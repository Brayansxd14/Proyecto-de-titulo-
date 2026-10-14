/* eslint-disable no-undef */
import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config({ path: './.env' })

const { Pool } = pg

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://admin:admin123@localhost:5432/tallerdb'
const databaseUrl = new URL(connectionString)
const localHosts = ['localhost', '127.0.0.1', '::1', '[::1]']
const sslMode = (process.env.DATABASE_SSL || databaseUrl.searchParams.get('sslmode') || '').toLowerCase()
const useSsl = ['true', 'require', 'verify-ca', 'verify-full'].includes(sslMode) ||
  (!['false', 'disable', 'allow', 'prefer'].includes(sslMode) && !localHosts.includes(databaseUrl.hostname))
const sslVerification = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED
const rejectUnauthorized = sslVerification === 'true' ||
  (sslVerification !== 'false' && ['verify-ca', 'verify-full'].includes(sslMode))

const pool = new Pool({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized } : false,
  connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT_MS) || 10000,
})

export default pool
