/**
 * Additional presets for SecureVault and NeoGame demo profiles
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

export function getSecureVaultDemoApk(): ApkAnalysisResult {
  const manifest = {
    packageName: 'org.securevault.encrypted.messenger',
    versionCode: '320',
    versionName: '3.2.0',
    minSdkVersion: '26',
    targetSdkVersion: '34',
    appLabel: 'SecureVault Messenger',
    debuggable: false,
    allowBackup: false,
    usesCleartextTraffic: false,
    networkSecurityConfig: '@xml/network_security_config',
    permissions: [
      { name: 'android.permission.INTERNET', shortName: 'INTERNET', description: 'Encrypted network communication', isDangerous: false, status: 'NORMAL' as const },
      { name: 'android.permission.USE_BIOMETRIC', shortName: 'USE_BIOMETRIC', description: 'Biometric authorization', isDangerous: false, status: 'NORMAL' as const },
      { name: 'android.permission.CAMERA', shortName: 'CAMERA', description: 'Scan QR codes for end-to-end device linking', isDangerous: true, status: 'HIGH_RISK' as const },
    ],
    components: [
      {
        name: 'org.securevault.ui.SplashActivity',
        type: 'activity' as const,
        exported: true,
        intentFilters: [{ actions: ['android.intent.action.MAIN'], categories: ['android.intent.category.LAUNCHER'] }],
        riskLevel: 'INFO' as const,
      },
      {
        name: 'org.securevault.ui.ChatActivity',
        type: 'activity' as const,
        exported: false,
        intentFilters: [],
        riskLevel: 'LOW' as const,
      },
      {
        name: 'org.securevault.service.EncryptedPushService',
        type: 'service' as const,
        exported: false,
        intentFilters: [],
        riskLevel: 'LOW' as const,
      },
    ],
    rawXml: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="org.securevault.encrypted.messenger"
    android:versionCode="320"
    android:versionName="3.2.0">
    <uses-sdk android:minSdkVersion="26" android:targetSdkVersion="34" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.USE_BIOMETRIC" />
    <uses-permission android:name="android.permission.CAMERA" />
    <application
        android:label="SecureVault Messenger"
        android:debuggable="false"
        android:allowBackup="false"
        android:usesCleartextTraffic="false">
        <activity android:name="org.securevault.ui.SplashActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        <activity android:name="org.securevault.ui.ChatActivity" android:exported="false" />
    </application>
</manifest>`,
  };

  const classes = [
    {
      className: 'Lorg/securevault/crypto/SignalProtocolManager;',
      packageName: 'org.securevault.crypto',
      simpleName: 'SignalProtocolManager',
      superclass: 'Ljava/lang/Object;',
      interfaces: [],
      accessFlags: ['public', 'final'],
      fields: [{ name: 'CIPHER_SUITE', type: 'Ljava/lang/String;', accessFlags: ['private', 'static', 'final'], value: '"AES-256-GCM"' }],
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
      rawSmali: `.class public final Lorg/securevault/crypto/SignalProtocolManager;
.super Ljava/lang/Object;
.source "SignalProtocolManager.java"

# static fields
.field private static final CIPHER_SUITE:Ljava/lang/String; = "AES-256-GCM"

.method public constructor <init>()V
    .registers 1
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V
    return-void
.end method`,
    },
  ];

  const dex = {
    dexCount: 1,
    classesCount: 142,
    methodsCount: 890,
    stringsCount: 4200,
    classes,
    strings: ['AES-256-GCM', 'https://api.securevault.org/v2/handshake', 'RootBeer checkSUBinary'],
    interestingStrings: [
      { category: 'URL' as const, value: 'https://api.securevault.org/v2/handshake' },
    ],
  };

  const files = [
    { name: 'AndroidManifest.xml', path: 'AndroidManifest.xml', size: 3100, compressedSize: 1200, isDex: false, isSmali: false, isResource: true, isNativeLib: false, isCert: false, category: 'RESOURCE' as const },
    { name: 'classes.dex', path: 'classes.dex', size: 2190300, compressedSize: 1100200, isDex: true, isSmali: false, isResource: false, isNativeLib: false, isCert: false, category: 'DEX' as const },
    { name: 'CERT.RSA', path: 'META-INF/CERT.RSA', size: 1240, compressedSize: 990, isDex: false, isSmali: false, isResource: false, isNativeLib: false, isCert: true, category: 'CERT' as const },
  ];

  const certificates = {
    present: true,
    files: ['META-INF/CERT.RSA', 'META-INF/CERT.SF'],
    signatureAlgorithm: 'SHA256withECDSA',
    issuer: 'CN=SecureVault Corp, O=SecureVault Security, C=CH',
    subject: 'CN=SecureVault Corp, O=SecureVault Security, C=CH',
    sha1Fingerprint: 'B4:12:88:99:AA:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE',
    sha256Fingerprint: 'F1:E2:D3:C4:B5:A6:97:88:79:6A:5B:4C:3D:2E:1F:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF',
    v1Signed: true,
    v2Signed: true,
  };

  const enrichedClasses: SmaliClass[] = classes.map((c) => {
    const methods: SmaliMethod[] = c.methods.map((m) => ({
      ...m,
      cfg: buildControlFlowGraph(c.className, m.name, m.instructions),
    }));
    const base = { ...c, methods };
    return {
      ...base,
      decompiledJava: decompileToJava(base),
      decompiledKotlin: decompileToKotlin(base),
    };
  });

  const enrichedDex = {
    ...dex,
    classes: enrichedClasses,
  };

  const securityAudit = runSecurityAudit(manifest, enrichedDex, false, true);
  const fridaScripts = generateFridaScripts(manifest, enrichedDex);
  const nativeAnalysis = analyzeNativeLibraries(files);
  const antiTamperRoutines = detectAntiTamperMechanisms(manifest, enrichedDex);
  const dynamicTraceLogs = generateDynamicTraceLogs(manifest, enrichedDex);
  const xrefs = extractXrefs(enrichedDex);

  const baseResult: ApkAnalysisResult = {
    fileName: 'SecureVault-v3.2.0-release.apk',
    fileSize: 3192800,
    fileSizeBytesFormatted: '3.19 MB',
    hashes: {
      md5: '88c1b92019efaa4001928374a5e12019',
      sha1: '99281a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f',
      sha256: 'a1b2c3d4e5f60123456789abcdef0123456789abcdef0123456789abcdef0123',
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

export function getNeoGameDemoApk(): ApkAnalysisResult {
  const manifest = {
    packageName: 'com.neostudio.game.controller3d',
    versionCode: '501',
    versionName: '5.0.1',
    minSdkVersion: '23',
    targetSdkVersion: '33',
    appLabel: 'NeoGame 3D Controller',
    debuggable: false,
    allowBackup: true,
    usesCleartextTraffic: true,
    permissions: [
      { name: 'android.permission.INTERNET', shortName: 'INTERNET', description: 'Multiplayer game matchmaking', isDangerous: false, status: 'NORMAL' as const },
      { name: 'android.permission.BLUETOOTH', shortName: 'BLUETOOTH', description: 'Gamepad controller connection', isDangerous: false, status: 'NORMAL' as const },
      { name: 'android.permission.ACCESS_FINE_LOCATION', shortName: 'ACCESS_FINE_LOCATION', description: 'Nearby Bluetooth beacon discovery', isDangerous: true, status: 'HIGH_RISK' as const },
    ],
    components: [
      {
        name: 'com.unity3d.player.UnityPlayerActivity',
        type: 'activity' as const,
        exported: true,
        intentFilters: [{ actions: ['android.intent.action.MAIN'], categories: ['android.intent.category.LAUNCHER'] }],
        riskLevel: 'INFO' as const,
      },
    ],
    rawXml: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.neostudio.game.controller3d"
    android:versionCode="501"
    android:versionName="5.0.1">
    <uses-sdk android:minSdkVersion="23" android:targetSdkVersion="33" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.BLUETOOTH" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <application
        android:label="NeoGame 3D Controller"
        android:debuggable="false"
        android:allowBackup="true"
        android:usesCleartextTraffic="true">
        <activity android:name="com.unity3d.player.UnityPlayerActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`,
  };

  const classes = [
    {
      className: 'Lcom/neostudio/game/NativeBridge;',
      packageName: 'com.neostudio.game',
      simpleName: 'NativeBridge',
      superclass: 'Ljava/lang/Object;',
      interfaces: [],
      accessFlags: ['public'],
      fields: [],
      methods: [
        {
          name: 'initNativeEngine',
          signature: '(I)V',
          accessFlags: ['public', 'native'],
          parameters: ['I'],
          returnType: 'V',
          instructions: ['.registers 2', '# Native C++ JNI binding in libgame_engine.so'],
        },
      ],
      rawSmali: `.class public Lcom/neostudio/game/NativeBridge;
.super Ljava/lang/Object;
.source "NativeBridge.java"

.method public native initNativeEngine(I)V
.end method`,
    },
  ];

  const dex = {
    dexCount: 1,
    classesCount: 65,
    methodsCount: 380,
    stringsCount: 2200,
    classes,
    strings: ['http://game-telemetry.neostudio.net/event', 'libgame_engine.so'],
    interestingStrings: [
      { category: 'URL' as const, value: 'http://game-telemetry.neostudio.net/event' },
    ],
  };

  const files = [
    { name: 'AndroidManifest.xml', path: 'AndroidManifest.xml', size: 2800, compressedSize: 1100, isDex: false, isSmali: false, isResource: true, isNativeLib: false, isCert: false, category: 'RESOURCE' as const },
    { name: 'classes.dex', path: 'classes.dex', size: 1450200, compressedSize: 720100, isDex: true, isSmali: false, isResource: false, isNativeLib: false, isCert: false, category: 'DEX' as const },
    { name: 'libgame_engine.so', path: 'lib/arm64-v8a/libgame_engine.so', size: 14890200, compressedSize: 7100200, isDex: false, isSmali: false, isResource: false, isNativeLib: true, isCert: false, category: 'NATIVE_LIB' as const },
    { name: 'libgame_engine.so', path: 'lib/armeabi-v7a/libgame_engine.so', size: 11200100, compressedSize: 5400200, isDex: false, isSmali: false, isResource: false, isNativeLib: true, isCert: false, category: 'NATIVE_LIB' as const },
    { name: 'libgame_engine.so', path: 'lib/x86_64/libgame_engine.so', size: 15100200, compressedSize: 7200200, isDex: false, isSmali: false, isResource: false, isNativeLib: true, isCert: false, category: 'NATIVE_LIB' as const },
  ];

  const certificates = {
    present: true,
    files: ['META-INF/CERT.RSA'],
    v1Signed: true,
    v2Signed: false,
    signatureAlgorithm: 'SHA256withRSA',
  };

  const enrichedClasses: SmaliClass[] = classes.map((c) => {
    const methods: SmaliMethod[] = c.methods.map((m) => ({
      ...m,
      cfg: buildControlFlowGraph(c.className, m.name, m.instructions),
    }));
    const base = { ...c, methods };
    return {
      ...base,
      decompiledJava: decompileToJava(base),
      decompiledKotlin: decompileToKotlin(base),
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
    fileName: 'NeoGame-3D-v5.0.1.apk',
    fileSize: 32640000,
    fileSizeBytesFormatted: '32.64 MB',
    hashes: {
      md5: '99aa88bb77cc66dd55ee44ff33221100',
      sha1: '11223344556677889900aabbccddeeff00112233',
      sha256: '445566778899aabbccddeeff00112233445566778899aabbccddeeff00112233',
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
