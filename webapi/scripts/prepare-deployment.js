const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function prepareDeployment() {
  console.log('🚀 Preparing FinFlux for Vercel deployment...');
  console.log('================================================');
  
  try {
    // Step 1: Check and build webapp if needed
    const webappPath = path.join(__dirname, '../../webapp');
    const webappDistPath = path.join(webappPath, 'dist');
    
    if (!fs.existsSync(webappDistPath)) {
      console.log('📦 Webapp build not found. Building webapp...');
      
      // Change to webapp directory and build
      process.chdir(webappPath);
      console.log('📁 Changed directory to:', process.cwd());
      
      console.log('🔧 Installing webapp dependencies...');
      execSync('npm install', { stdio: 'inherit' });
      
      console.log('🏗️  Building webapp...');
      execSync('npm run build', { stdio: 'inherit' });
      
      // Return to webapi directory
      process.chdir(path.join(__dirname, '..'));
      console.log('📁 Returned to webapi directory:', process.cwd());
    } else {
      console.log('✅ Webapp build found');
    }
    
    // Step 2: Copy webapp build files to webapi/build
    console.log('📋 Copying webapp files to API directory...');
    const copyWebappPath = path.join(__dirname, 'copy-webapp.js');
    
    // Execute the copy script
    execSync(`node "${copyWebappPath}"`, { stdio: 'inherit' });
    
    // Step 3: Verify webapi dependencies
    console.log('🔧 Verifying API dependencies...');
    const webapiNodeModules = path.join(__dirname, '../node_modules');
    
    if (!fs.existsSync(webapiNodeModules)) {
      console.log('📦 Installing API dependencies...');
      execSync('npm install', { stdio: 'inherit' });
    } else {
      console.log('✅ API dependencies found');
    }
    
    // Step 4: Verify build structure
    console.log('🔍 Verifying build structure...');
    const buildPath = path.join(__dirname, '../build');
    
    if (fs.existsSync(buildPath)) {
      const buildFiles = fs.readdirSync(buildPath);
      console.log('📋 Build directory contents:', buildFiles);
      
      // Check for essential files
      const hasIndexHtml = buildFiles.includes('index.html');
      const hasAssets = buildFiles.includes('assets') || buildFiles.some(f => f.includes('.js') || f.includes('.css'));
      
      if (hasIndexHtml && hasAssets) {
        console.log('✅ Build structure looks good!');
      } else {
        console.warn('⚠️  Warning: Build structure may be incomplete');
        console.log('   Missing:', !hasIndexHtml ? 'index.html' : '', !hasAssets ? 'assets/JS/CSS files' : '');
      }
    } else {
      throw new Error('Build directory not found after copying');
    }
    
    console.log('================================================');
    console.log('🎉 Deployment preparation complete!');
    console.log('💡 Your app is ready to deploy to Vercel');
    console.log('');
    console.log('Next steps:');
    console.log('1. Commit your changes: git add . && git commit -m "Prepare for deployment"');
    console.log('2. Push to GitHub: git push');
    console.log('3. Deploy to Vercel: vercel --prod');
    
  } catch (error) {
    console.error('❌ Deployment preparation failed:', error.message);
    console.log('');
    console.log('💡 Troubleshooting tips:');
    console.log('- Ensure you have npm installed');
    console.log('- Check that webapp/ directory exists');
    console.log('- Verify webapp package.json has a "build" script');
    console.log('- Make sure you\'re running this from the webapi/ directory');
    process.exit(1);
  }
}

// Run the preparation
prepareDeployment();