import localforage from 'localforage';
import MqttClientActions from '../actions/MqttClientActions';
import _ from 'lodash';

class MqttClientDbWorker { 

    constructor() {
        // Prefer LocalStorage in Electron to avoid IndexedDB/WebSQL driver issues
        try {
            this.db = localforage.createInstance({
                name:"MQTT_CLIENT_SETTINGS",
                driver: localforage.LOCALSTORAGE
            });
        } catch(e) {
            this.db = null;
        }

        // Fallback to window.localStorage if localforage drivers are not available
        if(!this.db || !this.db.setItem) {
            try {
                const storage = window && window.localStorage ? window.localStorage : null;
                if(storage) {
                    this.db = {
                        setItem: function(key, value){
                            storage.setItem(key, JSON.stringify(value));
                            return Promise.resolve();
                        },
                        getItem: function(key){
                            const v = storage.getItem(key);
                            return Promise.resolve(v ? JSON.parse(v) : null);
                        },
                        removeItem: function(key){
                            storage.removeItem(key);
                            return Promise.resolve();
                        },
                        iterate: function(iterator){
                            for (let i = 0; i < storage.length; i++) {
                                const k = storage.key(i);
                                if(!k) continue;
                                try {
                                    const v = JSON.parse(storage.getItem(k));
                                    iterator(v, k, i+1);
                                } catch(_) {}
                            }
                            return Promise.resolve();
                        }
                    };
                }
            } catch(_) {}
        }
        try {
            // Listen for migration payload from main process (Electron)
            const electron = require('electron');
            if (electron && electron.ipcRenderer) {
                electron.ipcRenderer.on('migration-data', function(event, payload){
                    if(payload && payload.service==='MQTT_CLIENT_SETTINGS' && Array.isArray(payload.items)){
                        for(var i=0;i<payload.items.length;i++){
                            (function(item){
                                if(!(item && item.mcsId)) return;
                                // Map legacy nested will -> top-level
                                try {
                                    if (item.will && typeof item.will === 'object') {
                                        if (item.willTopic == null && item.will.topic != null) item.willTopic = item.will.topic;
                                        if (item.willPayload == null && item.will.payload != null) item.willPayload = '' + item.will.payload;
                                        if (item.willQos == null && item.will.qos != null) item.willQos = item.will.qos;
                                        if (item.willRetain == null && item.will.retain != null) item.willRetain = !!item.will.retain;
                                    }
                                    if (item.willPayload == null) item.willPayload = '';
                                    if (item.willTopic == null) item.willTopic = '';
                                    if (item.willQos == null) item.willQos = 0;
                                    if (item.willRetain == null) item.willRetain = false;
                                } catch(_) {}

                                // Skip if already exists (by mcsId)
                                try {
                                    if (this.db && this.db.getItem) {
                                        this.db.getItem(item.mcsId).then(function(existing){
                                            if (existing) return; // already present, skip
                                            try { MqttClientActions.saveMqttClientSettings(item); } catch(_) {}
                                        }.bind(this)).catch(function(){
                                            try { MqttClientActions.saveMqttClientSettings(item); } catch(_) {}
                                        });
                                    } else {
                                        try { MqttClientActions.saveMqttClientSettings(item); } catch(_) {}
                                    }
                                } catch(_) {
                                    try { MqttClientActions.saveMqttClientSettings(item); } catch(_) {}
                                }
                            }.bind(this))(payload.items[i]);
                        }
                    }
                }.bind(this));
            }
        } catch(e) {}

        // Best-effort: one-time merge from IndexedDB instance (older data)
        // Disable auto-merge to avoid creating duplicates
        // (kept here commented intentionally for potential manual migration)
    }

    saveMqttClientSettings(obj) { 
        if (!this.db || !this.db.setItem) return Promise.resolve();
        return this.db.setItem(obj.mcsId, obj);
    }

    getAllMqttClientSettings() { 
        var mqttClientSettingsList = [];
        if (!this.db || !this.db.iterate) return Promise.resolve([]);
        return this.db.iterate(function(value, key, iterationNumber) {
            if (value && typeof value === 'object') {
                // Normalize will fields to avoid undefined/null issues
                // Map nested 'will' object if present (older data shapes)
                if (value.will && typeof value.will === 'object') {
                    if (value.willTopic == null && value.will.topic != null) value.willTopic = value.will.topic;
                    if (value.willPayload == null && value.will.payload != null) value.willPayload = value.will.payload;
                    if (value.willQos == null && value.will.qos != null) value.willQos = value.will.qos;
                    if (value.willRetain == null && value.will.retain != null) value.willRetain = !!value.will.retain;
                }
                if (value.willPayload == null) value.willPayload = '';
                if (value.willTopic == null) value.willTopic = '';
                if (value.willQos == null) value.willQos = 0;
                if (value.willRetain == null) value.willRetain = false;
                // Coerce payload to string
                if (typeof value.willPayload !== 'string') {
                    try { value.willPayload = '' + value.willPayload; } catch(_) { value.willPayload = ''; }
                }
            }
            mqttClientSettingsList.push(value);
        }).then(function() {
            return _.sortBy(mqttClientSettingsList, ['createdOn']);
        });
    }

    deleteMqttClientSettingsById(mcsId) {
        if (!this.db || !this.db.removeItem) return Promise.resolve();
        return this.db.removeItem(mcsId);
    }
}

export default new MqttClientDbWorker();