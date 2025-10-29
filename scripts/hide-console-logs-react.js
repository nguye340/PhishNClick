/**
 * Script to replace console.log with debugLog in React/TypeScript files
 * This hides console logs in production while keeping them in development
 */

const fs = require('fs');
const path = require('path');

// Files to process
const filesToProcess = [
  // Popup Manic game
  'frontend/src/components/games/popup-manic/popup-manic-game.tsx',
  'frontend/src/components/games/popup-manic/modern-popup-integration.tsx',
  'frontend/src/components/games/popup-manic/popup-manic-with-telemetry.tsx',
  'frontend/src/components/games/popup-manic/popup-types/PhoneCallUI.tsx',
  
  // Game telemetry
  'frontend/src/lib/game-telemetry.ts',
  
  // Assessment components
  'frontend/src/components/assessment/final-quiz.tsx',
  'frontend/src/components/assessment/phishing-test.tsx',
  
  // UI components
  'frontend/src/components/rive/RiveMainCharacter.tsx',
  'frontend/src/components/fish/swimming-fish.tsx',
  'frontend/src/components/popups/PopupDisplay.jsx',
  'frontend/src/components/popups/ModernPopupFetcher.tsx',
  'frontend/src/components/ui/GameDialogue.tsx',
  'frontend/src/components/landing/hero.tsx',
  
  // Auth context
  'frontend/src/context/auth.context.jsx',
  
  // API routes
  'frontend/src/app/api/popup/random/route.js',
  'frontend/src/app/api/voice/random/route.js',
  
  // Old game components
  'frontend/src/components/games/Phish404Game/ObstacleController.js',
  'frontend/src/components/games/Phish404Game/Player.js',
];

function addDebugImport(content, filePath) {
  const ext = path.extname(filePath);
  const isTypeScript = ext === '.ts' || ext === '.tsx';
  const isJavaScript = ext === '.js' || ext === '.jsx';
  
  // Check if import already exists
  if (content.includes('from \'@/lib/debug-utils\'') || 
      content.includes('from "@/lib/debug-utils"') ||
      content.includes('from \'../../../lib/debug-utils\'') ||
      content.includes('from \'../../lib/debug-utils\'') ||
      content.includes('from \'../../../../lib/debug-utils\'')) {
    return content;
  }
  
  // Calculate relative path to debug-utils
  const fileDir = path.dirname(filePath);
  const debugUtilsPath = 'frontend/src/lib/debug-utils';
  const relativePath = path.relative(fileDir, debugUtilsPath).replace(/\\/g, '/');
  
  // For files in src/, use @/lib/debug-utils alias
  const importStatement = isTypeScript || isJavaScript
    ? `import { debugLog, debugError, debugWarn } from '@/lib/debug-utils';\n`
    : '';
  
  // Find the best place to add the import
  const lines = content.split('\n');
  let insertIndex = 0;
  
  // Find last import statement
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ') || lines[i].trim().startsWith('const ')) {
      insertIndex = i + 1;
    }
    if (lines[i].trim().startsWith('export ') || 
        lines[i].trim().startsWith('function ') ||
        lines[i].trim().startsWith('class ')) {
      break;
    }
  }
  
  lines.splice(insertIndex, 0, importStatement);
  return lines.join('\n');
}

function replaceConsoleLogs(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let changeCount = 0;
  
  // Add import statement
  content = addDebugImport(content, filePath);
  
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

// Main execution
console.log('🚀 Starting React/TypeScript console.log replacement...\n');

console.log('📁 Processing React/TypeScript files...');
filesToProcess.forEach(replaceConsoleLogs);

console.log('\n✅ Console log replacement complete!');
console.log('\n📝 Note: Import statements added to all files.');
