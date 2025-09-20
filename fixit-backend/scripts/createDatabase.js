// scripts/createDatabase.js - Create database if it doesn't exist
const mysql = require('mysql2/promise');
require('dotenv').config();

const createDatabase = async () => {
  let connection;
  
  try {
    console.log('🔧 Creating database...');
    
    // Connect to MySQL without specifying a database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'fixit_ai';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`✅ Database '${dbName}' created or already exists`);

    // Use the database
    await connection.query(`USE \`${dbName}\``);
    console.log(`✅ Using database '${dbName}'`);

    console.log('🎉 Database setup completed!');
    console.log('\nNext steps:');
    console.log('1. Run: npm run migrate');
    console.log('2. Run: npm run dev');

  } catch (error) {
    console.error('❌ Database creation failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure MySQL/XAMPP is running');
    console.log('2. Check your database credentials in .env file');
    console.log('3. Ensure the database user has CREATE privileges');
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

if (require.main === module) {
  createDatabase();
}

module.exports = { createDatabase };
