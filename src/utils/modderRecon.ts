/**
 * Modder & Reverse Engineering Reconnaissance Engine
 * Automated detection of kill-switches, VIP gates, ad SDKs, billing handlers, and auto-patch generation.
 */

import {
  SmaliClass,
  ManifestInfo,
  AntiTamperRoutine,
  KillSwitchTarget,
  AdTrackerNetwork,
  ModderReconResult,
} from '../types/apk';

export type { KillSwitchTarget, AdTrackerNetwork, ModderReconResult };

const KNOWN_AD_NETWORKS = [
  { name: 'Google AdMob / Firebase Ads', category: 'ADS' as const, pattern: /(com\.google\.android\.gms\.ads|com\.google\.ads)/i },
  { name: 'Unity Ads', category: 'ADS' as const, pattern: /(com\.unity3d\.ads|com\.unity3d\.services\.ads)/i },
  { name: 'AppLovin MAX / SDK', category: 'ADS' as const, pattern: /com\.applovin/i },
  { name: 'IronSource Mediation', category: 'ADS' as const, pattern: /com\.ironsource/i },
  { name: 'Vungle Ads', category: 'ADS' as const, pattern: /com\.vungle/i },
  { name: 'ByteDance Pangle', category: 'ADS' as const, pattern: /(com\.bytedance\.sdk\.openadsdk|com\.pangle)/i },
  { name: 'Facebook Audience Network', category: 'ADS' as const, pattern: /com\.facebook\.ads/i },
  { name: 'AppsFlyer Analytics', category: 'ANALYTICS' as const, pattern: /com\.appsflyer/i },
  { name: 'Adjust Telemetry', category: 'ANALYTICS' as const, pattern: /com\.adjust\.sdk/i },
  { name: 'InMobi Ads', category: 'ADS' as const, pattern: /com\.inmobi/i },
];

export function runModderRecon(
  classes: SmaliClass[],
  manifest: ManifestInfo,
  antiTamper: AntiTamperRoutine[]
): ModderReconResult {
  const killSwitches: KillSwitchTarget[] = [];
  const adTrackersMap = new Map<string, AdTrackerNetwork>();

  const premiumKeywords = /(premium|vip|pro|license|bought|purchased?|subscribed?|adfree|unlocked?|member|authorized|paid|trial|feature|canaccess|hasaccess)/i;
  const securityKeywords = /(root|emulator|debugger|testkeys|tamper|integrity|signature|hook|frida|xposed)/i;

  classes.forEach((cls) => {
    const cleanCls = cls.className.replace(/^L/, '').replace(/;$/, '').replace(/\//g, '.');

    // 1. Scan for Ad / Analytics SDKs
    KNOWN_AD_NETWORKS.forEach((net) => {
      if (net.pattern.test(cleanCls)) {
        if (!adTrackersMap.has(net.name)) {
          adTrackersMap.set(net.name, {
            name: net.name,
            category: net.category,
            packagePattern: net.pattern.source,
            detectedClasses: [],
            manifestComponents: [],
            nukeRecipe: {
              description: `Neutralize ${net.name} initialization and display calls to silence all ads and telemetry`,
              smaliPatch: `.method public showAd()V\n    .registers 1\n    return-void\n.end method`,
              fridaSnippet: `Java.perform(function() {\n    try {\n        var target = Java.use("${cleanCls}");\n        target.show.implementation = function() {\n            console.log("[NUKE] Blocked ${net.name} show()");\n        };\n    } catch(e) {}\n});`,
            },
          });
        }
        const tracker = adTrackersMap.get(net.name)!;
        if (tracker.detectedClasses.length < 15 && !tracker.detectedClasses.includes(cleanCls)) {
          tracker.detectedClasses.push(cleanCls);
        }
      }
    });

    // 2. Scan methods for Kill-Switches
    cls.methods.forEach((m) => {
      if (m.name === '<init>' || m.name === '<clinit>') return;

      const isBooleanReturn = m.returnType === 'Z' || m.signature.endsWith(')Z');
      const isIntReturn = m.returnType === 'I' || m.signature.endsWith(')I');
      const nameMatchesPremium = premiumKeywords.test(m.name);
      const nameMatchesSecurity = securityKeywords.test(m.name);

      if (isBooleanReturn && (nameMatchesPremium || nameMatchesSecurity)) {
        const isSecurityCheck = nameMatchesSecurity;
        const category = isSecurityCheck
          ? 'SECURITY_BYPASS'
          : /ad|ads/i.test(m.name)
          ? 'AD_REMOVAL'
          : /license|bought|purchas/i.test(m.name)
          ? 'LICENSE'
          : /subscri/i.test(m.name)
          ? 'SUBSCRIPTION'
          : 'VIP_PREMIUM';

        const returnVal = isSecurityCheck ? '0x0' : '0x1';
        const fridaReturn = isSecurityCheck ? 'false' : 'true';

        const originalCode = (m.instructions && m.instructions.length > 0)
          ? m.instructions.join('\n')
          : `.registers 2\n    # Method body\n    return v0`;

        const patchedSmali = [
          `# Target: ${cleanCls}->${m.name}${m.signature}`,
          `.method ${m.accessFlags.join(' ')} ${m.name}${m.signature}`,
          `    .registers 2`,
          `    const/4 v0, ${returnVal}    # Forced by Modder Lab: Return ${isSecurityCheck ? 'FALSE (Bypass)' : 'TRUE (Unlock)'}`,
          `    return v0`,
          `.end method`,
        ].join('\n');

        const fridaHook = `Java.perform(function() {
    try {
        var cls = Java.use("${cleanCls}");
        cls.${m.name}.implementation = function() {
            console.log("[+] Modder Hook Triggered: ${cleanCls}.${m.name}() -> Returning ${fridaReturn}");
            return ${fridaReturn};
        };
    } catch(err) {
        console.error("[-] Hook failed on ${m.name}: " + err);
    }
});`;

        killSwitches.push({
          id: `${cleanCls}_${m.name}`,
          className: cls.className,
          cleanClassName: cleanCls,
          methodName: m.name,
          signature: m.signature,
          returnType: 'boolean',
          category,
          confidence: m.instructions && m.instructions.length < 15 ? 'HIGH' : 'MEDIUM',
          reason: isSecurityCheck
            ? `Security check method returning boolean. Force false (0x0) to bypass detection.`
            : `Feature gate/premium method returning boolean. Force true (0x1) to unlock.`,
          originalSmali: originalCode,
          patchedSmali,
          fridaHook,
          suggestedAction: isSecurityCheck ? 'Force Return FALSE (0x0)' : 'Force Return TRUE (0x1)',
        });
      } else if (isIntReturn && /billing|response|status|code/i.test(m.name)) {
        // Billing response code hook
        const patchedSmali = [
          `# Target: ${cleanCls}->${m.name}${m.signature}`,
          `.method ${m.accessFlags.join(' ')} ${m.name}${m.signature}`,
          `    .registers 2`,
          `    const/4 v0, 0x0    # Force BillingResponseCode.OK (0)`,
          `    return v0`,
          `.end method`,
        ].join('\n');

        const fridaHook = `Java.perform(function() {
    try {
        var cls = Java.use("${cleanCls}");
        cls.${m.name}.implementation = function() {
            console.log("[+] Billing code forced to OK (0)");
            return 0;
        };
    } catch(err) {}
});`;

        killSwitches.push({
          id: `${cleanCls}_${m.name}`,
          className: cls.className,
          cleanClassName: cleanCls,
          methodName: m.name,
          signature: m.signature,
          returnType: 'int',
          category: 'BILLING',
          confidence: 'MEDIUM',
          reason: `Integer status code method related to purchase/billing. Force 0 (OK) to spoof successful checkout.`,
          originalSmali: m.instructions?.join('\n') || 'return v0',
          patchedSmali,
          fridaHook,
          suggestedAction: 'Force Return 0 (BillingResponseCode.OK)',
        });
      }
    });
  });

  // Cross reference manifest components with ad networks
  manifest.components.forEach((comp) => {
    KNOWN_AD_NETWORKS.forEach((net) => {
      if (net.pattern.test(comp.name)) {
        const tracker = adTrackersMap.get(net.name);
        if (tracker && !tracker.manifestComponents.includes(comp.name)) {
          tracker.manifestComponents.push(comp.name);
        }
      }
    });
  });

  // Convert map to array
  const adTrackers = Array.from(adTrackersMap.values());

  // Generate Master Frida Script combining all targets
  const masterFridaScript = generateMasterFridaScript(manifest.packageName, killSwitches, adTrackers, antiTamper);

  return {
    killSwitches,
    adTrackers,
    masterFridaScript,
    totalTargetsCount: killSwitches.length + adTrackers.length,
  };
}

function generateMasterFridaScript(
  pkgName: string,
  killSwitches: KillSwitchTarget[],
  adTrackers: AdTrackerNetwork[],
  antiTamper: AntiTamperRoutine[]
): string {
  const lines: string[] = [];
  lines.push(`/**`);
  lines.push(` * ==============================================================================`);
  lines.push(` * 🎯 ALL-IN-ONE MASTER MODDER & REVERSE ENGINEERING FRIDA SUITE`);
  lines.push(` * Target Package : ${pkgName}`);
  lines.push(` * Generated by   : APK Postmortem & Reverse Engineering Studio`);
  lines.push(` * Execution      : frida -U -f ${pkgName} -l master_hook.js`);
  lines.push(` * ==============================================================================`);
  lines.push(` */`);
  lines.push(``);
  lines.push(`console.log("[*] Injected Master Modder Suite for: ${pkgName}");`);
  lines.push(``);
  lines.push(`Java.perform(function() {`);
  lines.push(`    console.log("[+] Java VM runtime hooked successfully.");`);
  lines.push(``);

  // 1. Universal SSL Pinning Bypass
  lines.push(`    // ==========================================`);
  lines.push(`    // 1. UNIVERSAL SSL PINNING BYPASS`);
  lines.push(`    // ==========================================`);
  lines.push(`    try {`);
  lines.push(`        var TrustManager = Java.use('javax.net.ssl.X509TrustManager');`);
  lines.push(`        var SSLContext = Java.use('javax.net.ssl.SSLContext');`);
  lines.push(`        var EmptyTrustManager = Java.registerClass({`);
  lines.push(`            name: 'com.modder.EmptyTrustManager',`);
  lines.push(`            implements: [TrustManager],`);
  lines.push(`            methods: {`);
  lines.push(`                checkClientTrusted: function(chain, authType) {},`);
  lines.push(`                checkServerTrusted: function(chain, authType) {},`);
  lines.push(`                getAcceptedIssuers: function() { return []; }`);
  lines.push(`            }`);
  lines.push(`        });`);
  lines.push(`        var trustManagers = [EmptyTrustManager.$new()];`);
  lines.push(`        var SSLContext_init = SSLContext.init.overload('[Ljavax.net.ssl.KeyManager;', '[Ljavax.net.ssl.TrustManager;', 'java.security.SecureRandom');`);
  lines.push(`        SSLContext_init.implementation = function(km, tm, sr) {`);
  lines.push(`            console.log("[SSL] Bypassed SSLContext.init TrustManager!");`);
  lines.push(`            SSLContext_init.call(this, km, trustManagers, sr);`);
  lines.push(`        };`);
  lines.push(`    } catch(e) { console.log("[-] SSL hook error: " + e); }`);
  lines.push(``);

  // 2. Anti-Tamper & Root Checks Bypass
  lines.push(`    // ==========================================`);
  lines.push(`    // 2. ROOT & INTEGRITY DEFENSE BYPASS`);
  lines.push(`    // ==========================================`);
  lines.push(`    try {`);
  lines.push(`        var File = Java.use("java.io.File");`);
  lines.push(`        File.exists.implementation = function() {`);
  lines.push(`            var path = this.getAbsolutePath();`);
  lines.push(`            if (path.indexOf("su") !== -1 || path.indexOf("busybox") !== -1 || path.indexOf("magisk") !== -1) {`);
  lines.push(`                console.log("[ANTI-ROOT] Cloaked binary lookup: " + path);`);
  lines.push(`                return false;`);
  lines.push(`            }`);
  lines.push(`            return this.exists();`);
  lines.push(`        };`);
  lines.push(`    } catch(e) {}`);
  lines.push(``);

  // 3. Kill-Switches and Premium Gates
  lines.push(`    // ==========================================`);
  lines.push(`    // 3. TARGET KILL-SWITCHES & FEATURE GATES`);
  lines.push(`    // ==========================================`);
  killSwitches.forEach((ks, i) => {
    lines.push(`    // Target #${i + 1}: ${ks.cleanClassName}.${ks.methodName} (${ks.category})`);
    lines.push(`    try {`);
    lines.push(`        var cls_${i} = Java.use("${ks.cleanClassName}");`);
    if (ks.returnType === 'boolean') {
      const retVal = ks.category === 'SECURITY_BYPASS' ? 'false' : 'true';
      lines.push(`        cls_${i}.${ks.methodName}.implementation = function() {`);
      lines.push(`            console.log("[KILL-SWITCH #${i + 1}] Intercepted ${ks.cleanClassName}.${ks.methodName}() -> Forcing ${retVal}");`);
      lines.push(`            return ${retVal};`);
      lines.push(`        };`);
    } else if (ks.returnType === 'int') {
      lines.push(`        cls_${i}.${ks.methodName}.implementation = function() {`);
      lines.push(`            console.log("[BILLING #${i + 1}] Intercepted ${ks.cleanClassName}.${ks.methodName}() -> Forcing 0 (OK)");`);
      lines.push(`            return 0;`);
      lines.push(`        };`);
    }
    lines.push(`    } catch(e) { console.log("[-] Target #${i + 1} skipped: " + e.message); }`);
    lines.push(``);
  });

  // 4. Ad Trackers Nuker
  if (adTrackers.length > 0) {
    lines.push(`    // ==========================================`);
    lines.push(`    // 4. AD SDKS & TELEMETRY SILENCER`);
    lines.push(`    // ==========================================`);
    adTrackers.forEach((ad, idx) => {
      lines.push(`    // Nuke Network: ${ad.name}`);
      ad.detectedClasses.slice(0, 3).forEach((clsName, cIdx) => {
        lines.push(`    try {`);
        lines.push(`        var adCls_${idx}_${cIdx} = Java.use("${clsName}");`);
        lines.push(`        // Silence load/show methods`);
        lines.push(`        ["show", "load", "showAd", "init"].forEach(function(mName) {`);
        lines.push(`            if (adCls_${idx}_${cIdx}[mName]) {`);
        lines.push(`                adCls_${idx}_${cIdx}[mName].implementation = function() {`);
        lines.push(`                    console.log("[NUKE ADS] Neutralized ${clsName}." + mName);`);
        lines.push(`                };`);
        lines.push(`            }`);
        lines.push(`        });`);
        lines.push(`    } catch(e) {}`);
      });
    });
  }

  lines.push(`    console.log("[*] All hooks installed successfully. Happy Reverse Engineering!");`);
  lines.push(`});`);

  return lines.join('\n');
}
