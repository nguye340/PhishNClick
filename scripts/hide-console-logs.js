/**
 * Script to replace console.log with debugLog in game files
 * This hides console logs in production while keeping them in development
 */

const fs = require('fs');
const path = require('path');

// Files to process
const filesToProcess = [
  // Phish404 game files
  'frontend/public/games/phish404/game.js',
  'frontend/public/games/phish404/hacker-controller.js',
  'frontend/public/games/phish404/hacker.js',
  'frontend/public/games/phish404/player.js',
  'frontend/public/games/phish404/electric-ball-controller.js',
  'frontend/public/games/phish404/shield-powerup-controller.js',
  'frontend/public/games/phish404/attack-powerup-controller.js',
  'frontend/public/games/phish404/burger-controller.js',
  'frontend/public/games/phish404/milk-controller.js',
  'frontend/public/games/phish404/coin-controller.js',
  'frontend/public/games/phish404/obstacleController.js',
  'frontend/public/games/phish404/skull-controller.js',
  'frontend/public/games/phish404/game-fixes.js',
  
  // PhishHunt game files
  'frontend/public/games/phish-hunt/JS/Game.js',
  'frontend/public/games/phish-hunt/JS/Duck.js',
  'frontend/public/games/phish-hunt/JS/View.js',
  
  // Game telemetry
  'frontend/public/games/game-telemetry.js',
  
  // Hooked or Cooked (embedded in HTML)
  'frontend/public/games/mini_game/mini_game/index.html',
];

// Auth files to process
const authFiles = [
  'frontend/src/lib/auth.ts',
  'frontend/src/app/api/auth/[...nextauth]/route.ts',
];

function replaceConsoleLogs(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let changeCount = 0;
  
  // Replace console.log with debugLog (but not console.error or console.warn)
  const logRegex = /\bconsole\.log\(/g;
  const matches = content.match(logRegex);
  
  if (matches) {
    changeCount = matches.length;
    content = content.replace(logRegex, 'debugLog(');
  }
  
  // Replace console.error with debugError
  const errorRegex = /\bconsole\.error\(/g;
  const errorMatches = content.match(errorRegex);
  
  if (errorMatches) {
    changeCount += errorMatches.length;
    content = content.replace(errorRegex, 'debugError(');
  }
  
  // Replace console.warn with debugWarn
  const warnRegex = /\bconsole\.warn\(/g;
  const warnMatches = content.match(warnRegex);
  
  if (warnMatches) {
    changeCount += warnMatches.length;
    content = content.replace(warnRegex, 'debugWarn(');
  }
  
  if (changeCount > 0) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ ${filePath}: Replaced ${changeCount} console statements`);
  } else {
    console.log(`ℹ️  ${filePath}: No console statements found`);
  }
}

function processAuthFiles(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let changeCount = 0;
  
  // For TypeScript/Next.js files, wrap console.log in production check
  const logRegex = /console\.log\(([^)]+)\);?/g;
  const matches = content.match(logRegex);
  
  if (matches) {
    changeCount = matches.length;
    content = content.replace(
      logRegex,
      (match, args) => `if (process.env.NODE_ENV !== 'production') console.log(${args});`
    );
  }
  
  if (changeCount > 0) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ ${filePath}: Wrapped ${changeCount} console.log statements`);
  } else {
    console.log(`ℹ️  ${filePath}: No console.log statements found`);
  }
}

// Main execution
console.log('🚀 Starting console.log replacement...\n');

console.log('📁 Processing game files...');
filesToProcess.forEach(replaceConsoleLogs);

console.log('\n📁 Processing auth files...');
authFiles.forEach(processAuthFiles);

console.log('\n✅ Console log replacement complete!');
console.log('\n📝 Note: Make sure debug-utils.js is loaded in all HTML files before other scripts.');
