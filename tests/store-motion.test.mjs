import { test } from 'node:test'
import assert from 'node:assert/strict'
import { scrollBehavior } from '../src/lib/store-motion.ts'

test('navigation never smooth-scrolls when reduced motion is requested', () => {
  assert.equal(scrollBehavior(true), 'instant')
  assert.equal(scrollBehavior(false), 'smooth')
})
