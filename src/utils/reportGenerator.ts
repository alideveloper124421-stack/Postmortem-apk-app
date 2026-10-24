/**
 * Deep Postmortem Text, Markdown & Interactive HTML Report Generator
 * Generates an exhaustive forensic & reverse engineering dossier of the APK
 * containing literally EVERYTHING: full smali code, Unity IL2CPP dumper & dump.cs,
 * ARM64 hex patches, kill-switches, ad nukers, master frida script, manifest, and adb tools.
 */

import { ApkAnalysisResult } from '../types/apk';
import { generateAdbCommands } from './adbCommandGenerator';

export function generateDeepPostmortemTextReport(data: ApkAnalysisResult): string {
  const lineSeparator = '='.repeat(90);
  const subSeparator = '-'.repeat(90);

  const lines: string[] = [];

  // 1. ASCII Header & Metadata
  lines.push(lineSeparator);
  lines.push('       APK ALL-IN-ONE MASTER POSTMORTEM, REVERSE ENGINEERING & MODDING DOSSIER');
  lines.push('               COMPLETE STATIC SMALI & UNITY IL2CPP BINARY AUDIT SUITE');
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
  lines.push(`Security Score      : ${data.securityAudit.score} / 100 [RATING: ${data.securityAudit.riskRating}]`);
  lines.push(lineSeparator);
  lines.push('');

  // 2. MODDER RECONNAISSANCE & TARGET MATRIX (Dalvik / Smali)
  lines.push('[ 1. MODDER RECONNAISSANCE: KILL-SWITCHES & TARGET GATES ]');
  lines.push(subSeparator);
  const killSwitches = data.modderRecon?.killSwitches || [];
  if (killSwitches.length === 0) {
    lines.push('  No obvious boolean VIP or feature-gate kill-switches detected via automated heuristics.');
    lines.push('  Tip: Check obfuscated class names or JNI native functions for hidden licensing logic.');
  } else {
    lines.push(`Total Targets Identified: ${killSwitches.length}`);
    lines.push('');
    killSwitches.forEach((ks, idx) => {
      lines.push(`  ==============================================================================`);
      lines.push(`  🎯 TARGET #${idx + 1}: [${ks.category}] ${ks.cleanClassName}->${ks.methodName}`);
      lines.push(`  ==============================================================================`);
      lines.push(`  Full Signature    : ${ks.cleanClassName}->${ks.methodName}${ks.signature}`);
      lines.push(`  Detection Reason  : ${ks.reason}`);
      lines.push(`  Action Required   : ${ks.suggestedAction}`);
      lines.push(`  Confidence        : ${ks.confidence}`);
      lines.push(`  Smali Patch (Drop-in):`);
      lines.push(ks.patchedSmali.split('\n').map((l) => '    ' + l).join('\n'));
      lines.push(`  Frida Hook (Dynamic Interception):`);
      lines.push(ks.fridaHook.split('\n').map((l) => '    ' + l).join('\n'));
      lines.push('');
    });
  }
  lines.push('');

  // 3. UNITY IL2CPP DUMPER & NATIVE GAME MODDING MATRIX
  lines.push('[ 2. UNITY IL2CPP DUMPER & NATIVE METHOD OFFSETS (RVA) ]');
  lines.push(subSeparator);
  if (data.il2cppDump && data.il2cppDump.detected) {
    const dump = data.il2cppDump;
    lines.push(`Unity IL2CPP Game Engine : DETECTED`);
    lines.push(`Binary Architecture      : ${dump.arch}`);
    lines.push(`Metadata File Version    : v${dump.metadataVersion || 24}`);
    lines.push(`Recovered C# Classes     : ${dump.classesCount}`);
    lines.push(`Recovered Native Methods : ${dump.methodsCount}`);
    lines.push('');
    lines.push('>>> RECOVERED METHOD OFFSETS & ARM64 TARGET HEX PATCHES:');
    dump.classes.forEach((cls) => {
      lines.push(`\n  Class: ${cls.fullName} (Token: ${cls.typeToken})`);
      cls.methods.forEach((m) => {
        lines.push(`    -> Method: ${m.name}`);
        lines.push(`       RVA Offset     : ${m.offsetHex}`);
        lines.push(`       Virtual Address: ${m.virtualAddress}`);
        lines.push(`       C# Signature   : ${m.signature}`);
        lines.push(`       Purpose        : ${m.arm64HexPatch.description}`);
        lines.push(`       ARM64 Patch Hex: ${m.arm64HexPatch.patchHex} [Original: ${m.arm64HexPatch.originalHex}]`);
        lines.push(`       C++ Mod Code   : ${m.cppModMenuSnippet}`);
        lines.push(`       Frida Hook     :\n${m.fridaInterceptorHook.split('\n').map((l) => '         ' + l).join('\n')}`);
      });
    });
    lines.push('');
    lines.push('>>> C++ NATIVE FLOATING MOD MENU IMPLEMENTATION (Zygisk / Native Hook):');
    lines.push(dump.unityModMenuBoilerplate);
    lines.push('');
    lines.push('>>> FULL RECONSTRUCTED C# HEADERS (dump.cs):');
    lines.push(dump.dumpCsHeader);
    lines.push('');
    lines.push('>>> IDA PRO & GHIDRA AUTO-RENAME SCRIPT (script.json):');
    lines.push(dump.scriptJson);
  } else {
    lines.push('  No Unity IL2CPP runtime binary detected (Pure Android Java/Kotlin/JNI app).');
  }
  lines.push('');

  // 4. AD NETWORKS & TRACKERS NUKER LIST
  lines.push('[ 3. AD SDKS & TRACKERS (NEUTRALIZATION DIRECTORY) ]');
  lines.push(subSeparator);
  const adTrackers = data.modderRecon?.adTrackers || [];
  if (adTrackers.length === 0) {
    lines.push('  No major commercial ad networks detected in package inventory.');
  } else {
    lines.push(`Commercial Ad & Analytics SDKs Detected: ${adTrackers.length}`);
    adTrackers.forEach((ad, idx) => {
      lines.push(`  #${idx + 1} Network : ${ad.name} [Type: ${ad.category}]`);
      lines.push(`     Classes Identified (${ad.detectedClasses.length}):`);
      ad.detectedClasses.slice(0, 8).forEach((cls) => lines.push(`       - ${cls}`));
      if (ad.manifestComponents.length > 0) {
        lines.push(`     Manifest Activities/Receivers to disable:`);
        ad.manifestComponents.forEach((c) => lines.push(`       - ${c}`));
      }
      lines.push(`     Nuke Recommendation : Return-void on initialization and display methods.`);
      lines.push(`     Smali Patch Recipe:\n${ad.nukeRecipe.smaliPatch.split('\n').map((l) => '       ' + l).join('\n')}`);
      lines.push('');
    });
  }
  lines.push('');

  // 5. MASTER FRIDA ALL-IN-ONE SCRIPT
  lines.push('[ 4. MASTER MODDER FRIDA DYNAMIC SCRIPT (ALL-IN-ONE) ]');
  lines.push(subSeparator);
  lines.push(data.modderRecon?.masterFridaScript || '// No dynamic hooks compiled');
  lines.push('');

  // 6. EXECUTIVE FORENSIC SUMMARY
  lines.push('[ 5. EXECUTIVE POSTMORTEM AUDIT SUMMARY ]');
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

  // 7. OWASP MASVS Assessment
  lines.push('[ 6. OWASP MASVS COMPLIANCE CHECKLIST ]');
  lines.push(subSeparator);
  data.securityAudit.owaspMatrix.forEach((cat) => {
    const padName = cat.name.padEnd(30, ' ');
    lines.push(`[${cat.status.padEnd(4, ' ')}] ${cat.id} - ${padName} : Score ${cat.score}/100`);
    lines.push(`       Summary: ${cat.summary}`);
  });
  lines.push('');

  // 8. Detailed Security Findings
  lines.push('[ 7. DETAILED SECURITY FINDINGS & VULNERABILITY AUDIT ]');
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

  // 9. Permissions Deep Audit
  lines.push('[ 8. ANDROID PERMISSIONS POSTMORTEM ]');
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

  // 10. Components Inventory
  lines.push('[ 9. APPLICATION COMPONENTS INVENTORY (ACTIVITIES, SERVICES, RECEIVERS, PROVIDERS) ]');
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

  // 11. Hardcoded Secrets, Keys & URLs
  lines.push('[ 10. EXTRACTED SENSITIVE STRINGS, API KEYS & ENDPOINTS ]');
  lines.push(subSeparator);
  if (data.dex.interestingStrings.length === 0) {
    lines.push('  No high-entropy API keys or hardcoded secrets detected in string pool.');
  } else {
    data.dex.interestingStrings.forEach((item, idx) => {
      lines.push(`  [#${idx + 1}] [${item.category}] ${item.value}`);
    });
  }
  lines.push('');

  // 12. Native Libraries & JNI Symbols
  lines.push('[ 11. NATIVE LIBRARIES & EXPORTED JNI SYMBOLS (.SO) ]');
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

  // 13. Anti-Tamper & Security Mechanisms
  lines.push('[ 12. ANTI-TAMPER & DEFENSE MECHANISMS POSTMORTEM ]');
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

  // 14. Cross-References
  lines.push('[ 13. SENSITIVE APIS CROSS-REFERENCES (XREFs) ]');
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

  // 15. ADB INTENT & SHELL TESTING COMMANDS
  lines.push('[ 14. ADB INTENT TESTING & SHELL COMMANDS ]');
  lines.push(subSeparator);
  const adbCommands = generateAdbCommands(data.manifest);
  adbCommands.forEach((cmd, idx) => {
    lines.push(`  #${idx + 1} [${cmd.category}] ${cmd.label}`);
    lines.push(`       Command    : ${cmd.command}`);
    lines.push(`       Description: ${cmd.description}`);
    lines.push('');
  });
  lines.push('');

  // 16. APK FILE ARCHIVE INVENTORY
  lines.push('[ 15. APK FILE ARCHIVE INVENTORY ]');
  lines.push(subSeparator);
  lines.push(`Total Files in Archive: ${data.files.length}`);
  data.files.forEach((f, idx) => {
    lines.push(`  #${idx + 1} [${f.category.padEnd(10, ' ')}] ${(f.size / 1024).toFixed(1).padStart(7, ' ')} KB  ${f.path}`);
  });
  lines.push('');

  // 17. COMPLETE SMALI CODE DISASSEMBLY FOR EVERY CLASS
  lines.push('[ 16. COMPLETE SMALI CODE DISASSEMBLY (ALL CLASSES) ]');
  lines.push(subSeparator);
  lines.push(`Total Classes Disassembled: ${data.dex.classes.length}`);
  lines.push('');
  data.dex.classes.forEach((cls, idx) => {
    lines.push(`################################################################################`);
    lines.push(`### CLASS #${idx + 1}: ${cls.className}`);
    lines.push(`### Package: ${cls.packageName} | Simple: ${cls.simpleName}`);
    lines.push(`################################################################################`);
    lines.push(cls.rawSmali);
    lines.push('');
  });

  // 18. Decoded AndroidManifest.xml
  lines.push('[ 17. DECODED ANDROIDMANIFEST.XML (FULL RAW XML) ]');
  lines.push(subSeparator);
  lines.push(data.manifest.rawXml);
  lines.push('');

  lines.push(lineSeparator);
  lines.push('            END OF ALL-IN-ONE MASTER MODDER & REVERSE ENGINEERING DOSSIER');
  lines.push('                        ANALYSIS COMPLETED SUCCESSFULLY');
  lines.push(lineSeparator);

  return lines.join('\n');
}

/**
 * Generates an interactive, standalone single-file HTML report
 * with cyberpunk styling, real-time search, filter tabs, Unity IL2CPP inspector, and copy buttons!
 */
export function generateInteractiveHtmlReport(data: ApkAnalysisResult): string {
  const killSwitches = data.modderRecon?.killSwitches || [];
  const adTrackers = data.modderRecon?.adTrackers || [];
  const il2cpp = data.il2cppDump;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>APK Reverse Engineering & Modding Dossier: ${data.manifest.packageName}</title>
  <style>
    :root {
      --bg: #09090b;
      --card-bg: #121217;
      --border: #27272a;
      --text: #f4f4f5;
      --text-muted: #a1a1aa;
      --emerald: #10b981;
      --emerald-glow: rgba(16, 185, 129, 0.2);
      --red: #ef4444;
      --amber: #f59e0b;
      --purple: #a855f7;
      --cyan: #06b6d4;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 24px;
      line-height: 1.5;
    }
    .container { max-width: 1250px; margin: 0 auto; }
    header {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(168, 85, 247, 0.08), var(--card-bg));
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.6);
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      font-family: monospace;
    }
    .badge-emerald { background: rgba(16, 185, 129, 0.2); color: var(--emerald); border: 1px solid rgba(16, 185, 129, 0.4); }
    .badge-red { background: rgba(239, 68, 68, 0.2); color: var(--red); border: 1px solid rgba(239, 68, 68, 0.4); }
    .badge-amber { background: rgba(245, 158, 11, 0.2); color: var(--amber); border: 1px solid rgba(245, 158, 11, 0.4); }
    .badge-purple { background: rgba(168, 85, 247, 0.2); color: var(--purple); border: 1px solid rgba(168, 85, 247, 0.4); }
    .badge-cyan { background: rgba(6, 182, 212, 0.2); color: var(--cyan); border: 1px solid rgba(6, 182, 212, 0.4); }

    .grid-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin: 20px 0;
    }
    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
    }
    .stat-val { font-size: 24px; font-weight: 800; color: var(--emerald); font-family: monospace; }
    .stat-label { font-size: 12px; color: var(--text-muted); text-transform: uppercase; }

    .toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 20px;
      align-items: center;
      justify-content: space-between;
    }
    .tabs { display: flex; gap: 8px; flex-wrap: wrap; }
    .tab-btn {
      background: var(--card-bg);
      border: 1px solid var(--border);
      color: var(--text-muted);
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      transition: all 0.2s;
    }
    .tab-btn.active {
      background: var(--emerald);
      color: #000;
      border-color: var(--emerald);
    }
    .search-box {
      background: var(--card-bg);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 13px;
      width: 280px;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 20px;
      margin-bottom: 16px;
    }
    pre {
      background: #000;
      border: 1px solid #1f2937;
      padding: 14px;
      border-radius: 8px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
      overflow-x: auto;
      color: #34d399;
      margin-top: 10px;
    }
    .copy-btn {
      background: #27272a;
      border: 1px solid #3f3f46;
      color: #e4e4e7;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 11px;
      cursor: pointer;
      font-weight: 600;
      float: right;
    }
    .copy-btn:hover { background: #3f3f46; color: #fff; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
    th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--border); }
    th { color: var(--text-muted); font-size: 11px; text-transform: uppercase; font-weight: 700; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
        <div>
          <span class="badge badge-emerald">MODDER & RECONNAISSANCE DOSSIER</span>
          <span class="badge badge-purple" style="margin-left: 6px;">${il2cpp?.detected ? 'UNITY IL2CPP DETECTED' : 'PURE DALVIK / ART'}</span>
          <h1 style="font-size: 24px; font-weight: 800; margin: 8px 0;">${data.manifest.appLabel || data.manifest.packageName}</h1>
          <p style="font-family: monospace; color: var(--text-muted); font-size: 13px;">Package: ${data.manifest.packageName} | v${data.manifest.versionName} (${data.manifest.versionCode})</p>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 28px; font-weight: 900; color: ${data.securityAudit.score < 50 ? 'var(--red)' : 'var(--emerald)'};">${data.securityAudit.score}/100</div>
          <div style="font-size: 11px; color: var(--text-muted); font-weight: 700;">SECURITY RATING: ${data.securityAudit.riskRating}</div>
        </div>
      </div>
    </header>

    <div class="grid-stats">
      <div class="stat-card">
        <div class="stat-val">${killSwitches.length}</div>
        <div class="stat-label">Kill-Switches / VIP Gates</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color: var(--purple);">${il2cpp?.methodsCount || 0}</div>
        <div class="stat-label">IL2CPP Native Methods (RVA)</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color: var(--cyan);">${adTrackers.length}</div>
        <div class="stat-label">Ad / Analytics SDKs</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color: var(--amber);">${data.securityAudit.findings.length}</div>
        <div class="stat-label">Security Vulnerabilities</div>
      </div>
    </div>

    <div class="toolbar">
      <div class="tabs">
        <button class="tab-btn active" onclick="switchTab('killswitches')">🎯 Kill-Switches (${killSwitches.length})</button>
        ${il2cpp?.detected ? `<button class="tab-btn" onclick="switchTab('il2cpp')">🎮 Unity IL2CPP (${il2cpp.methodsCount})</button>` : ''}
        <button class="tab-btn" onclick="switchTab('master-frida')">⚡ Master Frida Script</button>
        <button class="tab-btn" onclick="switchTab('ads')">💣 Ad Nuker (${adTrackers.length})</button>
        <button class="tab-btn" onclick="switchTab('secrets')">🔑 Secrets & Strings (${data.dex.interestingStrings.length})</button>
        <button class="tab-btn" onclick="switchTab('manifest')">📜 Manifest & Components (${data.manifest.components.length})</button>
      </div>
      <input type="text" class="search-box" id="searchInput" placeholder="Search report items..." onkeyup="filterContent()">
    </div>

    <!-- TAB: KILL-SWITCHES -->
    <div id="tab-killswitches" class="tab-content">
      ${killSwitches.length === 0 ? '<div class="card"><p style="color: var(--text-muted);">No automated boolean killswitches found.</p></div>' : ''}
      ${killSwitches.map((ks, i) => `
        <div class="card item-card" data-search="${ks.cleanClassName} ${ks.methodName} ${ks.category}">
          <button class="copy-btn" onclick="copyText(\`${encodeURIComponent(ks.patchedSmali)}\`, this)">Copy Smali Patch</button>
          <div style="margin-bottom: 8px;">
            <span class="badge badge-emerald">${ks.category}</span>
            <span class="badge badge-purple" style="margin-left: 6px;">Confidence: ${ks.confidence}</span>
            <h3 style="font-size: 16px; font-weight: 700; margin-top: 6px; font-family: monospace;">${ks.cleanClassName}->${ks.methodName}</h3>
          </div>
          <p style="font-size: 13px; color: var(--text-muted);">${ks.reason}</p>
          <div style="margin-top: 12px;">
            <div style="font-size: 11px; font-weight: 700; color: var(--emerald); text-transform: uppercase;">Smali Drop-in Patch:</div>
            <pre>${escapeHtml(ks.patchedSmali)}</pre>
          </div>
          <div style="margin-top: 12px;">
            <button class="copy-btn" onclick="copyText(\`${encodeURIComponent(ks.fridaHook)}\`, this)">Copy Frida Hook</button>
            <div style="font-size: 11px; font-weight: 700; color: var(--cyan); text-transform: uppercase;">Frida Hook:</div>
            <pre style="color: #67e8f9;">${escapeHtml(ks.fridaHook)}</pre>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- TAB: UNITY IL2CPP -->
    ${il2cpp?.detected ? `
    <div id="tab-il2cpp" class="tab-content" style="display: none;">
      <div class="card">
        <h3 style="font-size: 16px; font-weight: 800; color: var(--purple); margin-bottom: 6px;">Unity IL2CPP Native Method Offsets (RVA)</h3>
        <p style="font-size: 12px; color: var(--text-muted);">Arch: ${il2cpp.arch} | Metadata: v${il2cpp.metadataVersion} | Classes: ${il2cpp.classesCount}</p>
      </div>
      ${il2cpp.classes.map((cls) => `
        <div class="card item-card" data-search="${cls.fullName}">
          <h3 style="font-size: 15px; font-weight: 700; font-family: monospace; color: var(--purple); margin-bottom: 10px;">
            class ${cls.fullName} <span style="font-size: 11px; color: var(--text-muted);">(Token: ${cls.typeToken})</span>
          </h3>
          <table>
            <thead>
              <tr>
                <th>Method Name</th>
                <th>RVA Offset</th>
                <th>ARM64 Patch Hex</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${cls.methods.map((m) => `
                <tr class="item-card" data-search="${cls.name} ${m.name} ${m.offsetHex}">
                  <td style="font-family: monospace; font-weight: bold; color: var(--emerald);">${escapeHtml(m.name)}</td>
                  <td style="font-family: monospace; color: var(--cyan);">${m.offsetHex}</td>
                  <td style="font-family: monospace; color: var(--amber); font-weight: bold;">${m.arm64HexPatch.patchHex}</td>
                  <td>
                    <button class="copy-btn" onclick="copyText(\`${encodeURIComponent(m.arm64HexPatch.patchHex)}\`, this)">Copy Hex</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `).join('')}
    </div>
    ` : ''}

    <!-- TAB: MASTER FRIDA -->
    <div id="tab-master-frida" class="tab-content" style="display: none;">
      <div class="card">
        <button class="copy-btn" onclick="copyText(\`${encodeURIComponent(data.modderRecon?.masterFridaScript || '')}\`, this)">Copy Full Script</button>
        <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 6px;">All-in-One Master Frida Dynamic Script</h3>
        <p style="font-size: 12px; color: var(--text-muted);">Save as <code>master_hook.js</code> and run: <code>frida -U -f ${data.manifest.packageName} -l master_hook.js</code></p>
        <pre style="max-height: 500px; color: #a7f3d0;">${escapeHtml(data.modderRecon?.masterFridaScript || '// No script generated')}</pre>
      </div>
    </div>

    <!-- TAB: ADS -->
    <div id="tab-ads" class="tab-content" style="display: none;">
      ${adTrackers.map((ad) => `
        <div class="card item-card" data-search="${ad.name} ${ad.category}">
          <span class="badge badge-amber">${ad.category}</span>
          <h3 style="font-size: 16px; font-weight: 700; margin-top: 6px;">${ad.name}</h3>
          <p style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Classes found: ${ad.detectedClasses.join(', ') || 'N/A'}</p>
          <div style="margin-top: 10px;">
            <div style="font-size: 11px; font-weight: 700; color: var(--amber);">Nuke Recommendation:</div>
            <pre>${escapeHtml(ad.nukeRecipe.smaliPatch)}</pre>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- TAB: SECRETS -->
    <div id="tab-secrets" class="tab-content" style="display: none;">
      <div class="card">
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            ${data.dex.interestingStrings.map((s) => `
              <tr class="item-card" data-search="${s.category} ${s.value}">
                <td><span class="badge badge-cyan">${s.category}</span></td>
                <td style="font-family: monospace; word-break: break-all;">${escapeHtml(s.value)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB: MANIFEST -->
    <div id="tab-manifest" class="tab-content" style="display: none;">
      <div class="card">
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Status</th>
              <th>Component Name</th>
            </tr>
          </thead>
          <tbody>
            ${data.manifest.components.map((c) => `
              <tr class="item-card" data-search="${c.type} ${c.name}">
                <td><span class="badge badge-purple">${c.type}</span></td>
                <td><span class="badge ${c.exported ? 'badge-red' : 'badge-emerald'}">${c.exported ? 'EXPORTED' : 'INTERNAL'}</span></td>
                <td style="font-family: monospace;">${escapeHtml(c.name)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <script>
    function switchTab(tabId) {
      document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      const activeTab = document.getElementById('tab-' + tabId);
      if (activeTab) activeTab.style.display = 'block';
      event.target.classList.add('active');
    }

    function filterContent() {
      const query = document.getElementById('searchInput').value.toLowerCase();
      document.querySelectorAll('.item-card').forEach(card => {
        const text = (card.getAttribute('data-search') || '').toLowerCase();
        card.style.display = text.includes(query) ? '' : 'none';
      });
    }

    function copyText(encoded, btn) {
      const text = decodeURIComponent(encoded);
      navigator.clipboard.writeText(text);
      const original = btn.innerText;
      btn.innerText = 'Copied!';
      setTimeout(() => btn.innerText = original, 1500);
    }
  </script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
