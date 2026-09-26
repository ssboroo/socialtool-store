import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { detectGameBrand } from '../src/lib/game-brand.ts'

test('Counter-Strike names, marketplace variants and Mongolian spelling', () => {
  for (const name of [
    'Counter Strike 2 PRIME / Global',
    'Counter-Strike 2 account',
    'COUNTERSTRIKE2 | Full Access',
    'CS2 Prime Account',
    'CS:GO account',
    'CS GO prime',
    'CSGO account Global',
    'CS 1.6 key',
    'CS account with skins',
    'КС2 прайм аккаунт',
    'Кантер страйк 2',
  ]) assert.equal(detectGameBrand({ name, category: 'Gaming & Network' }), 'counter-strike', name)
})

test('Valorant aliases including Mongolian titles and VP', () => {
  for (const name of [
    'VALORANT ACCOUNT / Global',
    'Valorant VP',
    'Valorant Radiant Accounts',
    'VALO accounts',
    'Валорант аккаунт',
    'Валарант EU',
  ]) assert.equal(detectGameBrand({ name }), 'valorant', name)
})

test('Dota 2 aliases including Cyrillic names', () => {
  for (const name of [
    'DOTA2 Account / Immortal',
    'Dota 2 with Arcana',
    'DotA II ID',
    'Dota account',
    'Дота2 аккаунт',
    'ДОТА 2 Immortal',
  ]) assert.equal(detectGameBrand({ name }), 'dota2', name)
})

test('category and legacy icon fallback support explicitly named game', () => {
  assert.equal(detectGameBrand({ name: 'Full Access account', category: 'Valorant accounts' }), 'valorant')
  assert.equal(detectGameBrand({ name: 'Ranked ID', category: 'Gaming', icon: 'CS2' }), 'counter-strike')
  assert.equal(detectGameBrand({ name: 'Ranked ID', category: 'Gaming', icon: 'Valorant' }), 'valorant')
  assert.equal(detectGameBrand({ name: 'Ranked ID', category: 'Gaming', icon: 'Dota2' }), 'dota2')
  assert.equal(detectGameBrand({ name: 'Dota 2 account', category: 'Valorant' }), 'dota2')
})

test('do not infer an unrelated game for generic or ambiguous products', () => {
  for (const name of ['CSS templates', 'CSRF Protection', 'DotaSaurus SDK', 'Facebook gaming views', 'Microsoft Office']) {
    assert.equal(detectGameBrand({ name, category: 'Gaming & Network' }), null, name)
  }
  assert.equal(detectGameBrand({ name: 'CS2 + Valorant Bundle' }), 'gaming')
  assert.equal(detectGameBrand({ name: 'Dota2 & Valorant combo pack' }), 'gaming')
})

test('all three game marks are shipped locally and have their brand titles', () => {
  for (const [file, title] of [
    ['counter-strike.svg', 'Counter-Strike'],
    ['dota2.svg', 'Dota 2'],
    ['valorant.svg', 'Valorant'],
  ]) {
    const svg = readFileSync(new URL('../public/brand-icons/' + file, import.meta.url), 'utf8')
    assert.match(svg, new RegExp('<title>' + title + '</title>'))
    assert.match(svg, /viewBox="0 0 24 24"/)
    assert.match(svg, /<path d="/)
    assert.doesNotMatch(svg, /<(?:script|image|foreignObject)\b/i)
  }
})
