// This script will be injected into the Electron app to debug MQTT connection issues
console.log('🔍 Starting Electron MQTT connection debugging...');

// Check global variables
console.log('📊 Global variables check:');
console.log('window exists:', typeof window !== 'undefined');
console.log('window.navigator exists:', typeof window !== 'undefined' && !!window.navigator);
console.log('window.navigator.userAgent exists:', typeof window !== 'undefined' && !!window.navigator && !!window.navigator.userAgent);

if (typeof window !== 'undefined' && window.navigator && window.navigator.userAgent) {
  console.log('User Agent:', window.navigator.userAgent);
  console.log('Contains Electron:', window.navigator.userAgent.includes('Electron'));
}

// Check PlatformConstants
if (typeof PlatformConstants !== 'undefined') {
  console.log('📊 PlatformConstants check:');
  console.log('PlatformConstants exists:', true);
  console.log('PLATFORM_TYPE:', PlatformConstants.PLATFORM_TYPE);
} else {
  console.log('❌ PlatformConstants undefined');
}

// Check CommonConstants
if (typeof CommonConstants !== 'undefined') {
  console.log('📊 CommonConstants check:');
  console.log('CommonConstants exists:', true);
  console.log('PLATFORM_ELECTRON_APP:', CommonConstants.PLATFORM_ELECTRON_APP);
} else {
  console.log('❌ CommonConstants undefined');
}

// Check ElectronMqttService
if (typeof ElectronMqttService !== 'undefined') {
  console.log('📊 ElectronMqttService check:');
  console.log('ElectronMqttService exists:', true);
} else {
  console.log('❌ ElectronMqttService undefined');
}

// Check ipcRenderer
if (typeof require !== 'undefined') {
  try {
    const { ipcRenderer } = require('electron');
    console.log('📊 ipcRenderer check:');
    console.log('ipcRenderer exists:', !!ipcRenderer);
  } catch (error) {
    console.log('❌ Unable to get ipcRenderer:', error.message);
  }
}

// Listen for MQTT connection events
if (typeof window !== 'undefined') {
  window.addEventListener('mqtt-connected', (event) => {
    console.log('🎉 Received MQTT connection success event:', event.detail);
  });

  window.addEventListener('mqtt-disconnected', (event) => {
    console.log('🔌 Received MQTT disconnect event:', event.detail);
  });

  window.addEventListener('mqtt-error', (event) => {
    console.log('❌ Received MQTT error event:', event.detail);
  });

  window.addEventListener('mqtt-message', (event) => {
    console.log('📨 Received MQTT message event:', event.detail);
  });
}

console.log('✅ Debug script loaded successfully');
