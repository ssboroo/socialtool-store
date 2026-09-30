/**
 * Production startup safety gate.
 * Refuses to serve an incompatible database. On an existing SQLite database
 * with an older schema, snapshots it using SQLite VACUUM INTO, verifies the
 * backup, then runs Prisma's non-destructive schema sync.
 *
 * The backup is stored next to the database on the SAME persistent volume.
 * Use a separate external backup strategy as well. No --accept-data-loss.
 */
import { Database } from 'bun:sqlite'
import { execFileSync, spawn } from 'node:child_process'
import { existsSync, mkdirSync, statSync, chmodSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const requiredColumns = {
  Product: ['requiresOrderLink', 'searchKeywords'],
  OrderItem: ['orderLink'],
  Customer: ['cartItems', 'cartVersion'],
}
const requiredTables = ['Wishlist', 'AnalyticsEvent']
const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const checkOnly = process.argv.includes('--check-only')
const errorPrefix = '[Socialtool startup]'

function databasePath() {
  const raw = process.env.DATABASE_URL
  if (!raw?.startsWith('file:')) throw new Error('DATABASE_URL must be a persistent SQLite file: URL.')
  let path
  if (raw.startsWith('file://')) {
    path = fileURLToPath(raw)
  } else {
    const urlPath = decodeURIComponent(raw.slice(5).split('?')[0])
    if (!urlPath || urlPath === ':memory:') throw new Error('In-memory databases are not allowed in production.')
    path = isAbsolute(urlPath) ? urlPath : resolve(appRoot, 'prisma', urlPath)
  }
  const mounted = process.env.RAILWAY_VOLUME_MOUNT_PATH
  if (mounted) {
    const rel = relative(resolve(mounted), resolve(path))
    if (rel.startsWith('..') || isAbsolute(rel)) {
      throw new Error('DATABASE_URL must point INSIDE RAILWAY_VOLUME_MOUNT_PATH, not an ephemeral disk.')
    }
  }
  return resolve(path)
}

function readSchema(db) {
  const tables = new Set(db.query("SELECT name FROM sqlite_master WHERE type = 'table'").all().map(row => row.name))
  const columns = {}
  for (const table of Object.keys(requiredColumns)) {
    columns[table] = tables.has(table)
      ? new Set(db.query('PRAGMA table_info("' + table + '")').all().map(row => row.name))
      : new Set()
  }
  const outdated = requiredTables.some(table => !tables.has(table)) ||
    Object.entries(requiredColumns).some(([table, names]) =>
      names.some(name => !columns[table].has(name)))
  return { tables, outdated }
}

function verifyDatabase(db, context) {
  const row = db.query('PRAGMA quick_check').get()
  if (row?.quick_check !== 'ok') throw new Error(context + ' failed SQLite quick_check.')
}

function snapshotBeforeMigration(db, path) {
  const folder = join(dirname(path), '.socialtool-db-backups')
  mkdirSync(folder, { recursive: true, mode: 0o700 })
  const snapshot = join(folder, 'pre-schema-' + new Date().toISOString().replace(/[:.]/g, '-') + '-' + process.pid + '.sqlite')
  // VACUUM INTO creates a consistent snapshot even for databases using WAL.
  // SQLite's SQL parameters cannot be used in some VACUUM versions; the path
  // is generated locally and quoted, never supplied by an HTTP user.
  db.exec("VACUUM INTO '" + snapshot.replaceAll("'", "''") + "'")
  chmodSync(snapshot, 0o600)
  if (statSync(snapshot).size < 512) throw new Error('Database backup is unexpectedly empty.')
  const backup = new Database(snapshot, { readonly: true })
  try { verifyDatabase(backup, 'Backup') } finally { backup.close() }
  console.info(errorPrefix, 'Verified database snapshot:', snapshot)
  return snapshot
}

async function main() {
  const path = databasePath()
  if (!existsSync(path) || statSync(path).size < 512) {
    throw new Error('Production database is missing or empty at ' + path +
      '. Do not create an empty replacement. Check the persistent volume and DATABASE_URL.')
  }
  const db = new Database(path, { readonly: true })
  let outdated
  try {
    verifyDatabase(db, 'Production database')
    const state = readSchema(db)
    // An existing store must contain its original tables, otherwise this
    // could be an accidental empty DB pointed at the wrong path.
    for (const table of ['Product', 'Customer', 'Order', 'SiteSetting']) {
      if (!state.tables.has(table)) throw new Error('Expected existing table ' + table +
        ' was not found; refusing to overwrite an unexpected database.')
    }
    outdated = state.outdated
    if (outdated) snapshotBeforeMigration(db, path)
  } finally {
    db.close()
  }

  if (outdated) {
    console.info(errorPrefix, 'Old schema detected. Applying additive Prisma schema changes.')
    // A nonzero Prisma exit (including data-loss warnings) aborts startup.
    // prisma is a production dependency in this repository.
    execFileSync('bunx', ['prisma', 'db', 'push', '--skip-generate'], {
      cwd: appRoot, env: process.env, stdio: 'inherit', timeout: 120_000,
    })
    const updated = new Database(path, { readonly: true })
    try {
      verifyDatabase(updated, 'Updated database')
      if (readSchema(updated).outdated) throw new Error('Required tables/columns are still missing after schema sync.')
    } finally { updated.close() }
  } else {
    console.info(errorPrefix, 'Database schema is already compatible.')
  }

  // Keep the official Adobe catalog present without overwriting real prices later.
  execFileSync('bun', ['scripts/sync-adobe-catalog.mjs'], {
    cwd: appRoot, env: process.env, stdio: 'inherit', timeout: 60_000,
  })

  if (checkOnly) {
    console.info(errorPrefix, 'Database readiness check passed (server not started).')
    return
  }

  const server = resolve(appRoot, '.next', 'standalone', 'server.js')
  if (!existsSync(server)) throw new Error('Next.js standalone server is missing: ' + server)
  const child = spawn(process.execPath, [server], {
    cwd: appRoot,
    env: { ...process.env, NODE_ENV: 'production' },
    stdio: 'inherit',
  })
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => child.kill(signal))
  }
  child.on('error', err => {
    console.error(errorPrefix, 'Server launch failed:', err.message)
    process.exitCode = 1
  })
  child.on('exit', (code, signal) => {
    process.exitCode = code ?? (signal ? 1 : 0)
  })
}

main().catch(err => {
  console.error(errorPrefix, 'REFUSING STARTUP:', err instanceof Error ? err.message : String(err))
  process.exitCode = 1
})
