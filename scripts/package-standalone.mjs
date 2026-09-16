import { cpSync, mkdirSync } from 'node:fs'

// Node's copy API preserves the standalone bundle on Windows and Unix alike.
mkdirSync('.next/standalone/.next', { recursive: true })
cpSync('.next/static', '.next/standalone/.next/static', { recursive: true })
cpSync('public', '.next/standalone/public', { recursive: true })
