# AWS IoT Core Connection Configuration Guide

## Configuring AWS IoT Core Connection in MQTTBox

### 1. Basic Connection Settings

- **Protocol**: Select `mqtts` (MQTT over TLS)
- **Host**: `a347c83gr2h8if-ats.iot.ap-southeast-2.amazonaws.com:8883`
- **Client ID**: Use a unique client ID (recommended to include timestamp)

### 2. SSL/TLS Certificate Configuration

- **Certificate Type**: Select `ssc` (Server and Client Certificate)
- **CA Certificate**: Upload `AmazonRootCA1.pem` file
- **Client Certificate**: Upload `64288fe322-certificate.pem.crt` file  
- **Client Key**: Upload `64288fe322-private.pem.key` file

### 3. Connection Options

- **Keep Alive**: 60 seconds
- **Clean Session**: Enabled
- **Auto Reconnect**: Enabled
- **Connection Timeout**: 30 seconds

### 4. Certificate File Paths

Ensure certificate files are in the following locations:
- CA Certificate: `/Volumes/work/develop/workspace/documents/Server/amazon/iot/keys/AmazonRootCA1.pem`
- Client Certificate: `/Volumes/work/develop/workspace/documents/Server/amazon/iot/keys/64288fe322-certificate.pem.crt`
- Client Key: `/Volumes/work/develop/workspace/documents/Server/amazon/iot/keys/64288fe322-private.pem.key`

### 5. Troubleshooting

If connection fails, please check:
1. Whether certificate files exist and are readable
2. Whether certificates have expired
3. Whether AWS IoT Core policies are correctly configured
4. Whether network connection is normal
5. Whether firewall is blocking port 8883

### 6. Test Connection

Use the following command to test connection:
```bash
cd /Users/larry/Downloads/MQTTBox-master
node test/mqtt-connection-test.js
```