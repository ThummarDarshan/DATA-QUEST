// scripts/install.js - Helper script to install dependencies
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const installDependencies = () => {
  console.log('📦 Installing backend dependencies...');
  
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ package.json not found!');
    process.exit(1);
  }

  exec('npm install', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Installation failed:', error);
      process.exit(1);
    }

    if (stderr) {
      console.warn('⚠️ Installation warnings:', stderr);
    }

    console.log('✅ Dependencies installed successfully!');
    console.log(stdout);
    
    console.log('\n🎉 Setup complete! Next steps:');
    console.log('1. Create your database in XAMPP: fixit_chat');
    console.log('2. Update your .env file with proper values');
    console.log('3. Run: npm run migrate (to create tables)');
    console.log('4. Run: npm run dev (to start development server)');
  });
};

if (require.main === module) {
  installDependencies();
}

module.exports = { installDependencies };
