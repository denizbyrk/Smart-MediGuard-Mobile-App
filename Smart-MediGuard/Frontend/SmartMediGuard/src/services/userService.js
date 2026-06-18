import { getDb } from '../database/db';

export const createUser = async (user) => {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO users (name, email, age, health_conditions, emergency_contact) VALUES (?, ?, ?, ?, ?);`,
    [
      user.name,
      user.email ?? null,
      user.age ?? null,
      JSON.stringify(user.health_conditions ?? []),
      user.emergency_contact ? JSON.stringify(user.emergency_contact) : null,
    ]
  );
  return result.lastInsertRowId;
};

export const upsertUser = async (user) => {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO users (id, name, email, age)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name  = excluded.name,
       email = excluded.email;`,
    [user.id, user.name, user.email ?? null, user.age ?? null]
  );
};

export const getUserById = async (id) => {
  const db = await getDb();
  const user = await db.getFirstAsync(`SELECT * FROM users WHERE id = ?;`, [id]);
  if (!user) return null;
  return {
    ...user,
    health_conditions: JSON.parse(user.health_conditions || '[]'),
    emergency_contact: user.emergency_contact ? JSON.parse(user.emergency_contact) : null,
  };
};

export const updateUser = async (id, updates) => {
  const db = await getDb();
  await db.runAsync(
    `UPDATE users SET
       name = COALESCE(?, name),
       email = COALESCE(?, email),
       age = COALESCE(?, age),
       health_conditions = COALESCE(?, health_conditions),
       emergency_contact = COALESCE(?, emergency_contact)
     WHERE id = ?;`,
    [
      updates.name ?? null,
      updates.email ?? null,
      updates.age ?? null,
      updates.health_conditions ? JSON.stringify(updates.health_conditions) : null,
      updates.emergency_contact ? JSON.stringify(updates.emergency_contact) : null,
      id,
    ]
  );
};
