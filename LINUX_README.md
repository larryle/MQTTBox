# MQTTBox for Linux

MQTTBox is a powerful MQTT client application that helps developers create and test MQTT connectivity protocols. This document provides comprehensive installation and usage instructions for Linux systems.

## 📦 Available Downloads

### AppImage Format (Recommended)
- **MQTTBox-0.2.2.AppImage** - x64 (Intel/AMD 64-bit)
- **MQTTBox-0.2.2-arm64.AppImage** - ARM64 (ARM 64-bit)

## 🐧 Supported Linux Distributions

### Primary Support
- **Ubuntu** 18.04+ (LTS and latest versions)
- **Debian** 9+ (Stretch, Buster, Bullseye, Bookworm)
- **Fedora** 28+
- **CentOS** 7+ / RHEL 7+
- **openSUSE** Leap 15+ / Tumbleweed

### Additional Support
- **Arch Linux** (latest)
- **Manjaro** (latest)
- **Linux Mint** 19+ (Ubuntu-based)
- **Elementary OS** 5+ (Ubuntu-based)
- **Pop!_OS** (Ubuntu-based)
- **Zorin OS** (Ubuntu-based)
- **Kali Linux** (Debian-based)

## 🔧 System Requirements

### Minimum Requirements
- **Linux Kernel**: 2.6.18+ (x64) / 3.7.0+ (ARM64)
- **glibc**: 2.17+ (x64) / 2.19+ (ARM64)
- **RAM**: 512MB minimum
- **Disk Space**: 200MB available space
- **Architecture**: x64 or ARM64

### Recommended Configuration
- **Linux Kernel**: 4.4+
- **glibc**: 2.23+
- **RAM**: 1GB+
- **Disk Space**: 500MB+
- **Desktop Environment**: GNOME, KDE, XFCE, or similar

## 📋 Dependencies

The AppImage includes most dependencies, but your system should have:

```bash
# Essential libraries
libgtk-3-0
libnotify4
libnss3
libxss1
libxtst6
xdg-utils
libatspi2.0-0
libuuid1
libsecret-1-0

# Optional but recommended
libappindicator3-1
```

### Installing Dependencies

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 xdg-utils libatspi2.0-0 libuuid1 libsecret-1-0 libappindicator3-1
```

**Fedora/CentOS/RHEL:**
```bash
sudo dnf install gtk3 libnotify nss libXScrnSaver libXtst xdg-utils at-spi2-atk libuuid libsecret libappindicator-gtk3
```

**Arch Linux:**
```bash
sudo pacman -S gtk3 libnotify nss libxss libxtst xdg-utils at-spi2-core libuuid libsecret libappindicator-gtk3
```

## 🚀 Installation & Usage

### Method 1: Direct Execution (Recommended)

1. **Download the AppImage:**
   ```bash
   # For x64 systems
   wget https://your-domain.com/MQTTBox-0.2.2.AppImage
   
   # For ARM64 systems
   wget https://your-domain.com/MQTTBox-0.2.2-arm64.AppImage
   ```

2. **Make it executable:**
   ```bash
   chmod +x MQTTBox-0.2.2.AppImage
   ```

3. **Run the application:**
   ```bash
   ./MQTTBox-0.2.2.AppImage
   ```

### Method 2: Desktop Integration

1. **Install to system:**
   ```bash
   ./MQTTBox-0.2.2.AppImage --install
   ```

2. **Create desktop shortcut:**
   ```bash
   # The AppImage will be installed to ~/.local/share/applications/
   # You can then find it in your application menu
   ```

### Method 3: Portable Mode

1. **Create application directory:**
   ```bash
   mkdir -p ~/Applications/MQTTBox
   cp MQTTBox-0.2.2.AppImage ~/Applications/MQTTBox/
   ```

2. **Create launcher script:**
   ```bash
   cat > ~/Applications/MQTTBox/launch.sh << 'EOF'
   #!/bin/bash
   cd "$(dirname "$0")"
   ./MQTTBox-0.2.2.AppImage "$@"
   EOF
   chmod +x ~/Applications/MQTTBox/launch.sh
   ```

## 🔧 Troubleshooting

### Common Issues

**1. Permission Denied:**
```bash
chmod +x MQTTBox-0.2.2.AppImage
```

**2. Missing Dependencies:**
```bash
# Check if required libraries are installed
ldd MQTTBox-0.2.2.AppImage
```

**3. FUSE Not Available:**
```bash
# Install FUSE support
sudo apt install fuse  # Ubuntu/Debian
sudo dnf install fuse  # Fedora/CentOS
```

**4. AppImage Won't Run:**
```bash
# Try running with --appimage-extract-and-run
./MQTTBox-0.2.2.AppImage --appimage-extract-and-run
```

### Debug Mode

Run with debug information:
```bash
./MQTTBox-0.2.2.AppImage --debug
```

### Log Files

Check application logs:
```bash
# User logs
~/.config/MQTTBox/logs/

# System logs
journalctl --user -f | grep MQTTBox
```

## 🌐 Network Configuration

### Firewall Settings

If you're behind a firewall, ensure these ports are open:
- **MQTT**: 1883 (TCP)
- **MQTTS**: 8883 (TCP)
- **WebSocket MQTT**: 8080, 8083, 9001 (TCP)

### Proxy Configuration

If using a proxy, set environment variables:
```bash
export http_proxy=http://proxy-server:port
export https_proxy=http://proxy-server:port
export no_proxy=localhost,127.0.0.1
```

## 🔐 SSL/TLS Certificate Support

MQTTBox supports various certificate types:

### Certificate Types
- **SSC** (Server and Client Certificate)
- **CC** (Client Certificate)
- **CSSC** (Client Self-Signed Certificate)

### Supported Formats
- **PEM** (.pem, .crt, .key)
- **DER** (.der, .cer)
- **P12** (.p12, .pfx)

### AWS IoT Core Example
```bash
# Certificate files should be in PEM format
CA Certificate: AmazonRootCA1.pem
Client Certificate: device-certificate.pem.crt
Client Key: device-private.pem.key
```

## 🎯 Use Cases

### Development
- MQTT protocol testing
- IoT device simulation
- Message debugging
- Load testing

### Production
- MQTT broker monitoring
- Device management
- Data visualization
- System integration

## 📱 Features

### MQTT Client Features
- Connect to multiple MQTT brokers
- Support for TCP and WebSocket protocols
- Wide range of connection settings
- Publish/Subscribe to multiple topics
- Single Level (+) and Multi-level (#) subscriptions
- Copy/Republish payloads
- Message history for each topic
- Automatic reconnection

### Load Testing Features
- MQTT publisher/subscriber load testing
- Configurable load test settings
- Real-time data visualization
- Performance metrics and graphs

## 🆘 Support

### Getting Help
- **Documentation**: Check this README and inline help
- **Issues**: Report bugs at [GitHub Issues](https://github.com/workswithweb/MQTTBox/issues)
- **Email**: workswithweb@gmail.com

### System Information
When reporting issues, include:
```bash
# System information
uname -a
lsb_release -a  # Ubuntu/Debian
cat /etc/os-release  # Most distributions

# AppImage information
./MQTTBox-0.2.2.AppImage --version
```

## 🔄 Updates

### Checking for Updates
MQTTBox will automatically check for updates when connected to the internet.

### Manual Update
1. Download the latest AppImage
2. Replace the old file
3. Restart the application

## 📄 License

This software is provided under the terms specified in the project repository.

---

**Thank you for using MQTTBox on Linux!** 🐧

For more information, visit: [MQTTBox Official Website](http://workswithweb.com/html/mqttbox/downloads.html)
