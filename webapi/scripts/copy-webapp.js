const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // Read source directory
  const files = fs.readdirSync(src);

  files.forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);

    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

try {
  const webappDistPath = path.join(__dirname, '../../webapp/dist');
  const buildPath = path.join(__dirname, '../build');

  console.log('📦 Copying webapp build files...');
  console.log(`Source: ${webappDistPath}`);
  console.log(`Destination: ${buildPath}`);

  // Check if webapp dist exists
  if (!fs.existsSync(webappDistPath)) {
    console.error('❌ Webapp dist folder not found!');
    console.log('💡 Please run "cd ../webapp && npm run build" first');
    process.exit(1);
  }

  // Clear build directory
  if (fs.existsSync(buildPath)) {
    fs.rmSync(buildPath, { recursive: true, force: true });
  }

  // Copy webapp dist to build
  copyDir(webappDistPath, buildPath);
  
  console.log('✅ Webapp files copied successfully!');
  
  // List copied files for verification
  const copiedFiles = fs.readdirSync(buildPath);
  console.log('📋 Copied files:', copiedFiles);

} catch (error) {
  console.error('❌ Error copying webapp files:', error);
  process.exit(1);
}