import React from 'react';
import {render} from 'react-dom';
import { Router, hashHistory } from 'react-router';
import localforage from 'localforage';

import AppRoutes from './utils/AppRoutes';
import PlatformUtils from './platform/common/PlatformUtils';
// Initialize Electron MQTT event bridge, ensure renderer process registers IPC listeners
import './services/ElectronMqttService';
import PlatformDispatcherService from './platform/PlatformDispatcherService';
import MqttClientConstants from './utils/MqttClientConstants';
import CommonConstants from './utils/CommonConstants';

// Configure localforage only when a window context is available to avoid errors in workers
try {
    var hasWindow = (typeof window !== 'undefined' && typeof document !== 'undefined');
    if (hasWindow) {
        var isElectron = typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.indexOf('Electron') !== -1;
        // In Electron dev, force LocalStorage driver to avoid IndexedDB lock issues
        // Unified driver, ensure both packaged and development use LocalStorage consistently
        var drivers = [localforage.LOCALSTORAGE];
        localforage.config({
            driver: drivers,
            name: 'MQTTBox',
            version: 1.0,
            size: 4980736, // Size of database, in bytes. WebSQL-only for now.
            storeName: 'mqttbox_store', // Should be alphanumeric, with underscores.
            description: 'MQTTBox storage'
        });

        // If init still fails, fallback to LocalStorage at runtime
        if (!isElectron) {
            localforage.ready().catch(function() {
                try {
                    localforage.setDriver(localforage.LOCALSTORAGE);
                } catch (_) {}
            });
        }
    }
} catch (e) {
    // Swallow config errors to prevent crash in environments without storage
    // eslint-disable-next-line no-console
    console.warn('localforage config skipped due to environment:', e && e.message ? e.message : e);
}

PlatformUtils.init();
// 暴露全局调试方法，便于在 Console 主动触发与观察
try {
  if (typeof window !== 'undefined') {
    window.__MQTT_DEBUG = window.__MQTT_DEBUG || {};
    window.__MQTT_DEBUG.connect = function(mcsId){
      try {
        console.log('[DEBUG] manual connect for', mcsId);
        var settings = (require('./services/MqttClientService').default).getMqttClientSettingsByMcsId(mcsId);
        (require('./actions/MqttClientActions').default).connectToBroker(settings);
      } catch(e) { console.error('[DEBUG] connect error', e); }
    };
    window.__MQTT_DEBUG.disconnect = function(mcsId){
      try {
        console.log('[DEBUG] manual disconnect for', mcsId);
        (require('./actions/MqttClientActions').default).disConnectFromBroker(mcsId);
      } catch(e) { console.error('[DEBUG] disconnect error', e); }
    };
    window.__MQTT_DEBUG.state = function(mcsId){
      try {
        var s = (require('./services/MqttClientService').default).getMqttClientStateByMcsId(mcsId);
        console.log('[DEBUG] state for', mcsId, '=>', s);
        return s;
      } catch(e) { console.error('[DEBUG] state error', e); }
    };
    console.log('[DEBUG] __MQTT_DEBUG available: { connect(mcsId), disconnect(mcsId), state(mcsId) }');
  }
} catch(__) {}
// 兜底：直接在渲染进程桥接主进程 IPC 到应用事件总线（防止服务未初始化时丢事件）
try {
  var _wreq = (typeof window !== 'undefined' && window.require) ? window.require : null;
  var _electron = _wreq ? _wreq('electron') : null;
  var _ipc = _electron && _electron.ipcRenderer ? _electron.ipcRenderer : null;
  if (_ipc) {
    ['mqtt-connected','mqtt-disconnected','mqtt-error'].forEach(function(ch){
      _ipc.on(ch, function(_e, data){
        try {
          // 优先使用当前页面路由中的 mcsId，以保证当前详情页按钮能正确更新
          var ROUTE_MCS_ID = (typeof location !== 'undefined' && location.hash && (location.hash.match(/[0-9a-f-]{36}/i)||[])[0]) || null;
          var mcsId = ROUTE_MCS_ID || (data && (data.mcsId || data.clientId));
          // 调试日志：明确打印事件与 mcsId 选择过程
          try {
            console.log('[UI-IPC] event=', ch, 'data=', data);
            console.log('[UI-IPC] route.mcsId=', ROUTE_MCS_ID, 'chosen.mcsId=', mcsId);
          } catch(__) {}
          var connState = (ch === 'mqtt-connected') ? MqttClientConstants.CONNECTION_STATE_CONNECTED
                        : (ch === 'mqtt-disconnected') ? MqttClientConstants.CONNECTION_STATE_DIS_CONNECTED
                        : MqttClientConstants.CONNECTION_STATE_ERROR;
          PlatformDispatcherService.processEvents({
            event: MqttClientConstants.EVENT_MQTT_CLIENT_CONN_STATE_CHANGED,
            data: { mcsId: mcsId, connState: connState }
          }, CommonConstants.SERVICE_TYPE_MQTT_CLIENTS);
          try {
            console.log('[UI-IPC] dispatched EVENT_MQTT_CLIENT_CONN_STATE_CHANGED with', { mcsId: mcsId, connState: connState });
          } catch(__) {}
        } catch (e) {
          // noop
        }
      });
    });
  }
} catch (_e) {}
hashHistory.replace('/mqttclientslist');

render(
  <Router history={hashHistory}>
    {AppRoutes}
  </Router>
, document.getElementById('app'));


