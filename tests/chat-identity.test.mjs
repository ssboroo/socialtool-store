import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import fs from 'node:fs'
import ts from 'typescript'

test('chat restoration cannot cross customer identities or restore legacy history', () => {
  const storage = () => {
    const data = new Map()
    return { getItem: k => data.get(k) ?? null, setItem: (k,v) => data.set(k,v), removeItem: k => data.delete(k) }
  }
  const localStorage = storage(), sessionStorage = storage()
  const exports = {}
  const js = ts.transpileModule(fs.readFileSync('src/lib/chat-history.ts','utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  vm.runInNewContext(js, { exports, window: {}, localStorage, sessionStorage })
  localStorage.setItem('st-chat-history', '["old_order_12345"]')
  sessionStorage.setItem('st-order-chat', 'old_order_12345')
  exports.syncChatIdentity(null)
  assert.equal(sessionStorage.getItem('st-order-chat'), null)
  assert.equal(exports.savedChats().length, 0)
  exports.syncChatIdentity('alice')
  exports.rememberChat('alice_order_12345')
  exports.syncChatIdentity('alice')
  assert.equal(exports.savedChats()[0], 'alice_order_12345')
  exports.syncChatIdentity(null)
  assert.equal(exports.savedChats().length, 0)
  assert.equal(sessionStorage.getItem('st-order-chat'), null)
  exports.rememberChat('guest_order_12345')
  exports.syncChatIdentity('bob')
  assert.equal(exports.savedChats().length, 0)
  exports.rememberChat('bob_order_12345')
  exports.syncChatIdentity('alice')
  assert.equal(exports.savedChats().length, 0)
})
