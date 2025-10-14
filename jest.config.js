module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setupTests.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/__tests__/styleMock.js',
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/styleMock.js', // Ignore the mock file itself
  ],
  collectCoverageFrom: [
    'src/app/services/MqttClientDbService.js',
    'src/app/services/MqttClientService.js',
    'src/app/services/AnalyticsService.js'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
