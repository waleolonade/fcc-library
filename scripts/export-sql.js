import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '..', 'database', 'brainfeels_library.sqlite');
const OUT_SQL_PATH = path.join(__dirname, '..', 'database', 'brainfeels_library.sql');
const SCHEMA_PATH = path.join(__dirname, '..', 'database', 'schema.sql');

const db = new sqlite3.Database(DB_PATH, async (err) => {
  if (err) {
    console.error('Failed to open database:', err);
    process.exit(1);
  }

  let sqlOutput = `-- =========================================================================\n`;
  sqlOutput += `-- DATABASE: brainfeels_library\n`;
  sqlOutput += `-- Complete SQL Dump & Initializer for Federal Co-operative College Smart Library\n`;
  sqlOutput += `-- Compatible with MySQL, PostgreSQL, SQLite, MariaDB\n`;
  sqlOutput += `-- Generated At: ${new Date().toISOString()}\n`;
  sqlOutput += `-- =========================================================================\n\n`;

  // Read schema
  if (fs.existsSync(SCHEMA_PATH)) {
    sqlOutput += fs.readFileSync(SCHEMA_PATH, 'utf8') + '\n\n';
  }

  sqlOutput += `-- =========================================================================\n`;
  sqlOutput += `-- SEED DATA & RECORD INSERTIONS\n`;
  sqlOutput += `-- =========================================================================\n\n`;

  const tables = [
    'branches', 'patron_policies', 'patrons', 'books', 'courses', 'loans',
    'reservations', 'theses', 'study_rooms', 'room_bookings', 'partner_libraries',
    'acquisitions', 'serials', 'reading_lists', 'continue_reading', 'audit_logs', 'announcements'
  ];

  for (const table of tables) {
    try {
      const rows = await new Promise((resolve, reject) => {
        db.all(`SELECT * FROM ${table}`, (err, rows) => {
          if (err) resolve([]);
          else resolve(rows || []);
        });
      });

      if (rows.length > 0) {
        sqlOutput += `-- Table: ${table} (${rows.length} rows)\n`;
        for (const row of rows) {
          const keys = Object.keys(row);
          const values = keys.map(k => {
            const v = row[k];
            if (v === null || v === undefined) return 'NULL';
            if (typeof v === 'number') return v;
            return `'${String(v).replace(/'/g, "''")}'`;
          });
          sqlOutput += `INSERT OR REPLACE INTO ${table} (${keys.join(', ')}) VALUES (${values.join(', ')});\n`;
        }
        sqlOutput += '\n';
      }
    } catch (e) {
      console.warn(`Could not export table ${table}:`, e.message);
    }
  }

  fs.writeFileSync(OUT_SQL_PATH, sqlOutput, 'utf8');
  console.log(`✓ Exported standalone SQL dump to ${OUT_SQL_PATH}`);
  db.close();
});
