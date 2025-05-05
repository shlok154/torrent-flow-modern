
import fs from 'fs';

// Read the package.json file
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

// Update the scripts
packageJson.scripts = {
  ...packageJson.scripts,
  "start": "concurrently \"npm run dev\" \"npm run server\"",
  "server": "ts-node --esm src/server.js",
  "build:server": "tsc --project tsconfig.server.json",
  "start:prod": "concurrently \"npm run preview\" \"node dist/server.js\""
};

// Write the updated package.json file
fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2), 'utf8');
console.log('Updated package.json scripts for TypeScript support successfully!');
