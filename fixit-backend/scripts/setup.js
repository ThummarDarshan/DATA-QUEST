
const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const setupProject = async () => {
  console.log('🚀 Fixit AI Backend Setup');
  console.log('========================\n');

  try {
    // Create necessary directories
    const dirs = ['uploads', 'logs', 'temp'];
    for (const dir of dirs) {
      const dirPath = path.join(__dirname, '..', dir);
      try {
        await fs.access(dirPath);
        console.log(`✅ Directory ${dir}/ already exists`);
      } catch {
        await fs.mkdir(dirPath, { recursive: true });
        console.log(`✅ Created directory ${dir}/`);
      }
    }

    // Check .env file
    const envPath = path.join(__dirname, '..', '.env');
    try {
      await fs.access(envPath);
      console.log('✅ .env file exists');
      
      const updateEnv = await question('Do you want to update environment variables? (y/n): ');
      if (updateEnv.toLowerCase() === 'y') {
        await setupEnvironmentVariables();
      }
    } catch {
      console.log('⚠️ .env file not found, creating...');
      await createEnvFile();
    }

    // Create .gitignore if it doesn't exist
    await createGitignore();

    console.log('\n🎉 Setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Start XAMPP and create database "fixit_chat"');
    console.log('2. Update .env with your database credentials and API keys');
    console.log('3. Run: npm run migrate');
    console.log('4. Run: npm run dev');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    rl.close();
  }
};

const setupEnvironmentVariables = async () => {
  console.log('\n📝 Environment Variables Setup:');
  
  const dbName = await question('Database name (fixit_chat): ') || 'fixit_chat';
  const dbUser = await question('Database username (root): ') || 'root';
  const dbPassword = await question('Database password: ') || '';
  const geminiKey = await question('Gemini API Key: ');
  const emailUser = await question('Email address for notifications: ');
  const emailPassword = await question('Email app password: ');
  const frontendUrl = await question('Frontend URL (http://localhost:3000): ') || 'http://localhost:3000';

  const envContent = generateEnvContent({
    dbName,
    dbUser,
    dbPassword,
    geminiKey,
    emailUser,
    emailPassword,
    frontendUrl
  });

  await fs.writeFile(path.join(__dirname, '..', '.env'), envContent);
  console.log('✅ .env file updated');
};

const createEnvFile = async () => {
  const envTemplate = `# Server Configuration
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production_${Math.random().toString(36).substring(7)}
JWT_EXPIRES_IN=7d

# Database Configuration (XAMPP MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=fixit_chat
DB_USER=root
DB_PASSWORD=

# Google Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Email Configuration (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=Fixit AI <your-email@gmail.com>

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads/

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Session Secret
SESSION_SECRET=your_session_secret_here_change_in_production_${Math.random().toString(36).substring(7)}
`;

  await fs.writeFile(path.join(__dirname, '..', '.env'), envTemplate);
  console.log('✅ .env template created');
};

const generateEnvContent = (config) => {
  return `# Server Configuration
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production_${Math.random().toString(36).substring(7)}
JWT_EXPIRES_IN=7d

# Database Configuration (XAMPP MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=${config.dbName}
DB_USER=${config.dbUser}
DB_PASSWORD=${config.dbPassword}

# Google Gemini AI Configuration
GEMINI_API_KEY=${config.geminiKey}

# Email Configuration (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=${config.emailUser}
EMAIL_PASSWORD=${config.emailPassword}
EMAIL_FROM=Fixit AI <${config.emailUser}>

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads/

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# Frontend URL (for CORS)
FRONTEND_URL=${config.frontendUrl}

# Session Secret
SESSION_SECRET=your_session_secret_here_change_in_production_${Math.random().toString(36).substring(7)}
`;
};

const createGitignore = async () => {
  const gitignorePath = path.join(__dirname, '..', '.gitignore');
  
  try {
    await fs.access(gitignorePath);
    console.log('✅ .gitignore already exists');
  } catch {
    const gitignoreContent = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.production

# Logs
logs/
*.log

# Uploads
uploads/*
!uploads/.gitkeep

# Temporary files
temp/
.tmp/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Database
*.sqlite
*.sqlite3

# Test coverage
coverage/

# Build outputs
dist/
build/
`;

    await fs.writeFile(gitignorePath, gitignoreContent);
    console.log('✅ .gitignore created');
  }
};

if (require.main === module) {
  setupProject();
}

module.exports = { setupProject };
