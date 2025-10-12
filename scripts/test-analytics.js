#!/usr/bin/env node

/**
 * Test script for Google Analytics integration
 * Usage: node scripts/test-analytics.js
 */

const AnalyticsService = require('../src/app/services/AnalyticsService');

console.log('🧪 Testing Google Analytics integration...');

// Test 1: Check service status
console.log('\n1. Checking Analytics service status:');
const status = AnalyticsService.getStatus();
console.log('   Status:', status);

// Test 2: Test basic event tracking
console.log('\n2. Testing basic event tracking:');
try {
  AnalyticsService.track('test_event', {
    test_parameter: 'test_value',
    timestamp: new Date().toISOString()
  });
  console.log('   ✅ Basic event tracking successful');
} catch (error) {
  console.log('   ❌ Basic event tracking failed:', error.message);
}

// Test 3: Test app install tracking
console.log('\n3. Testing app install tracking:');
try {
  AnalyticsService.track('app_install', {
    platform: 'darwin',
    version: '0.2.2',
    arch: 'x64'
  });
  console.log('   ✅ App install tracking successful');
} catch (error) {
  console.log('   ❌ App install tracking failed:', error.message);
}

// Test 4: Test app startup tracking
console.log('\n4. Testing app startup tracking:');
try {
  AnalyticsService.trackAppStartup(2500);
  console.log('   ✅ App startup tracking successful');
} catch (error) {
  console.log('   ❌ App startup tracking failed:', error.message);
}

// Test 5: Test feature usage tracking
console.log('\n5. Testing feature usage tracking:');
try {
  AnalyticsService.trackFeatureUsage('mqtt_connect', 'mqtt_operations', 5000);
  console.log('   ✅ Feature usage tracking successful');
} catch (error) {
  console.log('   ❌ Feature usage tracking failed:', error.message);
}

// Test 6: Test error tracking
console.log('\n6. Testing error tracking:');
try {
  AnalyticsService.trackError('test_error', 'Test error message', { context: 'test' });
  console.log('   ✅ Error tracking successful');
} catch (error) {
  console.log('   ❌ Error tracking failed:', error.message);
}

console.log('\n🎉 Analytics testing completed!');
console.log('\n📊 Check your Google Analytics real-time reports to see the test events.');
console.log('🔗 Analytics URL: https://analytics.google.com/analytics/web/#/pXXXXXXXXXX');
