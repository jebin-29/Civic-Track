#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Checking CivicTrack Project for Common Errors...\n');

let hasErrors = false;

// Check 1: Node.js version
console.log('1. Checking Node.js version...');
try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (majorVersion >= 18) {
        console.log(`✅ Node.js ${nodeVersion} (OK)`);
    } else {
        console.log(`❌ Node.js ${nodeVersion} (Need v18 or higher)`);
        hasErrors = true;
    }
} catch (error) {
    console.log('❌ Node.js not found');
    hasErrors = true;
}

// Check 2: Backend dependencies
console.log('\n2. Checking backend dependencies...');
const backendPackageJson = path.join(__dirname, 'backend', 'package.json');
if (fs.existsSync(backendPackageJson)) {
    console.log('✅ Backend package.json exists');
    
    const backendNodeModules = path.join(__dirname, 'backend', 'node_modules');
    if (fs.existsSync(backendNodeModules)) {
        console.log('✅ Backend node_modules exists');
    } else {
        console.log('❌ Backend node_modules missing (run: cd backend && npm install)');
        hasErrors = true;
    }
} else {
    console.log('❌ Backend package.json missing');
    hasErrors = true;
}

// Check 3: Frontend dependencies
console.log('\n3. Checking frontend dependencies...');
const frontendPackageJson = path.join(__dirname, 'package.json');
if (fs.existsSync(frontendPackageJson)) {
    console.log('✅ Frontend package.json exists');
    
    const frontendNodeModules = path.join(__dirname, 'node_modules');
    if (fs.existsSync(frontendNodeModules)) {
        console.log('✅ Frontend node_modules exists');
    } else {
        console.log('❌ Frontend node_modules missing (run: npm install)');
        hasErrors = true;
    }
} else {
    console.log('❌ Frontend package.json missing');
    hasErrors = true;
}

// Check 4: Backend environment file
console.log('\n4. Checking backend environment...');
const backendEnv = path.join(__dirname, 'backend', '.env');
const backendEnvExample = path.join(__dirname, 'backend', 'env.example');

if (fs.existsSync(backendEnv)) {
    console.log('✅ Backend .env file exists');
    
    const envContent = fs.readFileSync(backendEnv, 'utf8');
    if (envContent.includes('DATABASE_URL=')) {
        console.log('✅ DATABASE_URL is configured');
    } else {
        console.log('❌ DATABASE_URL not found in .env');
        hasErrors = true;
    }
} else if (fs.existsSync(backendEnvExample)) {
    console.log('⚠️  Backend .env file missing (copy from env.example)');
    hasErrors = true;
} else {
    console.log('❌ Backend env.example missing');
    hasErrors = true;
}

// Check 5: Prisma setup
console.log('\n5. Checking Prisma setup...');
const prismaSchema = path.join(__dirname, 'backend', 'prisma', 'schema.prisma');
if (fs.existsSync(prismaSchema)) {
    console.log('✅ Prisma schema exists');
    
    const prismaClient = path.join(__dirname, 'backend', 'node_modules', '@prisma', 'client');
    if (fs.existsSync(prismaClient)) {
        console.log('✅ Prisma client generated');
    } else {
        console.log('❌ Prisma client not generated (run: cd backend && npx prisma generate)');
        hasErrors = true;
    }
} else {
    console.log('❌ Prisma schema missing');
    hasErrors = true;
}

// Check 6: Uploads directory
console.log('\n6. Checking uploads directory...');
const uploadsDir = path.join(__dirname, 'backend', 'uploads');
if (fs.existsSync(uploadsDir)) {
    console.log('✅ Uploads directory exists');
} else {
    console.log('⚠️  Uploads directory missing (will be created automatically)');
}

// Check 7: Port availability (basic check)
console.log('\n7. Checking port availability...');
try {
    const net = require('net');
    const testPort = (port) => {
        return new Promise((resolve) => {
            const server = net.createServer();
            server.listen(port, () => {
                server.close();
                resolve(true);
            });
            server.on('error', () => {
                resolve(false);
            });
        });
    };
    
    const backendPort = testPort(3000);
    const frontendPort = testPort(7532);
    
    if (backendPort) {
        console.log('✅ Port 3000 (backend) is available');
    } else {
        console.log('❌ Port 3000 (backend) is in use');
        hasErrors = true;
    }
    
    if (frontendPort) {
        console.log('✅ Port 7532 (frontend) is available');
    } else {
        console.log('❌ Port 7532 (frontend) is in use');
        hasErrors = true;
    }
} catch (error) {
    console.log('⚠️  Could not check port availability');
}

// Summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
    console.log('❌ Found some issues that need to be fixed');
    console.log('\nQuick fixes:');
    console.log('1. Install dependencies: npm install && cd backend && npm install');
    console.log('2. Set up environment: cp backend/env.example backend/.env');
    console.log('3. Generate Prisma client: cd backend && npx prisma generate');
    console.log('4. Create database and update DATABASE_URL in backend/.env');
} else {
    console.log('✅ All checks passed! Your project is ready to run.');
    console.log('\nTo start the application:');
    console.log('1. Backend: cd backend && npm run dev');
    console.log('2. Frontend: npm run dev');
    console.log('Or use: ./start.ps1 (PowerShell) or start.bat (Command Prompt)');
}

console.log('\nFor detailed setup instructions, see: setup.md'); 