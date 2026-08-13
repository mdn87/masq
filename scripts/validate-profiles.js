#!/usr/bin/env node
'use strict';

const {
  formatCatalog,
  loadProfiles,
  renderProfile
} = require('../src/hooks/persona-profiles');

try {
  const catalog = loadProfiles();
  let variants = 0;

  for (const profile of catalog.profiles.values()) {
    for (const variant of profile.variants) {
      const rendered = renderProfile({ id: profile.id, variant }, catalog, 1);
      if (!rendered || !rendered.includes(`(${profile.id}:${variant})`)) {
        throw new Error(`failed to render ${profile.id}:${variant}`);
      }
      variants += 1;
    }
  }

  console.log(`validated ${catalog.profiles.size} persona profiles and ${variants} variants`);
  console.log(formatCatalog(catalog));
} catch (error) {
  console.error(error && error.message ? error.message : String(error));
  process.exit(1);
}
