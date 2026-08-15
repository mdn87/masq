#!/usr/bin/env node
'use strict';

const fs = require('fs');
const { clearSessionStack } = require('./persona-state');

try {
  const raw = process.stdin.isTTY ? '' : fs.readFileSync(0, 'utf8');
  const payload = raw ? JSON.parse(raw) : {};
  if (payload.session_id) clearSessionStack(payload.session_id);
} catch (_) {
  // Session cleanup must never block Claude Code shutdown.
}
