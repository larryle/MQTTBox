import localforage from 'localforage';
import Q from 'q';
import _ from 'lodash';

class MqttLoadDbService {  

    constructor() {
        try {
            var isElectron = typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.indexOf('Electron') !== -1;
            var driver = isElectron ? localforage.LOCALSTORAGE : localforage.INDEXEDDB;
            this.loadSettingsDb = localforage.createInstance({ name: "MQTT_LOAD_SETTINGS", driver: driver });
            this.loadInstanceDataDb = localforage.createInstance({ name: "MQTT_LOAD_INSTANCE_DATA", driver: driver });
        } catch (e) {
            this.loadSettingsDb = localforage.createInstance({ name: "MQTT_LOAD_SETTINGS", driver: localforage.LOCALSTORAGE });
            this.loadInstanceDataDb = localforage.createInstance({ name: "MQTT_LOAD_INSTANCE_DATA", driver: localforage.LOCALSTORAGE });
        }
    }

    saveMqttLoadSettings(obj) { 
        Q.invoke(this.loadSettingsDb,'setItem',obj.mcsId,obj).done();
    }

    getAllMqttLoadSettings() { 
        var me =this;
        var mqttLoadSettingsList = [];
        return Q.invoke(this.loadSettingsDb,'iterate',
            function(value, key, iterationNumber) {
                mqttLoadSettingsList.push(value);
            }
        ).then(function() {
            return _.sortBy(mqttLoadSettingsList, ['createdOn']);
        });
    }

    deleteMqttLoadSettingsById(mcsId) {
        return Q.invoke(this.loadSettingsDb,'removeItem',mcsId).done();
    }

    deleteMqttLoadDataByInstanceId(iId) {
        return Q.invoke(this.loadInstanceDataDb,'removeItem',iId).done();
    }

    getMqttLoadDataByIIds(iIds) {
        var mqttLoadData = [];
        var promises  = iIds.map(function(iId) {return this.loadInstanceDataDb.getItem(iId);}.bind(this));
        return Promise.all(promises);
    }

    saveMqttLoadArchiveDataByIId(iId,archiveData) {
        if(iId!=null && archiveData!=null) {
            Q.invoke(this.loadInstanceDataDb,'setItem',iId,archiveData).done();
        }
    }
}

export default new MqttLoadDbService();