#!/usr/bin/env node
/**
 * Script to verify the project is ready for edge deployment
 * Checks for Node.js-specific imports and other compatibility issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.join(__dirname, '..', 'src');

// Patterns that indicate Node.js-specific code
const nodeJSPatterns = [
  /import.*from.*['"]fs['"]/, 
  /import.*from.*['"]path['"]/, 
  /import.*from.*['"]url['"]/, 
  /require\(['"]fs['"]\)/,
  /require\(['"]path['"]\)/,
  /process\.argv/,
  /process\.exit/,
  /console\.error/ // Should use console.log for Workers
];

const edgeIncompatibleApis = [
  'fs.readFileSync',
  'fs.writeFileSync', 
  'path.join',
  'fileURLToPath'
];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const issues = [];
  
  // Check for Node.js-specific imports
  nodeJSPatterns.forEach((pattern, index) => {
    if (pattern.test(content)) {
      issues.push(`Node.js-specific pattern detected: ${pattern}`);
    }
  });
  
  // Check for edge-incompatible APIs
  edgeIncompatibleApis.forEach(api => {
    if (content.includes(api)) {
      issues.push(`Edge-incompatible API: ${api}`);
    }
  });
  
  return issues;
}

function scanDirectory(dir, issues = {}) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && file !== 'node_modules' && file !== 'dist') {
      scanDirectory(filePath, issues);
    } else if (file.endsWith('.ts') || file.endsWith('.js')) {
      const fileIssues = scanFile(filePath);
      if (fileIssues.length > 0) {
        issues[filePath] = fileIssues;
      }
    }
  });
  
  return issues;
}

function main() {
  console.log('🔍 Scanning for edge deployment compatibility...\n');
  
  const issues = scanDirectory(srcDir);
  const issueCount = Object.keys(issues).length;
  
  if (issueCount === 0) {
    console.log('✅ Project is ready for edge deployment!');
    console.log('\n📦 Deployment options:');
    console.log('- Cloudflare Workers: npm run deploy:workers'); 
    console.log('- Vercel: npm run deploy:vercel');
    console.log('- HTTP Server: npm run start:http');
    process.exit(0);
  } else {
    console.log(`❌ Found ${issueCount} files with edge compatibility issues:\n`);
    
    Object.entries(issues).forEach(([file, fileIssues]) => {
      console.log(`📄 ${file.replace(srcDir, 'src')}`);
      fileIssues.forEach(issue => {
        console.log(`   - ${issue}`);
      });
      console.log();
    });
    
    console.log('💡 Recommendations:');
    console.log('- Replace filesystem operations with embedded data');
    console.log('- Remove Node.js-specific imports');  
    console.log('- Use console.log instead of console.error');
    console.log('- Consider using the HTTP server (src/http-server.ts) for edge deployment');
    
    process.exit(1);
  }
}

main();