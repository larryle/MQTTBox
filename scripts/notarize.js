const { notarize } = require('@electron/notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  
  if (electronPlatformName !== 'darwin') {
    return;
  }

  const appName = context.packager.appInfo.productFilename;

  console.log('🔐 Starting notarization process...');
  
  try {
    await notarize({
      appBundleId: 'com.mqttbox.app',
      appPath: `${appOutDir}/${appName}.app`,
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_ID_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID,
    });
    
    console.log('✅ Notarization completed successfully!');
  } catch (error) {
    console.error('❌ Notarization failed:', error);
    // Don't fail the build if notarization fails
    console.log('⚠️ Continuing build without notarization...');
  }
};
