#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing MQTT Worker path, redirecting to main process IPC...');

const appJsPath = path.join(__dirname, 'build/app.js');
let content = fs.readFileSync(appJsPath, 'utf8');

// Find and replace connectToBroker method
const oldPattern = /value: function connectToBroker\(action\) \{\s*var mqttClientConnectionWorker = this\.mqttClientConnectionWorkers\[action\.data\.mcsId\];\s*if \(mqttClientConnectionWorker != null\) \{\s*mqttClientConnectionWorker\.postMessage\(action\);\s*\} else \{\s*mqttClientConnectionWorker = new Worker\('\.\/platform\/PlatformMqttClientWorkerService\.js'\);\s*mqttClientConnectionWorker\.addEventListener\('message', function \(event\) \{\s*this\.processEvents\(event\.data\);\s*\}\.bind\(this\)\);\s*this\.mqttClientConnectionWorkers\[action\.data\.mcsId\] = mqttClientConnectionWorker;\s*mqttClientConnectionWorker\.postMessage\(action\);\s*\}\s*\}/s;

const newCode = `value: function connectToBroker(action) {
            var mqttClientConnectionWorker = this.mqttClientConnectionWorkers[action.data.mcsId];
            if (mqttClientConnectionWorker != null) {
                mqttClientConnectionWorker.postMessage(action);
            } else {
                // In Electron, use main process to handle MQTT, avoid using net/tls in renderer process
                try {
                    var _wreq = typeof window !== 'undefined' && window.require ? window.require : null;
                    var _electron = _wreq ? _wreq('electron') : null;
                    var _ipc = _electron && _electron.ipcRenderer ? _electron.ipcRenderer : null;
                    if (_ipc) {
                        var shim = {
                            postMessage: function (a) {
                                switch (a.actionType) {
                                    case _MqttClientConstants2.default.ACTION_MQTT_CLIENT_CONNECT:
                                        return _ipc.invoke('mqtt-connect-renderer', a.data);
                                    case _MqttClientConstants2.default.ACTION_MQTT_CLIENT_DISCONNECT:
                                        return _ipc.invoke('mqtt-disconnect', a.data);
                                    case _MqttClientConstants2.default.ACTION_PUBLISH_MESSAGE:
                                        return _ipc.invoke('mqtt-publish', {
                                            clientId: a.data.mcsId,
                                            topic: a.data.topic,
                                            message: a.data.payload,
                                            options: { qos: a.data.qos, retain: a.data.retain }
                                        });
                                    case _MqttClientConstants2.default.ACTION_SUBSCRIBE_TO_TOPIC:
                                        return _ipc.invoke('mqtt-subscribe', {
                                            clientId: a.data.mcsId,
                                            topic: a.data.topic,
                                            options: { qos: a.data.qos }
                                        });
                                    default:
                                        return;
                                }
                            },
                            addEventListener: function () {}
                        };
                        this.mqttClientConnectionWorkers[action.data.mcsId] = shim;
                        shim.postMessage(action);
                        return;
                    }
                } catch (e) {}

                // Fallback to Web Worker when not in Electron or no ipc available
                mqttClientConnectionWorker = new Worker('./platform/PlatformMqttClientWorkerService.js');
                mqttClientConnectionWorker.addEventListener('message', function (event) {
                    this.processEvents(event.data);
                }.bind(this));
                this.mqttClientConnectionWorkers[action.data.mcsId] = mqttClientConnectionWorker;
                mqttClientConnectionWorker.postMessage(action);
            }
        }`;

if (oldPattern.test(content)) {
    content = content.replace(oldPattern, newCode);
    fs.writeFileSync(appJsPath, content, 'utf8');
    console.log('✅ Fixed connectToBroker method');
} else {
    console.log('⚠️ No matching connectToBroker method found, trying other patterns...');
    
    // Try simpler replacement
    const simplePattern = /new Worker\('\.\/platform\/PlatformMqttClientWorkerService\.js'\)/g;
    if (simplePattern.test(content)) {
        content = content.replace(simplePattern, `(function() {
            try {
                var _wreq = typeof window !== 'undefined' && window.require ? window.require : null;
                var _electron = _wreq ? _wreq('electron') : null;
                var _ipc = _electron && _electron.ipcRenderer ? _electron.ipcRenderer : null;
                if (_ipc) {
                    return {
                        postMessage: function(a) {
                            switch(a.actionType) {
                                case 'ACTION_MQTT_CLIENT_CONNECT':
                                    return _ipc.invoke('mqtt-connect-renderer', a.data);
                                case 'ACTION_MQTT_CLIENT_DISCONNECT':
                                    return _ipc.invoke('mqtt-disconnect', a.data);
                                default:
                                    return;
                            }
                        },
                        addEventListener: function() {}
                    };
                }
            } catch(e) {}
            return new Worker('./platform/PlatformMqttClientWorkerService.js');
        })()`);
        fs.writeFileSync(appJsPath, content, 'utf8');
        console.log('✅ Fixed Worker creation');
    } else {
        console.log('❌ No Worker creation code found');
    }
}

console.log('🎉 Fix completed!');
