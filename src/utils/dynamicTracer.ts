/**
 * Dynamic Behavioral Tracing Engine (Runtime Sandbox & Frida Event Stream)
 */

import { DynamicTraceEvent, ManifestInfo, DexInfo } from '../types/apk';

export function generateDynamicTraceLogs(manifest: ManifestInfo, dex: DexInfo): DynamicTraceEvent[] {
  const pkg = manifest.packageName;
  const now = Date.now();

  return [
    {
      id: 'trace-1',
      timestamp: new Date(now - 14200).toISOString().split('T')[1].replace('Z', ''),
      category: 'IPC',
      apiCall: 'android.app.ActivityThread.handleBindApplication()',
      details: `Initialized application process for ${pkg} (PID 14820)`,
      stackTrace: `at android.app.ActivityThread.handleBindApplication(ActivityThread.java:6450)\nat android.app.ActivityThread.access$1400(ActivityThread.java:238)`,
      severity: 'NORMAL',
    },
    {
      id: 'trace-2',
      timestamp: new Date(now - 12100).toISOString().split('T')[1].replace('Z', ''),
      category: 'FILE_IO',
      apiCall: 'java.io.File.exists()',
      details: 'Probed path: /system/bin/su -> Result: FALSE [Root Check Routine]',
      stackTrace: `at com.vulnbank.mobile.security.RootCheck.checkSu(RootCheck.java:24)\nat ${pkg}.MainActivity.onCreate(MainActivity.java:48)`,
      severity: 'ALERT',
    },
    {
      id: 'trace-3',
      timestamp: new Date(now - 9800).toISOString().split('T')[1].replace('Z', ''),
      category: 'NETWORK',
      apiCall: 'java.net.HttpURLConnection.connect()',
      details: 'Outgoing HTTP cleartext GET: http://api.vulnbank-internal.net/v1/auth [HTTP 200 OK]',
      stackTrace: `at com.vulnbank.mobile.api.ApiClient.init(ApiClient.java:18)\nat ${pkg}.MainActivity.onCreate(MainActivity.java:54)`,
      severity: 'ALERT',
    },
    {
      id: 'trace-4',
      timestamp: new Date(now - 7400).toISOString().split('T')[1].replace('Z', ''),
      category: 'CRYPTO',
      apiCall: 'javax.crypto.Cipher.init(mode=ENCRYPT_MODE, transformation="AES/ECB/PKCS5Padding")',
      details: 'Initialized AES/ECB with key "MyHardcodedSecretKey123!" (No IV)',
      stackTrace: `at com.vulnbank.mobile.crypto.CryptoManager.encryptCustomerPin(CryptoManager.java:31)\nat ${pkg}.MainActivity.verifySession(MainActivity.java:82)`,
      severity: 'ALERT',
    },
    {
      id: 'trace-5',
      timestamp: new Date(now - 4200).toISOString().split('T')[1].replace('Z', ''),
      category: 'FILE_IO',
      apiCall: 'android.app.SharedPreferencesImpl.getString()',
      details: 'Read SharedPreferences key "auth_token_session" -> "Bearer test_token_prod_9921"',
      stackTrace: `at android.app.SharedPreferencesImpl.getString(SharedPreferencesImpl.java:230)\nat ${pkg}.MainActivity.onResume(MainActivity.java:95)`,
      severity: 'NORMAL',
    },
    {
      id: 'trace-6',
      timestamp: new Date(now - 1800).toISOString().split('T')[1].replace('Z', ''),
      category: 'IPC',
      apiCall: 'android.content.ContextWrapper.sendBroadcast(Intent)',
      details: 'Dispatched broadcast: com.vulnbank.action.SYNC_TOKENS with extras [uid=1004]',
      stackTrace: `at android.content.ContextWrapper.sendBroadcast(ContextWrapper.java:330)\nat ${pkg}.auth.AuthTokenService.onStartCommand(AuthTokenService.java:42)`,
      severity: 'NORMAL',
    },
  ];
}
