import { getDb } from '../database/db';

export const createDoseRecord = async (medicationId, scheduledTime) => {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO dose_history (medication_id, scheduled_time, status) VALUES (?, ?, 'pending');`,
    [medicationId, scheduledTime]
  );
  const newId = result.lastInsertRowId;
  await db.runAsync(
    `INSERT INTO sync_log (table_name, record_id, action) VALUES ('dose_history', ?, 'INSERT');`,
    [newId]
  );
  return newId;
};

export const markAsTaken = async (doseId) => {
  const db = await getDb();
  await db.runAsync(
    `UPDATE dose_history SET status = 'taken', taken_time = CURRENT_TIMESTAMP, synced = 0 WHERE id = ?;`,
    [doseId]
  );
  await db.runAsync(
    `INSERT INTO sync_log (table_name, record_id, action) VALUES ('dose_history', ?, 'UPDATE');`,
    [doseId]
  );
};

export const markAsSnoozed = async (doseId) => {
  const db = await getDb();
  await db.runAsync(
    `UPDATE dose_history SET status = 'snoozed', synced = 0 WHERE id = ?;`,
    [doseId]
  );
  await db.runAsync(
    `INSERT INTO sync_log (table_name, record_id, action) VALUES ('dose_history', ?, 'UPDATE');`,
    [doseId]
  );
};

export const markExpiredAsMissed = async () => {
  const db = await getDb();

  const affected = await db.getAllAsync(
    `SELECT id FROM dose_history
     WHERE status = 'pending' AND scheduled_time < datetime('now', '-30 minutes');`
  );
  if (affected.length === 0) return 0;

  await db.runAsync(
    `UPDATE dose_history SET status = 'missed', synced = 0
     WHERE status = 'pending' AND scheduled_time < datetime('now', '-30 minutes');`
  );

  // Her etkilenen kayıt için sync_log'a ekle
  for (const row of affected) {
    await db.runAsync(
      `INSERT INTO sync_log (table_name, record_id, action) VALUES ('dose_history', ?, 'UPDATE');`,
      [row.id]
    );
  }
  return affected.length;
};

export const getDoseHistory = async (medicationId, days = 7) => {
  const db = await getDb();
  return await db.getAllAsync(
    `SELECT * FROM dose_history
     WHERE medication_id = ? AND scheduled_time >= datetime('now', ? || ' days')
     ORDER BY scheduled_time DESC;`,
    [medicationId, `-${days}`]
  );
};

export const getAdherenceRate = async (medicationId, days = 30) => {
  const db = await getDb();
  const row = await db.getFirstAsync(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN status = 'taken' THEN 1 ELSE 0 END) AS taken
     FROM dose_history
     WHERE medication_id = ? AND scheduled_time >= datetime('now', ? || ' days') AND status != 'pending';`,
    [medicationId, `-${days}`]
  );
  const { total, taken } = row || { total: 0, taken: 0 };
  return total > 0 ? Math.round((taken / total) * 100) : 0;
};

export const getOverallAdherence = async (userId, days = 30) => {
  const db = await getDb();
  const row = await db.getFirstAsync(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN dh.status = 'taken' THEN 1 ELSE 0 END) AS taken,
            SUM(CASE WHEN dh.status = 'missed' THEN 1 ELSE 0 END) AS missed
     FROM dose_history dh
     JOIN medications m ON m.id = dh.medication_id
     WHERE m.user_id = ? AND dh.scheduled_time >= datetime('now', ? || ' days') AND dh.status != 'pending';`,
    [userId, `-${days}`]
  );
  const { total = 0, taken = 0, missed = 0 } = row || {};
  return { total, taken, missed, rate: total > 0 ? Math.round((taken / total) * 100) : 0 };
};

export const getConsecutiveMissedCount = async (medicationId) => {
  const db = await getDb();
  const rows = await db.getAllAsync(
    `SELECT status FROM dose_history
     WHERE medication_id = ? AND status != 'pending'
     ORDER BY scheduled_time DESC LIMIT 5;`,
    [medicationId]
  );
  let count = 0;
  for (const row of rows) {
    if (row.status === 'missed') count++;
    else break;
  }
  return count;
};
