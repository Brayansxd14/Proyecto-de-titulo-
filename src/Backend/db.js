import pg from 'pg'
import dotenv from 'dotenv'
import { readFileSync } from 'node:fs'

dotenv.config({ path: './.env', quiet: true })

const { Pool } = pg

const connectionString = process.env.DATABASE_URL?.trim()
const databaseUrl = connectionString ? new URL(connectionString) : null
const localHosts = ['localhost', '127.0.0.1', '::1', '[::1]']
const sslMode = (
  databaseUrl?.searchParams.get('sslmode') ||
  process.env.DATABASE_SSL ||
  ''
).toLowerCase()
const useSsl = ['true', 'require', 'verify-ca', 'verify-full'].includes(sslMode) ||
  (!['false', 'disable', 'allow', 'prefer'].includes(sslMode) &&
    !localHosts.includes(databaseUrl?.hostname || process.env.PGHOST || 'localhost'))
const sslVerification = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED
const rejectUnauthorized = sslVerification === 'true' ||
  (sslVerification !== 'false' && ['verify-ca', 'verify-full'].includes(sslMode))
const rootCertificatePath = process.env.PGSSLROOTCERT?.trim()
const ssl = useSsl
  ? {
      rejectUnauthorized,
      ...(rootCertificatePath ? { ca: readFileSync(rootCertificatePath, 'utf8') } : {})
    }
  : false
const pool = new Pool({
  ...(connectionString ? { connectionString } : {}),
  ssl,
  connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT_MS) || 10000,
})

export const databaseConfigured = Boolean(
  connectionString ||
  (process.env.PGHOST && process.env.PGDATABASE && process.env.PGUSER)
)

export default pool
