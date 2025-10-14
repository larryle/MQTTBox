/**
 * Global test setup for storage tests
 */

// Mock Electron environment
global.process = {
  versions: { electron: 'v22.3.27' },
  platform: 'darwin',
  arch: 'x64',
  env: { NODE_ENV: 'test' }
};

// Mock process.env for fbjs
if (!global.process.env) {
  global.process.env = { NODE_ENV: 'test' };
}

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

// Mock document for script injection
global.document = {
  createElement: jest.fn((tagName) => {
    if (tagName === 'script') {
      return {
        async: false,
        src: '',
        onload: null,
        onerror: null,
      };
    }
    return {};
  }),
  head: {
    appendChild: jest.fn(),
  },
};

// Mock window.gtag
global.window.dataLayer = [];
global.window.gtag = jest.fn();

// Mock Electron modules
global.require = jest.fn((moduleName) => {
  if (moduleName === 'electron') {
    return {
      app: {
        getVersion: () => '0.2.2',
      },
      dialog: {
        showMessageBoxSync: jest.fn(() => 0), // Default to 'Agree'
      },
      shell: {
        openExternal: jest.fn(),
      },
      ipcRenderer: {
        on: jest.fn(),
        send: jest.fn(),
      },
    };
  }
  return jest.requireActual(moduleName);
});

// Mock localforage
jest.mock('localforage', () => ({
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
}));

// Mock flux to avoid NODE_ENV issues
jest.mock('flux', () => ({
  Dispatcher: jest.fn(() => ({
    register: jest.fn(),
    dispatch: jest.fn()
  }))
}));
