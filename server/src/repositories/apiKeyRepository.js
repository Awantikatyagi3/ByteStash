import { getDb } from '../config/database.js';
import crypto from 'crypto';
import Logger from '../logger.js';

function generateApiKey() {
  return crypto.randomBytes(32).toString('hex');
}

// Normalization boundary for all ApiKey entities returned to callers.
// Mirrors the #processSnippet() / #processShare() pattern used elsewhere in
// the repository layer. Ensures is_active is always a JavaScript boolean
// regardless of whether the value originates from a synthetic object literal
// (createApiKey) or a raw better-sqlite3 row (getApiKeys).
function processApiKey(apiKey) {
  if (!apiKey) return null;
  return {
    id: apiKey.id,
    ...(apiKey.key !== undefined && { key: apiKey.key }),
    name: apiKey.name,
    created_at: apiKey.created_at,
    last_used_at: apiKey.last_used_at ?? null,
    is_active: !!apiKey.is_active,
  };
}

export function createApiKey(userId, name) {
  const db = getDb();
  const key = generateApiKey();
  
  try {
    const stmt = db.prepare(`
      INSERT INTO api_keys (user_id, key, name)
      VALUES (?, ?, ?)
    `);
    
    const result = stmt.run(userId, key, name);
    
    if (result.changes === 1) {
      Logger.debug(`Created new API key for user ${userId}`);
      return processApiKey({
        id: result.lastInsertRowid,
        key,
        name,
        created_at: new Date().toISOString(),
        last_used_at: null,
        is_active: true,
      });
    }
    return null;
  } catch (error) {
    Logger.error('Error creating API key:', error);
    throw error;
  }
}

export function getApiKeys(userId) {
  const db = getDb();
  try {
    const stmt = db.prepare(`
      SELECT id, name, created_at, last_used_at, is_active
      FROM api_keys
      WHERE user_id = ?
      ORDER BY created_at DESC
    `);
    
    return stmt.all(userId).map(processApiKey);
  } catch (error) {
    Logger.error('Error fetching API keys:', error);
    throw error;
  }
}

export function deleteApiKey(userId, keyId) {
  const db = getDb();
  try {
    const stmt = db.prepare(`
      DELETE FROM api_keys
      WHERE id = ? AND user_id = ?
    `);
    
    const result = stmt.run(keyId, userId);
    if (result.changes === 1) {
      Logger.debug(`Deleted API key ${keyId} for user ${userId}`);
    }
    return result.changes === 1;
  } catch (error) {
    Logger.error('Error deleting API key:', error);
    throw error;
  }
}

export function validateApiKey(key) {
  const db = getDb();
  try {
    const stmt = db.prepare(`
      SELECT ak.*, u.id as user_id
      FROM api_keys ak
      JOIN users u ON ak.user_id = u.id
      WHERE ak.key = ? AND ak.is_active = TRUE
    `);
    
    const apiKey = stmt.get(key);
    
    if (apiKey) {
      // Update last_used_at
      db.prepare(`
        UPDATE api_keys
        SET last_used_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(apiKey.id);
      
      Logger.debug(`Validated API key ${apiKey.id} for user ${apiKey.user_id}`);
      return {
        userId: apiKey.user_id,
        keyId: apiKey.id
      };
    }
    
    return null;
  } catch (error) {
    Logger.error('Error validating API key:', error);
    throw error;
  }
}
