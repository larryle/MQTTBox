/**
 * Storage Data Integrity Tests
 * Ensure data structure integrity and compatibility
 */

describe('Storage Data Integrity', () => {
  let MqttClientDbService;
  let MqttClientService;

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
    
    // Mock localStorage with test data
    const testData = {
      'test-client-1': JSON.stringify({
        mcsId: 'test-client-1',
        mqttClientName: 'Test Client 1',
        host: 'test.example.com:1883',
        protocol: 'mqtt',
        willTopic: 'test/will',
        willPayload: 'test message',
        willQos: 1,
        willRetain: false,
        publishSettings: [],
        subscribeSettings: []
      }),
      'test-client-2': JSON.stringify({
        mcsId: 'test-client-2',
        mqttClientName: 'Test Client 2',
        host: 'test2.example.com:8883',
        protocol: 'mqtts',
        // Test legacy nested will structure
        will: {
          topic: 'legacy/will',
          payload: 'legacy message',
          qos: 0,
          retain: true
        },
        publishSettings: [],
        subscribeSettings: []
      })
    };

    global.window = {
      localStorage: {
        getItem: jest.fn((key) => testData[key] || null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        key: jest.fn((index) => Object.keys(testData)[index] || null),
        length: Object.keys(testData).length
      }
    };

    // Mock localforage with test data
    const mockLocalforage = {
      createInstance: jest.fn(() => ({
        setItem: jest.fn(() => Promise.resolve()),
        getItem: jest.fn((key) => Promise.resolve(testData[key] ? JSON.parse(testData[key]) : null)),
        removeItem: jest.fn(() => Promise.resolve()),
        iterate: jest.fn((iterator) => {
          Object.values(testData).forEach((value, index) => {
            const parsed = JSON.parse(value);
            iterator(parsed, Object.keys(testData)[index], index + 1);
          });
          return Promise.resolve();
        }),
        length: jest.fn(() => Promise.resolve(Object.keys(testData).length)),
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
    MqttClientService = require('../src/app/services/MqttClientService');
  });

  afterAll(() => {
    jest.resetModules();
  });

  test('should read and normalize client data correctly', async () => {
    const clients = await MqttClientDbService.getAllMqttClientSettings();
    
    expect(clients).toHaveLength(2);
    
    // Check first client (standard structure)
    const client1 = clients.find(c => c.mcsId === 'test-client-1');
    expect(client1).toBeDefined();
    expect(client1.mqttClientName).toBe('Test Client 1');
    expect(client1.willTopic).toBe('test/will');
    expect(client1.willPayload).toBe('test message');
    expect(client1.willQos).toBe(1);
    expect(client1.willRetain).toBe(false);

    // Check second client (legacy nested structure)
    const client2 = clients.find(c => c.mcsId === 'test-client-2');
    expect(client2).toBeDefined();
    expect(client2.mqttClientName).toBe('Test Client 2');
    // Should expand nested will to top level
    expect(client2.willTopic).toBe('legacy/will');
    expect(client2.willPayload).toBe('legacy message');
    expect(client2.willQos).toBe(0);
    expect(client2.willRetain).toBe(true);
  });

  test('should handle missing will fields gracefully', async () => {
    const clients = await MqttClientDbService.getAllMqttClientSettings();
    
    clients.forEach(client => {
      // Ensure all will fields have default values
      expect(client.willTopic).toBeDefined();
      expect(client.willPayload).toBeDefined();
      expect(typeof client.willQos).toBe('number');
      expect(typeof client.willRetain).toBe('boolean');
    });
  });

  test('should maintain data consistency after save/read cycle', async () => {
    const testClient = {
      mcsId: 'test-consistency',
      mqttClientName: 'Consistency Test',
      host: 'consistency.test:1883',
      protocol: 'mqtt',
      willTopic: 'test/consistency',
      willPayload: 'consistency message',
      willQos: 2,
      willRetain: true,
      publishSettings: [],
      subscribeSettings: []
    };

    // Save
    await MqttClientDbService.saveMqttClientSettings(testClient);
    
    // Read
    const savedClient = await MqttClientDbService.db.getItem(testClient.mcsId);
    
    expect(savedClient).toBeDefined();
    expect(savedClient.mcsId).toBe(testClient.mcsId);
    expect(savedClient.mqttClientName).toBe(testClient.mqttClientName);
    expect(savedClient.willTopic).toBe(testClient.willTopic);
    expect(savedClient.willPayload).toBe(testClient.willPayload);
    expect(savedClient.willQos).toBe(testClient.willQos);
    expect(savedClient.willRetain).toBe(testClient.willRetain);
  });
});
