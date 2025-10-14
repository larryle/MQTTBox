#!/usr/bin/env node

/**
 * Storage Configuration Checker
 * CI script: Check if storage configuration has been accidentally modified
 */

const fs = require('fs');
const path = require('path');

// Critical configuration checks
const STORAGE_CONFIG = {
  name: 'MQTT_CLIENT_SETTINGS',
  driver: 'LOCALSTORAGE'
};

// Critical file paths
const KEY_FILES = [
  'src/app/services/MqttClientDbService.js',
  'src/app/services/MqttClientService.js',
  'main.js'
];

// Entry point check
const EXPECTED_ENTRY_POINT = 'build/index.html';

function checkStorageConfig() {
  console.log('🔍 Checking storage configuration...');
  
  let hasErrors = false;
  
  // Check MqttClientDbService.js
  const dbServicePath = path.join(__dirname, '..', 'src', 'app', 'services', 'MqttClientDbService.js');
  if (fs.existsSync(dbServicePath)) {
    const content = fs.readFileSync(dbServicePath, 'utf8');
    
    // Check storage name
    if (!content.includes(`name: "${STORAGE_CONFIG.name}"`)) {
      console.error('❌ MqttClientDbService: Storage name configuration changed!');
      hasErrors = true;
    }
    
    // Check driver type
    if (!content.includes(`driver: localforage.${STORAGE_CONFIG.driver}`)) {
      console.error('❌ MqttClientDbService: Storage driver configuration changed!');
      hasErrors = true;
    }
    
    console.log('✅ MqttClientDbService configuration is correct');
  } else {
    console.error('❌ MqttClientDbService.js not found!');
    hasErrors = true;
  }
  
  // Check entry point
  const mainPath = path.join(__dirname, '..', 'main.js');
  if (fs.existsSync(mainPath)) {
    const content = fs.readFileSync(mainPath, 'utf8');
    
    if (!content.includes(EXPECTED_ENTRY_POINT)) {
      console.error('❌ main.js: Entry point changed from build/index.html!');
      hasErrors = true;
    }
    
    console.log('✅ main.js entry point is correct');
  } else {
    console.error('❌ main.js not found!');
    hasErrors = true;
  }
  
  // Check if critical files exist
  KEY_FILES.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Critical file missing: ${file}`);
      hasErrors = true;
    }
  });
  
  if (hasErrors) {
    console.log('\n🚨 Storage configuration check failed!');
    console.log('Please review the changes and ensure storage stability.');
    process.exit(1);
  } else {
    console.log('\n✅ All storage configuration checks passed!');
    process.exit(0);
  }
}

// Run check
checkStorageConfig();
