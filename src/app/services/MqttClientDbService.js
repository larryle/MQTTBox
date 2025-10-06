import localforage from 'localforage';
import MqttClientActions from '../actions/MqttClientActions';
import Q from 'q';
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
                            var item = payload.items[i];
                            if(item && item.mcsId){
                                try { MqttClientActions.saveMqttClientSettings(item); } catch(_) {}
                            }
                        }
                    }
                }.bind(this));
            }
        } catch(e) {}
    }

    saveMqttClientSettings(obj) { 
        Q.invoke(this.db,'setItem',obj.mcsId,obj).done();
    }

    getAllMqttClientSettings() { 
        var me =this;
        var mqttClientSettingsList = [];
        return Q.invoke(this.db,'iterate',
            function(value, key, iterationNumber) {
                mqttClientSettingsList.push(value);
            }
        ).then(function() {
            return _.sortBy(mqttClientSettingsList, ['createdOn']);
        });
    }

    deleteMqttClientSettingsById(mcsId) {
        return Q.invoke(this.db,'removeItem',mcsId).done();
    }
}

export default new MqttClientDbWorker();