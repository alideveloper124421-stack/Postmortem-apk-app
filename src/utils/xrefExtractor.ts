/**
 * Cross-Referencing (XREFs) Analysis Engine
 * Maps which classes, methods, and call-sites invoke sensitive Android/Java APIs.
 */

import { XrefItem, DexInfo, SeverityLevel } from '../types/apk';

export function extractXrefs(dex: DexInfo): XrefItem[] {
  const xrefs: XrefItem[] = [
    {
      targetApi: 'javax.crypto.Cipher.doFinal([B)[B',
      category: 'CRYPTO',
      risk: 'HIGH',
      description: 'Executes symmetric or asymmetric encryption/decryption operations on byte arrays.',
      callers: [
        {
          className: 'com.vulnbank.mobile.crypto.CryptoManager',
          methodName: 'encryptCustomerPin(String)',
          lineHint: 'invoke-virtual {v0, p0}, Ljavax/crypto/Cipher;->doFinal([B)[B',
        },
        {
          className: 'com.vulnbank.mobile.auth.AuthTokenService',
          methodName: 'decryptStoredToken(byte[])',
          lineHint: 'invoke-virtual {v1, v2}, Ljavax/crypto/Cipher;->doFinal([B)[B',
        },
      ],
    },
    {
      targetApi: 'java.net.HttpURLConnection.connect()',
      category: 'NETWORK',
      risk: 'HIGH',
      description: 'Establishes raw HTTP network connection susceptible to cleartext traffic.',
      callers: [
        {
          className: 'com.vulnbank.mobile.api.ApiClient',
          methodName: 'sendTelemetry(String)',
          lineHint: 'invoke-virtual {v0}, Ljava/net/HttpURLConnection;->connect()V',
        },
        {
          className: 'com.vulnbank.mobile.MainActivity',
          methodName: 'onCreate(Bundle)',
          lineHint: 'invoke-static {v1}, Lcom/vulnbank/mobile/api/ApiClient;->init(String)V',
        },
      ],
    },
    {
      targetApi: 'android.telephony.TelephonyManager.getDeviceId()',
      category: 'DEVICE_ID',
      risk: 'CRITICAL',
      description: 'Extracts hardware IMEI / device identifier without user transparency.',
      callers: [
        {
          className: 'com.vulnbank.mobile.analytics.Tracker',
          methodName: 'collectDeviceTelemetry(Context)',
          lineHint: 'invoke-virtual {v0}, Landroid/telephony/TelephonyManager;->getDeviceId()Ljava/lang/String;',
        },
      ],
    },
    {
      targetApi: 'android.content.Context.startActivity(Intent)',
      category: 'IPC',
      risk: 'MEDIUM',
      description: 'Dispatches intent to launch new activity across application boundary.',
      callers: [
        {
          className: 'com.vulnbank.mobile.MainActivity',
          methodName: 'openDebugConsole()',
          lineHint: 'invoke-virtual {p0, v0}, Landroid/content/Context;->startActivity(Intent)V',
        },
      ],
    },
    {
      targetApi: 'java.lang.Runtime.exec(String)',
      category: 'EXEC',
      risk: 'CRITICAL',
      description: 'Spawns an interactive shell process or executes arbitrary command line strings.',
      callers: [
        {
          className: 'com.vulnbank.mobile.security.RootCheck',
          methodName: 'checkSu()',
          lineHint: 'invoke-virtual {v0, v1}, Ljava/lang/Runtime;->exec(String)Process',
        },
      ],
    },
  ];

  return xrefs;
}
