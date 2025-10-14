/**
 * Google Analytics Service for MQTTBox
 * Tracking ID: G-1JYEJC7FD3
 */

class AnalyticsService {
  constructor() {
    this.measurementId = 'G-1JYEJC7FD3';
    this.enabled = this.checkConsent();
    this.initialized = false;
  }

  /**
   * Check if user has consented to analytics
   */
  checkConsent() {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return false; // Default to disabled in Node.js environment
    }
    
    const consent = localStorage.getItem('mqttbox_analytics_consent');
    if (consent === null) {
      // Show consent dialog
      this.showConsentDialog();
      return false;
    }
    return consent === 'true';
  }

  /**
   * Show consent dialog
   */
  showConsentDialog() {
    // Only show dialog in Electron environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }
    
    try {
      const { dialog } = require('electron');
      const result = dialog.showMessageBoxSync({
        type: 'question',
        buttons: ['Agree', 'Decline', 'Learn More'],
        title: 'Data Collection Consent',
        message: 'MQTTBox wants to collect anonymous usage data to improve the software.\n\nCollected data includes:\n- Feature usage\n- Error information\n- Performance data\n\nThis data will help us:\n- Fix bugs\n- Improve features\n- Optimize performance\n\nDo you agree to collect this data?',
        detail: 'You can change this choice anytime in settings.'
      });

      if (result === 0) { // Agree
        localStorage.setItem('mqttbox_analytics_consent', 'true');
        this.enabled = true;
        this.init();
      } else if (result === 1) { // Decline
        localStorage.setItem('mqttbox_analytics_consent', 'false');
        this.enabled = false;
      } else if (result === 2) { // Learn More
        this.showPrivacyPolicy();
        return this.showConsentDialog(); // Show again
      }
    } catch (error) {
      console.warn('[Analytics] Consent dialog not available:', error.message);
    }
  }

  /**
   * Show privacy policy
   */
  showPrivacyPolicy() {
    const { shell } = require('electron');
    shell.openExternal('https://github.com/workswithweb/MQTTBox-master/blob/main/PRIVACY.md');
  }

  /**
   * Initialize Google Analytics
   */
  init() {
    if (!this.enabled || this.initialized) return;

    try {
      // In Electron environment, we need to load Google Analytics manually
      if (typeof process !== 'undefined' && process.versions && process.versions.electron) {
        this.loadGoogleAnalytics();
      } else if (typeof window !== 'undefined' && window.gtag) {
        this.initialized = true;
        console.log('[Analytics] Google Analytics initialized');
        this.setDefaultParameters();
      } else {
        console.warn('[Analytics] Google Analytics not loaded yet');
      }
    } catch (error) {
      console.error('[Analytics] Initialization failed:', error);
    }
  }

  /**
   * Load Google Analytics script in Electron environment
   */
  loadGoogleAnalytics() {
    if (typeof window === 'undefined') return;

    try {
      // Create and load the Google Analytics script
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
      script.onload = () => {
        // Initialize gtag after script loads
        window.dataLayer = window.dataLayer || [];
        function gtag(){window.dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', this.measurementId);
        window.gtag = gtag;
        
        this.initialized = true;
        console.log('[Analytics] Google Analytics loaded in Electron environment');
        this.setDefaultParameters();
      };
      script.onerror = () => {
        console.warn('[Analytics] Failed to load Google Analytics script in Electron');
        // Create a mock gtag function for offline mode
        window.gtag = () => console.log('[Analytics] Mock gtag called:', arguments);
        this.initialized = true;
      };
      document.head.appendChild(script);
    } catch (error) {
      console.error('[Analytics] Failed to load Google Analytics:', error);
    }
  }

  /**
   * Set default parameters for all events
   */
  setDefaultParameters() {
    if (!this.enabled || !window.gtag) return;

    try {
      window.gtag('config', this.measurementId, {
        custom_map: {
          'custom_parameter_1': 'app_version',
          'custom_parameter_2': 'platform',
          'custom_parameter_3': 'user_id'
        }
      });
    } catch (error) {
      console.error('[Analytics] Failed to set default parameters:', error);
    }
  }

  /**
   * Track an event
   */
  track(eventName, parameters = {}) {
    if (!this.enabled || !window.gtag) return;

    try {
      // Add default parameters
      const eventData = {
        ...parameters,
        app_version: this.getAppVersion(),
        platform: this.getPlatform(),
        user_id: this.getUserId(),
        timestamp: new Date().toISOString()
      };

      // Send event to Google Analytics
      window.gtag('event', eventName, eventData);
      
      console.log('[Analytics] Event tracked:', eventName, eventData);
    } catch (error) {
      console.error('[Analytics] Failed to track event:', error);
    }
  }

  /**
   * Track page view
   */
  trackPageView(pageName) {
    if (!this.enabled || !window.gtag) return;

    try {
      window.gtag('event', 'page_view', {
        page_title: pageName,
        page_location: `mqttbox://${pageName}`,
        app_version: this.getAppVersion(),
        platform: this.getPlatform()
      });
    } catch (error) {
      console.error('[Analytics] Failed to track page view:', error);
    }
  }

  // MQTT tracking methods removed - only basic app tracking needed

  /**
   * Track app startup
   */
  trackAppStartup(startupTime) {
    this.track('app_startup', {
      startup_time: startupTime,
      platform: this.getPlatform(),
      version: this.getAppVersion()
    });
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(featureName, category, duration) {
    this.track('feature_used', {
      feature_name: featureName,
      feature_category: category,
      duration: duration
    });
  }

  /**
   * Track error
   */
  trackError(errorType, errorMessage, context) {
    this.track('app_error', {
      error_type: errorType,
      error_message: this.sanitizeErrorMessage(errorMessage),
      context: context
    });
  }

  /**
   * Get app version
   */
  getAppVersion() {
    try {
      const { app } = require('electron');
      return app.getVersion();
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Get platform
   */
  getPlatform() {
    try {
      return process.platform;
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Get user ID
   */
  getUserId() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return 'user_' + Math.random().toString(36).substr(2, 9);
    }
    
    let userId = localStorage.getItem('mqttbox_user_id');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('mqttbox_user_id', userId);
    }
    return userId;
  }


  /**
   * Sanitize error message
   */
  sanitizeErrorMessage(message) {
    if (!message) return 'unknown';
    // Remove sensitive information
    return message.replace(/password|token|key|secret/gi, '***');
  }

  /**
   * Enable analytics
   */
  enable() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem('mqttbox_analytics_consent', 'true');
    }
    this.enabled = true;
    this.init();
  }

  /**
   * Disable analytics
   */
  disable() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem('mqttbox_analytics_consent', 'false');
    }
    this.enabled = false;
  }

  /**
   * Get analytics status
   */
  getStatus() {
    return {
      enabled: this.enabled,
      measurementId: this.measurementId,
      initialized: this.initialized
    };
  }

  /**
   * Force enable analytics for testing
   */
  forceEnable() {
    this.enabled = true;
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('mqttbox_analytics_consent', 'true');
    }
    this.init();
    console.log('[Analytics] Force enabled for testing');
  }


  /**
   * Track basic app usage
   */
  trackAppUsage(action, details = {}) {
    this.track('app_usage', {
      action: action,
      platform: this.getPlatform(),
      version: this.getAppVersion(),
      ...details
    });
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(featureName, success = true) {
    this.track('feature_used', {
      feature_name: featureName,
      success: success,
      platform: this.getPlatform(),
      version: this.getAppVersion()
    });
  }
}

// Export singleton instance
module.exports = new AnalyticsService();
