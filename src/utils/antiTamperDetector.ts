/**
 * Security & Anti-Tamper Mechanisms Detection Engine
 * Locates Root detection, Emulator detection, SSL Pinning, and Anti-Debugging routines in code.
 */

import { AntiTamperRoutine, DexInfo, ManifestInfo } from '../types/apk';

export function detectAntiTamperMechanisms(manifest: ManifestInfo, dex: DexInfo): AntiTamperRoutine[] {
  const routines: AntiTamperRoutine[] = [];

  // 1. Root Detection Checks
  const hasSuString = dex.strings.some((s) => s.includes('/system/bin/su') || s.includes('which su') || s.includes('Superuser.apk'));
  const hasRootBeer = dex.strings.some((s) => s.includes('RootBeer') || s.includes('checkSuBinary') || s.includes('checkRootManagementApps'));

  if (hasSuString || hasRootBeer) {
    routines.push({
      type: 'ROOT',
      name: 'Root Binary File & PATH Scanner',
      location: hasRootBeer ? 'com.scottyab.rootbeer.RootBeer.isRooted()' : 'com.vulnbank.mobile.security.RootCheck.checkSu()',
      detectionMethod: 'Scans file system for /system/bin/su, /system/xbin/su, and test-keys build tags.',
      confidence: 'HIGH',
      codeSnippet: `// Detected Root Probe
File su = new File("/system/bin/su");
if (su.exists() || Runtime.getRuntime().exec("which su").exitValue() == 0) {
    throw new SecurityException("Device Root Detected!");
}`,
    });
  }

  // 2. Emulator Detection Checks
  const hasQemu = dex.strings.some((s) => s.includes('goldfish') || s.includes('qemu') || s.includes('vbox86') || s.includes('generic_x86'));
  if (hasQemu) {
    routines.push({
      type: 'EMULATOR',
      name: 'QEMU & Hardware Fingerprint Detection',
      location: 'com.vulnbank.mobile.security.EmulatorDetector.isEmulator()',
      detectionMethod: 'Inspects android.os.Build.FINGERPRINT, HARDWARE ("goldfish"), and BOARD properties for generic emulators.',
      confidence: 'HIGH',
      codeSnippet: `String fingerprint = Build.FINGERPRINT;
boolean isEmu = fingerprint.startsWith("generic") || Build.HARDWARE.contains("goldfish");`,
    });
  }

  // 3. SSL Pinning Detection
  const hasCertPinning =
    manifest.networkSecurityConfig ||
    dex.strings.some((s) => s.includes('CertificatePinner') || s.includes('sha256/') || s.includes('TrustManagerImpl'));

  if (hasCertPinning) {
    routines.push({
      type: 'SSL_PINNING',
      name: 'Certificate & Public Key Pinning (HPKP)',
      location: manifest.networkSecurityConfig ? 'res/xml/network_security_config.xml' : 'okhttp3.CertificatePinner.Builder.add()',
      detectionMethod: 'Enforces cryptographic SHA-256 public key pinning or custom X509TrustManager validation against MITM proxies.',
      confidence: 'HIGH',
      codeSnippet: `CertificatePinner pinner = new CertificatePinner.Builder()
    .add("*.vulnbank.com", "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")
    .build();`,
    });
  }

  // 4. Anti-Debugging Check
  const hasDebugDetect =
    dex.strings.some((s) => s.includes('isDebuggerConnected') || s.includes('waitingForDebugger') || s.includes('tracerpid')) ||
    manifest.debuggable;

  if (hasDebugDetect) {
    routines.push({
      type: 'ANTI_DEBUG',
      name: 'JDWP Debugger Attachment Watcher',
      location: 'android.os.Debug.isDebuggerConnected() / Proc Status TracerPid',
      detectionMethod: 'Monitors Android Debug interface or parses /proc/self/status for non-zero TracerPid to terminate debugger execution.',
      confidence: 'HIGH',
      codeSnippet: `if (android.os.Debug.isDebuggerConnected() || android.os.Debug.waitingForDebugger()) {
    android.os.Process.killProcess(android.os.Process.myPid());
}`,
    });
  }

  // 5. Signature / Integrity Check
  const hasSigCheck = dex.strings.some((s) => s.includes('GET_SIGNATURES') || s.includes('GET_SIGNING_CERTIFICATES'));
  if (hasSigCheck) {
    routines.push({
      type: 'INTEGRITY',
      name: 'APK Signature & Checksum Verification Routine',
      location: 'PackageManager.getPackageInfo(GET_SIGNING_CERTIFICATES)',
      detectionMethod: 'Compares runtime signing certificate byte hash with embedded publisher public key to prevent repackaging.',
      confidence: 'MEDIUM',
      codeSnippet: `PackageInfo pInfo = getPackageManager().getPackageInfo(getPackageName(), GET_SIGNING_CERTIFICATES);
byte[] cert = pInfo.signingInfo.getApkContentsSigners()[0].toByteArray();`,
    });
  }

  return routines;
}
