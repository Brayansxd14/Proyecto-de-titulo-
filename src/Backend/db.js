/* eslint-disable no-undef */
import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config({ path: './.env' })

const { Pool } = pg

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://admin:admin123@localhost:5432/tallerdb',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

export default pool
