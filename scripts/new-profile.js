#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { NAME_RE } = require('../src/hooks/persona-profiles');

const id = String(process.argv[2] || '').trim().toLowerCase();
if (!NAME_RE.test(id)) {
  console.error('Usage: npm run new-profile -- <kebab-case-id> ["Display Name"]');
  process.exit(1);
}

const derivedName = id
  .split('-')
  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ');
const displayName = process.argv.slice(3).join(' ').trim() || derivedName;
const root = path.resolve(__dirname, '..');
const profilePath = path.join(root, 'profiles', `${id}.md`);

if (fs.existsSync(profilePath)) {
  console.error(`Profile already exists: ${profilePath}`);
  process.exit(1);
}

const template = `---
id: ${id}
name: ${displayName}
description: Describe what this profile contributes.
aliases: 
scope: user-visible prose where this style should apply
default-variant: default
variants: light, default, extreme
---
# ${displayName}

Define behavior shared by every variant. State the scope, positive voice traits, exact-content preservation rules, and boundaries.

## Variant: light

Describe a restrained version of the profile.

## Variant: default

Describe the normal version of the profile.

## Variant: extreme

Describe the strongest readable version of the profile.
`;

fs.writeFileSync(profilePath, template, { encoding: 'utf8', flag: 'wx' });
console.log(`Created ${profilePath}`);
