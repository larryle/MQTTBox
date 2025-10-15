import Events from 'events';
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

        this.registerToAppDispatcher();
        
        // Load data immediately without migration delays
        console.log('[MqttClientService] Starting initial data load...');
        this.syncMqttClientSettingsCache();
        
        // Expose MqttClientActions for v0.2.1 compatibility
        this.setupV021Compatibility();
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
                // Deduplicate by name+host+protocol, but prefer versions with more publishers
                var latestByKey = {};
                var orderVal = function(x){ return (x && x.updatedOn) || (x && x.createdOn) || 0; };
                var publisherCount = function(x){ return (x && x.publishSettings && x.publishSettings.length) || 0; };
                for(var j=0;j<mqttClientList.length;j++){
                    var c = mqttClientList[j];
                    if(!c) continue;
                    var key = (c.mqttClientName||'')+'|'+(c.host||'')+'|'+(c.protocol||'');
                    if(!latestByKey[key] || 
                       orderVal(c) > orderVal(latestByKey[key]) || 
                       (orderVal(c) === orderVal(latestByKey[key]) && publisherCount(c) > publisherCount(latestByKey[key]))){
                        console.log('[MqttClientService] Selecting client version:', c.mqttClientName, 'Publishers:', publisherCount(c), 'Updated:', orderVal(c));
                        latestByKey[key] = c;
                    }
                }

                this.mqttClientSettings = {};
                var firstId = null;
                for (var k in latestByKey){
                    var mqttClientObj = latestByKey[k];
                    if(mqttClientObj!=null && mqttClientObj.mcsId!=null) {
                        if(firstId==null) firstId = mqttClientObj.mcsId;
                        this.mqttClientSettings[mqttClientObj.mcsId] = mqttClientObj;
                        
                        // Debug: Check publisher count for each client
                        console.log('[MqttClientService] Loaded client:', mqttClientObj.mqttClientName, 'Publishers:', mqttClientObj.publishSettings ? mqttClientObj.publishSettings.length : 0);
                        if(mqttClientObj.publishSettings && mqttClientObj.publishSettings.length > 0) {
                            console.log('[MqttClientService] Publisher IDs:', mqttClientObj.publishSettings.map(p => p.pubId));
                        }
                        
                        if(mqttClientObj.autoConnectOnAppLaunch == true) {
                            PlatformDispatcherService.dispatcherAction({actionType: MqttClientConstants.ACTION_MQTT_CLIENT_CONNECT,data:mqttClientObj},CommonConstants.SERVICE_TYPE_MQTT_CLIENTS);
                        }
                    }
                }
                this.emitChange(MqttClientConstants.EVENT_MQTT_CLIENT_DATA_CHANGED, firstId);
            }
        }.bind(this));
    }

    syncMqttClientStateCache(connStateObj) { 
        var currentState = this.mqttClientsStatus[connStateObj.mcsId];
        if(currentState==null || currentState!=connStateObj.connState) {
            this.mqttClientsStatus[connStateObj.mcsId] = connStateObj.connState;
            this.emitChange(MqttClientConstants.EVENT_MQTT_CLIENT_CONN_STATE_CHANGED,connStateObj);

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
        dbClientSettingsObj.willTopic = data.willTopic || '';
        dbClientSettingsObj.willPayload = (data.willPayload!=null) ? (''+data.willPayload) : '';
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
        MqttClientDbService.deleteMqttClientSettingsById(mcsId).then(() => {
            PlatformDispatcherService.dispatcherAction({actionType: MqttClientConstants.ACTION_MQTT_CLIENT_DISCONNECT,data:mcsId},CommonConstants.SERVICE_TYPE_MQTT_CLIENTS);
            this.clearMqttClientPubSubCache(mcsId);
            delete this.mqttClientSettings[mcsId];
            delete this.mqttClientsStatus[mcsId];
            this.emitChange(MqttClientConstants.EVENT_MQTT_CLIENT_DATA_CHANGED,mcsId);
        }).catch((error) => {
            console.error('[MqttClientService] Error deleting client from database:', mcsId, error);
        });
    }

    disconnectMqttClient(action) { 
        PlatformDispatcherService.dispatcherAction(action,CommonConstants.SERVICE_TYPE_MQTT_CLIENTS);
        this.markAsUnSubscribed(action.data);
        delete this.mqttClientsStatus[action.data];
        this.emitChange(MqttClientConstants.EVENT_MQTT_CLIENT_DATA_CHANGED,action.data);
    }

    savePublisherSettings(mcsId,publisher) { 
        console.log('[MqttClientService] savePublisherSettings called for:', mcsId, 'publisher:', publisher.pubId);
        var obj = this.mqttClientSettings[mcsId];
        if(obj!=null && publisher!=null) {
            var isNew = false;
            publisher.updatedOn = +(new Date());
            var pubIndex = _.findIndex(obj.publishSettings,{'pubId':publisher.pubId});

            if(pubIndex!=-1) {
                obj.publishSettings[pubIndex] = publisher;
                console.log('[MqttClientService] Updated existing publisher at index:', pubIndex);
            } else {
                isNew = true;
                obj.publishSettings.push(publisher);
                console.log('[MqttClientService] Added new publisher, total publishers:', obj.publishSettings.length);
            }

            if(isNew === true) {
                this.emitChange(MqttClientConstants.EVENT_MQTT_CLIENT_DATA_CHANGED,mcsId);
            }
            console.log('[MqttClientService] Saving to database, total publishers:', obj.publishSettings.length);
            MqttClientDbService.saveMqttClientSettings(obj).then(() => {
                console.log('[MqttClientService] Database save completed for publisher:', publisher.pubId);
            }).catch((error) => {
                console.error('[MqttClientService] Database save failed:', error);
            });
        } else {
            console.log('[MqttClientService] Cannot save publisher - obj:', !!obj, 'publisher:', !!publisher);
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
            if(subData!=null && subData.topic == data.topic && subData.mcsId == data.mcsId && subData.isSubscribed==true) {
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

    // v0.2.1 compatibility methods
    setupV021Compatibility() {
        // Expose MqttClientActions on window for v0.2.1 compatibility
        if (typeof window !== 'undefined') {
            window.MqttClientActions = {
                loadAllMqttClients: () => {
                    console.log('[MqttClientService] v0.2.1 compatibility: reloading clients...');
                    this.syncMqttClientSettingsCache();
                }
            };
            console.log('[MqttClientService] v0.2.1 compatibility setup complete');
        }
    }
}

export default new MqttClientService();