//using web workers
import PlatformDispatcherService from './PlatformDispatcherService';
import CommonConstants from '../utils/CommonConstants';
import MqttClientConstants from '../utils/MqttClientConstants';

class PlatformMqttClientService {  

    constructor() {
        this.mqttClientConnectionWorkers = {};

        // 在 Electron 渲染进程中，挂载 ipcRenderer 事件 → 分发到应用总线，驱动 UI
        try {
            var _wreq = (typeof window !== 'undefined' && window.require) ? window.require : null;
            var _electron = _wreq ? _wreq('electron') : null;
            this._ipc = _electron && _electron.ipcRenderer ? _electron.ipcRenderer : null;
        } catch (e) {
            this._ipc = null;
        }

        if (this._ipc) {
            this._ipc.on('mqtt-connected', (event, data) => {
                const mcsId = (data && (data.mcsId || data.clientId)) || undefined;
                if (mcsId) {
                    PlatformDispatcherService.processEvents({
                        event: MqttClientConstants.EVENT_MQTT_CLIENT_CONN_STATE_CHANGED,
                        data: { mcsId: mcsId, connState: MqttClientConstants.CONNECTION_STATE_CONNECTED }
                    }, CommonConstants.SERVICE_TYPE_MQTT_CLIENTS);
                }
            });

            this._ipc.on('mqtt-disconnected', (event, data) => {
                const mcsId = (data && (data.mcsId || data.clientId)) || undefined;
                if (mcsId) {
                    PlatformDispatcherService.processEvents({
                        event: MqttClientConstants.EVENT_MQTT_CLIENT_CONN_STATE_CHANGED,
                        data: { mcsId: mcsId, connState: MqttClientConstants.CONNECTION_STATE_DIS_CONNECTED }
                    }, CommonConstants.SERVICE_TYPE_MQTT_CLIENTS);
                }
            });

            this._ipc.on('mqtt-error', (event, data) => {
                const mcsId = (data && (data.mcsId || data.clientId)) || undefined;
                PlatformDispatcherService.processEvents({
                    event: MqttClientConstants.EVENT_MQTT_CLIENT_CONN_STATE_CHANGED,
                    data: { mcsId: mcsId, connState: MqttClientConstants.CONNECTION_STATE_ERROR, error: data && data.error }
                }, CommonConstants.SERVICE_TYPE_MQTT_CLIENTS);
            });
        }
    }

    processAction(action) {
        try { console.log('[UI] processAction:', action && action.actionType, action && action.data); } catch(_) {}
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
        try { console.log('[UI] connectToBroker for mcsId=', action && action.data && action.data.mcsId); } catch(_) {}
        var mqttClientConnectionWorker = this.mqttClientConnectionWorkers[action.data.mcsId];
        if (mqttClientConnectionWorker != null) {
            try { console.log('[UI] reuse existing worker/ipc shim for', action.data.mcsId); } catch(_) {}
            mqttClientConnectionWorker.postMessage(action);
            return;
        }

        // 在 Electron 中优先通过主进程处理，避免渲染进程/Worker 内使用 net/tls 导致抖动
        try {
            var _wreq = (typeof window !== 'undefined' && window.require) ? window.require : null;
            var _electron = _wreq ? _wreq('electron') : null;
            var _ipc = _electron && _electron.ipcRenderer ? _electron.ipcRenderer : null;
            if (_ipc) {
                var shim = {
                    postMessage: function (a) {
                        try { console.log('[UI->IPC] postMessage:', a && a.actionType, a && a.data); } catch(_) {}
                        switch (a.actionType) {
                            case MqttClientConstants.ACTION_MQTT_CLIENT_CONNECT:
                                return _ipc.invoke('mqtt-connect-renderer', a.data);
                            case MqttClientConstants.ACTION_MQTT_CLIENT_DISCONNECT:
                                return _ipc.invoke('mqtt-disconnect', a.data);
                            case MqttClientConstants.ACTION_PUBLISH_MESSAGE:
                                return _ipc.invoke('mqtt-publish', {
                                    clientId: a.data.mcsId,
                                    topic: a.data.topic,
                                    message: a.data.payload,
                                    options: { qos: a.data.qos, retain: a.data.retain }
                                });
                            case MqttClientConstants.ACTION_SUBSCRIBE_TO_TOPIC:
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

        // 非 Electron 或无 ipc 时，回退到 Web Worker
        try { console.log('[UI] fallback to Web Worker for', action && action.data && action.data.mcsId); } catch(_) {}
        mqttClientConnectionWorker = new Worker('./platform/PlatformMqttClientWorkerService.js');
        mqttClientConnectionWorker.addEventListener('message', function (event) {
            try { console.log('[UI<-Worker] message:', event && event.data); } catch(_) {}
            this.processEvents(event.data);
        }.bind(this));
        this.mqttClientConnectionWorkers[action.data.mcsId] = mqttClientConnectionWorker;
        try { console.log('[UI->Worker] postMessage CONNECT for', action && action.data && action.data.mcsId); } catch(_) {}
        mqttClientConnectionWorker.postMessage(action);
    }

    disConnectFromBroker(action) {
        var mqttClientConnectionWorker = this.mqttClientConnectionWorkers[action.data];
        if(mqttClientConnectionWorker!=null) {
            mqttClientConnectionWorker.postMessage(action);
            delete this.mqttClientConnectionWorkers[action.data];
        }
    }

    sendAction(action) {
        var mqttClientConnectionWorker = this.mqttClientConnectionWorkers[action.data.mcsId];
        if(mqttClientConnectionWorker!=null) {
            mqttClientConnectionWorker.postMessage(action);
        }
    }
}

export default new PlatformMqttClientService();