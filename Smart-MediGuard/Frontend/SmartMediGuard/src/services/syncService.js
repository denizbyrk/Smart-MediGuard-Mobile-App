import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BASE_URL } from '../config';
import { getDb } from '../database/db';

const fetchRecord = async (db, tableName, recordId) => {
  try {
    if (tableName === 'medications') {
      return await db.getFirstAsync('SELECT * FROM medications WHERE id = ?;', [recordId]);
    }
    if (tableName === 'dose_history') {
      return await db.getFirstAsync('SELECT * FROM dose_history WHERE id = ?;', [recordId]);
    }
    if (tableName === 'reminders') {
      return await db.getFirstAsync('SELECT * FROM reminders WHERE id = ?;', [recordId]);
    }
  } catch {}
  return null;
};

export const syncWithServer = async () => {
  const token = await AsyncStorage.getItem('token');
  if (!token) return;

  const db = await getDb();
  const pending = await db.getAllAsync(
    `SELECT * FROM sync_log WHERE synced = 0 ORDER BY timestamp ASC LIMIT 100;`
  );
  if (pending.length === 0) return;

  const lastSync = await AsyncStorage.getItem('lastSyncAt') ?? new Date(0).toISOString();

  const changes = [];
  for (const entry of pending) {
    const record = entry.action !== 'DELETE'
      ? await fetchRecord(db, entry.table_name, entry.record_id)
      : null;

    changes.push({
      tableName: entry.table_name,
      recordId: entry.record_id,
      action: entry.action,
      data: record ? JSON.stringify(record) : null,
    });
  }

  try {
    const response = await axios.post(
      `${BASE_URL}/sync`,
      { changes, lastSyncAt: lastSync },
      { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
    );

    if (response.data.success) {
      const ids = pending.map(p => p.id).join(',');
      if (ids) {
        await db.runAsync(`UPDATE sync_log SET synced = 1 WHERE id IN (${ids});`);
      }
      await AsyncStorage.setItem('lastSyncAt', new Date().toISOString());
      console.log(`${response.data.processedCount} change sent to server.`);
    }
  } catch (e) {
    console.log('Sync failed: ', e?.message);
  }
};
