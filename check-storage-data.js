#!/usr/bin/env node

/**
 * Check storage data in MQTTBox directories
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🔍 Checking MQTTBox storage data...');

const homeDir = os.homedir();
const mqttBoxDir = path.join(homeDir, 'Library', 'Application Support', 'MQTTBox');
const oldMqttBoxDir = path.join(homeDir, 'Library', 'Application Support', 'mqttbox-mac');

console.log('📁 MQTTBox directory:', mqttBoxDir);
console.log('📁 Old mqttbox-mac directory:', oldMqttBoxDir);

// Check if directories exist
const mqttBoxExists = fs.existsSync(mqttBoxDir);
const oldMqttBoxExists = fs.existsSync(oldMqttBoxDir);

console.log('\n📊 Directory Status:');
console.log('MQTTBox exists:', mqttBoxExists);
console.log('mqttbox-mac exists:', oldMqttBoxExists);

if (mqttBoxExists) {
  console.log('\n📁 MQTTBox contents:');
  try {
    const contents = fs.readdirSync(mqttBoxDir);
    contents.forEach(item => {
      const itemPath = path.join(mqttBoxDir, item);
      const stats = fs.statSync(itemPath);
      console.log(`  ${item} (${stats.isDirectory() ? 'dir' : 'file'})`);
    });
  } catch (e) {
    console.log('  Error reading MQTTBox directory:', e.message);
  }
}

if (oldMqttBoxExists) {
  console.log('\n📁 mqttbox-mac contents:');
  try {
    const contents = fs.readdirSync(oldMqttBoxDir);
    contents.forEach(item => {
      const itemPath = path.join(oldMqttBoxDir, item);
      const stats = fs.statSync(itemPath);
      console.log(`  ${item} (${stats.isDirectory() ? 'dir' : 'file'})`);
    });
  } catch (e) {
    console.log('  Error reading mqttbox-mac directory:', e.message);
  }
}

// Check IndexedDB data
console.log('\n🗄️ IndexedDB Data:');
const mqttBoxIndexedDB = path.join(mqttBoxDir, 'IndexedDB', 'file__0.indexeddb.leveldb');
const oldMqttBoxIndexedDB = path.join(oldMqttBoxDir, 'IndexedDB', 'file__0.indexeddb.leveldb');

if (fs.existsSync(mqttBoxIndexedDB)) {
  console.log('MQTTBox IndexedDB exists');
  try {
    const contents = fs.readdirSync(mqttBoxIndexedDB);
    contents.forEach(file => {
      const filePath = path.join(mqttBoxIndexedDB, file);
      const stats = fs.statSync(filePath);
      console.log(`  ${file}: ${stats.size} bytes`);
    });
  } catch (e) {
    console.log('  Error reading MQTTBox IndexedDB:', e.message);
  }
}

if (fs.existsSync(oldMqttBoxIndexedDB)) {
  console.log('mqttbox-mac IndexedDB exists');
  try {
    const contents = fs.readdirSync(oldMqttBoxIndexedDB);
    contents.forEach(file => {
      const filePath = path.join(oldMqttBoxIndexedDB, file);
      const stats = fs.statSync(filePath);
      console.log(`  ${file}: ${stats.size} bytes`);
    });
  } catch (e) {
    console.log('  Error reading mqttbox-mac IndexedDB:', e.message);
  }
}

// Check Local Storage data
console.log('\n💾 Local Storage Data:');
const mqttBoxLocalStorage = path.join(mqttBoxDir, 'Local Storage', 'leveldb');
const oldMqttBoxLocalStorage = path.join(oldMqttBoxDir, 'Local Storage', 'leveldb');

if (fs.existsSync(mqttBoxLocalStorage)) {
  console.log('MQTTBox Local Storage exists');
  try {
    const contents = fs.readdirSync(mqttBoxLocalStorage);
    contents.forEach(file => {
      const filePath = path.join(mqttBoxLocalStorage, file);
      const stats = fs.statSync(filePath);
      console.log(`  ${file}: ${stats.size} bytes`);
    });
  } catch (e) {
    console.log('  Error reading MQTTBox Local Storage:', e.message);
  }
}

if (fs.existsSync(oldMqttBoxLocalStorage)) {
  console.log('mqttbox-mac Local Storage exists');
  try {
    const contents = fs.readdirSync(oldMqttBoxLocalStorage);
    contents.forEach(file => {
      const filePath = path.join(oldMqttBoxLocalStorage, file);
      const stats = fs.statSync(filePath);
      console.log(`  ${file}: ${stats.size} bytes`);
    });
  } catch (e) {
    console.log('  Error reading mqttbox-mac Local Storage:', e.message);
  }
}

console.log('\n🎉 Storage data check completed!');
