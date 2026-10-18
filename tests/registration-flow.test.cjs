const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { transformSync } = require('esbuild')
const { ref, computed, watch, nextTick } = require('vue')
const root = path.join(__dirname, '..')

function compile(relative, names, bindings, sfc = false) {
  let source = fs.readFileSync(path.join(root, relative), 'utf8')
  if (sfc) source = source.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
  source = source.replace(/^import .*$/gm, '').replace(/export /g, '')
  const js = transformSync(source, { loader: 'ts', target: 'es2020' }).code
  return new Function(...Object.keys(bindings), js + `\nreturn { ${names.join(',')} };`)(...Object.values(bindings))
}

function fixture() {
  const calls = []
  let registered = false
  let rejectPost = false
  let rejectDelete = false
  const auth = { user: ref({ id: 7 }), isLoggedIn: ref(true), isAdmin: ref(false) }
  const event = { id: 42, title: 'Server event', status: 'open', eventDate: '2026-10-25', eventTime: '10:00' }
  const row = { id: 1, eventId: 42, userId: 7, status: 'registered' }
  const fetch = async (url, options = {}) => {
    calls.push({ url, ...options })
    const method = options.method || 'GET'
    let data
    if (url.endsWith('/events')) data = [event]
    else if (url.endsWith('/stats')) data = { ok: true, data: { eventId: 42, totalRegistered: registered ? 1 : 0, totalCancelled: 0, full: registered } }
    else if (url.includes('/registrations/my?')) data = { ok: true, data: registered && url.endsWith('=7') ? [row] : [] }
    else if (method === 'POST') {
      assert.equal(url, '/api/events/42/registrations?userId=7')
      assert.equal(JSON.parse(options.body).realName, 'Test')
      if (rejectPost) data = { ok: false, error: '报名已截止' }
      else { registered = true; data = { ok: true, data: row } }
    } else if (method === 'DELETE') {
      assert.equal(url, '/api/events/42/registrations?userId=7')
      if (rejectDelete) data = { ok: false, error: '取消失败' }
      else { registered = false; data = { ok: true } }
    } else throw new Error('Unexpected request: ' + url)
    return { ok: data.ok !== false, json: async () => structuredClone(data) }
  }
  const regApi = compile('.vitepress/theme/api/registration.ts', ['getRegistrationStats','getMyRegistrations','registerForEvent','cancelRegistration'], { API_BASE: '/api', fetch })
  const bindings = { ref, computed, watch, nextTick, onMounted() {}, useAuth: () => auth, API_BASE_ROOT: '/api', regApi, fetch, document: { querySelector: () => null }, window: {} }
  const timeline = () => compile('.vitepress/theme/components/EventTimeline.vue', ['loadEvents','submitRegistration','cancelRegistration','isRegistered','regForm','stats','registrationError','showForm'], bindings, true)
  return { calls, auth, event, timeline, bindings, rejectPost: () => { rejectPost = true }, rejectDelete: () => { rejectDelete = true } }
}

test('registration uses server IDs and realName; counts survive reload and cancellation', async () => {
  const f = fixture(), ui = f.timeline()
  await ui.loadEvents()
  assert.equal(ui.stats.value[42].totalRegistered, 0)
  ui.regForm.value = { name: ' Test ', phone: '13000000000', email: 'test@example.invalid' }
  await ui.submitRegistration(f.event)
  assert.equal(ui.isRegistered(42), true)
  assert.equal(ui.stats.value[42].totalRegistered, 1)
  const reloaded = f.timeline()
  await reloaded.loadEvents()
  assert.equal(reloaded.isRegistered(42), true)
  await reloaded.cancelRegistration(42)
  assert.equal(reloaded.isRegistered(42), false)
  assert.equal(reloaded.stats.value[42].totalRegistered, 0)
})

test('failed registration stays unregistered and preserves the form', async () => {
  const f = fixture(), ui = f.timeline()
  await ui.loadEvents(); f.rejectPost()
  ui.regForm.value = { name: 'Test', phone: '13000000000', email: 'test@example.invalid' }
  ui.showForm.value = f.event.title
  await ui.submitRegistration(f.event)
  assert.equal(ui.isRegistered(42), false)
  assert.equal(ui.stats.value[42].totalRegistered, 0)
  assert.equal(ui.registrationError.value, '报名已截止')
  assert.equal(ui.showForm.value, f.event.title)
})

test('failed cancellation retains confirmed registration; account switch clears it', async () => {
  const f = fixture(), ui = f.timeline()
  await ui.loadEvents()
  ui.regForm.value = { name: 'Test', phone: '13000000000', email: 'test@example.invalid' }
  await ui.submitRegistration(f.event); f.rejectDelete()
  await ui.cancelRegistration(42)
  assert.equal(ui.isRegistered(42), true)
  f.auth.user.value = { id: 8 }
  await nextTick()
  assert.equal(ui.isRegistered(42), false)
})

test('statistics reload on window focus and unregister listener on unmount', async () => {
  const f = fixture()
  const listeners = new Map()
  let mount, unmount
  const ui = compile('.vitepress/theme/components/EventRegistrationStats.vue', ['loadStats','events'], {
    ...f.bindings, onMounted: fn => { mount = fn }, onUnmounted: fn => { unmount = fn },
    window: { addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: name => listeners.delete(name) }
  }, true)
  mount()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(ui.events.value[0].stats.totalRegistered, 0)
  const timeline = f.timeline()
  timeline.regForm.value = { name: 'Test', phone: '13000000000', email: 'test@example.invalid' }
  await timeline.submitRegistration(f.event)
  await listeners.get('focus')()
  assert.equal(ui.events.value[0].stats.totalRegistered, 1)
  assert.equal(ui.events.value[0].stats.full, true)
  unmount()
  assert.equal(listeners.size, 0)
})
