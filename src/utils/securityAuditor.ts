/**
 * Security Auditor and OWASP MASVS Risk Scoring Engine
 * Audits Manifest configurations, permissions, exported components, DEX bytecode, and hardcoded secrets.
 */

import {
  ApkAnalysisResult,
  ManifestInfo,
  DexInfo,
  SecurityFinding,
  OwaspCategory,
  SeverityLevel,
} from '../types/apk';

export function runSecurityAudit(
  manifest: ManifestInfo,
  dex: DexInfo,
  hasNativeLibs: boolean,
  certSigned: boolean
): ApkAnalysisResult['securityAudit'] {
  const findings: SecurityFinding[] = [];

  // 1. Debuggable Flag Check (CRITICAL)
  if (manifest.debuggable) {
    findings.push({
      id: 'SEC-DBG-01',
      title: 'Application is Debuggable (android:debuggable="true")',
      severity: 'CRITICAL',
      category: 'MANIFEST',
      description:
        'The application has debug mode enabled in production. Anyone with physical access or ADB can attach a debugger (JDWP), read memory, alter runtime execution flow, and bypass all authentication checks.',
      recommendation:
        'Set android:debuggable="false" in AndroidManifest.xml and ensure release builds disable debugging in build.gradle.',
      affectedItem: 'AndroidManifest.xml -> <application>',
      cwe: 'CWE-215: Insertion of Sensitive Information Into Debugging Code',
      masvsId: 'MASVS-CODE-2',
    });
  }

  // 2. Allow Backup Flag Check (MEDIUM)
  if (manifest.allowBackup) {
    findings.push({
      id: 'SEC-BCK-02',
      title: 'Application Data Backup Enabled (android:allowBackup="true")',
      severity: 'MEDIUM',
      category: 'STORAGE',
      description:
        'Application data can be backed up via "adb backup", allowing an attacker with device access to dump SQLite databases, SharedPreferences, cache files, and private authentication tokens.',
      recommendation:
        'Set android:allowBackup="false" in <application> or define a strict backup rule XML specifying which sensitive files must be excluded.',
      affectedItem: 'AndroidManifest.xml -> <application>',
      cwe: 'CWE-312: Cleartext Storage of Sensitive Information',
      masvsId: 'MASVS-STORAGE-2',
    });
  }

  // 3. Cleartext HTTP Traffic Check (HIGH)
  if (manifest.usesCleartextTraffic) {
    findings.push({
      id: 'SEC-NET-03',
      title: 'Cleartext Traffic Permitted (android:usesCleartextTraffic="true")',
      severity: 'HIGH',
      category: 'NETWORK',
      description:
        'The app explicitly allows unencrypted HTTP connections. Network traffic, API calls, and credentials can be intercepted and modified via Man-In-The-Middle (MITM) attacks on public or compromised Wi-Fi.',
      recommendation:
        'Set android:usesCleartextTraffic="false" and enforce TLS 1.3/HTTPS across all domains with an explicit network_security_config.xml.',
      affectedItem: 'AndroidManifest.xml -> <application>',
      cwe: 'CWE-319: Cleartext Transmission of Sensitive Information',
      masvsId: 'MASVS-NETWORK-1',
    });
  }

  // 4. Exported Components without Permissions (HIGH / CRITICAL)
  const exportedComponents = manifest.components.filter((c) => c.exported);
  exportedComponents.forEach((comp, idx) => {
    if (!comp.permission) {
      const isLauncher = comp.intentFilters.some((f) =>
        f.categories.includes('android.intent.category.LAUNCHER')
      );
      if (!isLauncher) {
        findings.push({
          id: `SEC-IPC-${idx + 10}`,
          title: `Exported ${comp.type.toUpperCase()}: ${comp.name.split('.').pop()}`,
          severity: comp.type === 'activity' ? 'MEDIUM' : 'HIGH',
          category: 'IPC',
          description: `The ${comp.type} "${comp.name}" is exported (android:exported="true") without any permission constraint. Any other application installed on the device can launch this component, trigger internal logic, or inject spoofed intents.`,
          recommendation: `Set android:exported="false" unless third-party interaction is required. If required, protect with a custom signature-level permission (android:permission="...").`,
          affectedItem: comp.name,
          cwe: 'CWE-926: Improper Export of Android Application Components',
          masvsId: 'MASVS-PLATFORM-1',
        });
      }
    }
  });

  // 5. Dangerous Permissions Audit
  const dangerousPerms = manifest.permissions.filter((p) => p.isDangerous);
  if (dangerousPerms.length > 4) {
    findings.push({
      id: 'SEC-PRM-01',
      title: `Excessive Dangerous Permissions (${dangerousPerms.length} requested)`,
      severity: 'HIGH',
      category: 'PERMISSIONS',
      description: `The APK requests ${dangerousPerms.length} runtime dangerous permissions (${dangerousPerms.map((p) => p.shortName).join(', ')}). An over-privileged app increases attack surface and telemetry exposure.`,
      recommendation: 'Apply the principle of least privilege: remove unused permissions and request transient scopes where possible.',
      affectedItem: 'AndroidManifest.xml -> <uses-permission>',
      cwe: 'CWE-250: Execution with Unnecessary Privileges',
      masvsId: 'MASVS-PLATFORM-2',
    });
  }

  // Check specific high-impact permissions
  if (manifest.permissions.some((p) => p.name.includes('SYSTEM_ALERT_WINDOW'))) {
    findings.push({
      id: 'SEC-PRM-ALERT',
      title: 'Overlay Permission Granted (SYSTEM_ALERT_WINDOW)',
      severity: 'HIGH',
      category: 'PERMISSIONS',
      description: 'Overlay permission allows rendering views on top of other applications, enabling Tapjacking and credential overlay attacks.',
      recommendation: 'Remove SYSTEM_ALERT_WINDOW unless strictly required for essential foreground accessibility features.',
      affectedItem: 'android.permission.SYSTEM_ALERT_WINDOW',
      cwe: 'CWE-1021: Improper Restriction of Rendered UI Layers or Frames (Tapjacking)',
      masvsId: 'MASVS-PLATFORM-3',
    });
  }

  if (manifest.permissions.some((p) => p.name.includes('READ_SMS') || p.name.includes('RECEIVE_SMS'))) {
    findings.push({
      id: 'SEC-PRM-SMS',
      title: 'SMS Access Permission Detected (READ_SMS / RECEIVE_SMS)',
      severity: 'HIGH',
      category: 'PERMISSIONS',
      description: 'The app can read or intercept SMS messages, which could allow 2FA verification codes, banking OTPs, or private user text messages to be accessed.',
      recommendation: 'Use the official SMS Retriever API or SMS User Consent API instead of requesting raw SMS read permissions.',
      affectedItem: 'android.permission.READ_SMS',
      cwe: 'CWE-359: Exposure of Private Personal Information to an Unauthorized Actor',
      masvsId: 'MASVS-STORAGE-3',
    });
  }

  // 6. Hardcoded Secrets in DEX strings
  dex.interestingStrings.forEach((item, idx) => {
    if (item.category === 'API_KEY') {
      findings.push({
        id: `SEC-KEY-${idx + 1}`,
        title: `Hardcoded API Secret Detected: ${item.value.slice(0, 8)}...`,
        severity: 'HIGH',
        category: 'SECRETS',
        description: `Found hardcoded API secret token in compiled bytecode: "${item.value}". Anyone who decompiles this APK can extract and abuse these credentials against cloud backends.`,
        recommendation: 'Never embed raw private API keys in client-side bytecode. Use backend API proxying or Android Keystore.',
        affectedItem: item.value,
        cwe: 'CWE-798: Use of Hard-coded Credentials',
        masvsId: 'MASVS-STORAGE-1',
      });
    } else if (item.category === 'SUSPICIOUS' && (item.value.includes('AES/ECB') || item.value.includes('DES'))) {
      findings.push({
        id: `SEC-CRYP-${idx + 1}`,
        title: `Insecure Cryptographic Cipher Suite: ${item.value}`,
        severity: 'HIGH',
        category: 'CRYPTO',
        description: `Discovered reference to insecure cipher mode "${item.value}". ECB mode does not use an initialization vector (IV) and preserves plaintext patterns, making it vulnerable to replay and frequency analysis.`,
        recommendation: 'Use AES-GCM (Galois/Counter Mode) with a 256-bit key and random 96-bit IV, or Google Tink cryptographic library.',
        affectedItem: item.value,
        cwe: 'CWE-327: Use of a Broken or Risky Cryptographic Algorithm',
        masvsId: 'MASVS-CRYPTO-1',
      });
    }
  });

  // 7. Check Insecure HTTP URLs
  const insecureUrls = dex.interestingStrings.filter(
    (i) => i.category === 'URL' && i.value.startsWith('http://') && !i.value.includes('schemas.android.com') && !i.value.includes('w3.org')
  );
  if (insecureUrls.length > 0) {
    findings.push({
      id: 'SEC-URL-HTTP',
      title: `Insecure Plaintext HTTP Endpoints (${insecureUrls.length} found)`,
      severity: 'MEDIUM',
      category: 'NETWORK',
      description: `Discovered plain HTTP endpoints in bytecode strings (e.g., "${insecureUrls[0].value}"). Cleartext endpoints expose network data to eavesdropping.`,
      recommendation: 'Migrate all endpoints to TLS/HTTPS with HSTS headers.',
      affectedItem: insecureUrls.map((u) => u.value).slice(0, 3).join(', '),
      cwe: 'CWE-319: Cleartext Transmission of Sensitive Information',
      masvsId: 'MASVS-NETWORK-1',
    });
  }

  // 8. Certificate Signing Check
  if (!certSigned) {
    findings.push({
      id: 'SEC-SIG-01',
      title: 'APK Not Properly Signed or Missing Valid META-INF Signature',
      severity: 'HIGH',
      category: 'MANIFEST',
      description: 'The APK is unsigned or missing valid cryptographic certificate files in META-INF. Android devices cannot safely verify publisher identity.',
      recommendation: 'Sign APK using apksigner with Android V2/V3 signing scheme and production keystore.',
      affectedItem: 'META-INF/',
      cwe: 'CWE-347: Improper Verification of Cryptographic Signature',
      masvsId: 'MASVS-RESILIENCE-1',
    });
  }

  // 9. Root / Tamper Detection Check
  const hasAntiRoot = dex.strings.some(
    (s) => s.includes('which su') || s.includes('test-keys') || s.includes('RootBeer') || s.includes('/system/bin/su') || s.includes('magisk')
  );
  if (!hasAntiRoot) {
    findings.push({
      id: 'SEC-RESI-01',
      title: 'No Anti-Root or Integrity Defense Checks Found',
      severity: 'LOW',
      category: 'STORAGE',
      description: 'No root detection or integrity verification hooks were detected in the application bytecode. Attackers can execute Frida, Xposed, or substrate on rooted testing devices.',
      recommendation: 'Implement Google Play Integrity API or defensive checks like RootBeer to detect compromised environments.',
      affectedItem: 'Application Bytecode',
      cwe: 'CWE-693: Protection Mechanism Failure',
      masvsId: 'MASVS-RESILIENCE-2',
    });
  }

  // Calculate overall risk score (100 is best, 0 is worst)
  let score = 100;
  const criticalCount = findings.filter((f) => f.severity === 'CRITICAL').length;
  const highCount = findings.filter((f) => f.severity === 'HIGH').length;
  const mediumCount = findings.filter((f) => f.severity === 'MEDIUM').length;
  const lowCount = findings.filter((f) => f.severity === 'LOW').length;
  const infoCount = findings.filter((f) => f.severity === 'INFO').length;

  score -= criticalCount * 25;
  score -= highCount * 12;
  score -= mediumCount * 5;
  score -= lowCount * 2;
  score = Math.max(5, Math.min(100, score));

  let riskRating: SeverityLevel = 'LOW';
  if (criticalCount > 0 || score < 40) riskRating = 'CRITICAL';
  else if (highCount > 0 || score < 65) riskRating = 'HIGH';
  else if (mediumCount > 0 || score < 85) riskRating = 'MEDIUM';
  else if (score >= 90) riskRating = 'INFO';

  // OWASP MASVS Category Matrix
  const owaspMatrix: OwaspCategory[] = [
    {
      id: 'MASVS-STORAGE',
      name: 'Data Storage & Privacy',
      score: manifest.allowBackup ? 60 : 95,
      status: manifest.allowBackup ? 'WARN' : 'PASS',
      summary: manifest.allowBackup ? 'Backup enabled allows adb dumps' : 'No major storage exposure flags',
    },
    {
      id: 'MASVS-CRYPTO',
      name: 'Cryptography',
      score: findings.some((f) => f.category === 'CRYPTO') ? 40 : 90,
      status: findings.some((f) => f.category === 'CRYPTO') ? 'FAIL' : 'PASS',
      summary: findings.some((f) => f.category === 'CRYPTO') ? 'Insecure cipher modes (ECB/DES) detected' : 'Standard crypto constructs',
    },
    {
      id: 'MASVS-NETWORK',
      name: 'Network Communication',
      score: manifest.usesCleartextTraffic ? 30 : 85,
      status: manifest.usesCleartextTraffic ? 'FAIL' : 'PASS',
      summary: manifest.usesCleartextTraffic ? 'Cleartext HTTP traffic enabled' : 'Cleartext disabled by default',
    },
    {
      id: 'MASVS-PLATFORM',
      name: 'Platform Interaction & IPC',
      score: exportedComponents.length > 2 ? 50 : 85,
      status: exportedComponents.length > 2 ? 'WARN' : 'PASS',
      summary: `${exportedComponents.length} exported components exposed`,
    },
    {
      id: 'MASVS-CODE',
      name: 'Code Quality & Build Settings',
      score: manifest.debuggable ? 20 : 90,
      status: manifest.debuggable ? 'FAIL' : 'PASS',
      summary: manifest.debuggable ? 'Debuggable flag active in production' : 'Debug mode disabled',
    },
    {
      id: 'MASVS-RESILIENCE',
      name: 'Resilience & Anti-Tampering',
      score: hasAntiRoot ? 85 : 55,
      status: hasAntiRoot ? 'PASS' : 'WARN',
      summary: hasAntiRoot ? 'Root/tamper detection heuristics present' : 'No anti-root or integrity checks detected',
    },
  ];

  return {
    score,
    riskRating,
    findings,
    owaspMatrix,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    infoCount,
  };
}
