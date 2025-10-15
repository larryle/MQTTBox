import localforage from 'localforage';
import MqttClientActions from '../actions/MqttClientActions';
import _ from 'lodash';

class MqttClientDbWorker { 

    constructor() {
        // Use IndexedDB to access existing data
        try {
            this.db = localforage.createInstance({
                name: "MQTT_CLIENT_SETTINGS",
                driver: localforage.INDEXEDDB
            });
        } catch(e) {
            console.error('[MqttClientDbService] Error creating localforage instance:', e);
            this.db = null;
        }

        // Auto-compatibility with v0.2.1 data
        this.setupV021Compatibility();

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
        
        // If primary store is empty, attempt one-time import from window.localStorage (older runs)
        try {
            if (this.db && this.db.length) {
                this.db.length().then(function(count){
                    if (count === 0 && typeof window !== 'undefined' && window.localStorage) {
                        try {
                            var imported = 0;
                            for (var i=0;i<window.localStorage.length;i++) {
                                var k = window.localStorage.key(i);
                                if(!k) continue;
                                try {
                                    var v = JSON.parse(window.localStorage.getItem(k));
                                    if (v && v.mcsId) {
                                        imported++;
                                        this.db.setItem(v.mcsId, v);
                                    }
                                } catch(_) {}
                            }
                            if (imported>0) {
                                try { console.log('[MqttClientDbService] Imported', imported, 'clients from localStorage'); } catch(_){ }
                            }
                        } catch(_) {}
                    }
                }.bind(this)).catch(function(){});
            }
        } catch(_) {}
    }

    saveMqttClientSettings(obj) {
        if (!this.db || !this.db.setItem) return Promise.resolve();
        return this.db.setItem(obj.mcsId, obj);
    }

    getAllMqttClientSettings() { 
        var mqttClientSettingsList = [];
        if (!this.db || !this.db.iterate) {
            return Promise.resolve([]);
        }
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
        if (!this.db || !this.db.removeItem) {
            return Promise.resolve();
        }
        return this.db.removeItem(mcsId);
    }

    // v0.2.1 compatibility methods
    setupV021Compatibility() {
        console.log('[MqttClientDbService] Setting up v0.2.1 compatibility...');
        
        // Check if we need to migrate from v0.2.1
        this.checkAndMigrateV021Data();
    }

    async checkAndMigrateV021Data() {
        try {
            // Check if current store is empty
            const currentCount = await this.getCurrentStoreCount();
            if (currentCount > 0) {
                console.log('[MqttClientDbService] Current store has data, skipping v0.2.1 migration');
                return;
            }

            // Try to find v0.2.1 data in localStorage
            const v021Data = this.findV021DataInLocalStorage();
            if (v021Data && v021Data.length > 0) {
                console.log(`[MqttClientDbService] Found ${v021Data.length} clients from v0.2.1, migrating...`);
                await this.migrateV021Data(v021Data);
            }
        } catch (error) {
            console.error('[MqttClientDbService] Error in v0.2.1 compatibility check:', error);
        }
    }

    async getCurrentStoreCount() {
        if (!this.db || !this.db.length) {
            return 0;
        }
        try {
            return await this.db.length();
        } catch (error) {
            console.error('[MqttClientDbService] Error getting store count:', error);
            return 0;
        }
    }

    findV021DataInLocalStorage() {
        if (!window || !window.localStorage) {
            return null;
        }

        const v021Clients = [];
        try {
            // Look for v0.2.1 client data in localStorage
            for (let i = 0; i < window.localStorage.length; i++) {
                const key = window.localStorage.key(i);
                if (!key) continue;

                try {
                    const value = JSON.parse(window.localStorage.getItem(key));
                    // Check if this looks like a v0.2.1 client
                    if (value && value.mcsId && value.mqttClientName) {
                        v021Clients.push(value);
                    }
                } catch (e) {
                    // Ignore non-JSON values
                }
            }
        } catch (error) {
            console.error('[MqttClientDbService] Error scanning localStorage:', error);
        }

        return v021Clients;
    }

    async migrateV021Data(v021Clients) {
        if (!this.db || !this.db.setItem) {
            console.error('[MqttClientDbService] Cannot migrate: database not available');
            return;
        }

        let migratedCount = 0;
        for (const client of v021Clients) {
            try {
                await this.db.setItem(client.mcsId, client);
                migratedCount++;
                console.log(`[MqttClientDbService] Migrated client: ${client.mqttClientName}`);
            } catch (error) {
                console.error(`[MqttClientDbService] Error migrating client ${client.mcsId}:`, error);
            }
        }

        if (migratedCount > 0) {
            console.log(`[MqttClientDbService] Successfully migrated ${migratedCount} clients from v0.2.1`);
            // Trigger a reload of the client list
            setTimeout(() => {
                if (window.MqttClientActions) {
                    window.MqttClientActions.loadAllMqttClients();
                }
            }, 100);
        }
    }

}

export default new MqttClientDbWorker();