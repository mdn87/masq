'use strict';

const fs = require('fs');
const path = require('path');

const NAME_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const MAX_PROFILE_BYTES = 128 * 1024;
const PROFILE_KINDS = Object.freeze(['presentation', 'conduct', 'policy']);
const PROFILE_FIELDS = Object.freeze([
  'id',
  'name',
  'description',
  'aliases',
  'scope',
  'kind',
  'default-variant',
  'variants'
]);

function normalizeName(value) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  return NAME_RE.test(normalized) ? normalized : null;
}


function tokenizeProfileList(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .split(/[\s,+]+/)
    .map(token => token.trim())
    .filter(token => token && token !== 'and');
}

function parseList(value) {
  if (typeof value !== 'string') return [];
  return value
    .split(',')
    .map(item => normalizeName(item))
    .filter(Boolean);
}

function parseFrontmatter(content, sourceName = 'profile') {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(content);
  if (!match) throw new Error(`${sourceName}: missing YAML-style frontmatter`);

  const metadata = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || /^\s*#/.test(line)) continue;
    const field = /^([a-z][a-z0-9-]*):\s*(.*?)\s*$/.exec(line);
    if (!field) throw new Error(`${sourceName}: unsupported frontmatter line: ${line}`);
    if (!PROFILE_FIELDS.includes(field[1])) {
      throw new Error(
        `${sourceName}: unknown frontmatter field "${field[1]}"; supported: ${PROFILE_FIELDS.join(', ')}`
      );
    }
    if (Object.prototype.hasOwnProperty.call(metadata, field[1])) {
      throw new Error(`${sourceName}: duplicate frontmatter field "${field[1]}"`);
    }
    metadata[field[1]] = field[2];
  }

  return { metadata, body: match[2].trim() };
}

// A "## Requirements" section holds hard output requirements, one per bullet.
// Only conduct and policy profiles may declare one; see composeFullContext,
// which hoists them out of the persona framing entirely.
function extractRequirements(body) {
  const lines = String(body || '').split(/\r?\n/);
  const requirements = [];
  let inside = false;

  for (const line of lines) {
    if (/^##\s+Requirements\s*$/.test(line)) { inside = true; continue; }
    if (inside && /^##\s+/.test(line)) { inside = false; continue; }
    if (!inside) continue;
    const bullet = /^\s*-\s+(.*\S)\s*$/.exec(line);
    if (bullet) requirements.push(bullet[1]);
  }

  return requirements;
}

function splitVariantSections(body, sourceName = 'profile') {
  const common = [];
  const sections = new Map();
  let current = null;

  for (const line of body.split(/\r?\n/)) {
    const heading = /^##\s+Variant:\s*([a-z0-9][a-z0-9-]{0,63})\s*$/.exec(line);
    if (heading) {
      current = heading[1];
      if (sections.has(current)) {
        throw new Error(`${sourceName}: duplicate variant section ${current}`);
      }
      sections.set(current, []);
      continue;
    }

    if (current === null) common.push(line);
    else sections.get(current).push(line);
  }

  const variantBodies = new Map();
  for (const [id, lines] of sections.entries()) {
    variantBodies.set(id, lines.join('\n').trim());
  }

  return {
    commonBody: common.join('\n').trim(),
    variantBodies
  };
}

function candidateProfileDirs() {
  const candidates = [];
  if (process.env.CLAUDE_PLUGIN_ROOT) {
    candidates.push(path.join(process.env.CLAUDE_PLUGIN_ROOT, 'profiles'));
  }
  candidates.push(path.join(__dirname, '..', '..', 'profiles'));
  return [...new Set(candidates.map(candidate => path.resolve(candidate)))];
}

function findProfilesDir() {
  for (const candidate of candidateProfileDirs()) {
    try {
      const stat = fs.lstatSync(candidate);
      if (!stat.isSymbolicLink() && stat.isDirectory()) return candidate;
    } catch (_) {}
  }
  throw new Error('profiles directory not found');
}

function loadProfiles() {
  const profilesDir = findProfilesDir();
  const profiles = new Map();
  const aliases = new Map();

  const entries = fs.readdirSync(profilesDir, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.md') && !entry.name.startsWith('_'))
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const entry of entries) {
    const filePath = path.join(profilesDir, entry.name);
    const stat = fs.lstatSync(filePath);
    if (stat.isSymbolicLink() || !stat.isFile()) continue;
    if (stat.size > MAX_PROFILE_BYTES) {
      throw new Error(`${entry.name}: profile exceeds ${MAX_PROFILE_BYTES} bytes`);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const { metadata, body } = parseFrontmatter(content, entry.name);
    const id = normalizeName(metadata.id);
    const fileId = normalizeName(path.basename(entry.name, '.md'));
    if (!id) throw new Error(`${entry.name}: invalid or missing id`);
    if (fileId !== id) throw new Error(`${entry.name}: filename must match id ${id}.md`);
    if (profiles.has(id)) throw new Error(`${entry.name}: duplicate profile id ${id}`);

    const name = String(metadata.name || '').trim();
    const description = String(metadata.description || '').trim();
    const scope = String(metadata.scope || 'user-visible prose').trim();
    if (!name) throw new Error(`${entry.name}: missing name`);
    if (!description) throw new Error(`${entry.name}: missing description`);

    const kind = metadata.kind === undefined
      ? 'presentation'
      : normalizeName(metadata.kind);
    if (!kind || !PROFILE_KINDS.includes(kind)) {
      throw new Error(`${entry.name}: kind must be one of: ${PROFILE_KINDS.join(', ')}`);
    }

    const variants = parseList(metadata.variants);
    if (variants.length === 0) throw new Error(`${entry.name}: define at least one variant`);
    if (new Set(variants).size !== variants.length) throw new Error(`${entry.name}: duplicate variant`);

    const defaultVariant = normalizeName(metadata['default-variant']);
    if (!defaultVariant || !variants.includes(defaultVariant)) {
      throw new Error(`${entry.name}: default-variant must be one of: ${variants.join(', ')}`);
    }

    const parsed = splitVariantSections(body, entry.name);

    const commonRequirements = extractRequirements(parsed.commonBody);
    const variantRequirements = new Map();
    for (const [variant, variantBody] of parsed.variantBodies.entries()) {
      variantRequirements.set(variant, extractRequirements(variantBody));
    }
    const declaresRequirements = commonRequirements.length
      || [...variantRequirements.values()].some(list => list.length);
    if (declaresRequirements && kind === 'presentation') {
      throw new Error(
        `${entry.name}: only conduct and policy profiles may declare "## Requirements"`
      );
    }
    for (const variant of variants) {
      if (!parsed.variantBodies.has(variant)) {
        throw new Error(`${entry.name}: missing section "## Variant: ${variant}"`);
      }
    }
    for (const variant of parsed.variantBodies.keys()) {
      if (!variants.includes(variant)) {
        throw new Error(`${entry.name}: undeclared variant section ${variant}`);
      }
    }

    const profileAliases = [...new Set([id, ...parseList(metadata.aliases)])];
    const profile = Object.freeze({
      id,
      name,
      description,
      scope,
      kind,
      aliases: Object.freeze(profileAliases),
      variants: Object.freeze(variants),
      defaultVariant,
      commonBody: parsed.commonBody,
      variantBodies: parsed.variantBodies,
      commonRequirements: Object.freeze(commonRequirements),
      variantRequirements,
      filePath
    });

    profiles.set(id, profile);
    for (const alias of profileAliases) {
      if (aliases.has(alias)) {
        throw new Error(`${entry.name}: alias ${alias} already belongs to ${aliases.get(alias)}`);
      }
      aliases.set(alias, id);
    }
  }

  if (profiles.size === 0) throw new Error('no persona profiles found');
  return Object.freeze({ profiles, aliases, profilesDir });
}

function resolveProfileToken(rawToken, catalog) {
  const raw = String(rawToken || '').trim().toLowerCase();
  if (!raw) return { error: 'empty profile token' };

  const parts = raw.split(':');
  if (parts.length > 2) return { error: `invalid profile token: ${raw}` };

  const alias = normalizeName(parts[0]);
  const requestedVariant = parts[1] ? normalizeName(parts[1]) : null;
  if (!alias || (parts[1] && !requestedVariant)) {
    return { error: `invalid profile token: ${raw}` };
  }

  const id = catalog.aliases.get(alias);
  if (!id) return { error: `unknown profile: ${alias}` };

  const profile = catalog.profiles.get(id);
  const variant = requestedVariant || profile.defaultVariant;
  if (!profile.variants.includes(variant)) {
    return {
      error: `unknown variant ${variant} for ${id}; choose ${profile.variants.join(', ')}`
    };
  }

  return { entry: { id, variant }, profile };
}

function canonicalizeStack(stack, catalog, maxActive = 12) {
  const result = [];
  for (const item of Array.isArray(stack) ? stack : []) {
    if (!item || typeof item !== 'object') continue;
    const resolved = resolveProfileToken(`${item.id || ''}:${item.variant || ''}`, catalog);
    if (resolved.error) continue;
    const existing = result.findIndex(entry => entry.id === resolved.entry.id);
    if (existing !== -1) result.splice(existing, 1);
    result.push(resolved.entry);
    if (result.length > maxActive) result.shift();
  }
  return result;
}

function renderProfile(entry, catalog, slotNumber) {
  const profile = catalog.profiles.get(entry.id);
  if (!profile || !profile.variants.includes(entry.variant)) return '';
  const variantBody = profile.variantBodies.get(entry.variant) || '';

  return [
    `## Slot ${slotNumber}: ${profile.name} (${profile.id}:${entry.variant})`,
    `Kind: ${profile.kind}`,
    `Scope: ${profile.scope}`,
    '',
    profile.commonBody,
    '',
    `### Active variant: ${entry.variant}`,
    '',
    variantBody
  ].filter((line, index, all) => !(line === '' && all[index - 1] === '')).join('\n').trim();
}

function formatStack(stack) {
  return stack.length ? stack.map(entry => `${entry.id}:${entry.variant}`).join(' + ') : '(none)';
}

function formatCatalog(catalog) {
  const lines = [];
  for (const profile of catalog.profiles.values()) {
    const aliases = profile.aliases.filter(alias => alias !== profile.id);
    lines.push(
      `- ${profile.id} [${profile.variants.join('|')}] default=${profile.defaultVariant}` +
      `${aliases.length ? ` aliases=${aliases.join(',')}` : ''}` +
      `${profile.kind === 'presentation' ? '' : ` kind=${profile.kind}`} - ${profile.description}`
    );
  }
  return lines.join('\n');
}

function requirementsFor(entry, catalog) {
  const profile = catalog.profiles.get(entry.id);
  if (!profile) return [];
  return [
    ...profile.commonRequirements,
    ...(profile.variantRequirements.get(entry.variant) || [])
  ];
}

module.exports = {
  NAME_RE,
  PROFILE_FIELDS,
  PROFILE_KINDS,
  extractRequirements,
  requirementsFor,
  canonicalizeStack,
  findProfilesDir,
  formatCatalog,
  formatStack,
  loadProfiles,
  normalizeName,
  parseFrontmatter,
  renderProfile,
  resolveProfileToken,
  splitVariantSections,
  tokenizeProfileList
};
