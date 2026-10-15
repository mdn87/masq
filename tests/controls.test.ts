import { expect, test, mock } from 'claude-code/testing'

const BAND = { plugin: 'masq', component: 'AbovePrompt', requestId: 'band',
  viewport: { columns: 100, rows: 30 }, props: { hasSurvey: false, isWorking: false,
    maxRows: 3, bodyColumns: 80, scroll: { offset: 0, bodyRows: 3 }, view: {} } } as const

test('one immediate command invokes the portable CLI once and draws its result', async ($, on) => {
  let calls = 0
  on('ui.render', () => ({ type: 'Text', props: {}, children: ['existing band'] }))
  on('session.id', () => ({ value: 'session-one' }))
  on('session.cwd', () => ({ value: '/work' }))
  on('env.get', () => ({ value: '/data' }))
  on('process.run', ($, e) => {
    calls += 1
    expect(e.argv[2]).toBe('--claude-plugin-root')
    expect(e.argv.slice(4)).toEqual(['--cwd', '/work',
      '--session-id', 'session-one', '--harness', 'claude-code', '--json', '--', 'toggle', 'plain'])
    expect(e.init.timeoutMs).toBe(5000)
    return { value: { exitCode: 0, stdout: JSON.stringify({ schema_version: 1, ok: true,
      text: 'Active personas: plain:default\nPersistent scope: global' }), stderr: '' } }
  })
  const reply = await $.command.run({ command: 'masq', args: 'toggle plain' })
  expect(reply.text).toContain('plain:default')
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...BAND, surface })
    expect(await ui.find({ type: 'Text', text: /plain:default/ })).toBeDefined()
    await ui.unmount()
  }
  expect(calls).toBe(1)
})

test('an unavailable process is reported without automatically retrying a mutation', async ($, on) => {
  let calls = 0
  on('session.id', () => ({ value: 'session-one' }))
  on('session.cwd', () => ({ value: '/work' }))
  on('env.get', () => ({ value: '/data' }))
  on('process.run', () => { calls += 1; return { deny: 'timed out' } })
  const reply = await $.command.run({ command: 'masq', args: 'toggle plain' })
  expect(reply.text).toContain('may have been saved')
  expect(calls).toBe(1)
})

test('clear reloads status for the new session instead of showing a previous stack', async ($, on) => {
  const clock = mock.clock(on)
  on('ui.render', () => ({ type: 'Text', props: {}, children: [] }))
  on('classic.SessionStart', () => ({}))
  on('session.id', () => ({ value: 'new-session' }))
  on('session.cwd', () => ({ value: '/other-worktree' }))
  on('env.get', () => ({ value: '/data' }))
  on('process.run', ($, e) => {
    expect(e.argv).toContain('new-session')
    expect(e.argv).toContain('/other-worktree')
    return { value: { exitCode: 0, stdout: JSON.stringify({ schema_version: 1, ok: true,
      text: 'Active personas: (none)' }), stderr: '' } }
  })
  await $.classic.SessionStart({ source: 'clear' })
  await clock.settle()
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: 'Active personas: (none)' })).toBeDefined()
})

test('catalog output does not replace the active stack in the band', async ($, on) => {
  on('session.id', () => ({ value: 'session-one' }))
  on('session.cwd', () => ({ value: '/work' }))
  on('ui.render', () => ({ type: 'Text', props: {}, children: [] }))
  on('process.run', () => ({ value: { exitCode: 0, stdout: JSON.stringify({ schema_version: 1,
    text: 'Persona profiles: catalog listing', status_text: 'Active personas: plain:default' }), stderr: '' } }))
  const reply = await $.command.run({ command: 'masq', args: 'list' })
  expect(reply.text).toContain('catalog listing')
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: 'Active personas: plain:default' })).toBeDefined()
})
