import localforage from 'localforage';
import Q from 'q';
import _ from 'lodash';

class MqttClientDbWorker {  

    constructor() {
        try {
            var isElectron = typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.indexOf('Electron') !== -1;
            var driver = isElectron ? localforage.LOCALSTORAGE : localforage.INDEXEDDB;
            this.db = localforage.createInstance({ name: "MQTT_CLIENT_SETTINGS", driver: driver });
        } catch (e) {
            this.db = localforage.createInstance({ name: "MQTT_CLIENT_SETTINGS", driver: localforage.LOCALSTORAGE });
        }
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