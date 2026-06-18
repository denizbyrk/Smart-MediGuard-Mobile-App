import * as SQLite from 'expo-sqlite';

// Tek bir promise — hem açma hem şema oluşturma birlikte kilitli
let _promise = null;

const _init = () => {
  if (_promise) return _promise;
  _promise = (async () => {
    const database = await SQLite.openDatabaseAsync('smart_mediguard.db');

    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id                  INTEGER PRIMARY KEY AUTOINCREMENT,
        name                TEXT    NOT NULL,
        email               TEXT    UNIQUE,
        age                 INTEGER,
        health_conditions   TEXT,
        emergency_contact   TEXT,
        created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS medications (
        id                      INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id                 INTEGER NOT NULL,
        name                    TEXT    NOT NULL,
        dosage                  TEXT,
        frequency               TEXT,
        time_slots              TEXT,
        stock_count             INTEGER DEFAULT 0,
        stock_warning_threshold INTEGER DEFAULT 7,
        instructions            TEXT,
        image_uri               TEXT,
        color_code              TEXT,
        start_date              DATE,
        end_date                DATE,
        is_active               INTEGER DEFAULT 1,
        synced                  INTEGER DEFAULT 0,
        created_at              DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at              DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS dose_history (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        medication_id   INTEGER NOT NULL,
        scheduled_time  DATETIME,
        taken_time      DATETIME,
        status          TEXT DEFAULT 'pending',
        synced          INTEGER DEFAULT 0,
        FOREIGN KEY (medication_id) REFERENCES medications(id)
      );

      CREATE TABLE IF NOT EXISTS reminders (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        medication_id   INTEGER NOT NULL,
        reminder_time   TEXT,
        is_active       INTEGER DEFAULT 1,
        snooze_minutes  INTEGER DEFAULT 15,
        FOREIGN KEY (medication_id) REFERENCES medications(id)
      );

      CREATE TABLE IF NOT EXISTS sync_log (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name  TEXT,
        record_id   INTEGER,
        action      TEXT,
        timestamp   DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced      INTEGER DEFAULT 0
      );
    `);

    console.log('✅ The database was successfully created.');
    return database;
  })();
  return _promise;
};

// Her ikisi de aynı lock'a yönlenir — race condition imkansız
export const getDb = () => _init();
export const initDatabase = () => _init();
