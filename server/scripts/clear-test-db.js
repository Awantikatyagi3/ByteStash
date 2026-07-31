import { initializeDatabase, getDb, shutdownDatabase } from '../src/config/database.js';
import Logger from '../src/logger.js';

async function clearTestDb() {
  Logger.info("Starting test database cleanup...");

  try {
    // 1. Initialize database connection
    await initializeDatabase();
    const db = getDb();

    // 2. Clear all tables modified by seeding/testing
    db.exec(`
      DELETE FROM shared_snippets;
      DELETE FROM api_keys;
      DELETE FROM fragments;
      DELETE FROM categories;
      DELETE FROM snippets;
      DELETE FROM users;
    `);

    Logger.info("Test database cleaned up successfully.");

    shutdownDatabase();
    process.exit(0);
  } catch (error) {
    Logger.error("Failed to clean up test database:", error);
    process.exit(1);
  }
}

clearTestDb();
