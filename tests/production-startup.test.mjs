// Executed with Bun, against an isolated copy of the CI SQLite database.
import assert from 'node:assert/strict'
import { Database } from 'bun:sqlite'
import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const source = process.env.TEST_DATABASE_URL
assert.ok(source?.startsWith('file:/tmp/'), 'Requires isolated /tmp TEST_DATABASE_URL')
const folder = mkdtempSync(join(tmpdir(), 'socialtool-boot-test-'))
const path = join(folder, 'site.sqlite')
const env = { ...process.env, DATABASE_URL: 'file:' + path }
const boot = () => spawnSync('bun', ['scripts/start-production.mjs', '--check-only'], {
  cwd: resolve('.'), env, encoding: 'utf8', timeout: 120000,
})
try {
  copyFileSync(source.slice(5), path)
  const stale = new Database(path)
  try {
    stale.exec("INSERT INTO SiteSetting (id, key, value, updatedAt) VALUES ('boot-test', 'private.startupSentinel', 'preserved', 1750000000000)")
    stale.exec('PRAGMA foreign_keys = OFF')
    stale.exec('DROP TABLE "Wishlist"')
    stale.exec('DROP TABLE "AnalyticsEvent"')
    stale.exec('ALTER TABLE "Product" DROP COLUMN "searchKeywords"')
  } finally { stale.close() }

  const first = boot()
  assert.equal(first.status, 0, 'Schema upgrade failed: ' + first.stdout + first.stderr)
  const migrated = new Database(path, { readonly: true })
  try {
    assert.equal(migrated.query("SELECT value FROM SiteSetting WHERE key = 'private.startupSentinel'").get().value, 'preserved')
    assert.ok(migrated.query('PRAGMA table_info("Product")').all().some(column => column.name === 'searchKeywords'))
    for (const table of ['Wishlist', 'AnalyticsEvent']) {
      assert.ok(migrated.query("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(table))
    }
  } finally { migrated.close() }
  const backupDir = join(folder, '.socialtool-db-backups')
  const backups = readdirSync(backupDir)
  assert.equal(backups.length, 1, 'Expected exactly one pre-migration snapshot')
  const backup = new Database(join(backupDir, backups[0]), { readonly: true })
  try {
    assert.equal(backup.query("SELECT value FROM SiteSetting WHERE key = 'private.startupSentinel'").get().value, 'preserved')
    assert.equal(backup.query("SELECT name FROM sqlite_master WHERE name = 'Wishlist'").get(), null)
    assert.equal(backup.query('PRAGMA quick_check').get().quick_check, 'ok')
  } finally { backup.close() }

  const second = boot()
  assert.equal(second.status, 0, 'Idempotent boot failed: ' + second.stdout + second.stderr)
  assert.equal(readdirSync(backupDir).length, 1, 'Compatible schema should not create another backup')

  const missingPath = join(folder, 'missing.sqlite')
  const missing = spawnSync('bun', ['scripts/start-production.mjs', '--check-only'], {
    cwd: resolve('.'), env: { ...env, DATABASE_URL: 'file:' + missingPath },
    encoding: 'utf8', timeout: 15000,
  })
  assert.notEqual(missing.status, 0, 'Missing database must fail closed')
  assert.equal(existsSync(missingPath), false, 'Startup must not create an empty replacement database')
  console.log('Production startup: snapshot verified, additive upgrade preserved data, idempotent, missing DB refused')
} finally {
  rmSync(folder, { recursive: true, force: true })
}
