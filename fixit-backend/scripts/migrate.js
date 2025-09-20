
const sequelize = require('../config/database');
const logger = require('../utils/logger');

// Import all models to ensure they're registered
const {
  User,
  ChatSession,
  Message,
  UserSettings,
  Notification
} = require('../models');

const migrate = async () => {
  try {
    console.log('Starting database migration...');
    logger.info('Starting database migration');

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Create/update tables
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Database tables created/updated');

    // Create indexes if they don't exist
    await createIndexes();
    console.log('✅ Database indexes created');

    // Seed initial data if needed
    await seedInitialData();
    console.log('✅ Initial data seeded (if needed)');

    console.log('🎉 Migration completed successfully!');
    logger.info('Database migration completed successfully');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    logger.error('Database migration failed', { error: error.message });
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

const createIndexes = async () => {
  try {
    // Additional indexes for better performance
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email_active 
      ON users (email, is_active)
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_active_last_message 
      ON chat_sessions (user_id, is_active, last_message_at DESC)
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_session_created 
      ON messages (session_id, created_at ASC)
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created 
      ON notifications (user_id, is_read, created_at DESC)
    `);

    logger.info('Additional database indexes created');
  } catch (error) {
    logger.warn('Some indexes might already exist', { error: error.message });
  }
};

const seedInitialData = async () => {
  try {
    // Check if we need to seed any initial data
    const userCount = await User.count();
    
    if (userCount === 0) {
      console.log('No users found, database appears to be fresh');
      // You can add initial admin user or default settings here if needed
    }

    logger.info('Initial data check completed');
  } catch (error) {
    logger.error('Failed to seed initial data', { error: error.message });
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  migrate();
}

module.exports = { migrate };
