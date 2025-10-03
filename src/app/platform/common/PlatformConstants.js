import CommonConstants from '../../utils/CommonConstants';

class PlatformConstants {}

// Detect platform type only once
if (!PlatformConstants.PLATFORM_TYPE) {
    // Detect Electron in both window and worker contexts
    var isElectronWindow = (typeof window !== 'undefined' && window.navigator && window.navigator.userAgent && window.navigator.userAgent.indexOf('Electron') !== -1);
    var isElectronWorker = (typeof self !== 'undefined' && typeof window === 'undefined' && self.navigator && self.navigator.userAgent && self.navigator.userAgent.indexOf('Electron') !== -1);
    var isElectron = isElectronWindow || isElectronWorker;

    if (isElectron) {
        // Running in Electron (renderer or worker)
        PlatformConstants.PLATFORM_TYPE = CommonConstants.PLATFORM_ELECTRON_APP;
        console.log('Platform detected: ELECTRON_APP');
    } else if (typeof window !== 'undefined' && window.chrome && window.chrome.runtime && window.chrome.runtime.id) {
        // Running in Chrome extension
        PlatformConstants.PLATFORM_TYPE = CommonConstants.PLATFORM_CHROME_APP;
        console.log('Platform detected: CHROME_APP');
    } else {
        // Running in web browser
        PlatformConstants.PLATFORM_TYPE = CommonConstants.PLATFORM_WEB_APP;
        console.log('Platform detected: WEB_APP');
    }
}

export default PlatformConstants;