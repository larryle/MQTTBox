import Events from 'events';
import localforage from 'localforage';
import _ from 'lodash';
import AppDispatcher from '../dispatcher/AppDispatcher';
import MqttClientConstants from '../utils/MqttClientConstants';
import CommonConstants from '../utils/CommonConstants';
import MqttClientSettings from '../models/MqttClientSettings';
import PublisherSettings from '../models/PublisherSettings';
import SubscriberSettings from '../models/SubscriberSettings';
import MqttClientDbService from './MqttClientDbService';
import PlatformDispatcherService from '../platform/PlatformDispatcherService';

class MqttClientService extends Events.EventEmitter {

    constructor() {
        super();
        this.mqttClientSettings = {};
        this.mqttClientsStatus = {};
        this.mqttClientPublishedMessages = {};
        this.mqttClientSubscribedData = {};
        try {
            var isElectron = typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.indexOf('Electron') !== -1;
            var driver = localforage.LOCALSTORAGE;
            this._metaDb = localforage.createInstance({ name: 'MQTT_META', driver: driver });
        } catch(_) {
            this._metaDb = null;
        }

        this.registerToAppDispatcher();
        this.syncMqttClientSettingsCache();
    }

    registerToAppDispatcher() { 
        AppDispatcher.register(function(action) {
            switch(action.actionType) {
                case MqttClientConstants.ACTION_SAVE_MQTT_CLIENT:
                    this.saveMqttClientSettings(action.data);
                    break;
                case MqttClientConstants.ACTION_DELETE_MQTT_CLIENT:
                    this.deleteMqttClientSettings(action.data);
                    break;
                case MqttClientConstants.ACTION_SAVE_MQTT_CLIENT_PUBLISHER:
                    this.savePublisherSettings(action.data.mcsId,action.data.publisher);
                    break;
                case MqttClientConstants.ACTION_SAVE_MQTT_CLIENT_SUBSCRIBER:
                    this.saveSubscriberSettings(action.data.mcsId,action.data.subscriber);
                    break;
                case MqttClientConstants.ACTION_DELETE_MQTT_CLIENT_PUBLISHER:
                    this.deletePublisherSettings(action.data.mcsId,action.data.pubId);
                    break;
                case MqttClientConstants.ACTION_DELETE_MQTT_CLIENT_SUBSCRIBER:
                    this.deleteSubscriberSettings(action.data.mcsId,action.data.subId);
                    break;
                case MqttClientConstants.ACTION_MQTT_CLIENT_CONNECT:
                    PlatformDispatcherService.dispatcherAction(action,CommonConstants.SERVICE_TYPE_MQTT_CLIENTS);
                    break;
                case MqttClientConstants.ACTION_MQTT_CLIENT_DISCONNECT:
                    this.disconnectMqttClient(action);
                    break;
                case MqttClientConstants.ACTION_PUBLISH_MESSAGE:
                    this.publishMessage(action);
                    break;
                case MqttClientConstants.ACTION_SUBSCRIBE_TO_TOPIC:
                    this.subscribeToTopic(action);
                    break;
                case MqttClientConstants.ACTION_UN_SUBSCRIBE_TO_TOPIC:
                    this.unSubscribeToTopic(action);
                    break;
                default:
            }
        }.bind(this));
    }

    processEvents(eventObj) { 
        switch(eventObj.event) {
            case MqttClientConstants.EVENT_MQTT_CLIENT_CONN_STATE_CHANGED:
                try { console.log('[UI-Store] EVENT_MQTT_CLIENT_CONN_STATE_CHANGED:', eventObj && eventObj.data); } catch(_) {}
                this.syncMqttClientStateCache(eventObj.data);
                break;
            case MqttClientConstants.EVENT_MQTT_CLIENT_SUBSCRIBED_DATA_RECIEVED:
                this.syncMqttClientSubscribedData(eventObj.data);
                break;
            case MqttClientConstants.EVENT_MQTT_CLIENT_PUBLISHED_MESSAGE:
                this.syncMqttPublishedData(eventObj.data);
                break;
            default:
        }
    }

    syncMqttPublishedData(data) { 
        var pubMess = this.mqttClientPublishedMessages[data.mcsId+data.pubId];
        if(pubMess==null) {
            pubMess = [];
        }
        pubMess.push({topic:data.topic,payload:data.payload,qos:data.qos,retain:data.retain,publishedTime:data.publishedTime,qosResponseReceivedTime:data.qosResponseReceivedTime});
        this.mqttClientPublishedMessages[data.mcsId+data.pubId] = pubMess;
    }

    syncMqttClientSettingsCache() { 
        MqttClientDbService.getAllMqttClientSettings()
        .then(function(mqttClientList) {
            if(mqttClientList!=null && mqttClientList.length>0) {
                for(var i=0;i<mqttClientList.length;i++) {
                    var mqttClientObj = mqttClientList[i];
                    if(mqttClientObj!=null && mqttClientObj.mcsId!=null) {
                        this.mqttClientSettings[mqttClientObj.mcsId] = mqttClientObj;
                    }
                }
                var connectOnce = function(targetId){
                    console.log('🎯 准备连接客户端，目标ID:', targetId);
                    if(targetId!=null && this.mqttClientSettings[targetId]!=null) {
                        console.log('✅ 找到目标客户端，开始连接:', this.mqttClientSettings[targetId].mqttClientName);
                        PlatformDispatcherService.dispatcherAction({actionType: MqttClientConstants.ACTION_MQTT_CLIENT_CONNECT,data:this.mqttClientSettings[targetId]},CommonConstants.SERVICE_TYPE_MQTT_CLIENTS);
                    } else {
                        console.log('⚠️ 目标客户端不存在，使用fallback逻辑');
                        // fallback：若没有 lastUsed，就找第一个标记了 autoConnectOnAppLaunch 的；若也没有，则不自动连接
                        var firstAuto = null;
                        for(var j=0;j<mqttClientList.length;j++) {
                            if(mqttClientList[j] && mqttClientList[j].autoConnectOnAppLaunch===true) { firstAuto = mqttClientList[j]; break; }
                        }
                        if(firstAuto!=null) {
                            console.log('🔄 使用fallback客户端:', firstAuto.mqttClientName);
                            PlatformDispatcherService.dispatcherAction({actionType: MqttClientConstants.ACTION_MQTT_CLIENT_CONNECT,data:firstAuto},CommonConstants.SERVICE_TYPE_MQTT_CLIENTS);
                        } else {
                            console.log('❌ 没有找到可自动连接的客户端');
                        }
                    }
                }.bind(this);
                if(this._metaDb && this._metaDb.getItem) {
                    this._metaDb.getItem('LAST_USED_MCS_ID').then(function(lastId){
                        console.log('🔍 读取到上次使用的客户端ID:', lastId);
                        connectOnce(lastId);
                    }.bind(this)).catch(function(e){
                        console.log('❌ 读取上次使用客户端ID失败:', e);
                        connectOnce(null);
                    }.bind(this));
                } else {
                    console.log('⚠️ 元数据库不可用，使用fallback逻辑');
                    connectOnce(null);
                }
                this.emitChange(MqttClientConstants.EVENT_MQTT_CLIENT_DATA_CHANGED,mqttClientList[0].mcsId);
            }
        }.bind(this))
        .done();
    }

    syncMqttClientStateCache(connStateObj) { 
        try { console.log('[UI-Store] syncMqttClientStateCache in:', connStateObj); } catch(_) {}
        var currentState = this.mqttClientsStatus[connStateObj.mcsId];
        if(currentState==null || currentState!=connStateObj.connState) {
            this.mqttClientsStatus[connStateObj.mcsId] = connStateObj.connState;
            try { console.log('[UI-Store] state updated to', connStateObj.connState, 'for', connStateObj.mcsId); } catch(_) {}
            this.emitChange(MqttClientConstants.EVENT_MQTT_CLIENT_CONN_STATE_CHANGED,connStateObj);
            // 记录最近使用，用于下次启动仅自动连接最后一次成功的客户端
            try {
                if (this._metaDb && connStateObj.connState === MqttClientConstants.CONNECTION_STATE_CONNECTED) {
                    console.log('💾 保存最后使用的客户端ID:', connStateObj.mcsId);
                    this._metaDb.setItem('LAST_USED_MCS_ID', connStateObj.mcsId);
                }
            } catch(e) {
                console.error('❌ 保存最后使用客户端ID失败:', e);
            }

            var mqttClient = this.mqttClientSettings[connStateObj.mcsId];
            if(mqttClient!=null && mqttClient.subscribeSettings!=null && mqttClient.subscribeSettings.length>0) {
                for(var i=0;i<mqttClient.subscribeSettings.length;i++) {
                    var subSettings = mqttClient.subscribeSettings[i];
                    var mqttClientSubscribedData = this.mqttClientSubscribedData[connStateObj.mcsId+subSettings.subId];
                    if(mqttClientSubscribedData!=null && mqttClientSubscribedData.isSubscribed == true) {
                        this.unSubscribeToTopic({actionType: MqttClientConstants.ACTION_UN_SUBSCRIBE_TO_TOPIC, 
                        data: {mcsId:connStateObj.mcsId,subId:subSettings.subId,topic:subSettings.topic} });
                    }
                }
            }
        }
    }

    getAllMqttClientStates() { 
        return this.mqttClientsStatus;
    }

    getMqttClientStateByMcsId(mcsId) { 
        return this.mqttClientsStatus[mcsId];
    }

    emitChange(event,data) { 
        this.emit(event,data);
    }

    addChangeListener(event,callback) { 
        this.on(event,callback);
    }

    removeChangeListener(event,callback) { 
        this.removeListener(event,callback);
    }

    getAllMqttClientSettings() { 
        return _.values(this.mqttClientSettings);
    }

    getMqttClientSettingsByMcsId(mcsId) {
        return this.mqttClientSettings[mcsId];
    }

    saveMqttClientSettings(data) { 
        var dbClientSettingsObj = this.mqttClientSettings[data.mcsId];
        if(dbClientSettingsObj==null) {
            dbClientSettingsObj = new MqttClientSettings();
            dbClientSettingsObj.mcsId = data.mcsId;
            dbClientSettingsObj.createdOn = +(new Date());
            dbClientSettingsObj.publishSettings.push(new PublisherSettings());
            dbClientSettingsObj.subscribeSettings.push(new SubscriberSettings());
        }

        dbClientSettingsObj.protocol = data.protocol;
        dbClientSettingsObj.host = data.host;
        dbClientSettingsObj.mqtt311Compliant = data.mqtt311Compliant;
        dbClientSettingsObj.keepalive = data.keepalive;
        dbClientSettingsObj.reschedulePings = data.reschedulePings;
        dbClientSettingsObj.mqttClientId = data.mqttClientId;
        dbClientSettingsObj.timestampClientId = data.timestampClientId;
        dbClientSettingsObj.protocolId = data.protocolId;
        dbClientSettingsObj.protocolVersion = data.protocolVersion;
        dbClientSettingsObj.clean = data.clean;
        dbClientSettingsObj.reconnectPeriod = data.reconnectPeriod;
        dbClientSettingsObj.connectTimeout = data.connectTimeout;
        dbClientSettingsObj.username = data.username;
        dbClientSettingsObj.password = data.password;
        dbClientSettingsObj.queueQoSZero = data.queueQoSZero;
        dbClientSettingsObj.willTopic = data.willTopic;
        dbClientSettingsObj.willPayload = data.willPayload;
        dbClientSettingsObj.willQos = data.willQos;
        dbClientSettingsObj.willRetain = data.willRetain;
        dbClientSettingsObj.mqttClientName = data.mqttClientName;
        dbClientSettingsObj.tag = data.tag;
        dbClientSettingsObj.autoConnectOnAppLaunch = data.autoConnectOnAppLaunch;
        dbClientSettingsObj.updatedOn = +(new Date());
        dbClientSettingsObj.sslTlsVersion = data.sslTlsVersion;
        dbClientSettingsObj.certificateType = data.certificateType;
        dbClientSettingsObj.caFilePath = data.caFilePath;
        dbClientSettingsObj.caFile = data.caFile;
        dbClientSettingsObj.clientCertificateFilePath = data.clientCertificateFilePath;
        dbClientSettingsObj.clientCertificateFile = data.clientCertificateFile;
        dbClientSettingsObj.clientKeyFilePath = data.clientKeyFilePath;
        dbClientSettingsObj.clientKeyFile = data.clientKeyFile;
        dbClientSettingsObj.clientKeyPassphrase = data.clientKeyPassphrase;

        this.mqttClientSettings[data.mcsId] = dbClientSettingsObj;
        MqttClientDbService.saveMqttClientSettings(dbClientSettingsObj);
        PlatformDispatcherService.dispatcherAction({actionType: MqttClientConstants.ACTION_MQTT_CLIENT_CONNECT,data:dbClientSettingsObj},CommonConstants.SERVICE_TYPE_MQTT_CLIENTS);
        this.markAsUnSubscribed(dbClientSettingsObj.mcsId);
        this.emitChange(MqttClientConstants.EVENT_MQTT_CLIENT_DATA_CHANGED,dbClientSettingsObj.mcsId);
    }

    markAsUnSubscribed(mcsId) {
        var mqttClient = this.mqttClientSettings[mcsId];
        if(mqttClient!=null && mqttClient.subscribeSettings!=null && mqttClient.subscribeSettings.length>0) {
            for(var i=0;i<mqttClient.subscribeSettings.length;i++) {
                if(this.mqttClientSubscribedData[mcsId+mqttClient.subscribeSettings[i].subId]!=null) {
                    this.mqttClientSubscribedData[mcsId+mqttClient.subscribeSettings[i].subId].isSubscribed = false;
                }
            }
        }
    }

    clearMqttClientPubSubCache(mcsId) {
        var mqttClient = this.mqttClientSettings[mcsId];
        if(mqttClient!=null && mqttClient.publishSettings!=null && mqttClient.publishSettings.length>0) {
            for(var i=0;i<mqttClient.publishSettings.length;i++) {
                delete this.mqttClientPublishedMessages[mcsId+mqttClient.publishSettings[i].pubId];
            }
        }
        if(mqttClient!=null && mqttClient.subscribeSettings!=null && mqttClient.subscribeSettings.length>0) {
            for(var i=0;i<mqttClient.subscribeSettings.length;i++) {
                delete this.mqttClientSubscribedData[mcsId+mqttClient.subscribeSettings[i].subId];
            }
        }
    }

    deleteMqttClientSettings(mcsId) { 
        MqttClientDbService.deleteMqttClientSettingsById(mcsId);
        PlatformDispatcherService.dispatcherAction({actionType: MqttClientConstants.ACTION_MQTT_CLIENT_DISCONNECT,data:mcsId},CommonConstants.SERVICE_TYPE_MQTT_CLIENTS);
        this.clearMqttClientPubSubCache(mcsId);
        delete this.mqttClientSettings[mcsId];
        delete this.mqttClientsStatus[mcsId];
        this.emitChange(MqttClientConstants.EVENT_MQTT_CLIENT_DATA_CHANGED,mcsId);
    }

    disconnectMqttClient(action) { 
        PlatformDispatcherService.dispatcherAction(action,CommonConstants.SERVICE_TYPE_MQTT_CLIENTS);
        this.markAsUnSubscribed(action.data);
        delete this.mqttClientsStatus[action.data];
        this.emitChange(MqttClientConstants.EVENT_MQTT_CLIENT_DATA_CHANGED,action.data);
    }

    savePublisherSettings(mcsId,publisher) { 
        var obj = this.mqttClientSettings[mcsId];
        if(obj!=null && publisher!=null) {
            var isNew = false;
            publisher.updatedOn = +(new Date());
            var pubIndex = _.findIndex(obj.publishSettings,{'pubId':publisher.pubId});

            if(pubIndex!=-1) {
                obj.publishSettings[pubIndex] = publisher;
            } else {
                isNew = true;
                obj.publishSettings.push(publisher);
            }

            if(isNew === true) {
                this.emitChange(MqttClientConstants.EVENT_MQTT_CLIENT_DATA_CHANGED,mcsId);
            }
            MqttClientDbService.saveMqttClientSettings(obj);
        }
    }

    deletePublisherSettings(mcsId,pubId) {
        var obj = this.mqttClientSettings[mcsId];
        if(obj!=null && obj.publishSettings!=null && obj.publishSettings.length>0) {
            var pubIndex = _.findIndex(obj.publishSettings,{'pubId':pubId});
            if (pubIndex > -1) {
                obj.publishSettings.splice(pubIndex, 1);
                 MqttClientDbService.saveMqttClientSettings(obj);
                 delete this.mqttClientPublishedMessages[mcsId+pubId];
                 this.emitChange(MqttClientConstants.EVENT_MQTT_CLIENT_DATA_CHANGED,mcsId);
            }
        }
    }

    publishMessage(action) {
        PlatformDispatcherService.dispatcherAction(action,CommonConstants.SERVICE_TYPE_MQTT_CLIENTS);
    }

    getPublishedMessages(mcsId,pubId) {
        var pubMess = this.mqttClientPublishedMessages[mcsId+pubId];
        if(pubMess==null || pubMess.length<=0) {
            return [];
        } else {
            return pubMess.slice(Math.max(pubMess.length-20, 0));
        }

    }

    getAllPublishedMessages(mcsId,pubId) {
        var pubMess = this.mqttClientPublishedMessages[mcsId+pubId];
        if(pubMess==null || pubMess.length<=0) {
            return [];
        } else {
            return pubMess;
        }
    }

    saveSubscriberSettings(mcsId,subscriber) { 
        var obj = this.mqttClientSettings[mcsId];

        if(obj!=null && subscriber!=null) {
            var isNew = false;
            subscriber.updatedOn = +(new Date());
            var subIndex = _.findIndex(obj.subscribeSettings,{'subId':subscriber.subId});
            if(subIndex!=-1) {
                obj.subscribeSettings[subIndex] = subscriber;
            } else {
                isNew = true;
                obj.subscribeSettings.push(subscriber);
            }

            if(isNew === true) {
                this.emitChange(MqttClientConstants.EVENT_MQTT_CLIENT_DATA_CHANGED,mcsId);
            }
             MqttClientDbService.saveMqttClientSettings(obj);
        }
    }

    deleteSubscriberSettings(mcsId,subId) {
        var obj = this.mqttClientSettings[mcsId];
        if(obj!=null && obj.subscribeSettings!=null && obj.subscribeSettings.length>0) {
            var subIndex = _.findIndex(obj.subscribeSettings,{'subId':subId});
            if (subIndex > -1) {
                obj.subscribeSettings.splice(subIndex, 1);
                MqttClientDbService.saveMqttClientSettings(obj);
                delete this.mqttClientSubscribedData[mcsId+subId];
                this.emitChange(MqttClientConstants.EVENT_MQTT_CLIENT_DATA_CHANGED,mcsId);
            }
        }
    }

    subscribeToTopic(action) {
        this.mqttClientSubscribedData[action.data.mcsId+action.data.subId] = {mcsId:action.data.mcsId,subId:action.data.subId,isSubscribed:true,topic:action.data.topic,receivedMessages:[]};
        PlatformDispatcherService.dispatcherAction(action,CommonConstants.SERVICE_TYPE_MQTT_CLIENTS);
        this.emitChange(MqttClientConstants.EVENT_MQTT_CLIENT_SUBSCRIBED_DATA_RECIEVED,{mcsId:action.data.mcsId,subId:action.data.subId});
    }

    unSubscribeToTopic(action) {
        _.forOwn(this.mqttClientSubscribedData, function(subData, key) {
            if(subData!=null && subData.topic==action.data.topic && subData.mcsId==action.data.mcsId) {
                if(this.mqttClientSubscribedData[action.data.mcsId+subData.subId]!=null) {
                    this.mqttClientSubscribedData[action.data.mcsId+subData.subId].isSubscribed = false;
                    this.emitChange(MqttClientConstants.EVENT_MQTT_CLIENT_SUBSCRIBED_DATA_RECIEVED,{mcsId:action.data.mcsId,subId:subData.subId});
                }
            }
        }.bind(this));
        PlatformDispatcherService.dispatcherAction(action,CommonConstants.SERVICE_TYPE_MQTT_CLIENTS);
    }

    getSubscribedData(mcsId,subId) {
        return this.mqttClientSubscribedData[mcsId+subId];
    }

    syncMqttClientSubscribedData(data) { 
        _.forOwn(this.mqttClientSubscribedData, function(subData, key) {
            var incomingTopic = (data.topic||'').trim();
            var subTopic = (subData && subData.topic ? (''+subData.topic).trim() : '');
            if(subData!=null && subTopic == incomingTopic && subData.mcsId == data.mcsId && subData.isSubscribed==true) {
                if(subData.receivedMessages == null) {
                    subData.receivedMessages = [];
                }
                subData.receivedMessages.push({message:data.message,packet:data.packet});
                if(subData.receivedMessages.length>20) {
                    subData.receivedMessages.shift();
                }
                this.emitChange(MqttClientConstants.EVENT_MQTT_CLIENT_SUBSCRIBED_DATA_RECIEVED,{mcsId:subData.mcsId,subId:subData.subId});
            }
        }.bind(this));
    }
}

export default new MqttClientService();