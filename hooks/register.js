let report = 'Masq: run /masq status to inspect the active stack';
let band = report;
let generation = 0;
let busy = false;

function reset($) {
  generation += 1;
  busy = false;
  report = 'Masq: run /masq status to inspect the active stack';
  band = report;
  $.ui.invalidate('ui.render');
}

async function runCommand($, args) {
  if (busy) return 'Masq: the previous command is still running; inspect status before trying again.';
  busy = true;
  const epoch = generation;
  let started = false;
  const failure = 'Masq: session identity unavailable; no command was run.';
  try {
    const root = $.plugin.root;
    const cwd = await $.session.cwd();
    const session = await $.session.id();
    if (!cwd || !session) throw new Error('session identity unavailable');
    started = true;
    const result = await $.process.run(['node', root + '/src/cli.js',
      '--claude-plugin-root', root, '--cwd', cwd, '--session-id', session,
      '--harness', 'claude-code', '--json', '--', ...args.trim().split(/\s+/).filter(Boolean)],
      { timeoutMs: 5000 });
    const output = JSON.parse(result.stdout);
    if (output.schema_version !== 1 || typeof output.text !== 'string') throw new Error('invalid command response');
    if (epoch !== generation) return 'Masq: the session changed; inspect status in the current session.';
    report = output.text;
    band = typeof output.status_text === 'string' ? output.status_text : report;
    $.ui.invalidate('ui.render');
    return report;
  } catch (_) {
    const message = started ? 'Masq: command result unavailable. A change may have been saved; run /masq status before retrying.' : failure;
    if (epoch === generation) {
      report = message;
      band = message;
      $.ui.invalidate('ui.render');
    }
    return message;
  } finally {
    if (epoch === generation) busy = false;
  }
}

export function register(on) {
  on('session.start', async ($, e, next) => {
    reset($);
    await $.command.register({ name: 'masq', immediate: true,
      description: 'Inspect or change persona selection, order and scope without a model turn',
      argumentHint: '[status|list|set|move|global|project|temp|preset] [...]' });
    $.clock.after(0, () => runCommand($, 'status'));
    return next(e);
  });
  on('classic.SessionStart', async ($, e, next) => {
    const result = await next(e);
    reset($);
    $.clock.after(0, () => runCommand($, 'status'));
    return result;
  });
  on('classic.CwdChanged', async ($, e, next) => {
    const result = await next(e);
    reset($);
    $.clock.after(0, () => runCommand($, 'status'));
    return result;
  });
  on('session.end', async ($, e, next) => { reset($); return next(e); });
  on('command.run', { command: 'masq' }, async ($, e) => ({ text: await runCommand($, e.args || 'status') }));
  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined) $.clock.after(0, () => runCommand($, 'status'));
    return next(e);
  });
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const previous = await next(e);
    const { Box, Text } = $.ui.resolve(e);
    return Box({ flexDirection: 'column', children: [previous,
      Text({ dimColor: true, children: [band.split('\n').slice(0, 2).join(' | ')] })].filter(Boolean) });
  });
}
