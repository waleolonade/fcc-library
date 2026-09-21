import mysql from 'mysql2/promise';
import path from 'path';
import sqlite3 from 'sqlite3';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_DIR = path.join(__dirname, '..', 'database');
const DB_PATH = path.join(DB_DIR, 'brainfeels_library.sqlite');

let mysqlPool = null;
let useMySQL = false;

// Initialize MySQL Pool
async function initMySQL() {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'brainfeels_library',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Test connection
    const [rows] = await pool.query('SELECT 1 as test');
    if (rows && rows.length > 0) {
      mysqlPool = pool;
      useMySQL = true;
      console.log('🏛️  [MySQL] Connected to database: brainfeels_library (phpMyAdmin active)');
    }
  } catch (err) {
    console.warn('⚠️ MySQL connection unavailable, using SQLite fallback:', err.message);
    useMySQL = false;
  }
}

initMySQL();

// SQLite Fallback Instance
export const sqliteDb = new sqlite3.Database(DB_PATH, (err) => {
  if (!err) {
    console.log('📁 [SQLite] Local mirror ready: brainfeels_library.sqlite');
  }
});
export const db = sqliteDb;

// Helper for SELECT queries returning multiple rows
export async function queryAll(sql, params = []) {
  if (useMySQL && mysqlPool) {
    try {
      // Convert SQLite ? to MySQL format
      const [rows] = await mysqlPool.query(sql, params);
      return rows || [];
    } catch (e) {
      console.warn('MySQL queryAll error, falling back to SQLite:', e.message);
    }
  }

  return new Promise((resolve, reject) => {
    sqliteDb.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

// Helper for SELECT queries returning a single row
export async function queryOne(sql, params = []) {
  if (useMySQL && mysqlPool) {
    try {
      const [rows] = await mysqlPool.query(sql, params);
      return rows && rows.length > 0 ? rows[0] : null;
    } catch (e) {
      console.warn('MySQL queryOne error, falling back to SQLite:', e.message);
    }
  }

  return new Promise((resolve, reject) => {
    sqliteDb.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row || null);
    });
  });
}

// Helper for INSERT / UPDATE / DELETE queries
export async function runSql(sql, params = []) {
  let mysqlResult = null;
  if (useMySQL && mysqlPool) {
    try {
      let mysqlSql = sql
        .replace(/INSERT\s+OR\s+REPLACE\s+INTO/gi, 'REPLACE INTO')
        .replace(/INSERT\s+OR\s+IGNORE\s+INTO/gi, 'INSERT IGNORE INTO');

      if (mysqlSql.includes('ON CONFLICT')) {
        mysqlSql = mysqlSql
          .replace(/ON\s+CONFLICT\s*\([^)]*\)\s*DO\s+UPDATE\s+SET/gi, 'ON DUPLICATE KEY UPDATE')
          .replace(/excluded\.(\w+)/gi, 'VALUES($1)');
      }

      const [result] = await mysqlPool.query(mysqlSql, params);
      mysqlResult = result;
    } catch (e) {
      console.warn('MySQL runSql error, updating SQLite:', e.message);
    }
  }

  // Also sync to SQLite mirror
  const sqlitePromise = new Promise((resolve, reject) => {
    sqliteDb.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

  return mysqlResult || (await sqlitePromise);
}

export function isMySQLActive() {
  return useMySQL;
}
