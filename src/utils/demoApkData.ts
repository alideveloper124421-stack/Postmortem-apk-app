/**
 * Pre-configured Demo APK profiles for instant forensic analysis and testing
 */

import { ApkAnalysisResult, SmaliClass, SmaliMethod } from '../types/apk';
import { runSecurityAudit } from './securityAuditor';
import { generateFridaScripts } from './fridaGenerator';
import { generateDeepPostmortemTextReport } from './reportGenerator';
import { decompileToJava, decompileToKotlin } from './decompiler';
import { buildControlFlowGraph } from './cfgBuilder';
import { analyzeNativeLibraries } from './nativeAnalyzer';
import { detectAntiTamperMechanisms } from './antiTamperDetector';
import { generateDynamicTraceLogs } from './dynamicTracer';
import { extractXrefs } from './xrefExtractor';

export function getVulnBankDemoApk(): ApkAnalysisResult {
  const manifest = {
    packageName: 'com.vulnbank.mobile.secure',
    versionCode: '104',
    versionName: '2.4.1-beta',
    minSdkVersion: '21',
    targetSdkVersion: '29',
    appLabel: 'VulnBank Mobile',
    debuggable: true,
    allowBackup: true,
    usesCleartextTraffic: true,
    networkSecurityConfig: '@xml/network_security_config',
    permissions: [
      { name: 'android.permission.INTERNET', shortName: 'INTERNET', description: 'Full network access', isDangerous: false, status: 'NORMAL' as const },
      { name: 'android.permission.READ_SMS', shortName: 'READ_SMS', description: 'Read incoming SMS verification codes and user text messages', isDangerous: true, status: 'HIGH_RISK' as const },
      { name: 'android.permission.RECEIVE_SMS', shortName: 'RECEIVE_SMS', description: 'Intercept incoming SMS 2FA notifications', isDangerous: true, status: 'HIGH_RISK' as const },
      { name: 'android.permission.SYSTEM_ALERT_WINDOW', shortName: 'SYSTEM_ALERT_WINDOW', description: 'Display overlay windows on top of all other apps (Tapjacking risk)', isDangerous: true, status: 'HIGH_RISK' as const },
      { name: 'android.permission.READ_PHONE_STATE', shortName: 'READ_PHONE_STATE', description: 'Access cellular identity, IMEI and phone state', isDangerous: true, status: 'HIGH_RISK' as const },
      { name: 'android.permission.ACCESS_FINE_LOCATION', shortName: 'ACCESS_FINE_LOCATION', description: 'Access precise GPS coordinates', isDangerous: true, status: 'HIGH_RISK' as const },
      { name: 'android.permission.WRITE_EXTERNAL_STORAGE', shortName: 'WRITE_EXTERNAL_STORAGE', description: 'Write cached financial statements to public SD card', isDangerous: true, status: 'HIGH_RISK' as const },
      { name: 'android.permission.USE_BIOMETRIC', shortName: 'USE_BIOMETRIC', description: 'Authenticate using fingerprint sensor', isDangerous: false, status: 'NORMAL' as const },
    ],
    components: [
      {
        name: 'com.vulnbank.mobile.MainActivity',
        type: 'activity' as const,
        exported: true,
        intentFilters: [{ actions: ['android.intent.action.MAIN'], categories: ['android.intent.category.LAUNCHER'] }],
        riskLevel: 'INFO' as const,
      },
      {
        name: 'com.vulnbank.mobile.DebugConsoleActivity',
        type: 'activity' as const,
        exported: true,
        intentFilters: [{ actions: ['com.vulnbank.action.DEBUG_DUMP'], categories: [] }],
        riskLevel: 'CRITICAL' as const,
        riskReason: 'Exported debug activity with no permission checks allows arbitrary unauthorized execution and state tampering.',
      },
      {
        name: 'com.vulnbank.mobile.auth.AuthTokenService',
        type: 'service' as const,
        exported: true,
        intentFilters: [{ actions: ['com.vulnbank.action.SYNC_TOKENS'], categories: [] }],
        riskLevel: 'HIGH' as const,
        riskReason: 'Service exported without permission restriction; third-party apps can bind and issue synchronization commands.',
      },
      {
        name: 'com.vulnbank.mobile.receiver.SmsOtpReceiver',
        type: 'receiver' as const,
        exported: true,
        intentFilters: [{ actions: ['android.provider.Telephony.SMS_RECEIVED'], categories: [] }],
        riskLevel: 'HIGH' as const,
        riskReason: 'Broadcast receiver accepts spoofed SMS_RECEIVED broadcasts from unverified sources.',
      },
      {
        name: 'com.vulnbank.mobile.provider.AccountDataProvider',
        type: 'provider' as const,
        exported: false,
        intentFilters: [],
        riskLevel: 'LOW' as const,
      },
    ],
    rawXml: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.vulnbank.mobile.secure"
    android:versionCode="104"
    android:versionName="2.4.1-beta">

    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="29" />

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.READ_SMS" />
    <uses-permission android:name="android.permission.RECEIVE_SMS" />
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
    <uses-permission android:name="android.permission.READ_PHONE_STATE" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.USE_BIOMETRIC" />

    <application
        android:label="VulnBank Mobile"
        android:icon="@mipmap/ic_launcher"
        android:debuggable="true"
        android:allowBackup="true"
        android:usesCleartextTraffic="true"
        android:networkSecurityConfig="@xml/network_security_config">

        <activity
            android:name="com.vulnbank.mobile.MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <activity
            android:name="com.vulnbank.mobile.DebugConsoleActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="com.vulnbank.action.DEBUG_DUMP" />
            </intent-filter>
        </activity>

        <service
            android:name="com.vulnbank.mobile.auth.AuthTokenService"
            android:exported="true">
            <intent-filter>
                <action android:name="com.vulnbank.action.SYNC_TOKENS" />
            </intent-filter>
        </service>

        <receiver
            android:name="com.vulnbank.mobile.receiver.SmsOtpReceiver"
            android:exported="true">
            <intent-filter>
                <action android:name="android.provider.Telephony.SMS_RECEIVED" />
            </intent-filter>
        </receiver>

        <provider
            android:name="com.vulnbank.mobile.provider.AccountDataProvider"
            android:authorities="com.vulnbank.mobile.provider"
            android:exported="false" />

    </application>
</manifest>`,
  };

  const classes = [
    {
      className: 'Lcom/vulnbank/mobile/MainActivity;',
      packageName: 'com.vulnbank.mobile',
      simpleName: 'MainActivity',
      superclass: 'Landroidx/appcompat/app/AppCompatActivity;',
      interfaces: [],
      accessFlags: ['public'],
      fields: [
        { name: 'TAG', type: 'Ljava/lang/String;', accessFlags: ['private', 'static', 'final'], value: '"VulnBankMain"' },
        { name: 'API_ENDPOINT', type: 'Ljava/lang/String;', accessFlags: ['public', 'static', 'final'], value: '"http://api.vulnbank-internal.net/v1"' },
        { name: 'AUTH_HEADER', type: 'Ljava/lang/String;', accessFlags: ['private'], value: '"Bearer test_token_prod_9921"' },
      ],
      methods: [
        {
          name: '<init>',
          signature: '()V',
          accessFlags: ['public', 'constructor'],
          parameters: [],
          returnType: 'V',
          instructions: ['.registers 1', 'invoke-direct {p0}, Landroidx/appcompat/app/AppCompatActivity;-><init>()V', 'return-void'],
        },
        {
          name: 'onCreate',
          signature: '(Landroid/os/Bundle;)V',
          accessFlags: ['protected'],
          parameters: ['Landroid/os/Bundle;'],
          returnType: 'V',
          instructions: [
            '.registers 3',
            'invoke-super {p0, p1}, Landroidx/appcompat/app/AppCompatActivity;->onCreate(Landroid/os/Bundle;)V',
            'const v0, 0x7f0b001c',
            'invoke-virtual {p0, v0}, Lcom/vulnbank/mobile/MainActivity;->setContentView(I)V',
            'const-string v1, "http://api.vulnbank-internal.net/v1/auth"',
            'invoke-static {v1}, Lcom/vulnbank/mobile/api/ApiClient;->init(Ljava/lang/String;)V',
            'return-void',
          ],
        },
        {
          name: 'verifySession',
          signature: '(Ljava/lang/String;Ljava/lang/String;)Z',
          accessFlags: ['public'],
          parameters: ['Ljava/lang/String;', 'Ljava/lang/String;'],
          returnType: 'Z',
          instructions: [
            '.registers 5',
            'const-string v0, "admin"',
            'invoke-virtual {p1, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z',
            'move-result v0',
            'if-nez v0, :cond_check_token',
            'const/4 v1, 0x1',
            'return v1',
            ':cond_check_token',
            'const/4 v1, 0x0',
            'return v1',
          ],
        },
      ],
      rawSmali: `.class public Lcom/vulnbank/mobile/MainActivity;
.super Landroidx/appcompat/app/AppCompatActivity;
.source "MainActivity.java"

# static fields
.field private static final TAG:Ljava/lang/String; = "VulnBankMain"
.field public static final API_ENDPOINT:Ljava/lang/String; = "http://api.vulnbank-internal.net/v1"
.field private AUTH_HEADER:Ljava/lang/String; = "Bearer test_token_prod_9921"

# direct methods
.method public constructor <init>()V
    .registers 1
    invoke-direct {p0}, Landroidx/appcompat/app/AppCompatActivity;-><init>()V
    return-void
.end method

.method protected onCreate(Landroid/os/Bundle;)V
    .registers 3
    invoke-super {p0, p1}, Landroidx/appcompat/app/AppCompatActivity;->onCreate(Landroid/os/Bundle;)V
    const v0, 0x7f0b001c
    invoke-virtual {p0, v0}, Lcom/vulnbank/mobile/MainActivity;->setContentView(I)V
    const-string v1, "http://api.vulnbank-internal.net/v1/auth"
    invoke-static {v1}, Lcom/vulnbank/mobile/api/ApiClient;->init(Ljava/lang/String;)V
    return-void
.end method

.method public verifySession(Ljava/lang/String;Ljava/lang/String;)Z
    .registers 5
    const-string v0, "admin"
    invoke-virtual {p1, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v0
    if-nez v0, :cond_check_token
    const/4 v1, 0x1
    return v1
    :cond_check_token
    const/4 v1, 0x0
    return v1
.end method`,
    },
    {
      className: 'Lcom/vulnbank/mobile/crypto/CryptoManager;',
      packageName: 'com.vulnbank.mobile.crypto',
      simpleName: 'CryptoManager',
      superclass: 'Ljava/lang/Object;',
      interfaces: [],
      accessFlags: ['public'],
      fields: [
        { name: 'HARDCODED_KEY', type: 'Ljava/lang/String;', accessFlags: ['private', 'static', 'final'], value: '"MyHardcodedSecretKey123!"' },
        { name: 'CIPHER_TRANSFORMATION', type: 'Ljava/lang/String;', accessFlags: ['private', 'static', 'final'], value: '"AES/ECB/PKCS5Padding"' },
      ],
      methods: [
        {
          name: '<init>',
          signature: '()V',
          accessFlags: ['public', 'constructor'],
          parameters: [],
          returnType: 'V',
          instructions: ['.registers 1', 'invoke-direct {p0}, Ljava/lang/Object;-><init>()V', 'return-void'],
        },
        {
          name: 'encryptCustomerPin',
          signature: '(Ljava/lang/String;)[B',
          accessFlags: ['public', 'static'],
          parameters: ['Ljava/lang/String;'],
          returnType: '[B',
          instructions: [
            '.registers 4',
            'const-string v0, "AES/ECB/PKCS5Padding"',
            'invoke-static {v0}, Ljavax/crypto/Cipher;->getInstance(Ljava/lang/String;)Ljavax/crypto/Cipher;',
            'move-result-object v0',
            'sget-object v1, Lcom/vulnbank/mobile/crypto/CryptoManager;->HARDCODED_KEY:Ljava/lang/String;',
            'invoke-virtual {v1}, Ljava/lang/String;->getBytes()[B',
            'move-result-object v1',
            'new-instance v2, Ljavax/crypto/spec/SecretKeySpec;',
            'const-string v3, "AES"',
            'invoke-direct {v2, v1, v3}, Ljavax/crypto/spec/SecretKeySpec;-><init>([BLjava/lang/String;)V',
            'const/4 v1, 0x1',
            'invoke-virtual {v0, v1, v2}, Ljavax/crypto/Cipher;->init(ILjava/security/Key;)V',
            'invoke-virtual {p0}, Ljava/lang/String;->getBytes()[B',
            'move-result-object p0',
            'invoke-virtual {v0, p0}, Ljavax/crypto/Cipher;->doFinal([B)[B',
            'move-result-object p0',
            'return-object p0',
          ],
        },
      ],
      rawSmali: `.class public Lcom/vulnbank/mobile/crypto/CryptoManager;
.super Ljava/lang/Object;
.source "CryptoManager.java"

# static fields
.field private static final HARDCODED_KEY:Ljava/lang/String; = "MyHardcodedSecretKey123!"
.field private static final CIPHER_TRANSFORMATION:Ljava/lang/String; = "AES/ECB/PKCS5Padding"

# direct methods
.method public constructor <init>()V
    .registers 1
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V
    return-void
.end method

.method public static encryptCustomerPin(Ljava/lang/String;)[B
    .registers 4
    const-string v0, "AES/ECB/PKCS5Padding"
    invoke-static {v0}, Ljavax/crypto/Cipher;->getInstance(Ljava/lang/String;)Ljavax/crypto/Cipher;
    move-result-object v0
    sget-object v1, Lcom/vulnbank/mobile/crypto/CryptoManager;->HARDCODED_KEY:Ljava/lang/String;
    invoke-virtual {v1}, Ljava/lang/String;->getBytes()[B
    move-result-object v1
    new-instance v2, Ljavax/crypto/spec/SecretKeySpec;
    const-string v3, "AES"
    invoke-direct {v2, v1, v3}, Ljavax/crypto/spec/SecretKeySpec;-><init>([BLjava/lang/String;)V
    const/4 v1, 0x1
    invoke-virtual {v0, v1, v2}, Ljavax/crypto/Cipher;->init(ILjava/security/Key;)V
    invoke-virtual {p0}, Ljava/lang/String;->getBytes()[B
    move-result-object p0
    invoke-virtual {v0, p0}, Ljavax/crypto/Cipher;->doFinal([B)[B
    move-result-object p0
    return-object p0
.end method`,
    },
    {
      className: 'Lcom/vulnbank/mobile/api/ApiClient;',
      packageName: 'com.vulnbank.mobile.api',
      simpleName: 'ApiClient',
      superclass: 'Ljava/lang/Object;',
      interfaces: [],
      accessFlags: ['public'],
      fields: [
        { name: 'AWS_ACCESS_KEY', type: 'Ljava/lang/String;', accessFlags: ['public', 'static', 'final'], value: '"AKIAIOSFODNN7EXAMPLE"' },
        { name: 'STRIPE_SECRET_KEY', type: 'Ljava/lang/String;', accessFlags: ['public', 'static', 'final'], value: '"sk_live_51MvWq9ABCxyz1234567890"' },
        { name: 'GOOGLE_MAPS_KEY', type: 'Ljava/lang/String;', accessFlags: ['public', 'static', 'final'], value: '"AIzaSyD-xZ1938bY93Z_0219vBka921-abc"' },
      ],
      methods: [
        {
          name: '<init>',
          signature: '()V',
          accessFlags: ['public', 'constructor'],
          parameters: [],
          returnType: 'V',
          instructions: ['.registers 1', 'invoke-direct {p0}, Ljava/lang/Object;-><init>()V', 'return-void'],
        },
      ],
      rawSmali: `.class public Lcom/vulnbank/mobile/api/ApiClient;
.super Ljava/lang/Object;
.source "ApiClient.java"

# static fields
.field public static final AWS_ACCESS_KEY:Ljava/lang/String; = "AKIAIOSFODNN7EXAMPLE"
.field public static final STRIPE_SECRET_KEY:Ljava/lang/String; = "sk_live_51MvWq9ABCxyz1234567890"
.field public static final GOOGLE_MAPS_KEY:Ljava/lang/String; = "AIzaSyD-xZ1938bY93Z_0219vBka921-abc"

.method public constructor <init>()V
    .registers 1
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V
    return-void
.end method`,
    },
    {
      className: 'Lcom/vulnbank/mobile/DebugConsoleActivity;',
      packageName: 'com.vulnbank.mobile',
      simpleName: 'DebugConsoleActivity',
      superclass: 'Landroid/app/Activity;',
      interfaces: [],
      accessFlags: ['public'],
      fields: [],
      methods: [
        {
          name: '<init>',
          signature: '()V',
          accessFlags: ['public', 'constructor'],
          parameters: [],
          returnType: 'V',
          instructions: ['.registers 1', 'invoke-direct {p0}, Landroid/app/Activity;-><init>()V', 'return-void'],
        },
        {
          name: 'dumpUserDatabase',
          signature: '()Ljava/lang/String;',
          accessFlags: ['public'],
          parameters: [],
          returnType: 'Ljava/lang/String;',
          instructions: [
            '.registers 2',
            'const-string v0, "SELECT * FROM users; SELECT * FROM transactions;"',
            'return-object v0',
          ],
        },
      ],
      rawSmali: `.class public Lcom/vulnbank/mobile/DebugConsoleActivity;
.super Landroid/app/Activity;
.source "DebugConsoleActivity.java"

.method public constructor <init>()V
    .registers 1
    invoke-direct {p0}, Landroid/app/Activity;-><init>()V
    return-void
.end method

.method public dumpUserDatabase()Ljava/lang/String;
    .registers 2
    const-string v0, "SELECT * FROM users; SELECT * FROM transactions;"
    return-object v0
.end method`,
    },
  ];

  const dex = {
    dexCount: 2,
    classesCount: 84,
    methodsCount: 420,
    stringsCount: 1940,
    classes,
    strings: [
      'AKIAIOSFODNN7EXAMPLE',
      'sk_live_51MvWq9ABCxyz1234567890',
      'AIzaSyD-xZ1938bY93Z_0219vBka921-abc',
      'http://api.vulnbank-internal.net/v1',
      'http://telemetry.vulnbank.com/log',
      '192.168.1.105',
      '10.0.2.2',
      'AES/ECB/PKCS5Padding',
      'MyHardcodedSecretKey123!',
      'SELECT * FROM users',
      'SELECT * FROM transactions',
      'Bearer test_token_prod_9921',
      '/system/bin/su',
      'which su',
      'goldfish',
      'qemu',
      'isDebuggerConnected',
      'CertificatePinner',
    ],
    interestingStrings: [
      { category: 'API_KEY' as const, value: 'AKIAIOSFODNN7EXAMPLE' },
      { category: 'API_KEY' as const, value: 'sk_live_51MvWq9ABCxyz1234567890' },
      { category: 'API_KEY' as const, value: 'AIzaSyD-xZ1938bY93Z_0219vBka921-abc' },
      { category: 'URL' as const, value: 'http://api.vulnbank-internal.net/v1' },
      { category: 'URL' as const, value: 'http://telemetry.vulnbank.com/log' },
      { category: 'IP' as const, value: '192.168.1.105' },
      { category: 'SUSPICIOUS' as const, value: 'AES/ECB/PKCS5Padding' },
      { category: 'SUSPICIOUS' as const, value: 'Bearer test_token_prod_9921' },
      { category: 'SUSPICIOUS' as const, value: 'MyHardcodedSecretKey123!' },
    ],
  };

  const files = [
    { name: 'AndroidManifest.xml', path: 'AndroidManifest.xml', size: 4892, compressedSize: 1820, isDex: false, isSmali: false, isResource: true, isNativeLib: false, isCert: false, category: 'RESOURCE' as const },
    { name: 'classes.dex', path: 'classes.dex', size: 1249024, compressedSize: 620100, isDex: true, isSmali: false, isResource: false, isNativeLib: false, isCert: false, category: 'DEX' as const },
    { name: 'classes2.dex', path: 'classes2.dex', size: 450120, compressedSize: 220010, isDex: true, isSmali: false, isResource: false, isNativeLib: false, isCert: false, category: 'DEX' as const },
    { name: 'resources.arsc', path: 'resources.arsc', size: 280190, compressedSize: 140020, isDex: false, isSmali: false, isResource: true, isNativeLib: false, isCert: false, category: 'RESOURCE' as const },
    { name: 'libvuln_crypto.so', path: 'lib/arm64-v8a/libvuln_crypto.so', size: 98120, compressedSize: 42100, isDex: false, isSmali: false, isResource: false, isNativeLib: true, isCert: false, category: 'NATIVE_LIB' as const },
    { name: 'CERT.RSA', path: 'META-INF/CERT.RSA', size: 1042, compressedSize: 890, isDex: false, isSmali: false, isResource: false, isNativeLib: false, isCert: true, category: 'CERT' as const },
    { name: 'CERT.SF', path: 'META-INF/CERT.SF', size: 2190, compressedSize: 1200, isDex: false, isSmali: false, isResource: false, isNativeLib: false, isCert: true, category: 'CERT' as const },
  ];

  const certificates = {
    present: true,
    files: ['META-INF/CERT.RSA', 'META-INF/CERT.SF', 'META-INF/MANIFEST.MF'],
    signatureAlgorithm: 'SHA256withRSA',
    issuer: 'CN=Android Debug, O=Android, C=US',
    subject: 'CN=Android Debug, O=Android, C=US',
    md5Fingerprint: '4A:8B:23:CD:91:02:11:FE:84:99:A1:00:19:44:BB:CC',
    sha1Fingerprint: 'A1:B2:C3:D4:E5:F6:01:23:45:67:89:AB:CD:EF:01:23:45:67:89:AB',
    sha256Fingerprint: '99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88',
    v1Signed: true,
    v2Signed: false,
  };

  // Enrich classes with CFG, Java, and Kotlin decompilation
  const enrichedClasses: SmaliClass[] = classes.map((c) => {
    const methods: SmaliMethod[] = c.methods.map((m) => ({
      ...m,
      cfg: buildControlFlowGraph(c.className, m.name, m.instructions),
    }));
    const baseCls = {
      ...c,
      methods,
    };
    return {
      ...baseCls,
      decompiledJava: decompileToJava(baseCls),
      decompiledKotlin: decompileToKotlin(baseCls),
    };
  });

  const enrichedDex = {
    ...dex,
    classes: enrichedClasses,
  };

  const securityAudit = runSecurityAudit(manifest, enrichedDex, true, true);
  const fridaScripts = generateFridaScripts(manifest, enrichedDex);
  const nativeAnalysis = analyzeNativeLibraries(files);
  const antiTamperRoutines = detectAntiTamperMechanisms(manifest, enrichedDex);
  const dynamicTraceLogs = generateDynamicTraceLogs(manifest, enrichedDex);
  const xrefs = extractXrefs(enrichedDex);

  const baseResult: ApkAnalysisResult = {
    fileName: 'VulnBank-v2.4.1-insecure.apk',
    fileSize: 2082286,
    fileSizeBytesFormatted: '2.08 MB',
    hashes: {
      md5: '7d29a59312c1b854a8e235a90e3f8901',
      sha1: '3df2194a028019be55aa71829e102fca918820c2',
      sha256: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
    },
    manifest,
    dex: enrichedDex,
    files,
    certificates,
    nativeAnalysis,
    antiTamperRoutines,
    dynamicTraceLogs,
    xrefs,
    securityAudit,
    fridaScripts,
    postmortemTextReport: '',
    analyzedAt: new Date().toISOString(),
  };

  baseResult.postmortemTextReport = generateDeepPostmortemTextReport(baseResult);
  return baseResult;
}
