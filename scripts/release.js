#!/usr/bin/env node

import { execSync } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';
import { createInterface } from 'readline';

// Get current version from package.json
const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
const currentVersion = packageJson.version;

// Parse version
const [major, minor, patch] = currentVersion.split('.').map(Number);

// Calculate new version based on type
function getNewVersion(type) {
  switch (type) {
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'major':
      return `${major + 1}.0.0`;
    case 'custom':
      return null; // Will be asked to user
    default:
      throw new Error(`Invalid release type: ${type}`);
  }
}

// Get release type from command line args
const releaseType = process.argv[2];

if (!['patch', 'minor', 'major', 'custom'].includes(releaseType)) {
  console.error('Usage: node scripts/release.js [patch|minor|major|custom]');
  process.exit(1);
}

async function createRelease() {
  try {
    let newVersion;
    let tagMessage;

    if (releaseType === 'custom') {
      const rl = createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      newVersion = await new Promise(resolve => {
        rl.question('Enter version (e.g., 1.2.3): ', answer => {
          rl.close();
          resolve(answer.trim());
        });
      });

      if (!newVersion.match(/^\d+\.\d+\.\d+$/)) {
        console.error('Invalid version format. Use X.Y.Z format.');
        process.exit(1);
      }
    } else {
      newVersion = getNewVersion(releaseType);
    }

    // Create tag with annotation
    const tagName = `v${newVersion}`;
    tagMessage = `Release ${newVersion}`;

    console.log(`Creating release ${tagName}...`);
    
    // Update package.json version
    packageJson.version = newVersion;
    writeFileSync('./package.json', JSON.stringify(packageJson, null, 2) + '\n');
    
    // Commit version change
    execSync('git add package.json', { stdio: 'inherit' });
    execSync(`git commit -m "chore: bump version to ${newVersion}"`, { stdio: 'inherit' });
    
    // Create and push tag
    execSync(`git tag -a ${tagName} -m "${tagMessage}"`, { stdio: 'inherit' });
    execSync(`git push origin ${tagName}`, { stdio: 'inherit' });
    
    console.log(`✅ Release ${tagName} created and pushed successfully!`);
    console.log('🚀 Deployment will start automatically...');
    
  } catch (error) {
    console.error('❌ Error creating release:', error.message);
    process.exit(1);
  }
}

createRelease();