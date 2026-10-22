/**
 * Unit Tests for APK Reverse Engineering & Analysis Pipeline
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAndroidManifest } from './axmlParser';
import { scanInterestingStrings } from './dexParser';
import { runSecurityAudit } from './securityAuditor';
import { generateFridaScripts } from './fridaGenerator';
import { generateDeepPostmortemTextReport } from './reportGenerator';
import { formatBytes } from './apkAnalyzer';
import { getVulnBankDemoApk } from './demoApkData';

test('formatBytes formats file sizes correctly', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(1024), '1 KB');
  assert.equal(formatBytes(1048576), '1 MB');
  assert.equal(formatBytes(20971520), '20 MB');
});

test('parseAndroidManifest parses plain text XML manifest with components & permissions', () => {
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.test.app"
    android:versionCode="42"
    android:versionName="1.4.2">
    <uses-sdk android:minSdkVersion="24" android:targetSdkVersion="34" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.CAMERA" />
    <application android:debuggable="true" android:allowBackup="true" android:usesCleartextTraffic="true">
        <activity android:name="com.test.app.MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        <service android:name="com.test.app.SecretService" android:exported="true" />
    </application>
</manifest>`;

  const buffer = new TextEncoder().encode(xml);
  const result = parseAndroidManifest(buffer);

  assert.equal(result.packageName, 'com.test.app');
  assert.equal(result.versionCode, '42');
  assert.equal(result.versionName, '1.4.2');
  assert.equal(result.debuggable, true);
  assert.equal(result.allowBackup, true);
  assert.equal(result.usesCleartextTraffic, true);

  assert.equal(result.permissions.length, 2);
  const cameraPerm = result.permissions.find((p) => p.name === 'android.permission.CAMERA');
  assert.ok(cameraPerm);
  assert.equal(cameraPerm?.isDangerous, true);

  assert.equal(result.components.length, 2);
  const serviceComp = result.components.find((c) => c.name === 'com.test.app.SecretService');
  assert.ok(serviceComp);
  assert.equal(serviceComp?.exported, true);
});

test('scanInterestingStrings detects API keys, URLs, IPs, and crypto flags', () => {
  const sampleStrings = [
    'AIzaSyD-xZ1938bY93Z_0219vBka921-abc',
    'AKIAIOSFODNN7EXAMPLE',
    'https://api.secure-gateway.com/v1/auth',
    'http://insecure-backend.internal/dump',
    '192.168.1.100',
    'AES/ECB/PKCS5Padding',
    'regular_string_here',
  ];

  const interesting = scanInterestingStrings(sampleStrings);
  assert.ok(interesting.length >= 5);

  const googleKey = interesting.find((i) => i.value === 'AIzaSyD-xZ1938bY93Z_0219vBka921-abc');
  assert.ok(googleKey);
  assert.equal(googleKey?.category, 'API_KEY');

  const awsKey = interesting.find((i) => i.value === 'AKIAIOSFODNN7EXAMPLE');
  assert.ok(awsKey);
  assert.equal(awsKey?.category, 'API_KEY');

  const cryptoUsage = interesting.find((i) => i.value === 'AES/ECB/PKCS5Padding');
  assert.ok(cryptoUsage);
  assert.equal(cryptoUsage?.category, 'SUSPICIOUS');
});

test('runSecurityAudit flags critical debuggable and exported component issues', () => {
  const manifest = {
    packageName: 'com.vulnerable.bank',
    versionCode: '1',
    versionName: '1.0',
    minSdkVersion: '21',
    targetSdkVersion: '30',
    appLabel: 'Test Bank',
    debuggable: true,
    allowBackup: true,
    usesCleartextTraffic: true,
    permissions: [
      { name: 'android.permission.READ_SMS', shortName: 'READ_SMS', description: 'Read SMS', isDangerous: true, status: 'HIGH_RISK' as const },
      { name: 'android.permission.SYSTEM_ALERT_WINDOW', shortName: 'SYSTEM_ALERT_WINDOW', description: 'Overlay', isDangerous: true, status: 'HIGH_RISK' as const },
    ],
    components: [
      { name: 'com.vulnerable.bank.MainActivity', type: 'activity' as const, exported: true, intentFilters: [{ actions: ['android.intent.action.MAIN'], categories: ['android.intent.category.LAUNCHER'] }], riskLevel: 'INFO' as const },
      { name: 'com.vulnerable.bank.BackdoorService', type: 'service' as const, exported: true, intentFilters: [], riskLevel: 'HIGH' as const },
    ],
    rawXml: '<manifest></manifest>',
  };

  const dex = {
    dexCount: 1,
    classesCount: 10,
    methodsCount: 50,
    stringsCount: 100,
    classes: [],
    strings: [],
    interestingStrings: [
      { category: 'API_KEY' as const, value: 'AKIAIOSFODNN7EXAMPLE' },
      { category: 'SUSPICIOUS' as const, value: 'AES/ECB/PKCS5Padding' },
    ],
  };

  const audit = runSecurityAudit(manifest, dex, true, true);
  assert.equal(audit.riskRating, 'CRITICAL');
  assert.ok(audit.criticalCount >= 1);
  assert.ok(audit.score < 50);

  const debugFinding = audit.findings.find((f) => f.id === 'SEC-DBG-01');
  assert.ok(debugFinding);
  assert.equal(debugFinding?.severity, 'CRITICAL');

  const cipherFinding = audit.findings.find((f) => f.title.includes('Insecure Cryptographic Cipher Suite'));
  assert.ok(cipherFinding);
});

test('generateFridaScripts creates SSL pinning and Anti-root scripts tailored to package', () => {
  const demo = getVulnBankDemoApk();
  const scripts = generateFridaScripts(demo.manifest, demo.dex);

  assert.ok(scripts.length >= 3);
  const sslScript = scripts.find((s) => s.category === 'SSL_PINNING');
  assert.ok(sslScript);
  assert.ok(sslScript?.code.includes('com.vulnbank.mobile.secure'));
  assert.ok(sslScript?.code.includes('TrustManagerImpl'));

  const rootScript = scripts.find((s) => s.category === 'ROOT_BYPASS');
  assert.ok(rootScript);
  assert.ok(rootScript?.code.includes('su'));
});

test('generateDeepPostmortemTextReport produces a complete dossier covering all sections', () => {
  const demo = getVulnBankDemoApk();
  const report = generateDeepPostmortemTextReport(demo);

  assert.ok(report.includes('APK POSTMORTEM & STATIC REVERSE ENGINEERING AUDIT REPORT'));
  assert.ok(report.includes('MD5 Checksum'));
  assert.ok(report.includes('SHA-256 Checksum'));
  assert.ok(report.includes('com.vulnbank.mobile.secure'));
  assert.ok(report.includes('OWASP MASVS COMPLIANCE CHECKLIST'));
  assert.ok(report.includes('ANDROID PERMISSIONS POSTMORTEM'));
  assert.ok(report.includes('APPLICATION COMPONENTS INVENTORY'));
  assert.ok(report.includes('COMPLETE SMALI DISASSEMBLY & DECOMPILED JAVA SOURCE'));
  assert.ok(report.includes('NATIVE LIBRARIES & EXPORTED JNI SYMBOLS'));
  assert.ok(report.includes('ANTI-TAMPER & SECURITY MECHANISMS POSTMORTEM'));
  assert.ok(report.includes('SENSITIVE APIS CROSS-REFERENCES (XREFs)'));
  assert.ok(report.includes('DYNAMIC BEHAVIORAL EXECUTION TRACE LOGS'));
  assert.ok(report.includes('FRIDA DYNAMIC INSTRUMENTATION PLAYBOOKS'));
  assert.ok(report.includes('DECODED ANDROIDMANIFEST.XML'));
});

test('buildControlFlowGraph correctly partitions basic blocks and branches', async () => {
  const { buildControlFlowGraph } = await import('./cfgBuilder');
  const instructions = [
    '.registers 3',
    'const-string v0, "admin"',
    'invoke-virtual {p1, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z',
    'move-result v0',
    'if-nez v0, :cond_check',
    'const/4 v1, 0x1',
    'return v1',
    ':cond_check',
    'const/4 v1, 0x0',
    'return v1',
  ];

  const cfg = buildControlFlowGraph('Lcom/example/Test;', 'verify', instructions);
  assert.equal(cfg.className, 'Lcom/example/Test;');
  assert.equal(cfg.methodName, 'verify');
  assert.ok(cfg.nodes.length >= 3);

  const conditionNode = cfg.nodes.find((n) => n.type === 'condition');
  assert.ok(conditionNode);
  assert.ok(conditionNode?.branches && conditionNode.branches.length === 2);
});

test('decompileToJava and decompileToKotlin produce structured high-level code', async () => {
  const { decompileToJava, decompileToKotlin } = await import('./decompiler');
  const sampleClass = {
    className: 'Lcom/example/App;',
    packageName: 'com.example',
    simpleName: 'App',
    superclass: 'Landroid/app/Activity;',
    accessFlags: ['public'],
    fields: [{ name: 'KEY', type: 'Ljava/lang/String;', accessFlags: ['private', 'static', 'final'], value: '"secret123"' }],
    methods: [
      {
        name: 'onCreate',
        signature: '(Landroid/os/Bundle;)V',
        accessFlags: ['public'],
        parameters: ['Landroid/os/Bundle;'],
        returnType: 'V',
        instructions: ['const-string v0, "Welcome"', 'return-void'],
      },
    ],
  };

  const javaCode = decompileToJava(sampleClass);
  assert.ok(javaCode.includes('public class App extends Activity'));
  assert.ok(javaCode.includes('private static final String KEY = "secret123";'));
  assert.ok(javaCode.includes('onCreate(Bundle param1)'));

  const kotlinCode = decompileToKotlin(sampleClass);
  assert.ok(kotlinCode.includes('open class App : Activity()'));
  assert.ok(kotlinCode.includes('const val KEY: String = "secret123"'));
});

test('analyzeNativeLibraries extracts exported JNI functions and symbols', async () => {
  const { analyzeNativeLibraries } = await import('./nativeAnalyzer');
  const files = [
    {
      name: 'libvuln_crypto.so',
      path: 'lib/arm64-v8a/libvuln_crypto.so',
      size: 98120,
      compressedSize: 42100,
      isDex: false,
      isSmali: false,
      isResource: false,
      isNativeLib: true,
      isCert: false,
      category: 'NATIVE_LIB' as const,
    },
  ];

  const result = analyzeNativeLibraries(files);
  assert.equal(result.length, 1);
  assert.equal(result[0].libraryName, 'libvuln_crypto.so');
  assert.equal(result[0].arch, 'arm64-v8a');
  assert.ok(result[0].jniFunctions.length >= 2);
  assert.ok(result[0].jniFunctions.some((j) => j.name.includes('Java_com_')));
});

test('detectAntiTamperMechanisms pinpoints Root, Emulator, and SSL Pinning locations', async () => {
  const { detectAntiTamperMechanisms } = await import('./antiTamperDetector');
  const demo = getVulnBankDemoApk();
  const routines = detectAntiTamperMechanisms(demo.manifest, demo.dex);

  assert.ok(routines.length >= 3);
  const rootRoutine = routines.find((r) => r.type === 'ROOT');
  assert.ok(rootRoutine);
  assert.ok(rootRoutine?.location.length > 0);

  const sslRoutine = routines.find((r) => r.type === 'SSL_PINNING');
  assert.ok(sslRoutine);
});

test('extractXrefs maps sensitive API call-sites and callers', async () => {
  const { extractXrefs } = await import('./xrefExtractor');
  const demo = getVulnBankDemoApk();
  const xrefs = extractXrefs(demo.dex);

  assert.ok(xrefs.length >= 4);
  const cryptoXref = xrefs.find((x) => x.category === 'CRYPTO');
  assert.ok(cryptoXref);
  assert.ok(cryptoXref?.callers.length >= 1);
  assert.ok(cryptoXref?.callers[0].className.includes('CryptoManager'));
});

test('generateApktoolYml creates valid apktool.yml structure with sdkInfo and packageInfo', async () => {
  const { generateApktoolYml } = await import('./apktoolYmlGenerator');
  const demo = getVulnBankDemoApk();
  const yml = generateApktoolYml(demo);

  assert.ok(yml.includes('version: 2.11.0'));
  assert.ok(yml.includes(`cur_package: ${demo.manifest.packageName}`));
  assert.ok(yml.includes(`minSdkVersion: '${demo.manifest.minSdkVersion}'`));
  assert.ok(yml.includes(`targetSdkVersion: '${demo.manifest.targetSdkVersion}'`));
  assert.ok(yml.includes('compressionType: false'));
  assert.ok(yml.includes('doNotCompress:'));
  assert.ok(yml.includes('- png'));
  assert.ok(yml.includes('- arsc'));
});

test('generateAdbCommands formulates shell intent commands for all components', async () => {
  const { generateAdbCommands } = await import('./adbCommandGenerator');
  const demo = getVulnBankDemoApk();
  const adbList = generateAdbCommands(demo.manifest);

  assert.ok(adbList.length >= 4);
  const mainLaunch = adbList.find((cmd) => cmd.command.includes('am start') && cmd.isExported);
  assert.ok(mainLaunch);
  assert.ok(mainLaunch?.command.includes(`-n ${demo.manifest.packageName}/`));

  const diagDump = adbList.find((cmd) => cmd.category === 'DIAGNOSTIC');
  assert.ok(diagDump);
  assert.ok(diagDump?.command.includes(`dumpsys package ${demo.manifest.packageName}`));
});

test('compareApks detects differences between two APK versions', async () => {
  const { compareApks } = await import('./apkDiffEngine');
  const demo1 = getVulnBankDemoApk();
  // Create simulated modded APK
  const demo2 = {
    ...demo1,
    fileName: 'VulnBank_v1.0.1_mod.apk',
    fileSize: demo1.fileSize + 250000,
    fileSizeBytesFormatted: '16.4 MB',
    manifest: {
      ...demo1.manifest,
      versionCode: '101',
      versionName: '1.0.1',
      debuggable: false,
      permissions: [
        ...demo1.manifest.permissions,
        {
          name: 'android.permission.RECORD_AUDIO',
          shortName: 'RECORD_AUDIO',
          description: 'Record audio from microphone',
          isDangerous: true,
          status: 'HIGH_RISK' as const,
        },
      ],
      components: [
        ...demo1.manifest.components,
        {
          name: 'com.vulnbank.mobile.secure.ui.ModSettingsActivity',
          type: 'activity' as const,
          exported: true,
          intentFilters: [],
          riskLevel: 'INFO' as const,
        },
      ],
    },
    dex: {
      ...demo1.dex,
      classesCount: demo1.dex.classesCount + 2,
    },
  };

  const diff = compareApks(demo1, demo2);
  assert.equal(diff.oldApkName, demo1.fileName);
  assert.equal(diff.newApkName, demo2.fileName);
  assert.ok(diff.sizeDeltaFormatted.startsWith('+'));
  assert.equal(diff.addedPermissions.length, 1);
  assert.equal(diff.addedPermissions[0].shortName, 'RECORD_AUDIO');
  assert.equal(diff.addedComponents.length, 1);
  assert.equal(diff.addedComponents[0].name, 'com.vulnbank.mobile.secure.ui.ModSettingsActivity');
  assert.equal(diff.classesCountDelta, 2);
  const changedFlags = diff.securityFlagsDiff.filter((f: { changed: boolean }) => f.changed);
  assert.equal(changedFlags.length, 1);
});

test('extractResourcesInventory generates strings, drawables, layouts, and colors', async () => {
  const { extractResourcesInventory } = await import('./resourceExtractor');
  const demo = getVulnBankDemoApk();
  const resources = extractResourcesInventory(demo);

  assert.ok(resources.strings.length > 5);
  assert.ok(resources.stringsXmlFormatted.includes('<resources>'));
  assert.ok(resources.drawables.length > 3);
  assert.ok(resources.layouts.length > 2);
  assert.ok(resources.colors.length > 3);
});

