//using web workers or Electron IPC
import PlatformDispatcherService from './PlatformDispatcherService';
import CommonConstants from '../utils/CommonConstants';
import MqttClientConstants from '../utils/MqttClientConstants';

class PlatformMqttClientService {  

    constructor() {
        this.mqttClientConnectionWorkers = {};
        this.ipcRenderer = null;
        try {
            // Prefer window.require to access Electron in Browserify-bundled renderer
            const electron = (typeof window !== 'undefined' && window.require) ? window.require('electron') : null;
            if (!electron && typeof require === 'function') {
                // fallback best-effort
                try { /* eslint-disable global-require */ var e2 = require('electron'); if(e2) { /* noop */ } } catch(_) {}
            }
            const ipc = electron && electron.ipcRenderer ? electron.ipcRenderer : null;
            if (ipc) {
                this.ipcRenderer = ipc;
                this.ipcRenderer.on('mqtt-events', function(event, payload) {
                    this.processEvents(payload);
                }.bind(this));
            }
        } catch (e) {
            // not in Electron
        }
    }

    processAction(action) {
        switch(action.actionType) {
            case MqttClientConstants.ACTION_MQTT_CLIENT_CONNECT:
                this.connectToBroker(action);
                break;
            case MqttClientConstants.ACTION_MQTT_CLIENT_DISCONNECT:
                this.disConnectFromBroker(action);
                break;
            case MqttClientConstants.ACTION_PUBLISH_MESSAGE:
                this.sendAction(action);
                break;
            case MqttClientConstants.ACTION_SUBSCRIBE_TO_TOPIC:
               this.sendAction(action);
               break;
            case MqttClientConstants.ACTION_UN_SUBSCRIBE_TO_TOPIC:
               this.sendAction(action);
               break;
            default:
        }
    }

    processEvents(event) {
        PlatformDispatcherService.processEvents(event,CommonConstants.SERVICE_TYPE_MQTT_CLIENTS);
    }

    connectToBroker(action) {
        if (this.ipcRenderer) {
            // Electron path
            this.ipcRenderer.send('mqtt-connect', action.data);
            return;
        }
        // Web/Worker path
        var mqttClientConnectionWorker = this.mqttClientConnectionWorkers[action.data.mcsId];
        if(mqttClientConnectionWorker!=null) {
            mqttClientConnectionWorker.postMessage(action);
        } else {
            mqttClientConnectionWorker = new Worker('./platform/PlatformMqttClientWorkerService.js');
            mqttClientConnectionWorker.addEventListener('message',function(event){
                this.processEvents(event.data);
            }.bind(this));
            this.mqttClientConnectionWorkers[action.data.mcsId] = mqttClientConnectionWorker;
            mqttClientConnectionWorker.postMessage(action);
        }
    }

    disConnectFromBroker(action) {
        if (this.ipcRenderer) {
            this.ipcRenderer.send('mqtt-disconnect', action.data);
            return;
        }
        var mqttClientConnectionWorker = this.mqttClientConnectionWorkers[action.data];
        if(mqttClientConnectionWorker!=null) {
            mqttClientConnectionWorker.postMessage(action);
            delete this.mqttClientConnectionWorkers[action.data];
        }
    }

    sendAction(action) {
        if (this.ipcRenderer) {
            switch(action.actionType) {
                case MqttClientConstants.ACTION_PUBLISH_MESSAGE:
                    this.ipcRenderer.send('mqtt-publish', { mcsId: action.data.mcsId, topic: action.data.topic, message: action.data.payload, qos: action.data.qos, retain: action.data.retain, pubId: action.data.pubId });
                    break;
                case MqttClientConstants.ACTION_SUBSCRIBE_TO_TOPIC:
                    this.ipcRenderer.send('mqtt-subscribe', { mcsId: action.data.mcsId, topic: action.data.topic, qos: action.data.qos });
                    break;
                case MqttClientConstants.ACTION_UN_SUBSCRIBE_TO_TOPIC:
                    this.ipcRenderer.send('mqtt-unsubscribe', { mcsId: action.data.mcsId, topic: action.data.topic });
                    break;
                default:
            }
            return;
        }
        var mqttClientConnectionWorker = this.mqttClientConnectionWorkers[action.data.mcsId];
        if(mqttClientConnectionWorker!=null) {
            mqttClientConnectionWorker.postMessage(action);
        }
    }
}

export default new PlatformMqttClientService();