import Q from 'q';
import {Qlobber} from 'qlobber';
import _ from 'lodash';
import mqtt from 'mqtt';
import Events from 'events';
import fs from 'fs';
var path = require('path');

import MqttClientConstants from '../utils/MqttClientConstants';
import PlatformConstants from '../platform/common/PlatformConstants';
import CommonConstants from '../utils/CommonConstants';
import ElectronMqttService from '../services/ElectronMqttService';

class MqttClientConnectionWorker extends Events.EventEmitter {  

    constructor() {
        super();
        this.mqttClientObj = null;
        this.client = null;
        this._matcher = new Qlobber({separator:'/',wildcard_one:'+',wildcard_some:'#'});
        this.isDisconnecting =false;
        
        // 初始化Electron MQTT服务
        // 检测Electron环境：在渲染进程中通过window.navigator.userAgent，在Web Worker中通过self.navigator.userAgent
        const isElectron = (typeof window !== 'undefined' && window.navigator && window.navigator.userAgent && window.navigator.userAgent.includes('Electron')) ||
                          (typeof self !== 'undefined' && self.navigator && self.navigator.userAgent && self.navigator.userAgent.includes('Electron'));
        if (isElectron) {
            this.electronMqttService = new ElectronMqttService();
            this.setupElectronMqttEventHandlers();
        }
    }

    emitChange(data) { 
        this.emit(MqttClientConstants.EVENT_WORKER_MQTT_CLIENT,data);
    }

    addChangeListener(callback) { 
        this.on(MqttClientConstants.EVENT_WORKER_MQTT_CLIENT,callback);
    }

    removeChangeListener(callback) { 
        this.removeListener(MqttClientConstants.EVENT_WORKER_MQTT_CLIENT,callback);
    }

    setupElectronMqttEventHandlers() {
        if (!this.electronMqttService) return;

        // 重写Electron MQTT服务的事件处理器
        this.electronMqttService.handleConnectionSuccess = (data) => {
            console.log('🎉 Electron MQTT连接成功，更新UI状态');
            this.publishClientConnectionStatus(MqttClientConstants.CONNECTION_STATE_CONNECTED);
            // 调用原始方法以触发自定义事件
            ElectronMqttService.prototype.handleConnectionSuccess.call(this.electronMqttService, data);
        };

        this.electronMqttService.handleDisconnection = (data) => {
            console.log('🔌 Electron MQTT连接断开，更新UI状态');
            if (this.isDisconnecting === false) {
                this.publishClientConnectionStatus(MqttClientConstants.CONNECTION_STATE_ERROR);
            }
            // 调用原始方法以触发自定义事件
            ElectronMqttService.prototype.handleDisconnection.call(this.electronMqttService, data);
        };

        this.electronMqttService.handleError = (data) => {
            console.error('❌ MQTT连接错误:', data);
            this.publishClientConnectionStatus(MqttClientConstants.CONNECTION_STATE_ERROR);
            // 调用原始方法以触发自定义事件
            ElectronMqttService.prototype.handleError.call(this.electronMqttService, data);
        };

        this.electronMqttService.handleMessage = (data) => {
            const topics = this._matcher.match(data.topic);
            if (topics && topics.length > 0) {
                for (let i = 0; i < topics.length; i++) {
                    this.emitChange({
                        event: MqttClientConstants.EVENT_MQTT_CLIENT_SUBSCRIBED_DATA_RECIEVED,
                        data: {
                            mcsId: this.mqttClientObj.mcsId,
                            topic: topics[i],
                            message: data.message,
                            packet: data.packet
                        }
                    });
                }
            }
        };

        this.electronMqttService.handleOffline = (data) => {
            this.publishClientConnectionStatus(MqttClientConstants.CONNECTION_STATE_ERROR);
        };
    }

    emitChange(data) { 
        this.emit(MqttClientConstants.EVENT_WORKER_MQTT_CLIENT,data);
    }

    addChangeListener(callback) { 
        this.on(MqttClientConstants.EVENT_WORKER_MQTT_CLIENT,callback);
    }

    removeChangeListener(callback) { 
        this.removeListener(MqttClientConstants.EVENT_WORKER_MQTT_CLIENT,callback);
    }

    processAction(action) {
        switch(action.actionType) {
            case MqttClientConstants.ACTION_MQTT_CLIENT_CONNECT:
                this.connect(action.data);
                break;
            case MqttClientConstants.ACTION_MQTT_CLIENT_DISCONNECT:
                this.disConnect();
                break;
            case MqttClientConstants.ACTION_PUBLISH_MESSAGE:
                this.publishMessage(action.data.topic,action.data.payload,action.data.qos,action.data.retain,action.data.pubId);
                break;
            case MqttClientConstants.ACTION_SUBSCRIBE_TO_TOPIC:
                this.subscribeToTopic(action.data.topic,action.data.qos);
                break;
            case MqttClientConstants.ACTION_UN_SUBSCRIBE_TO_TOPIC:
                this.unSubscribeTopic(action.data.topic);
                break;
            default:
        }
    }

    connectToBroker() {
        if(this.mqttClientObj!=null && this.mqttClientObj.mcsId!=null) {
            // 在Electron环境中使用新的MQTT服务
            // 检测Electron环境：在渲染进程中通过window.navigator.userAgent，在Web Worker中通过self.navigator.userAgent
            const isElectron = (typeof window !== 'undefined' && window.navigator && window.navigator.userAgent && window.navigator.userAgent.includes('Electron')) ||
                              (typeof self !== 'undefined' && self.navigator && self.navigator.userAgent && self.navigator.userAgent.includes('Electron'));
            console.log('🔍 环境检测结果:', { 
                isElectron, 
                hasElectronMqttService: !!this.electronMqttService,
                userAgent: typeof window !== 'undefined' && window.navigator ? window.navigator.userAgent : 
                          (typeof self !== 'undefined' && self.navigator ? self.navigator.userAgent : 'undefined'),
                windowExists: typeof window !== 'undefined',
                selfExists: typeof self !== 'undefined',
                navigatorExists: (typeof window !== 'undefined' && !!window.navigator) || (typeof self !== 'undefined' && !!self.navigator)
            });
            if (isElectron && this.electronMqttService) {
                console.log('🔧 Electron环境检测到，使用主进程MQTT服务');
                console.log('🔧 连接数据:', this.mqttClientObj);
                this.electronMqttService.connect(this.mqttClientObj).catch(error => {
                    console.error('❌ Electron MQTT连接失败:', error);
                    this.publishClientConnectionStatus(MqttClientConstants.CONNECTION_STATE_ERROR);
                });
                return; // 确保在Electron环境中不继续执行后续代码
            } else {
                console.log('❌ 未进入Electron重定向逻辑:', { 
                    isElectron, 
                    hasElectronMqttService: !!this.electronMqttService,
                    userAgent: typeof window !== 'undefined' && window.navigator ? window.navigator.userAgent : 'undefined'
                });
            }
            
            var connectUrl = this.mqttClientObj.protocol+'://'+this.mqttClientObj.host;
            var options = this.getConnectOptions();
            
            // Override protocol for Electron to use TCP for mqtt/mqtts, but keep WebSocket for ws/wss
            if (PlatformConstants.PLATFORM_TYPE == CommonConstants.PLATFORM_ELECTRON_APP) {
                console.log('🔧 Electron环境检测到，强制使用TCP连接');
                
                if (this.mqttClientObj.protocol === 'mqtts') {
                    // Force TCP connection for MQTTS
                    connectUrl = 'mqtts://' + this.mqttClientObj.host;
                    console.log('🔒 使用MQTTS TCP连接:', connectUrl);
                    
                    // Clear all WebSocket related options
                    delete options['protocol'];
                    delete options['wsOptions'];
                    delete options['ws'];
                    delete options['webSocket'];
                    
                    // Force TCP transport
                    options['transport'] = 'tcp';
                    options['protocol'] = 'mqtts';
                    options['browser'] = false;
                    
                } else if (this.mqttClientObj.protocol === 'mqtt') {
                    // Force TCP connection for MQTT
                    connectUrl = 'mqtt://' + this.mqttClientObj.host;
                    console.log('🔓 使用MQTT TCP连接:', connectUrl);
                    
                    // Clear all WebSocket related options
                    delete options['protocol'];
                    delete options['wsOptions'];
                    delete options['ws'];
                    delete options['webSocket'];
                    
                    // Force TCP transport
                    options['transport'] = 'tcp';
                    options['protocol'] = 'mqtt';
                    options['browser'] = false;
                    
                } else if (this.mqttClientObj.protocol === 'ws' || this.mqttClientObj.protocol === 'wss') {
                    // Keep WebSocket for ws/wss protocols
                    connectUrl = this.mqttClientObj.protocol + '://' + this.mqttClientObj.host;
                    console.log('🌐 使用WebSocket连接:', connectUrl);
                    
                    delete options['protocol'];
                    options['transport'] = 'websocket';
                }
            }

            // Debug logging
            console.log('🚀 MQTT连接参数:');
            console.log('  - 平台:', PlatformConstants.PLATFORM_TYPE);
            console.log('  - 连接URL:', connectUrl);
            console.log('  - 选项:', JSON.stringify(options, null, 2));

            this.client = mqtt.connect(connectUrl, options);

            this.client.on('connect', function () {
                this.publishClientConnectionStatus(MqttClientConstants.CONNECTION_STATE_CONNECTED);
            }.bind(this));

            this.client.on('close', function () {
                if(this.isDisconnecting==false) {
                    this.publishClientConnectionStatus(MqttClientConstants.CONNECTION_STATE_ERROR);
                }
            }.bind(this));

            this.client.on('offline', function () {
                this.publishClientConnectionStatus(MqttClientConstants.CONNECTION_STATE_ERROR);
            }.bind(this));

            this.client.on('error', function (err) {
                console.error('❌ MQTT连接错误:', err);
                console.error('错误详情:', {
                    message: err.message,
                    code: err.code,
                    errno: err.errno,
                    syscall: err.syscall,
                    address: err.address,
                    port: err.port
                });
                this.publishClientConnectionStatus(MqttClientConstants.CONNECTION_STATE_ERROR);
            }.bind(this));

            this.client.on('message', function (topic, message,packet) {
                var topics = _.uniq(this._matcher.match(topic));
                if(message!=null && topics!=null && topics.length>0) {
                    for(var i=0;i<topics.length;i++) {
                        this.emitChange({event:MqttClientConstants.EVENT_MQTT_CLIENT_SUBSCRIBED_DATA_RECIEVED,
                            data:{mcsId:this.mqttClientObj.mcsId,topic:topics[i],
                            message:message.toString(),packet:packet}});
                    }
                }
            }.bind(this));
        }
    }

    publishClientConnectionStatus(connState) {
        this.emitChange({event:MqttClientConstants.EVENT_MQTT_CLIENT_CONN_STATE_CHANGED, data:{mcsId:this.mqttClientObj.mcsId,connState:connState}});
    }

    getConnectOptions() {
        var clId = this.mqttClientObj.mqttClientId;
        if(this.mqttClientObj.timestampClientId == true) {
            clId = clId + (+new Date());
        }

        var options = {
            protocolId:this.mqttClientObj.protocolId,
            protocolVersion:this.mqttClientObj.protocolVersion,
            keepalive:Number(this.mqttClientObj.keepalive),
            reschedulePings:this.mqttClientObj.reschedulePings,
            clientId:clId,
            clean:this.mqttClientObj.clean,
            reconnectPeriod:Number(this.mqttClientObj.reconnectPeriod),
            connectTimeout:Number(this.mqttClientObj.connectTimeout),
            queueQoSZero:this.mqttClientObj.queueQoSZero
        };

        if(this.mqttClientObj.username!=null && this.mqttClientObj.username.trim().length>0) {
            options['username']=this.mqttClientObj.username;
        }
        if(this.mqttClientObj.password!=null && this.mqttClientObj.password.trim().length>0) {
            options['password']=this.mqttClientObj.password;
        }

        if(this.mqttClientObj.willTopic!=null && this.mqttClientObj.willTopic.length>0 && this.mqttClientObj.willPayload!=null) {
            options['will']= {
                topic:this.mqttClientObj.willTopic,
                payload:this.mqttClientObj.willPayload,
                qos:this.mqttClientObj.willQos,
                retain:this.mqttClientObj.willRetain
            }
        }

        if(this.mqttClientObj.protocol == 'mqtts' || this.mqttClientObj.protocol == 'wss') {
            console.log('🔐 配置SSL/TLS证书...');
            console.log('证书类型:', this.mqttClientObj.certificateType);
            
            if(this.mqttClientObj.certificateType == 'ssc') {
                // 验证证书文件是否存在
                if (!this.mqttClientObj.caFile) {
                    console.error('❌ CA证书文件未配置');
                    throw new Error('CA证书文件未配置');
                }
                if (!this.mqttClientObj.clientCertificateFile) {
                    console.error('❌ 客户端证书文件未配置');
                    throw new Error('客户端证书文件未配置');
                }
                if (!this.mqttClientObj.clientKeyFile) {
                    console.error('❌ 客户端密钥文件未配置');
                    throw new Error('客户端密钥文件未配置');
                }
                
                console.log('✅ 证书文件配置完成');
                options['ca']= this.mqttClientObj.caFile;
                options['cert']= this.mqttClientObj.clientCertificateFile;
                options['key']= this.mqttClientObj.clientKeyFile;
                options['passphrase']= this.mqttClientObj.clientKeyPassphrase;
                options['rejectUnauthorized'] = true;
            } else if(this.mqttClientObj.certificateType == 'cc') {
                options['ca']= this.mqttClientObj.caFile;
                options['rejectUnauthorized'] = true;
            } else if(this.mqttClientObj.certificateType == 'cssc') {
                options['rejectUnauthorized'] = false;
            }

            if(this.mqttClientObj.sslTlsVersion!=null && this.mqttClientObj.sslTlsVersion != 'auto') {
                options['secureProtocol']= this.mqttClientObj.sslTlsVersion;
            }
        }
        return options;
    }

    connect(newMqttClient) {
        this.mqttClientObj = newMqttClient;
        if(this.client!=null) {
            Q.invoke(this.client,'end',true)
            .then(function() {
                this.connectToBroker();
            }.bind(this));
        } else {
            this.connectToBroker();
        }
    }

    disConnect() {
        this.isDisconnecting = true;
        
        // 在Electron环境中使用新的MQTT服务
        // 检测Electron环境：在渲染进程中通过window.navigator.userAgent，在Web Worker中通过self.navigator.userAgent
        const isElectron = (typeof window !== 'undefined' && window.navigator && window.navigator.userAgent && window.navigator.userAgent.includes('Electron')) ||
                          (typeof self !== 'undefined' && self.navigator && self.navigator.userAgent && self.navigator.userAgent.includes('Electron'));
        if (isElectron && this.electronMqttService) {
            console.log('🔌 Electron环境断开MQTT连接');
            this.electronMqttService.disconnect(this.mqttClientObj.mcsId).then(() => {
                this.emitChange({event:MqttClientConstants.EVENT_MQTT_CLIENT_CONNECTION_CLOSED, data:{mcsId:this.mqttClientObj.mcsId}});
            }).catch(error => {
                console.error('❌ Electron MQTT断开失败:', error);
                this.emitChange({event:MqttClientConstants.EVENT_MQTT_CLIENT_CONNECTION_CLOSED, data:{mcsId:this.mqttClientObj.mcsId}});
            });
            return;
        }
        
        if(this.client!=null) {
            Q.invoke(this.client,'end',true)
            .then(function() {
                this.emitChange({event:MqttClientConstants.EVENT_MQTT_CLIENT_CONNECTION_CLOSED, data:{mcsId:this.mqttClientObj.mcsId}});
            }.bind(this));
        } else {
            this.emitChange({event:MqttClientConstants.EVENT_MQTT_CLIENT_CONNECTION_CLOSED, data:{mcsId:this.mqttClientObj.mcsId}});
        }
    }

    publishMessage(topic,payload,qos,retain,pubId) {
        if(topic!=null && topic.trim().length>0) {
            var publishedTime = +(new Date());
            this.client.publish(topic,payload,{qos:parseInt(qos),retain:retain},function(err) {
                if(err==null) {
                    this.emitChange({event:MqttClientConstants.EVENT_MQTT_CLIENT_PUBLISHED_MESSAGE,
                        data:{publishedTime:publishedTime,qosResponseReceivedTime:+(new Date()),mcsId:this.mqttClientObj.mcsId,pubId:pubId,topic:topic,payload:payload,qos:qos,retain:retain}});
                }
            }.bind(this));
        }
    }

    subscribeToTopic(topic,qos) {
        if(topic!=null && topic.trim().length>0) {
            this.client.subscribe(topic,{qos:parseInt(qos)});
            this._matcher.add(topic,topic);
        }
    }

    unSubscribeTopic(topic) {
        if(topic!=null && topic.trim().length>0) {
            this.client.unsubscribe(topic);
            this._matcher.remove(topic);
        }
    }
}

export default MqttClientConnectionWorker;