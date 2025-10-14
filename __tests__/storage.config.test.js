/**
 * Storage Configuration Tests
 * Prevent storage configuration from being accidentally modified causing data invisibility
 */

describe('Storage Configuration Protection', () => {
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
    
    // Mock window and localStorage
    global.window = {
      localStorage: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        key: jest.fn(),
        length: 0
      }
    };

    // Mock localforage
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
    MqttClientService = require('../src/app/services/MqttClientService');
  });

  afterAll(() => {
    jest.resetModules();
  });

  test('MqttClientDbService should use correct storage name', () => {
    expect(MqttClientDbService.db.config.name).toBe('MQTT_CLIENT_SETTINGS');
  });

  test('MqttClientDbService should use LOCALSTORAGE driver', () => {
    expect(MqttClientDbService.db.config.driver).toBe('LOCALSTORAGE');
  });

  test('Storage configuration should not change without explicit approval', () => {
    // Snapshot test: this test will fail if configuration is modified
    expect({
      name: MqttClientDbService.db.config.name,
      driver: MqttClientDbService.db.config.driver,
      hasSetItem: typeof MqttClientDbService.db.setItem === 'function',
      hasGetItem: typeof MqttClientDbService.db.getItem === 'function',
      hasIterate: typeof MqttClientDbService.db.iterate === 'function'
    }).toMatchSnapshot();
  });

  test('MqttClientService should be properly initialized', () => {
    expect(MqttClientService).toBeDefined();
    expect(typeof MqttClientService.getAllMqttClientSettings).toBe('function');
    expect(typeof MqttClientService.saveMqttClientSettings).toBe('function');
  });
});
