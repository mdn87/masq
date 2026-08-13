#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function readJson(relativePath) {
  const fullPath = path.join(root, relativePath);
  try {
    return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  } catch (error) {
    throw new Error(`${relativePath}: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const pkg = readJson('package.json');
const plugin = readJson('.claude-plugin/plugin.json');
const marketplace = readJson('.claude-plugin/marketplace.json');

assert(pkg.name === 'masque', 'package.json name must be masque');
assert(plugin.name === 'masque', 'plugin.json name must be masque');
assert(marketplace.name === 'masque', 'marketplace.json name must be masque');
assert(pkg.version === plugin.version, 'package and plugin versions must match');
assert(plugin.license === 'MIT' && pkg.license === 'MIT', 'license metadata must be MIT');

const listing = Array.isArray(marketplace.plugins)
  ? marketplace.plugins.find(entry => entry && entry.name === 'masque')
  : null;
assert(listing, 'marketplace must contain the masque plugin');
assert(listing.source === './', 'marketplace plugin source must be ./');

for (const event of ['SessionStart', 'UserPromptSubmit']) {
  const registrations = plugin.hooks && plugin.hooks[event];
  assert(Array.isArray(registrations) && registrations.length > 0, `plugin hook missing: ${event}`);
  const command = registrations[0]?.hooks?.[0]?.command || '';
  assert(command.includes('${CLAUDE_PLUGIN_ROOT}'), `${event} hook must use CLAUDE_PLUGIN_ROOT`);
  assert(command.includes('${CLAUDE_PLUGIN_DATA}'), `${event} hook must pass CLAUDE_PLUGIN_DATA`);
}

for (const skill of ['persona', 'afterdark']) {
  const skillPath = path.join(root, 'skills', skill, 'SKILL.md');
  assert(fs.existsSync(skillPath), `missing skill: skills/${skill}/SKILL.md`);
  const text = fs.readFileSync(skillPath, 'utf8');
  assert(text.startsWith('---\n'), `skill frontmatter missing: ${skill}`);
  assert(new RegExp(`^name:\\s*${skill}\\s*$`, 'm').test(text), `skill name mismatch: ${skill}`);
}

console.log('manifest and skill metadata validation passed');
