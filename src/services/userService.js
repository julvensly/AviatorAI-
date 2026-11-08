import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

const USERS_FILE = path.resolve(
  currentDirectory,
  '../../data/users.json'
);

export async function readUsers() {
  try {
    const content = await readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(content);

    if (!Array.isArray(users)) {
      throw new Error('Invalid users data format.');
    }

    return users;
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error('Users storage file not found.');
    }

    throw error;
  }
}

export async function findUserById(id) {
  if (typeof id !== 'string' || !id.trim()) {
    return null;
  }

  const users = await readUsers();

  return users.find(user => user.id === id) || null;
}

export async function findUserByEmail(email) {
  if (typeof email !== 'string' || !email.trim()) {
    return null;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const users = await readUsers();

  return users.find(
    user => user.email?.toLowerCase() === normalizedEmail
  ) || null;
}
