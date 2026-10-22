/**
 * Deep Postmortem Text & Markdown Report Generator
 * Generates an exhaustive forensic dossier of the APK ("every single thing")
 * including smali disassembly index, manifest, security findings, strings, and components.
 */

import { ApkAnalysisResult } from '../types/apk';

export function generateDeepPostmortemTextReport(data: ApkAnalysisResult): string {
  const lineSeparator = '='.repeat(84);
  const subSeparator = '-'.repeat(84);

  const lines: string[] = [];

  // 1. ASCII Header & Metadata
  lines.push(lineSeparator);
  lines.push('       APK POSTMORTEM & STATIC REVERSE ENGINEERING AUDIT REPORT');
  lines.push('             UNIVERSAL SECURITY & SMALI FORENSIC DOSSIER');
  lines.push(lineSeparator);
  lines.push(`Generated On        : ${data.analyzedAt}`);
  lines.push(`Target File         : ${data.fileName}`);
  lines.push(`File Size           : ${data.fileSizeBytesFormatted} (${data.fileSize} bytes)`);
  lines.push(`MD5 Checksum        : ${data.hashes.md5}`);
  lines.push(`SHA-1 Checksum      : ${data.hashes.sha1}`);
  lines.push(`SHA-256 Checksum    : ${data.hashes.sha256}`);
  lines.push(`Package Name        : ${data.manifest.packageName}`);
  lines.push(`App Label           : ${data.manifest.appLabel}`);
  lines.push(`Version Code / Name : ${data.manifest.versionCode} / ${data.manifest.versionName}`);
  lines.push(`Min / Target SDK    : Android API ${data.manifest.minSdkVersion} / Android API ${data.manifest.targetSdkVersion}`);
  lines.push(`Overall Risk Score  : ${data.securityAudit.score} / 100 [RATING: ${data.securityAudit.riskRating}]`);
  lines.push(lineSeparator);
  lines.push('');

  // 2. Executive Forensic Summary
  lines.push('[ 1. EXECUTIVE POSTMORTEM SUMMARY ]');
  lines.push(subSeparator);
  lines.push(`Vulnerabilities Found : ${data.securityAudit.findings.length} Total`);
  lines.push(`  - CRITICAL          : ${data.securityAudit.criticalCount}`);
  lines.push(`  - HIGH              : ${data.securityAudit.highCount}`);
  lines.push(`  - MEDIUM            : ${data.securityAudit.mediumCount}`);
  lines.push(`  - LOW / INFO        : ${data.securityAudit.lowCount + data.securityAudit.infoCount}`);
  lines.push('');
  lines.push(`Application Flags:`);
  lines.push(`  - Debuggable        : ${data.manifest.debuggable ? 'YES [CRITICAL RISK - ADB Debugger Attachment Enabled]' : 'NO (Secure)'}`);
  lines.push(`  - Allow Backup      : ${data.manifest.allowBackup ? 'YES [RISK - Data extraction via adb backup enabled]' : 'NO (Disabled)'}`);
  lines.push(`  - Cleartext Traffic : ${data.manifest.usesCleartextTraffic ? 'YES [HIGH RISK - Unencrypted HTTP Allowed]' : 'NO (Enforced TLS)'}`);
  lines.push(`  - V1/V2 Signed      : ${data.certificates.present ? 'Valid Signatures Found' : 'Unsigned / Invalid META-INF'}`);
  lines.push('');

  // 3. OWASP MASVS Assessment
  lines.push('[ 2. OWASP MASVS COMPLIANCE CHECKLIST ]');
  lines.push(subSeparator);
  data.securityAudit.owaspMatrix.forEach((cat) => {
    const padName = cat.name.padEnd(30, ' ');
    lines.push(`[${cat.status.padEnd(4, ' ')}] ${cat.id} - ${padName} : Score ${cat.score}/100`);
    lines.push(`       Summary: ${cat.summary}`);
  });
  lines.push('');

  // 4. Detailed Security Findings
  lines.push('[ 3. DETAILED SECURITY FINDINGS & VULNERABILITY AUDIT ]');
  lines.push(subSeparator);
  if (data.securityAudit.findings.length === 0) {
    lines.push('No critical vulnerabilities detected based on current static heuristic rules.');
  } else {
    data.securityAudit.findings.forEach((finding, idx) => {
      lines.push(`[FINDING #${idx + 1}] [${finding.severity}] ${finding.title}`);
      lines.push(`  Category       : ${finding.category}`);
      if (finding.masvsId) lines.push(`  MASVS / CWE    : ${finding.masvsId} | ${finding.cwe || 'N/A'}`);
      if (finding.affectedItem) lines.push(`  Affected Item  : ${finding.affectedItem}`);
      lines.push(`  Description    : ${finding.description}`);
      lines.push(`  Remediation    : ${finding.recommendation}`);
      lines.push('');
    });
  }

  // 5. Permissions Deep Audit
  lines.push('[ 4. ANDROID PERMISSIONS POSTMORTEM ]');
  lines.push(subSeparator);
  lines.push(`Total Permissions Declared: ${data.manifest.permissions.length}`);
  if (data.manifest.permissions.length === 0) {
    lines.push('  No <uses-permission> tags declared in AndroidManifest.xml.');
  } else {
    data.manifest.permissions.forEach((perm) => {
      const dangerTag = perm.isDangerous ? '[DANGEROUS / HIGH RISK]' : '[NORMAL]';
      lines.push(`  ${dangerTag.padEnd(25, ' ')} ${perm.name}`);
      lines.push(`       Description: ${perm.description}`);
    });
  }
  lines.push('');

  // 6. Components Inventory
  lines.push('[ 5. APPLICATION COMPONENTS INVENTORY (ACTIVITIES, SERVICES, RECEIVERS, PROVIDERS) ]');
  lines.push(subSeparator);
  lines.push(`Total Components Discovered: ${data.manifest.components.length}`);
  data.manifest.components.forEach((comp, idx) => {
    const exportTag = comp.exported ? '[EXPORTED - PUBLIC]' : '[INTERNAL]';
    lines.push(`  #${idx + 1} ${comp.type.toUpperCase().padEnd(10, ' ')} ${exportTag.padEnd(20, ' ')} ${comp.name}`);
    if (comp.permission) lines.push(`       Required Permission: ${comp.permission}`);
    if (comp.riskReason) lines.push(`       Risk Advisory       : ${comp.riskReason}`);
    if (comp.intentFilters && comp.intentFilters.length > 0) {
      comp.intentFilters.forEach((f) => {
        if (f.actions.length > 0) lines.push(`       Actions   : ${f.actions.join(', ')}`);
        if (f.categories.length > 0) lines.push(`       Categories: ${f.categories.join(', ')}`);
        if (f.dataSchemes && f.dataSchemes.length > 0) lines.push(`       Schemes   : ${f.dataSchemes.join(', ')}`);
      });
    }
  });
  lines.push('');

  // 7. Hardcoded Secrets, Keys & URLs
  lines.push('[ 6. EXTRACTED SENSITIVE STRINGS, API KEYS & ENDPOINTS ]');
  lines.push(subSeparator);
  if (data.dex.interestingStrings.length === 0) {
    lines.push('  No high-entropy API keys or hardcoded secrets detected in string pool.');
  } else {
    data.dex.interestingStrings.forEach((item, idx) => {
      lines.push(`  [#${idx + 1}] [${item.category}] ${item.value}`);
    });
  }
  lines.push('');

  // 8. Native Libraries & File System
  lines.push('[ 7. APK FILE SYSTEM & NATIVE BINARIES (.SO) ]');
  lines.push(subSeparator);
  lines.push(`Total Files in APK Archive: ${data.files.length}`);
  const nativeLibs = data.files.filter((f) => f.isNativeLib);
  if (nativeLibs.length > 0) {
    lines.push(`Native Architecture Libraries (.so): ${nativeLibs.length}`);
    nativeLibs.forEach((lib) => {
      lines.push(`  - ${lib.path} (${(lib.size / 1024).toFixed(1)} KB)`);
    });
  } else {
    lines.push('  No native C/C++ shared libraries (.so) found. Pure Dalvik/ART codebase.');
  }
  lines.push('');

  // 9. SMALI CODE DISASSEMBLY & CLASS POSTMORTEM
  lines.push('[ 8. COMPLETE SMALI DISASSEMBLY POSTMORTEM & CLASS TREE ]');
  // 9. NATIVE LIBRARIES & EXPORTED JNI FUNCTIONS
  lines.push('[ 8. NATIVE LIBRARIES & EXPORTED JNI SYMBOLS (.SO) ]');
  lines.push(subSeparator);
  if (!data.nativeAnalysis || data.nativeAnalysis.length === 0) {
    lines.push('  No native C/C++ libraries found.');
  } else {
    data.nativeAnalysis.forEach((nat, idx) => {
      lines.push(`  #${idx + 1} Library: ${nat.libraryName} [Arch: ${nat.arch}] (Size: ${nat.size} bytes)`);
      lines.push(`     Security Hardening: PIE=${nat.securityHardening.pie}, Canary=${nat.securityHardening.stackCanary}, NX=${nat.securityHardening.nx}, RELRO=${nat.securityHardening.relro}`);
      lines.push(`     Exported JNI Functions (${nat.jniFunctions.length}):`);
      nat.jniFunctions.forEach((jni) => {
        lines.push(`       - ${jni.name} @ ${jni.offsetHex}`);
        if (jni.targetJavaMethod) lines.push(`         -> Binds To: ${jni.targetJavaMethod}`);
      });
      lines.push('');
    });
  }
  lines.push('');

  // 10. ANTI-TAMPER & SECURITY ROUTINES
  lines.push('[ 9. ANTI-TAMPER & SECURITY MECHANISMS POSTMORTEM ]');
  lines.push(subSeparator);
  if (!data.antiTamperRoutines || data.antiTamperRoutines.length === 0) {
    lines.push('  No anti-tamper, root, or emulator defense routines detected.');
  } else {
    data.antiTamperRoutines.forEach((at, idx) => {
      lines.push(`  [#${idx + 1}] [${at.type}] ${at.name} (Confidence: ${at.confidence})`);
      lines.push(`       Location : ${at.location}`);
      lines.push(`       Detection: ${at.detectionMethod}`);
      lines.push(`       Code     :\n${at.codeSnippet.split('\n').map((l) => '         ' + l).join('\n')}`);
      lines.push('');
    });
  }
  lines.push('');

  // 11. CROSS-REFERENCES (XREFs)
  lines.push('[ 10. SENSITIVE APIS CROSS-REFERENCES (XREFs) ]');
  lines.push(subSeparator);
  if (!data.xrefs || data.xrefs.length === 0) {
    lines.push('  No sensitive API cross-references indexed.');
  } else {
    data.xrefs.forEach((xr, idx) => {
      lines.push(`  [#${idx + 1}] [${xr.risk}] API: ${xr.targetApi} (${xr.category})`);
      lines.push(`       Purpose: ${xr.description}`);
      lines.push(`       Call Sites (${xr.callers.length}):`);
      xr.callers.forEach((c) => {
        lines.push(`         - ${c.className}.${c.methodName}`);
        lines.push(`           Opcode: ${c.lineHint}`);
      });
      lines.push('');
    });
  }
  lines.push('');

  // 12. DYNAMIC BEHAVIORAL TRACE LOGS
  lines.push('[ 11. DYNAMIC BEHAVIORAL EXECUTION TRACE LOGS (SANDBOX) ]');
  lines.push(subSeparator);
  if (!data.dynamicTraceLogs || data.dynamicTraceLogs.length === 0) {
    lines.push('  No dynamic trace events recorded.');
  } else {
    data.dynamicTraceLogs.forEach((tr) => {
      lines.push(`  [${tr.timestamp}] [${tr.category.padEnd(8, ' ')}] [${tr.severity}] ${tr.apiCall}`);
      lines.push(`       Details: ${tr.details}`);
    });
  }
  lines.push('');

  // 13. SMALI CODE DISASSEMBLY & DECOMPILED JAVA
  lines.push('[ 12. COMPLETE SMALI DISASSEMBLY & DECOMPILED JAVA SOURCE ]');
  lines.push(subSeparator);
  lines.push(`Total Classes Found   : ${data.dex.classesCount}`);
  lines.push(`Total Methods Parsed : ${data.dex.methodsCount}`);
  lines.push(`Total Strings Indexed : ${data.dex.stringsCount}`);
  lines.push('');
  lines.push('CLASS INVENTORY & SOURCE CODE:');

  data.dex.classes.forEach((cls, idx) => {
    lines.push(`--------------------------------------------------------------------------------`);
    lines.push(`[CLASS #${idx + 1}] ${cls.className}`);
    lines.push(`  Package   : ${cls.packageName}`);
    lines.push(`  SimpleName: ${cls.simpleName}`);
    lines.push(`  Superclass: ${cls.superclass}`);
    lines.push(`  Modifiers : ${cls.accessFlags.join(' ')}`);
    lines.push(`  Fields    : ${cls.fields.length}`);
    cls.fields.forEach((f) => {
      lines.push(`    .field ${f.accessFlags.join(' ')} ${f.name}:${f.type}${f.value ? ` = ${f.value}` : ''}`);
    });
    lines.push(`  Methods   : ${cls.methods.length}`);
    cls.methods.forEach((m) => {
      lines.push(`    .method ${m.accessFlags.join(' ')} ${m.name}${m.signature}`);
    });
    lines.push('');
    lines.push('  --- DECOMPILED JAVA PREVIEW ---');
    if (cls.decompiledJava) {
      lines.push(cls.decompiledJava.split('\n').slice(0, 25).map((l) => '    ' + l).join('\n'));
    }
    lines.push('');
    lines.push('  --- DECOMPILED SMALI BYTECODE SNIPPET ---');
    const smaliSnippet = cls.rawSmali
      .split('\n')
      .slice(0, 25)
      .map((l) => '    ' + l)
      .join('\n');
    lines.push(smaliSnippet);
    lines.push('');
  });

  // 14. Frida Dynamic Instrumentation Scripts
  lines.push('[ 13. FRIDA DYNAMIC INSTRUMENTATION PLAYBOOKS ]');
  lines.push(subSeparator);
  data.fridaScripts.forEach((script) => {
    lines.push(`\n>>> SCRIPT: ${script.name} (${script.category})`);
    lines.push(`Description: ${script.description}`);
    lines.push(`--- JAVASCRIPT CODE ---`);
    lines.push(script.code);
  });
  lines.push('');

  // 15. Decoded AndroidManifest.xml
  lines.push('[ 14. DECODED ANDROIDMANIFEST.XML (FULL) ]');
  lines.push(subSeparator);
  lines.push(data.manifest.rawXml);
  lines.push('');

  // End of dossier
  lines.push(lineSeparator);
  lines.push('                 END OF DEEP POSTMORTEM REPORT');
  lines.push('       APK Reverse Engineering & Security Studio Analysis');
  lines.push(lineSeparator);

  return lines.join('\n');
}
