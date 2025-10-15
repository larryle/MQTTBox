# MQTTBox
#### Developers helper program to create and test MQTT connectivity protocol.
Supercharge your MQTT workflow with MQTTBox Apps available on Chrome, Linux, Mac, Web and Windows! Build, test, and document your MQTT connectivity protocol.

> **📋 Project Information**
> 
> This project is based on the original [MQTTBox](https://github.com/workswithweb/MQTTBox) by workswithweb, with significant enhancements and improvements including:
> - Modern build system migration (Gulp → Vite)
> - Enhanced data persistence and storage protection
> - Apple code signing and notarization support
> - Multi-platform build support (macOS, Windows, Linux)
> - v0.2.1 compatibility and automatic data migration
> - Comprehensive testing suite


### 📥 Download Links

#### Latest Release
- **Download MQTTBox v0.2.2**: [GitHub Releases](https://github.com/larryle/MQTTBox/releases/tag/v0.2.2)

#### Supported Platforms
- **macOS**: Intel and Apple Silicon (ARM64) support
  - **Minimum Version**: macOS 10.14 (Mojave) or later
  - **Recommended**: macOS 11.0 (Big Sur) or later
- **Windows**: 64-bit executable with NSIS installer
  - **Minimum Version**: Windows 7 SP1 or later
  - **Recommended**: Windows 10 (version 1903) or later
- **Linux**: AppImage and DEB package support
  - **Minimum Version**: Ubuntu 18.04 LTS or equivalent
  - **Recommended**: Ubuntu 20.04 LTS or later
  - **Supported Distributions**: Ubuntu, Debian, Fedora, CentOS, openSUSE

#### All Releases
- **View all releases**: [GitHub Releases](https://github.com/larryle/MQTTBox/releases)

#### MQTTBox Client features include:
- Connect to multiple mqtt brokers with TCP or Web Sockets protocols
- Connect with wide range of mqtt client connection settings
- Publish/Subscribe to multiple topics at same time
- Supports Single Level(+) and Multilevel(#) subscription to topics
- Copy/Republish payloads
- History of published/subscribed messages for each topic
- Reconnect client to broker

#### MQTTBox Load test features include:
- Load test MQTT publisher/Subscriber.
- Run load test with wide range load test settings
- View load test data 
- View load test results in graphs

Please report Feature Requests, Enhancements or Bugs to linfengle@gmail.com or on [Github](https://github.com/larryle/MQTTBox/issues)

## Acknowledgments

This project is a fork and enhancement of the original [MQTTBox](https://github.com/workswithweb/MQTTBox) project by workswithweb. We extend our gratitude to the original developers for creating this excellent MQTT testing tool.

## Getting Started
Make sure you have [Node.js](https://nodejs.org/en/) installed and follow below steps to build and execute.

- `git clone git@github.com:larryle/MQTTBox.git`

- `cd MQTTBox`

- `npm install`

> **⚠️ Installation Note**: If you encounter dependency conflicts during `npm install`, use the following command instead:
> ```bash
> npm install --legacy-peer-deps
> ```
> This resolves React version conflicts between different packages.

That's it! Your project is set up. Execute the following commands in your current folder (MQTTBox) as per your app requirements.

###### Electron App Development
- `npm run build` - Generates `build` folder with all compiled static web assets for the Electron app.

- `npm run electron` - Start the Electron application in development mode.

- `npm start` - Live development mode for web assets. Use while development to see live reload of your web app when changes are made in code.

###### Building Distribution Packages
- `npm run dist:mac` - Build macOS DMG package (Intel and ARM64)
- `npm run dist:win` - Build Windows NSIS installer
- `npm run dist:linux` - Build Linux AppImage and DEB packages

NOTE: 
1. This is an Electron application that supports both TCP and WebSocket MQTT connections.
2. The app runs natively on macOS, Windows, and Linux platforms.
3. All MQTT features are available across all platforms.