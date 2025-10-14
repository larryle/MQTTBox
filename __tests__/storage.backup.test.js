/**
 * Storage Backup and Recovery Tests
 * Test read-only backup and recovery mechanism
 */

describe('Storage Backup and Recovery', () => {
  let MqttClientDbService;

  beforeAll(() => {
    // Clear module cache
    jest.resetModules();
    
    // Mock Electron environment
    global.process = {
      versions: { electron: 'v22.3.27' },
      platform: 'darwin',
      arch: 'x64',
      env: { NODE_ENV: 'test' }
    };
    
    // Mock localStorage with backup data
    const backupData = JSON.stringify([
      {
        mcsId: 'backup-client-1',
        mqttClientName: 'Backup Client 1',
        host: 'backup1.example.com:1883',
        protocol: 'mqtt',
        willTopic: 'backup/will1',
        willPayload: 'backup message 1',
        willQos: 0,
        willRetain: false,
        publishSettings: [],
        subscribeSettings: []
      },
      {
        mcsId: 'backup-client-2',
        mqttClientName: 'Backup Client 2',
        host: 'backup2.example.com:8883',
        protocol: 'mqtts',
        willTopic: 'backup/will2',
        willPayload: 'backup message 2',
        willQos: 1,
        willRetain: true,
        publishSettings: [],
        subscribeSettings: []
      }
    ]);

    global.window = {
      localStorage: {
        getItem: jest.fn((key) => {
          if (key === 'MQTT_CLIENT_SETTINGS_BACKUP') {
            return backupData;
          }
          return null;
        }),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        key: jest.fn(),
        length: 0
      }
    };

    // Mock localforage with empty main store
    const mockLocalforage = {
      createInstance: jest.fn(() => ({
        setItem: jest.fn(() => Promise.resolve()),
        getItem: jest.fn(() => Promise.resolve(null)),
        removeItem: jest.fn(() => Promise.resolve()),
        iterate: jest.fn(() => Promise.resolve()),
        length: jest.fn(() => Promise.resolve(0)),
        config: {
          name: 'MQTT_CLIENT_SETTINGS',
          driver: 'LOCALSTORAGE'
        }
      })),
      LOCALSTORAGE: 'LOCALSTORAGE'
    };

    jest.doMock('localforage', () => mockLocalforage);
    
    // Import after mocking
    MqttClientDbService = require('../src/app/services/MqttClientDbService');
  });

  afterAll(() => {
    jest.resetModules();
  });

  test('should detect when main store is empty', async () => {
    const count = await MqttClientDbService.db.length();
    expect(count).toBe(0);
  });

  test('should be able to read backup data', () => {
    const backupData = window.localStorage.getItem('MQTT_CLIENT_SETTINGS_BACKUP');
    expect(backupData).toBeDefined();
    
    const parsed = JSON.parse(backupData);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(2);
    
    // Verify backup data structure
    parsed.forEach(client => {
      expect(client.mcsId).toBeDefined();
      expect(client.mqttClientName).toBeDefined();
      expect(client.host).toBeDefined();
      expect(client.protocol).toBeDefined();
      expect(client.willTopic).toBeDefined();
      expect(client.willPayload).toBeDefined();
      expect(typeof client.willQos).toBe('number');
      expect(typeof client.willRetain).toBe('boolean');
    });
  });

  test('should be able to restore from backup', async () => {
    const backupData = window.localStorage.getItem('MQTT_CLIENT_SETTINGS_BACKUP');
    const clients = JSON.parse(backupData);
    
    // Simulate recovery process
    for (const client of clients) {
      await MqttClientDbService.saveMqttClientSettings(client);
    }
    
    // Verify restored data
    const restoredClients = await MqttClientDbService.getAllMqttClientSettings();
    expect(restoredClients).toHaveLength(2);
    
    const client1 = restoredClients.find(c => c.mcsId === 'backup-client-1');
    expect(client1).toBeDefined();
    expect(client1.mqttClientName).toBe('Backup Client 1');
    
    const client2 = restoredClients.find(c => c.mcsId === 'backup-client-2');
    expect(client2).toBeDefined();
    expect(client2.mqttClientName).toBe('Backup Client 2');
  });

  test('should handle backup data validation', () => {
    const backupData = window.localStorage.getItem('MQTT_CLIENT_SETTINGS_BACKUP');
    const clients = JSON.parse(backupData);
    
    // Verify each client has necessary fields
    clients.forEach(client => {
      expect(client.mcsId).toBeTruthy();
      expect(client.mqttClientName).toBeTruthy();
      expect(client.host).toBeTruthy();
      expect(client.protocol).toBeTruthy();
      
      // will fields should have default values
      expect(client.willTopic).toBeDefined();
      expect(client.willPayload).toBeDefined();
      expect(typeof client.willQos).toBe('number');
      expect(typeof client.willRetain).toBe('boolean');
    });
  });
});
