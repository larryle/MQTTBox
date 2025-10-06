const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const url = require('url');
const mqtt = require('mqtt');
const fs = require('fs');

const clients = new Map();

function buildMqttUrl(mqttClientObj) {
  return mqttClientObj.protocol + '://' + mqttClientObj.host;
}

function buildMqttOptions(mqttClientObj) {
  let clId = mqttClientObj.mqttClientId;
  if (mqttClientObj.timestampClientId === true) {
    clId = clId + (+new Date());
  }
  const options = {
    protocolId: mqttClientObj.protocolId,
    protocolVersion: mqttClientObj.protocolVersion,
    keepalive: Number(mqttClientObj.keepalive),
    reschedulePings: mqttClientObj.reschedulePings,
    clientId: clId,
    clean: mqttClientObj.clean,
    reconnectPeriod: Number(mqttClientObj.reconnectPeriod),
    connectTimeout: Number(mqttClientObj.connectTimeout),
    queueQoSZero: mqttClientObj.queueQoSZero
  };
  if (mqttClientObj.username && mqttClientObj.username.trim().length > 0) {
    options.username = mqttClientObj.username;
  }
  if (mqttClientObj.password && mqttClientObj.password.trim().length > 0) {
    options.password = mqttClientObj.password;
  }
  if (mqttClientObj.willTopic && mqttClientObj.willTopic.length > 0 && mqttClientObj.willPayload != null) {
    options.will = {
      topic: mqttClientObj.willTopic,
      payload: mqttClientObj.willPayload,
      qos: mqttClientObj.willQos,
      retain: mqttClientObj.willRetain
    };
  }
  if (mqttClientObj.protocol === 'mqtts' || mqttClientObj.protocol === 'wss') {
    if (mqttClientObj.certificateType === 'ssc') {
      options.ca = mqttClientObj.caFile;
      options.cert = mqttClientObj.clientCertificateFile;
      options.key = mqttClientObj.clientKeyFile;
      if (mqttClientObj.clientKeyPassphrase) options.passphrase = mqttClientObj.clientKeyPassphrase;
      options.rejectUnauthorized = true;
    } else if (mqttClientObj.certificateType === 'cc') {
        options.ca = mqttClientObj.caFile;
      options.rejectUnauthorized = true;
    } else if (mqttClientObj.certificateType === 'cssc') {
      options.rejectUnauthorized = false;
    }
    if (mqttClientObj.sslTlsVersion && mqttClientObj.sslTlsVersion !== 'auto') {
      options.secureProtocol = mqttClientObj.sslTlsVersion;
    }
  }
  return options;
}

function wireClientEvents(mcsId, client, win) {
  client.on('connect', () => {
    win.webContents.send('mqtt-events', { event: 'EVENT_MQTT_CLIENT_CONN_STATE_CHANGED', data: { mcsId, connState: 'CONNECTED' } });
  });
  client.on('close', () => {
    win.webContents.send('mqtt-events', { event: 'EVENT_MQTT_CLIENT_CONN_STATE_CHANGED', data: { mcsId, connState: 'ERROR' } });
  });
  client.on('offline', () => {
    win.webContents.send('mqtt-events', { event: 'EVENT_MQTT_CLIENT_CONN_STATE_CHANGED', data: { mcsId, connState: 'ERROR' } });
  });
  client.on('error', (err) => {
    win.webContents.send('mqtt-events', { event: 'EVENT_MQTT_CLIENT_CONN_STATE_CHANGED', data: { mcsId, connState: 'ERROR', error: (err && err.message) || String(err) } });
  });
  client.on('message', (topic, message, packet) => {
    try { console.log('[main][mqtt] message', topic); } catch(e) {}
    win.webContents.send('mqtt-events', { event: 'EVENT_MQTT_CLIENT_SUBSCRIBED_DATA_RECIEVED', data: { mcsId, topic, message: String(message), packet } });
  });
}

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    }
  });

  const indexPath = path.join(__dirname, 'build', 'index.html');
  const fileUrl = 'file://' + indexPath;
  mainWindow.loadURL(fileUrl);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Ensure Cmd+V/Ctrl+V works even if menu is missing or focus quirks
  try {
    mainWindow.webContents.on('before-input-event', (event, input) => {
      const isAccel = (process.platform === 'darwin') ? input.meta : input.control;
      if (isAccel && !input.isAutoRepeat) {
        const key = String(input.key || '').toLowerCase();
        if (key === 'v') {
          mainWindow.webContents.paste();
          event.preventDefault();
        }
      }
    });
  } catch (e) { /* ignore */ }

  // MQTT IPC bridge
  ipcMain.on('mqtt-connect', (event, mqttClientObj) => {
    const mcsId = mqttClientObj.mcsId;
    const url = buildMqttUrl(mqttClientObj);
    const options = buildMqttOptions(mqttClientObj);
    try {
      if (clients.has(mcsId)) {
        clients.get(mcsId).end(true);
        clients.delete(mcsId);
      }
      const client = mqtt.connect(url, options);
      wireClientEvents(mcsId, client, mainWindow);
      clients.set(mcsId, client);
        } catch (e) {
      mainWindow.webContents.send('mqtt-events', { event: 'EVENT_MQTT_CLIENT_CONN_STATE_CHANGED', data: { mcsId, connState: 'ERROR', error: (e && e.message) || String(e) } });
    }
  });

  ipcMain.on('mqtt-disconnect', (event, mcsId) => {
    const client = clients.get(mcsId);
    if (client) {
      client.end(true);
      clients.delete(mcsId);
      mainWindow.webContents.send('mqtt-events', { event: 'EVENT_MQTT_CLIENT_CONNECTION_CLOSED', data: { mcsId } });
    }
  });

  ipcMain.on('mqtt-publish', (event, payload) => {
    const { mcsId, topic, message, qos, retain, pubId } = payload;
    const client = clients.get(mcsId);
    if (client) {
      const publishedTime = +new Date();
      client.publish(topic, message, { qos: parseInt(qos, 10), retain: !!retain }, (err) => {
        if (!err) {
          mainWindow.webContents.send('mqtt-events', { event: 'EVENT_MQTT_CLIENT_PUBLISHED_MESSAGE', data: { publishedTime, qosResponseReceivedTime: +new Date(), mcsId, pubId, topic, payload: message, qos, retain } });
        }
      });
    }
  });

  ipcMain.on('mqtt-subscribe', (event, payload) => {
    const { mcsId, topic, qos } = payload;
    const client = clients.get(mcsId);
    if (client) {
      try { console.log('[main][mqtt] subscribe', topic, qos); } catch(e) {}
      client.subscribe(topic, { qos: parseInt(qos, 10) });
    }
  });

  ipcMain.on('mqtt-unsubscribe', (event, payload) => {
    const { mcsId, topic } = payload;
    const client = clients.get(mcsId);
    if (client) client.unsubscribe(topic);
  });
}

async function tryMigrateFromOldOrigin() {
  try {
    const userData = app.getPath('userData');
    const flagFile = path.join(userData, 'migration_from_src_www_build_done');
    if (fs.existsSync(flagFile)) return;

    const oldIndexPath = path.join(__dirname, 'src', 'www', 'build', 'index.html');
    if (!fs.existsSync(oldIndexPath)) {
      fs.writeFileSync(flagFile, 'no-old-origin');
        return;
      }
      
    const hiddenWin = new BrowserWindow({
      show: false,
      webPreferences: { nodeIntegration: true, contextIsolation: false }
    });
    await hiddenWin.loadURL('file://' + oldIndexPath);

    // Execute in old origin: read localforage data
    const script = `
      (function(){
        return new Promise(function(resolve){
          try {
            var lf = window.localforage || (window.localForage||{});
            var inst = (lf && lf.createInstance)? lf.createInstance({name:'MQTT_CLIENT_SETTINGS'}) : null;
            if(!inst){ resolve({items:[], cleared:false}); return; }
            var out=[];
            inst.iterate(function(v,k){ out.push(v); }).then(function(){
              // clear only this database instance after reading
              inst.clear().then(function(){
                resolve({items:out, cleared:true});
              }).catch(function(){ resolve({items:out, cleared:false}); });
            }).catch(function(){ resolve({items:[], cleared:false}); });
          } catch(e){ resolve({items:[], cleared:false}); }
        });
      })();
    `;
    const data = await hiddenWin.webContents.executeJavaScript(script, true);
    if (data && Array.isArray(data.items) && data.items.length > 0 && mainWindow) {
      mainWindow.webContents.send('migration-data', { service: 'MQTT_CLIENT_SETTINGS', items: data.items });
    }
    hiddenWin.destroy();
    fs.writeFileSync(flagFile, 'done');
  } catch (e) {
    // ignore
  }
}

app.on('ready', async () => {
  createWindow();
  await tryMigrateFromOldOrigin();
  // Set standard application menu to enable copy/paste shortcuts
  try {
    const isMac = process.platform === 'darwin';
  const template = [
      ...(isMac ? [{
        label: app.name,
      submenu: [
          { role: 'about' },
        { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideothers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      }] : []),
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
          { role: 'pasteandmatchstyle' },
        { role: 'selectall' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
          { role: 'forcereload' },
          { role: 'toggledevtools' },
        { type: 'separator' },
          { role: 'resetzoom' },
          { role: 'zoomin' },
          { role: 'zoomout' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
        role: 'window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
      },
      {
        role: 'help',
        submenu: [
          {
            label: 'Learn More',
            click: async () => {
              const { shell } = require('electron');
              await shell.openExternal('http://workswithweb.com/mqttbox.html');
            }
          }
        ]
      }
    ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
                } catch (e) {
    // ignore menu errors
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});


