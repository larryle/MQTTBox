// Check if in Electron environment (use window.require to avoid being processed by browserify)
let ipcRenderer;
try {
    const wreq = typeof window !== 'undefined' && window.require ? window.require : null;
    if (wreq) {
        const electron = wreq('electron');
        ipcRenderer = electron && electron.ipcRenderer ? electron.ipcRenderer : undefined;
    }
} catch (_) {
    ipcRenderer = undefined;
}

import MqttClientConstants from '../utils/MqttClientConstants';
import CommonConstants from '../utils/CommonConstants';
import PlatformDispatcherService from '../platform/PlatformDispatcherService';

class ElectronMqttService {
    constructor() {
        this.clients = new Map();
        this.clientIdToMcsId = new Map();
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (ipcRenderer) {
            // Use ipcRenderer in renderer process
            console.log('🔧 Setting up event listeners using ipcRenderer');
            this.setupIpcRendererListeners();
        } else if (typeof self !== 'undefined' && self.postMessage) {
            // Use postMessage in Web Worker
            console.log('🔧 使用postMessage设置事件监听器');
            this.setupPostMessageListeners();
        } else {
            console.warn('⚠️ 既没有ipcRenderer也没有postMessage，跳过事件监听器设置');
        }
    }

    setupIpcRendererListeners() {
        // 监听来自主进程的MQTT事件
        ipcRenderer.on('mqtt-connected', (event, data) => {
            console.log('✅ MQTT连接成功:', data);
            this.handleConnectionSuccess(data);
        });

        ipcRenderer.on('mqtt-disconnected', (event, data) => {
            console.log('🔌 MQTT连接断开:', data);
            this.handleDisconnection(data);
        });

        ipcRenderer.on('mqtt-error', (event, data) => {
            console.error('❌ MQTT错误:', data);
            this.handleError(data);
        });

        ipcRenderer.on('mqtt-message', (event, data) => {
            console.log('📨 收到MQTT消息:', data);
            this.handleMessage(data);
        });

        ipcRenderer.on('mqtt-offline', (event, data) => {
            console.log('📴 MQTT客户端离线:', data);
            this.handleOffline(data);
        });

        ipcRenderer.on('mqtt-published', (event, data) => {
            console.log('✅ 消息发布成功:', data);
            this.handlePublishSuccess(data);
        });

        ipcRenderer.on('mqtt-publish-error', (event, data) => {
            console.error('❌ 发布失败:', data);
            this.handlePublishError(data);
        });

        ipcRenderer.on('mqtt-subscribed', (event, data) => {
            console.log('✅ 订阅成功:', data);
            this.handleSubscribeSuccess(data);
        });

        ipcRenderer.on('mqtt-subscribe-error', (event, data) => {
            console.error('❌ 订阅失败:', data);
            this.handleSubscribeError(data);
        });
    }

    setupPostMessageListeners() {
        // 在Web Worker中监听来自主进程的消息
        self.onmessage = (event) => {
            console.log('📨 Web Worker收到原始消息:', event.data);
            
            // 检查消息格式
            let messageData;
            if (typeof event.data === 'string') {
                try {
                    messageData = JSON.parse(event.data);
                } catch (e) {
                    console.error('❌ 无法解析消息JSON:', e);
                    return;
                }
            } else if (typeof event.data === 'object' && event.data !== null) {
                messageData = event.data;
            } else {
                console.error('❌ 未知的消息格式:', typeof event.data, event.data);
                return;
            }
            
            const { type, data } = messageData;
            console.log('📨 Web Worker解析后消息:', type, data);
            
            switch (type) {
                case 'mqtt-connected':
                    this.handleConnectionSuccess(data);
                    break;
                case 'mqtt-disconnected':
                    this.handleDisconnection(data);
                    break;
                case 'mqtt-error':
                    this.handleError(data);
                    break;
                case 'mqtt-message':
                    this.handleMessage(data);
                    break;
                case 'mqtt-offline':
                    this.handleOffline(data);
                    break;
                case 'mqtt-published':
                    this.handlePublishSuccess(data);
                    break;
                case 'mqtt-publish-error':
                    this.handlePublishError(data);
                    break;
                case 'mqtt-subscribed':
                    this.handleSubscribeSuccess(data);
                    break;
                case 'mqtt-subscribe-error':
                    this.handleSubscribeError(data);
                    break;
            }
        };
        
        // 添加测试机制：定期检查是否有MQTT_WORKER_MESSAGE
        setInterval(() => {
            console.log('🔍 Web Worker正在运行，等待MQTT消息...');
        }, 5000);
        
        // 监听window.postMessage事件
        if (typeof window !== 'undefined' && window.addEventListener) {
            window.addEventListener('message', (event) => {
                console.log('📨 通过window.postMessage收到消息:', event.data);
                const { type, data } = event.data;
                
                switch (type) {
                    case 'mqtt-connected':
                        console.log('🎉 处理连接成功消息:', data);
                        this.handleConnectionSuccess(data);
                        break;
                    case 'mqtt-disconnected':
                        console.log('🔌 处理断开连接消息:', data);
                        this.handleDisconnection(data);
                        break;
                    case 'mqtt-error':
                        console.log('❌ 处理错误消息:', data);
                        this.handleError(data);
                        break;
                    case 'mqtt-message':
                        console.log('📨 处理消息:', data);
                        this.handleMessage(data);
                        break;
                    case 'mqtt-offline':
                        console.log('📴 处理离线消息:', data);
                        this.handleOffline(data);
                        break;
                    case 'mqtt-published':
                        console.log('📤 处理发布成功消息:', data);
                        this.handlePublishSuccess(data);
                        break;
                    case 'mqtt-publish-error':
                        console.log('❌ 处理发布错误消息:', data);
                        this.handlePublishError(data);
                        break;
                    case 'mqtt-subscribed':
                        console.log('📥 处理订阅成功消息:', data);
                        this.handleSubscribeSuccess(data);
                        break;
                    case 'mqtt-subscribe-error':
                        console.log('❌ 处理订阅错误消息:', data);
                        this.handleSubscribeError(data);
                        break;
                }
            });
        }
        
        // 移除 console.log 劫持，避免误解析普通日志（如 sourcemap 提示）
    }

    async connect(connectionData) {
        try {
            console.log('🔌 请求MQTT连接:', connectionData);
            
            // 解析主机和端口
            const [host, port] = connectionData.host.split(':');
            const portNumber = port ? parseInt(port) : (connectionData.protocol === 'mqtts' ? 8883 : 1883);
            
            const mqttData = {
                // 强制使用 mcsId 作为主进程侧 clientId，保证后续事件中的 mcsId 一致
                clientId: connectionData.mcsId,
                host: host,
                port: portNumber,
                protocol: connectionData.protocol,
                options: this.buildConnectionOptions(connectionData)
            };

            // 记录 clientId 到 UI mcsId 的映射，便于后续事件回填 UI 状态
            try {
                var uiId = connectionData.mcsId || connectionData.mqttClientId || connectionData.clientId;
                if (uiId && mqttData.clientId) {
                    this.clientIdToMcsId.set(mqttData.clientId, uiId);
                }
            } catch (_) {}

            if (ipcRenderer) {
                // 在渲染进程中使用ipcRenderer
                console.log('🔧 使用ipcRenderer发送连接请求');
                await ipcRenderer.invoke('mqtt-connect-renderer', mqttData);
            } else if (typeof self !== 'undefined' && self.postMessage) {
                // 在Web Worker中使用postMessage
                console.log('🔧 使用postMessage发送连接请求');
                return new Promise((resolve, reject) => {
                    const messageId = Date.now() + Math.random();
                    
                    // 设置一次性监听器
                    const handleMessage = (event) => {
                        const { type, data, messageId: responseId } = event.data;
                        if (responseId === messageId) {
                            self.removeEventListener('message', handleMessage);
                            if (type === 'mqtt-connect-success') {
                                resolve(data);
                            } else if (type === 'mqtt-connect-error') {
                                reject(new Error(data.error));
                            }
                        }
                    };
                    
                    self.addEventListener('message', handleMessage);
                    
                    // 发送连接请求 - 通过console.log让主进程能够接收
                    console.log('MQTT_WORKER_MESSAGE:', JSON.stringify({
                        type: 'mqtt-connect-request',
                        data: mqttData,
                        messageId: messageId
                    }));
                });
            } else {
                throw new Error('既没有ipcRenderer也没有postMessage，无法连接MQTT');
            }

            this.clients.set(connectionData.mqttClientId || connectionData.mcsId, connectionData);
            
        } catch (error) {
            console.error('❌ MQTT连接失败:', error);
            throw error;
        }
    }

    async disconnect(clientId) {
        if (!ipcRenderer) {
            throw new Error('ipcRenderer不可用，无法断开MQTT连接');
        }
        
        try {
            await ipcRenderer.invoke('mqtt-disconnect', clientId);
            this.clients.delete(clientId);
        } catch (error) {
            console.error('❌ MQTT断开失败:', error);
            throw error;
        }
    }

    async publish(clientId, topic, message, options = {}) {
        if (!ipcRenderer) {
            throw new Error('ipcRenderer不可用，无法发布MQTT消息');
        }
        
        try {
            await ipcRenderer.invoke('mqtt-publish', {
                clientId,
                topic,
                message,
                options
            });
        } catch (error) {
            console.error('❌ MQTT发布失败:', error);
            throw error;
        }
    }

    async subscribe(clientId, topic, options = {}) {
        if (!ipcRenderer) {
            throw new Error('ipcRenderer不可用，无法订阅MQTT主题');
        }
        
        try {
            await ipcRenderer.invoke('mqtt-subscribe', {
                clientId,
                topic,
                options
            });
        } catch (error) {
            console.error('❌ MQTT订阅失败:', error);
            throw error;
        }
    }

    buildConnectionOptions(connectionData) {
        // If caller already prepared options (including TLS), honor them
        if (connectionData && connectionData.options && typeof connectionData.options === 'object') {
            return connectionData.options;
        }

        const options = {
            clientId: connectionData.mqttClientId || connectionData.mcsId,
            keepalive: connectionData.keepalive || 60,
            clean: connectionData.clean !== false,
            reconnectPeriod: connectionData.reconnectPeriod || 1000,
            connectTimeout: connectionData.connectTimeout || 30000,
            protocolVersion: connectionData.protocolVersion || 4,
            protocolId: connectionData.protocolId || 'MQTT'
        };

        // 添加用户名和密码
        if (connectionData.username) {
            options.username = connectionData.username;
        }
        if (connectionData.password) {
            options.password = connectionData.password;
        }

        // 添加Will消息
        if (connectionData.willTopic && connectionData.willPayload) {
            options.will = {
                topic: connectionData.willTopic,
                payload: connectionData.willPayload,
                qos: connectionData.willQos || 0,
                retain: connectionData.willRetain || false
            };
        }

        // 添加SSL/TLS配置
        if (connectionData.protocol === 'mqtts' || connectionData.protocol === 'wss') {
            // Direct pass-through if PEM buffers/strings provided on connectionData
            if (connectionData.ca) options.ca = connectionData.ca;
            if (connectionData.cert) options.cert = connectionData.cert;
            if (connectionData.key) options.key = connectionData.key;
            if (typeof connectionData.rejectUnauthorized === 'boolean') {
                options.rejectUnauthorized = connectionData.rejectUnauthorized;
            }

            if (connectionData.certificateType === 'ssc') {
                // 读取证书文件
                if (connectionData.caFile) {
                    options.ca = connectionData.caFile;
                }
                if (connectionData.clientCertificateFile) {
                    options.cert = connectionData.clientCertificateFile;
                }
                if (connectionData.clientKeyFile) {
                    options.key = connectionData.clientKeyFile;
                }
                if (connectionData.clientKeyPassphrase) {
                    options.passphrase = connectionData.clientKeyPassphrase;
                }
                options.rejectUnauthorized = true;
            } else if (connectionData.certificateType === 'cc') {
                if (connectionData.caFile) {
                    options.ca = connectionData.caFile;
                }
                options.rejectUnauthorized = true;
            } else if (connectionData.certificateType === 'cssc') {
                options.rejectUnauthorized = false;
            }

            // SSL/TLS版本
            if (connectionData.sslTlsVersion && connectionData.sslTlsVersion !== 'auto') {
                options.secureProtocol = connectionData.sslTlsVersion;
            }
        }

        return options;
    }

    // 事件处理器（这些方法可以被重写以处理特定的事件）
    handleConnectionSuccess(data) {
        console.log('🎉 处理连接成功事件:', data);
        // 触发自定义事件，让其他组件可以监听
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('mqtt-connected', { detail: data }));
        }

        // 同步到应用事件总线，驱动 UI 状态
        try {
            var clientId = data && (data.clientId || data.mcsId);
            var uiId = clientId && this.clientIdToMcsId.get(clientId);
            var mcsId = uiId || data.mcsId || clientId;
            if (mcsId) {
                PlatformDispatcherService.processEvents({
                    event: MqttClientConstants.EVENT_MQTT_CLIENT_CONN_STATE_CHANGED,
                    data: { mcsId: mcsId, connState: MqttClientConstants.CONNECTION_STATE_CONNECTED }
                }, CommonConstants.SERVICE_TYPE_MQTT_CLIENTS);
            }
        } catch (e) {
            console.error('同步连接成功状态到UI失败:', e);
        }
    }

    handleDisconnection(data) {
        console.log('🔌 处理断开连接事件:', data);
        // 触发自定义事件，让其他组件可以监听
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('mqtt-disconnected', { detail: data }));
        }

        try {
            var clientId = data && (data.clientId || data.mcsId);
            var uiId = clientId && this.clientIdToMcsId.get(clientId);
            var mcsId = uiId || data.mcsId || clientId;
            if (mcsId) {
                PlatformDispatcherService.processEvents({
                    event: MqttClientConstants.EVENT_MQTT_CLIENT_CONN_STATE_CHANGED,
                    data: { mcsId: mcsId, connState: MqttClientConstants.CONNECTION_STATE_DIS_CONNECTED }
                }, CommonConstants.SERVICE_TYPE_MQTT_CLIENTS);
            }
        } catch (e) {
            console.error('同步断开状态到UI失败:', e);
        }
    }

    handleError(data) {
        console.error('❌ 处理错误事件:', data);
        // 触发自定义事件，让其他组件可以监听
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('mqtt-error', { detail: data }));
        }

        try {
            var clientId = data && (data.clientId || data.mcsId);
            var uiId = clientId && this.clientIdToMcsId.get(clientId);
            var mcsId = uiId || data.mcsId || clientId;
            if (mcsId) {
                PlatformDispatcherService.processEvents({
                    event: MqttClientConstants.EVENT_MQTT_CLIENT_CONN_STATE_CHANGED,
                    data: { mcsId: mcsId, connState: MqttClientConstants.CONNECTION_STATE_ERROR }
                }, CommonConstants.SERVICE_TYPE_MQTT_CLIENTS);
            }
        } catch (e) {
            console.error('同步错误状态到UI失败:', e);
        }
    }

    handleMessage(data) {
        console.log('📨 处理消息事件:', data);
        // 触发自定义事件，让其他组件可以监听
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('mqtt-message', { detail: data }));
        }

        // 同步消息到应用事件总线，驱动订阅面板数据
        try {
            var clientId = data && (data.clientId || data.mcsId);
            var uiId = clientId && this.clientIdToMcsId.get(clientId);
            var mcsId = uiId || data.mcsId || clientId;
            if (mcsId && data && data.topic != null) {
                PlatformDispatcherService.processEvents({
                    event: MqttClientConstants.EVENT_MQTT_CLIENT_SUBSCRIBED_DATA_RECIEVED,
                    data: { mcsId: mcsId, topic: data.topic, message: data.message, packet: data.packet }
                }, CommonConstants.SERVICE_TYPE_MQTT_CLIENTS);
            }
        } catch (e) {
            console.error('同步消息到UI订阅面板失败:', e);
        }
    }

    handleOffline(data) {
        // 可以在这里添加离线处理逻辑
    }

    handlePublishSuccess(data) {
        // 可以在这里添加发布成功的处理逻辑
    }

    handlePublishError(data) {
        // 可以在这里添加发布失败的处理逻辑
    }

    handleSubscribeSuccess(data) {
        // 可以在这里添加订阅成功的处理逻辑
    }

    handleSubscribeError(data) {
        // 可以在这里添加订阅失败的处理逻辑
    }
}

export default new ElectronMqttService();
