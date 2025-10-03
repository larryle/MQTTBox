const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron');
const path = require('path');
const mqtt = require('mqtt');
const fs = require('fs');
const isDev = process.env.NODE_ENV === 'development';

// Add debug information
console.log('MQTTBox Electron App Starting...');
console.log('Node Environment:', process.env.NODE_ENV);
console.log('Platform:', process.platform);
console.log('Electron Version:', process.versions.electron);

// No longer using test mcsId in production

// Keep a global reference of the window object
let mainWindow;
let mqttClients = new Map();
let connectingClientIds = new Set();

function createWindow() {
  console.log('Creating main window...');
  
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, 'build/images/icon-128.png'),
    titleBarStyle: 'default',
    show: false
  });

  // Load the app
  const indexPath = path.join(__dirname, 'build/index.html');
  const fileUrl = 'file://' + indexPath;
  console.log('Loading index file:', fileUrl);
  try {
    mainWindow.loadURL(fileUrl);
  } catch (e) {
    console.warn('loadURL failed, fallback to loadFile:', e && e.message);
    mainWindow.loadFile(indexPath);
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    console.log('Window ready to show');
    mainWindow.show();
    // Only auto-open DevTools in development environment
    if (isDev) {
      try {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
      } catch (e) {
        console.warn('Failed to open DevTools:', e && e.message);
      }
    }

    // Remove DOM injection and direct modifications to avoid breaking React rendering
  });

  // Handle window errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load:', errorCode, errorDescription, validatedURL);
  });

  mainWindow.webContents.on('crashed', (event) => {
    console.error('Renderer process crashed');
  });

  // Open external links in the default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create application menu
  createMenu();
}

function createMenu() {
  const template = [
    {
      label: 'MQTTBox',
      submenu: [
        {
          label: 'About MQTTBox',
          click: () => {
            // You can add an about dialog here
            shell.openExternal('https://github.com/workswithweb/MQTTBox');
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectall' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// MQTT connection handling function
function handleMqttConnect(event, connectionData) {
  console.log('🔌 Processing MQTT connection request:', connectionData);
  
  const { clientId, host, port, protocol, options } = connectionData;
  // Guard against duplicate client instances flapping connect/disconnect
  const existing = mqttClients.get(clientId);
  if (existing && existing.connected) {
    console.log('🔁 Active connection exists, skipping duplicate connection:', clientId);
          if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
            mainWindow.webContents.send('mqtt-connected', { clientId, mcsId: clientId, success: true });
    }
    return;
  }
  if (connectingClientIds.has(clientId)) {
    console.log('⏳ Connection in progress, ignoring duplicate request:', clientId);
    return;
  }
  // Enforce single-active-client policy: disconnect all other clients
  try {
    for (const [otherId, otherClient] of mqttClients.entries()) {
      if (otherId !== clientId && otherClient) {
        try {
          console.log('🧹 Disconnecting other connected clients to maintain single connection:', otherId);
          // stop automatic reconnect then end immediately
          try { if (otherClient.options) otherClient.options.reconnectPeriod = 0; } catch (_) {}
          otherClient.end(true);
        } catch (_) {}
        mqttClients.delete(otherId);
        try {
          if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
            mainWindow.webContents.send('mqtt-disconnected', { clientId: otherId, mcsId: otherId });
          }
        } catch (_) {}
      }
    }
  } catch (_) {}
  connectingClientIds.add(clientId);
  
  try {
    // Build connection URL
    let connectUrl;
    if (protocol === 'mqtts') {
      connectUrl = `mqtts://${host}:${port}`;
    } else if (protocol === 'mqtt') {
      connectUrl = `mqtt://${host}:${port}`;
    } else {
      connectUrl = `${protocol}://${host}:${port}`;
    }
    
    console.log('🔗 Connection URL:', connectUrl);
    console.log('⚙️ Connection options:', options);
    
    // Create MQTT client
    const client = mqtt.connect(connectUrl, options);
    
    // Store client
    mqttClients.set(clientId, client);
    
        // Set event listeners
    client.on('connect', (connack) => {
          console.log('✅ MQTT connection successful:', clientId);
          try { console.log('🧾 connack:', connack && connack.returnCode !== undefined ? connack.returnCode : connack); } catch (_) {}
          try {
            connectingClientIds.delete(clientId);
            if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
              mainWindow.webContents.send('mqtt-connected', { clientId, mcsId: clientId, success: true });
              
              // Notify Web Worker via console.log
              console.log('MQTT_WORKER_MESSAGE:', JSON.stringify({
                type: 'mqtt-connected',
                data: { clientId, mcsId: clientId, success: true }
              }));
              
              // Send message to Web Worker via executeJavaScript
              mainWindow.webContents.executeJavaScript(`
                // Send message to Web Worker
                if (typeof window !== 'undefined' && window.mqttClientConnectionWorkers) {
                  Object.values(window.mqttClientConnectionWorkers).forEach(worker => {
                    if (worker && worker.postMessage) {
                  worker.postMessage({
                    type: 'mqtt-connected',
                    data: { clientId: '${clientId}', mcsId: '${clientId}', success: true }
                  });
                    }
                  });
                }
              `).catch(error => {
                console.warn('⚠️ Unable to send message to Web Worker:', error.message);
              });
              
              // Also notify Web Worker via window.postMessage
              mainWindow.webContents.executeJavaScript(`
                if (typeof window !== 'undefined' && window.postMessage) {
                  window.postMessage({
                    type: 'mqtt-connected',
                    data: { clientId: '${clientId}', mcsId: '${clientId}', success: true }
                  }, '*');
                }
                
                // Directly update UI status
                try {
                  const statusElements = document.querySelectorAll('[class*="status"], [class*="connection"], [class*="connect"]');
                  statusElements.forEach(el => {
                    if (el.textContent && el.textContent.includes('Not Connected')) {
                      el.textContent = 'Connected';
                      el.className = el.className.replace(/error|danger|warning/g, 'success');
                    }
                  });
                  
                  // Find buttons and update status
                  const buttons = document.querySelectorAll('button');
                  buttons.forEach(btn => {
                    if (btn.textContent && btn.textContent.includes('Connect')) {
                      btn.textContent = 'Disconnect';
                      btn.className = btn.className.replace(/btn-primary|btn-success/g, 'btn-danger');
                    }
                  });
                } catch (e) {
                  console.log('UI update failed:', e);
                }
              `).catch(error => {
                console.warn('⚠️ Unable to send message via executeJavaScript:', error.message);
              });
            }
          } catch (error) {
            console.warn('⚠️ Unable to send connection success message:', error.message);
          }
        });
    
    client.on('close', () => {
      console.log('🔌 MQTT connection closed:', clientId);
      // prevent reconnect storms if explicitly disconnected
      try {
        const c = mqttClients.get(clientId);
        if (c && c.options && c.options.reconnectPeriod === 0) {
          c.end(true);
        }
      } catch (_) {}
      try {
        connectingClientIds.delete(clientId);
        if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
          mainWindow.webContents.send('mqtt-disconnected', { clientId, mcsId: clientId });
          
          // Notify Web Worker via console.log
          console.log('MQTT_WORKER_MESSAGE:', JSON.stringify({
            type: 'mqtt-disconnected',
            data: { clientId, mcsId: clientId }
          }));
          
          // Send message to Web Worker via executeJavaScript
          mainWindow.webContents.executeJavaScript(`
            // Send message to Web Worker
            if (typeof window !== 'undefined' && window.mqttClientConnectionWorkers) {
              Object.values(window.mqttClientConnectionWorkers).forEach(worker => {
                if (worker && worker.postMessage) {
                  worker.postMessage({
                    type: 'mqtt-disconnected',
                    data: { clientId: '${clientId}', mcsId: '${clientId}' }
                  });
                }
              });
            }
          `).catch(error => {
            console.warn('⚠️ Unable to send disconnect message to Web Worker:', error.message);
          });
          
          // Directly update UI status
          mainWindow.webContents.executeJavaScript(`
            try {
              const statusElements = document.querySelectorAll('[class*="status"], [class*="connection"], [class*="connect"]');
              statusElements.forEach(el => {
                if (el.textContent && el.textContent.includes('Connected')) {
                  el.textContent = 'Not Connected';
                  el.className = el.className.replace(/success/g, 'error');
                }
              });
              
              // Find buttons and update status
              const buttons = document.querySelectorAll('button');
              buttons.forEach(btn => {
                if (btn.textContent && btn.textContent.includes('Disconnect')) {
                  btn.textContent = 'Connect';
                  btn.className = btn.className.replace(/btn-danger/g, 'btn-primary');
                }
              });
            } catch (e) {
              console.log('UI update failed:', e);
            }
          `).catch(error => {
            console.warn('⚠️ Unable to update UI via executeJavaScript:', error.message);
          });
        }
      } catch (error) {
        console.warn('⚠️ Unable to send disconnect message:', error.message);
      }
    });
    
    client.on('error', (error) => {
      console.error('❌ MQTT connection error:', clientId, error);
      try {
        connectingClientIds.delete(clientId);
        if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
          mainWindow.webContents.send('mqtt-error', { clientId, mcsId: clientId, error: error.message });
        }
      } catch (err) {
        console.warn('⚠️ Unable to send error message:', err.message);
      }
    });
    
    client.on('message', (topic, message, packet) => {
      console.log('📨 Received MQTT message:', topic, message.toString());
      try {
        if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
          mainWindow.webContents.send('mqtt-message', { 
            clientId,
            mcsId: clientId,
            topic,
            message: message.toString(),
            packet
          });
        }
      } catch (error) {
        console.warn('⚠️ Unable to send message:', error.message);
      }
    });
    
    client.on('offline', () => {
      console.log('📴 MQTT client offline:', clientId);
      try {
        if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
          mainWindow.webContents.send('mqtt-offline', { clientId, mcsId: clientId });
        }
      } catch (error) {
        console.warn('⚠️ Unable to send offline message:', error.message);
      }
    });
    
    client.on('reconnect', () => {
      console.log('♻️ Reconnecting:', clientId);
    });
    
  } catch (error) {
    console.error('❌ MQTT connection creation failed:', error);
    connectingClientIds.delete(clientId);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('mqtt-error', { clientId, error: error.message });
    }
  }
}

// Handle MQTT connection requests from renderer process
function handleMqttConnectFromRenderer(event, mqttClientObj) {
  console.log('🔌 Processing MQTT connection request from renderer process:', mqttClientObj);
  
  try {
    // Parse host and port
    const [host, portStr] = mqttClientObj.host.split(':');
    const port = portStr ? parseInt(portStr) : (mqttClientObj.protocol === 'mqtts' ? 8883 : 1883);
    
    // Build connection options
    const options = buildConnectionOptions(mqttClientObj);
    
    const connectionData = {
      clientId: mqttClientObj.mcsId,
      host: host,
      port: port,
      protocol: mqttClientObj.protocol,
      options: options
    };
    
    handleMqttConnect(event, connectionData);
    
  } catch (error) {
    console.error('❌ Failed to handle MQTT connection request:', error);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('mqtt-error', { clientId: mqttClientObj.mcsId, error: error.message });
    }
  }
}

// Build connection options
function buildConnectionOptions(mqttClientObj) {
  const options = {
    clientId: mqttClientObj.mqttClientId,
    keepalive: mqttClientObj.keepalive || 60,
    clean: mqttClientObj.clean !== false,
    reconnectPeriod: mqttClientObj.reconnectPeriod || 1000,
    connectTimeout: mqttClientObj.connectTimeout || 30000,
    protocolVersion: mqttClientObj.protocolVersion || 4,
    protocolId: mqttClientObj.protocolId || 'MQTT'
  };

  // Add username and password
  if (mqttClientObj.username) {
    options.username = mqttClientObj.username;
  }
  if (mqttClientObj.password) {
    options.password = mqttClientObj.password;
  }

  // Add Will message
  if (mqttClientObj.willTopic && mqttClientObj.willPayload) {
    options.will = {
      topic: mqttClientObj.willTopic,
      payload: mqttClientObj.willPayload,
      qos: mqttClientObj.willQos || 0,
      retain: mqttClientObj.willRetain || false
    };
  }

  // Add SSL/TLS configuration
  if (mqttClientObj.protocol === 'mqtts' || mqttClientObj.protocol === 'wss') {
    console.log('🔐 Configuring SSL/TLS certificates...');
    console.log('Certificate type:', mqttClientObj.certificateType);
    
    if (mqttClientObj.certificateType === 'ssc') {
      // Verify certificate files exist
      if (!mqttClientObj.caFile) {
        console.error('❌ CA certificate file not configured');
        throw new Error('CA certificate file not configured');
      }
      if (!mqttClientObj.clientCertificateFile) {
        console.error('❌ Client certificate file not configured');
        throw new Error('Client certificate file not configured');
      }
      if (!mqttClientObj.clientKeyFile) {
        console.error('❌ Client key file not configured');
        throw new Error('Client key file not configured');
      }
      
      console.log('✅ Certificate files configured successfully');
      options.ca = mqttClientObj.caFile;
      options.cert = mqttClientObj.clientCertificateFile;
      options.key = mqttClientObj.clientKeyFile;
      options.passphrase = mqttClientObj.clientKeyPassphrase;
      options.rejectUnauthorized = true;
    } else if (mqttClientObj.certificateType === 'cc') {
      if (mqttClientObj.caFile) {
        options.ca = mqttClientObj.caFile;
      }
      options.rejectUnauthorized = true;
    } else if (mqttClientObj.certificateType === 'cssc') {
      options.rejectUnauthorized = false;
    }

    // SSL/TLS version
    if (mqttClientObj.sslTlsVersion && mqttClientObj.sslTlsVersion !== 'auto') {
      options.secureProtocol = mqttClientObj.sslTlsVersion;
    }
  }

  return options;
}

function handleMqttDisconnect(event, clientId) {
  console.log('🔌 Disconnecting MQTT connection:', clientId);
  
  const client = mqttClients.get(clientId);
  if (client) {
    client.end();
    mqttClients.delete(clientId);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('mqtt-disconnected', { clientId });
    }
  }
}

function handleMqttPublish(event, data) {
  const { clientId, topic, message, options } = data;
  console.log('📤 Publishing MQTT message:', clientId, topic, message);
  
  const client = mqttClients.get(clientId);
  if (client) {
    client.publish(topic, message, options, (error) => {
      if (error) {
        console.error('❌ Publish failed:', error);
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('mqtt-publish-error', { clientId, error: error.message });
        }
      } else {
        console.log('✅ Publish successful');
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('mqtt-published', { clientId, topic });
        }
      }
    });
  }
}

function handleMqttSubscribe(event, data) {
  const { clientId, topic, options } = data;
  console.log('📥 Subscribing to MQTT topic:', clientId, topic);
  
  const client = mqttClients.get(clientId);
  if (client) {
    client.subscribe(topic, options, (error) => {
      if (error) {
        console.error('❌ Subscribe failed:', error);
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('mqtt-subscribe-error', { clientId, error: error.message });
        }
      } else {
        console.log('✅ Subscribe successful');
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('mqtt-subscribed', { clientId, topic });
        }
      }
    });
  }
}

// Global error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// This method will be called when Electron has finished initialization
app.on('ready', () => {
  console.log('Electron app ready');
  createWindow();
  
  // Set up IPC event listeners
  ipcMain.handle('mqtt-connect', handleMqttConnect);
  ipcMain.handle('mqtt-connect-renderer', handleMqttConnectFromRenderer);
  ipcMain.handle('mqtt-disconnect', handleMqttDisconnect);
  ipcMain.handle('mqtt-publish', handleMqttPublish);
  ipcMain.handle('mqtt-subscribe', handleMqttSubscribe);
  
  // Set up Web Worker message handling
  setupWebWorkerMessageHandling();
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

// Set up Web Worker message handling
function setupWebWorkerMessageHandling() {
  console.log('🔧 Setting up Web Worker message handling');
  
  // Listen for messages from Web Worker
  mainWindow.webContents.on('console-message', (event, level, message) => {
    if (message.includes('MQTT_WORKER_MESSAGE:')) {
      console.log('📨 Received Web Worker message:', message);
      try {
        // Extract JSON data
        const jsonStart = message.indexOf('MQTT_WORKER_MESSAGE:') + 'MQTT_WORKER_MESSAGE:'.length;
        const jsonStr = message.substring(jsonStart).trim();
        const data = JSON.parse(jsonStr);
        
        if (data.type === 'mqtt-connect-request') {
          console.log('🔌 Processing Web Worker MQTT connection request:', data.data);
          handleWebWorkerMqttConnect(data.data, data.messageId);
        }
      } catch (error) {
        console.error('❌ Failed to parse Web Worker message:', error);
      }
    }
  });
}

// Handle MQTT connection requests from Web Worker
async function handleWebWorkerMqttConnect(connectionData, messageId) {
  console.log('🔌 Processing MQTT connection request from Web Worker:', connectionData);
  
  try {
    // Use existing connection handling logic
    await handleMqttConnect(null, connectionData);
    
    // Send success response to Web Worker
    mainWindow.webContents.executeJavaScript(`
      if (typeof self !== 'undefined' && self.postMessage) {
        self.postMessage({
          type: 'mqtt-connect-success',
          data: { clientId: '${connectionData.clientId}', success: true },
          messageId: ${messageId}
        });
      }
    `);
  } catch (error) {
    console.error('❌ Web Worker MQTT连接失败:', error);
    
    // 发送错误响应给Web Worker
    mainWindow.webContents.executeJavaScript(`
      if (typeof self !== 'undefined' && self.postMessage) {
        self.postMessage({
          type: 'mqtt-connect-error',
          data: { error: '${error.message}' },
          messageId: ${messageId}
        });
      }
    `);
  }
}
