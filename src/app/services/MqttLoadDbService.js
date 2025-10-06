import localforage from 'localforage';
import _ from 'lodash';

class MqttLoadDbService {  

    constructor() {
        try {
            this.loadSettingsDb = localforage.createInstance({name:"MQTT_LOAD_SETTINGS",driver: localforage.LOCALSTORAGE});
            this.loadInstanceDataDb = localforage.createInstance({name:"MQTT_LOAD_INSTANCE_DATA",driver: localforage.LOCALSTORAGE});
        } catch(e) {
            this.loadSettingsDb = null;
            this.loadInstanceDataDb = null;
        }

        // Fallback to window.localStorage wrapper
        if(!this.loadSettingsDb || !this.loadSettingsDb.setItem) {
            try {
                const storage = window && window.localStorage ? window.localStorage : null;
                if(storage) {
                    this.loadSettingsDb = {
                        setItem: function(key, value){ storage.setItem(key, JSON.stringify(value)); return Promise.resolve(); },
                        getItem: function(key){ const v = storage.getItem(key); return Promise.resolve(v?JSON.parse(v):null); },
                        removeItem: function(key){ storage.removeItem(key); return Promise.resolve(); },
                        iterate: function(iterator){ for(let i=0;i<storage.length;i++){ const k=storage.key(i); if(!k) continue; try{ const v=JSON.parse(storage.getItem(k)); iterator(v,k,i+1);}catch(_){} } return Promise.resolve(); }
                    };
                }
            } catch(_) {}
        }

        if(!this.loadInstanceDataDb || !this.loadInstanceDataDb.setItem) {
            try {
                const storage = window && window.localStorage ? window.localStorage : null;
                if(storage) {
                    this.loadInstanceDataDb = {
                        setItem: function(key, value){ storage.setItem(key, JSON.stringify(value)); return Promise.resolve(); },
                        getItem: function(key){ const v = storage.getItem(key); return Promise.resolve(v?JSON.parse(v):null); },
                        removeItem: function(key){ storage.removeItem(key); return Promise.resolve(); }
                    };
                }
            } catch(_) {}
        }
    }

    saveMqttLoadSettings(obj) { 
        if (!this.loadSettingsDb || !this.loadSettingsDb.setItem) return Promise.resolve();
        return this.loadSettingsDb.setItem(obj.mcsId, obj);
    }

    getAllMqttLoadSettings() { 
        var mqttLoadSettingsList = [];
        if (!this.loadSettingsDb || !this.loadSettingsDb.iterate) return Promise.resolve([]);
        return this.loadSettingsDb.iterate(function(value, key, iterationNumber) {
            mqttLoadSettingsList.push(value);
        }).then(function() {
            return _.sortBy(mqttLoadSettingsList, ['createdOn']);
        });
    }

    deleteMqttLoadSettingsById(mcsId) {
        if (!this.loadSettingsDb || !this.loadSettingsDb.removeItem) return Promise.resolve();
        return this.loadSettingsDb.removeItem(mcsId);
    }

    deleteMqttLoadDataByInstanceId(iId) {
        if (!this.loadInstanceDataDb || !this.loadInstanceDataDb.removeItem) return Promise.resolve();
        return this.loadInstanceDataDb.removeItem(iId);
    }

    getMqttLoadDataByIIds(iIds) {
        var mqttLoadData = [];
        var promises  = iIds.map(function(iId) {return this.loadInstanceDataDb.getItem(iId);}.bind(this));
        return Promise.all(promises);
    }

    saveMqttLoadArchiveDataByIId(iId,archiveData) {
        if(iId!=null && archiveData!=null && this.loadInstanceDataDb && this.loadInstanceDataDb.setItem) {
            return this.loadInstanceDataDb.setItem(iId, archiveData);
        }
        return Promise.resolve();
    }
}

export default new MqttLoadDbService();