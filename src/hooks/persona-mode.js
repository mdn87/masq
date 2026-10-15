#!/usr/bin/env node
'use strict';

const { canonicalizeStack, loadProfiles } = require('./persona-profiles');
const { writeSessionRecord } = require('./persona-state');
const { diagnose } = require('./persona-doctor');
const { composeFullContext, composeReinforcement } = require('./persona-context');
const { commandEnvelope, parseCommand, applyCommand, commandContext, previewContext } = require('./persona-command');

function emitContext(text) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: text
    }
  }));
}

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('error', () => process.exit(0));
process.stdin.on('end', () => {
  try {
    const payload = input ? JSON.parse(input) : {};
    const normalized = commandEnvelope(payload.prompt);
    if (normalized.scheduled) return;
    const command = parseCommand(normalized.prompt, normalized.foreignCommand);
    const context = {
      cwd: payload.cwd || process.cwd(),
      sessionId: payload.session_id || 'unknown'
    };
    if (command && command.op === 'doctor') {
      const report = diagnose(context);
      emitContext([
        'MASQ MANAGEMENT COMMAND',
        'Do not apply persona styling to this management response.',
        'Reply with exactly the text between <masq-result> tags, without the tags or additional commentary.',
        `<masq-result>${report}</masq-result>`
      ].join('\n'));
      return;
    }

    const catalog = loadProfiles();
    const result = applyCommand(command, context, catalog);
    if (command) {
      if (result.kind === 'preview') {
        emitContext(previewContext(result.stack, catalog));
        return;
      }
      writeSessionRecord(
        context.sessionId,
        result.state.temporary,
        result.state.sessionRecord.lastEffective
      );
      emitContext(commandContext(result, catalog));
      return;
    }

    const state = result.state;
    const previous = canonicalizeStack(state.sessionRecord.lastEffective, catalog);
    const changed = JSON.stringify(previous) !== JSON.stringify(state.effective);
    const reinforcement = changed
      ? composeFullContext(state.effective, catalog)
      : composeReinforcement(state.effective, catalog);
    writeSessionRecord(context.sessionId, state.temporary, state.effective);
    if (reinforcement) emitContext(reinforcement);
  } catch (_) {
    // Hooks fail closed and never interrupt Claude Code.
  }
});
