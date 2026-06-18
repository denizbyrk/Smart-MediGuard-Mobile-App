import { getDb } from '../database/db';

export const addMedication = async (med) => {
  const db = await getDb();
  const timeSlots = med.time_slots ?? [];

  const result = await db.runAsync(
    `INSERT INTO medications
      (user_id, name, dosage, frequency, time_slots, stock_count,
       stock_warning_threshold, instructions, image_uri, color_code,
       start_date, end_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      med.user_id,
      med.name,
      med.dosage ?? null,
      med.frequency ?? null,
      JSON.stringify(timeSlots),
      med.stock_count ?? 0,
      med.stock_warning_threshold ?? 7,
      med.instructions ?? null,
      med.image_uri ?? null,
      med.color_code ?? null,
      med.start_date ?? null,
      med.end_date ?? null,
    ]
  );
  const newId = result.lastInsertRowId;

  await db.runAsync(
    `INSERT INTO sync_log (table_name, record_id, action) VALUES (?, ?, 'INSERT');`,
    ['medications', newId]
  );

  for (const slot of timeSlots) {
    const reminderResult = await db.runAsync(
      `INSERT INTO reminders (medication_id, reminder_time, is_active, snooze_minutes)
       VALUES (?, ?, 1, 15);`,
      [newId, slot]
    );
    await db.runAsync(
      `INSERT INTO sync_log (table_name, record_id, action) VALUES (?, ?, 'INSERT');`,
      ['reminders', reminderResult.lastInsertRowId]
    );
  }

  const today = new Date().toISOString().split('T')[0];
  for (const slot of timeSlots) {
    // "HH:MM" → "YYYY-MM-DD HH:MM:00"
    const scheduledTime = `${today} ${slot.length === 5 ? slot : slot.substring(0, 5)}:00`;
    const doseResult = await db.runAsync(
      `INSERT INTO dose_history (medication_id, scheduled_time, status)
       VALUES (?, ?, 'pending');`,
      [newId, scheduledTime]
    );
    await db.runAsync(
      `INSERT INTO sync_log (table_name, record_id, action) VALUES (?, ?, 'INSERT');`,
      ['dose_history', doseResult.lastInsertRowId]
    );
  }

  return newId;
};

export const getMedications = async (userId) => {
  const db = await getDb();
  const rows = await db.getAllAsync(
    `SELECT * FROM medications WHERE user_id = ? AND is_active = 1 ORDER BY name;`,
    [userId]
  );
  return rows.map((row) => ({
    ...row,
    time_slots: JSON.parse(row.time_slots || '[]'),
  }));
};

export const updateMedication = async (id, updates) => {
  const db = await getDb();
  const result = await db.runAsync(
    `UPDATE medications SET
       name = COALESCE(?, name),
       dosage = COALESCE(?, dosage),
       frequency = COALESCE(?, frequency),
       time_slots = COALESCE(?, time_slots),
       stock_count = COALESCE(?, stock_count),
       stock_warning_threshold = COALESCE(?, stock_warning_threshold),
       instructions = COALESCE(?, instructions),
       image_uri = COALESCE(?, image_uri),
       color_code = COALESCE(?, color_code),
       end_date = COALESCE(?, end_date),
       updated_at = CURRENT_TIMESTAMP,
       synced = 0
     WHERE id = ?;`,
    [
      updates.name ?? null,
      updates.dosage ?? null,
      updates.frequency ?? null,
      updates.time_slots ? JSON.stringify(updates.time_slots) : null,
      updates.stock_count ?? null,
      updates.stock_warning_threshold ?? null,
      updates.instructions ?? null,
      updates.image_uri ?? null,
      updates.color_code ?? null,
      updates.end_date ?? null,
      id,
    ]
  );
  await db.runAsync(
    `INSERT INTO sync_log (table_name, record_id, action) VALUES (?, ?, 'UPDATE');`,
    ['medications', id]
  );
  return result.changes;
};

export const deleteMedication = async (id) => {
  const db = await getDb();

  await db.runAsync(
    `UPDATE medications SET is_active = 0, synced = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?;`,
    [id]
  );
  await db.runAsync(
    `UPDATE reminders SET is_active = 0 WHERE medication_id = ?;`,
    [id]
  );
  await db.runAsync(
    `INSERT INTO sync_log (table_name, record_id, action) VALUES (?, ?, 'DELETE');`,
    ['medications', id]
  );
};

export const decreaseStock = async (id) => {
  const db = await getDb();
  await db.runAsync(
    `UPDATE medications
     SET stock_count = MAX(0, stock_count - 1),
         updated_at  = CURRENT_TIMESTAMP,
         synced      = 0
     WHERE id = ?;`,
    [id]
  );
};

export const getStockWarnings = async (userId) => {
  const db = await getDb();
  const meds = await db.getAllAsync(
    `SELECT id, name, stock_count, stock_warning_threshold
     FROM medications
     WHERE user_id = ? AND is_active = 1 AND stock_count <= stock_warning_threshold
     ORDER BY stock_count ASC;`,
    [userId]
  );
  return {
    red: meds.filter(m => m.stock_count <= 1),
    orange: meds.filter(m => m.stock_count > 1 && m.stock_count <= 3),
    yellow: meds.filter(m => m.stock_count > 3),
  };
};

export const createTodaysDoseRecords = async (userId) => {
  const db = await getDb();
  const today = new Date().toISOString().split('T')[0];

  const meds = await getMedications(userId);
  for (const med of meds) {
    for (const slot of med.time_slots) {

      const existing = await db.getFirstAsync(
        `SELECT id FROM dose_history
         WHERE medication_id = ? AND date(scheduled_time) = ?;`,
        [med.id, today]
      );
      if (!existing) {
        const scheduledTime = `${today} ${slot.length === 5 ? slot : slot.substring(0, 5)}:00`;
        await db.runAsync(
          `INSERT INTO dose_history (medication_id, scheduled_time, status)
           VALUES (?, ?, 'pending');`,
          [med.id, scheduledTime]
        );
      }
    }
  }
};

export const getTodaysMedications = async (userId) => {
  const db = await getDb();
  const rows = await db.getAllAsync(
    `SELECT m.*, dh.id as dose_id, dh.status as dose_status
     FROM medications m
     LEFT JOIN dose_history dh ON dh.medication_id = m.id
       AND date(dh.scheduled_time) = date('now')
     WHERE m.user_id = ? AND m.is_active = 1
     ORDER BY m.name;`,
    [userId]
  );
  return rows.map(row => ({
    ...row,
    time_slots: JSON.parse(row.time_slots || '[]'),
  }));
};
