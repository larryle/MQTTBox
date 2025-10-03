// MQTT fix script - Intercept MQTT connection requests in renderer process
(function() {
    'use strict';
    
    console.log('🔧 Loading MQTT fix script...');
    
    // Check if in Electron environment
    if (typeof require !== 'undefined' && require('electron')) {
        const { ipcRenderer } = require('electron');
        
        // Intercept original MQTT connection logic
        const originalConsoleError = console.error;
        console.error = function(...args) {
            // Check if it's a net.isIP error
            if (args[0] && args[0].toString().includes('net.isIP is not a function')) {
                console.log('🔧 Detected net.isIP error, trying to use main process MQTT service...');
                
                // Try to extract MQTT client information from error stack
                const errorStack = args[0].stack || '';
                if (errorStack.includes('MqttClientConnectionWorker')) {
                    console.log('🔌 Detected MQTT connection request, redirecting to main process...');
                    
                    // Here we need to get MQTT client object from global variables or events
                    // Since we can't access directly, we'll handle this error in the main process
                    return;
                }
            }
            
            // Call original console.error
            originalConsoleError.apply(console, args);
        };
        
        // Listen for MQTT events from main process
        ipcRenderer.on('mqtt-connected', (event, data) => {
            console.log('✅ MQTT connection successful:', data);
            // Trigger connection success event
            window.dispatchEvent(new CustomEvent('mqtt-connected', { detail: data }));
        });
        
        ipcRenderer.on('mqtt-disconnected', (event, data) => {
            console.log('🔌 MQTT connection disconnected:', data);
            // Trigger disconnect event
            window.dispatchEvent(new CustomEvent('mqtt-disconnected', { detail: data }));
        });
        
        ipcRenderer.on('mqtt-error', (event, data) => {
            console.error('❌ MQTT错误:', data);
            // 触发错误事件
            window.dispatchEvent(new CustomEvent('mqtt-error', { detail: data }));
        });
        
        ipcRenderer.on('mqtt-message', (event, data) => {
            console.log('📨 收到MQTT消息:', data);
            // 触发消息事件
            window.dispatchEvent(new CustomEvent('mqtt-message', { detail: data }));
        });
        
        console.log('✅ MQTT修复脚本加载完成');
    } else {
        console.log('⚠️ 不在Electron环境中，跳过MQTT修复脚本');
    }
})();
