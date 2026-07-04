import pg from 'pg';
import sqlite3 from 'sqlite3';
import { open, type Database } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let pool: pg.Pool | null = null;
let sqliteDb: Database<sqlite3.Database, sqlite3.Statement> | null = null;
let isPostgres = false;

export async function initDb() {
  const connectionString = process.env.DATABASE_URL;

  // Database Schema (identical for both SQLite and PostgreSQL)
  const schemaQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      bio TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS likes (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(post_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS follows (
      id TEXT PRIMARY KEY,
      follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      following_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(follower_id, following_id)
    );
  `;

  if (connectionString) {
    // Connect to PostgreSQL (Production/Render or Local-with-cloud-db)
    isPostgres = true;
    pool = new pg.Pool({
      connectionString,
      ssl: connectionString.includes('render.com') || process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
    });

    await pool.query('SELECT NOW()');
    await pool.query(schemaQuery);
    console.log('PostgreSQL database connected and initialized successfully.');
  } else {
    // Fallback to SQLite (Local Development / Tests)
    isPostgres = false;
    sqliteDb = await open({
      filename: process.env.NODE_ENV === 'test' ? ':memory:' : path.join(__dirname, '../database.sqlite'),
      driver: sqlite3.Database
    });

    await sqliteDb.run('PRAGMA foreign_keys = ON;');
    await sqliteDb.exec(schemaQuery);
    console.log('SQLite database connected and initialized successfully.');
  }
}

// Convert SQLite style ? parameters to PostgreSQL $1, $2 style parameters
function convertSql(sql: string): string {
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
}

export function getDb() {
  if (isPostgres) {
    if (!pool) {
      throw new Error('PostgreSQL Pool is not initialized. Call initDb() first.');
    }

    return {
      async get(sql: string, params?: any): Promise<any> {
        const formattedSql = convertSql(sql);
        const paramArray = params === undefined ? [] : (Array.isArray(params) ? params : [params]);
        const res = await pool!.query(formattedSql, paramArray);
        return res.rows[0];
      },

      async all(sql: string, params?: any): Promise<any[]> {
        const formattedSql = convertSql(sql);
        const paramArray = params === undefined ? [] : (Array.isArray(params) ? params : [params]);
        const res = await pool!.query(formattedSql, paramArray);
        return res.rows;
      },

      async run(sql: string, params?: any): Promise<{ changes: number }> {
        const formattedSql = convertSql(sql);
        const paramArray = params === undefined ? [] : (Array.isArray(params) ? params : [params]);
        const res = await pool!.query(formattedSql, paramArray);
        return { changes: res.rowCount ?? 0 };
      },

      async exec(sql: string): Promise<void> {
        await pool!.query(sql);
      }
    };
  } else {
    if (!sqliteDb) {
      throw new Error('SQLite Database is not initialized. Call initDb() first.');
    }

    return {
      async get(sql: string, params?: any): Promise<any> {
        return sqliteDb!.get(sql, params);
      },

      async all(sql: string, params?: any): Promise<any[]> {
        return sqliteDb!.all(sql, params);
      },

      async run(sql: string, params?: any): Promise<{ changes: number }> {
        const res = await sqliteDb!.run(sql, params);
        return { changes: res.changes ?? 0 };
      },

      async exec(sql: string): Promise<void> {
        await sqliteDb!.exec(sql);
      }
    };
  }
}
