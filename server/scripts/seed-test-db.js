import { initializeDatabase, getDb, shutdownDatabase } from '../src/config/database.js';
import bcrypt from 'bcrypt';
import Logger from '../src/logger.js';

async function seedTestDb() {
  Logger.info("Starting test database seeding...");

  try {
    // 1. Initialize database (this creates the DB and runs migrations if needed)
    await initializeDatabase();
    const db = getDb();

    // 2. Clear existing test data to ensure a clean state
    db.exec(`
      DELETE FROM shared_snippets;
      DELETE FROM api_keys;
      DELETE FROM fragments;
      DELETE FROM categories;
      DELETE FROM snippets;
      DELETE FROM users;
    `);

    // 3. Insert 'testuser' (ID 1)
    const passwordHash = await bcrypt.hash('Password123', 10);
    const insertUser = db.prepare(`
      INSERT INTO users (id, username, username_normalized, password_hash, is_admin, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertUser.run(1, 'testuser', 'testuser', passwordHash, 0, 1);
    Logger.info("Seeded user: testuser (ID 1)");

    // 4. Insert snippets (ID 1 and 2)
    const insertSnippet = db.prepare(`
      INSERT INTO snippets (id, title, description, user_id, is_public, is_pinned, is_favorite, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    insertSnippet.run(1, 'Hello World', 'My first snippet', 1, 1, 0, 0);
    insertSnippet.run(2, 'Hello World 2', 'For deletion', 1, 1, 0, 0);
    Logger.info("Seeded snippets (ID 1, 2)");

    // 5. Insert fragment for snippet 1 and 2
    const insertFragment = db.prepare(`
      INSERT INTO fragments (id, snippet_id, file_name, code, language, position)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertFragment.run(1, 1, 'hello.js', "console.log('Hello World');", 'javascript', 0);
    insertFragment.run(2, 2, 'hello2.js', "console.log('Hello World 2');", 'javascript', 0);
    Logger.info("Seeded fragments");
    
    // 6. Insert category for snippet 1
    const insertCategory = db.prepare(`
      INSERT INTO categories (id, snippet_id, name)
      VALUES (?, ?, ?)
    `);
    insertCategory.run(1, 1, 'tutorial');
    insertCategory.run(2, 1, 'js');
    Logger.info("Seeded categories for snippet 1");

    // 7. Insert API Keys (ID 1 and 2)
    const insertApiKey = db.prepare(`
      INSERT INTO api_keys (id, user_id, key, name, is_active)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertApiKey.run(1, 1, 'OXPQD', 'Test Key', 1);
    insertApiKey.run(2, 1, 'DELETE_KEY', 'Key for Deletion', 1);
    Logger.info("Seeded API keys");

    // 8. Insert Share Links (ID 123 and 124) pointing to Snippets
    const insertShare = db.prepare(`
      INSERT INTO shared_snippets (id, snippet_id, requires_auth)
      VALUES (?, ?, ?)
    `);
    insertShare.run('123', 1, 0);
    insertShare.run('124', 2, 0);
    Logger.info("Seeded share links '123' and '124'");

    Logger.info("Test database seeding completed successfully.");
    
    shutdownDatabase();
    process.exit(0);
  } catch (error) {
    Logger.error("Failed to seed test database:", error);
    process.exit(1);
  }
}

seedTestDb();
