/**
 * Frida Dynamic Instrumentation Script Generator
 * Generates tailored Frida scripts for defensive auditing, SSL verification bypass testing,
 * crypto tracking, intent spying, and custom method hooks based on parsed APK components.
 */

import { FridaScriptDef, ManifestInfo, DexInfo } from '../types/apk';

export function generateFridaScripts(manifest: ManifestInfo, dex: DexInfo): FridaScriptDef[] {
  const pkg = manifest.packageName;
  const scripts: FridaScriptDef[] = [];

  // 1. SSL Pinning Defensive Audit Script
  scripts.push({
    id: 'frida-ssl-pinning',
    name: 'Universal SSL Pinning Bypass (Audit)',
    category: 'SSL_PINNING',
    description: `Disables TLS certificate verification in ${pkg} to inspect network traffic in Burp Suite / OWASP ZAP proxy.`,
    code: `/**
 * Universal SSL Pinning Bypass Script
 * Target Package: ${pkg}
 * Tool: Frida Dynamic Instrumentation
 * Run command: frida -U -f ${pkg} -l ssl_bypass.js --no-pause
 */
Java.perform(function() {
    console.log("[*] Injecting Universal SSL Pinning Bypass into ${pkg}...");

    // 1. Hook TrustManagerImpl (Android N+)
    try {
        var TrustManagerImpl = Java.use('com.android.org.conscrypt.TrustManagerImpl');
        TrustManagerImpl.verifyChain.implementation = function(untrustedChain, trustAnchorChain, host, clientAuth, ocspData, tlsSctData) {
            console.log("[+] [TrustManagerImpl] Bypassed certificate chain validation for host: " + host);
            return untrustedChain;
        };
    } catch(err) {
        console.log("[-] Conscrypt TrustManagerImpl not found: " + err);
    }

    // 2. Hook OkHttp3 CertificatePinner
    try {
        var CertificatePinner = Java.use('okhttp3.CertificatePinner');
        CertificatePinner.check.overload('java.lang.String', 'java.util.List').implementation = function(hostname, peerCertificates) {
            console.log("[+] [OkHttp3] Bypassed CertificatePinner check for: " + hostname);
            return;
        };
        CertificatePinner.check$okhttp.overload('java.lang.String', 'kotlin.jvm.functions.Function0').implementation = function(hostname, fn) {
            console.log("[+] [OkHttp3-Kotlin] Bypassed CertificatePinner for: " + hostname);
            return;
        };
    } catch(err) {
        console.log("[-] OkHttp3 CertificatePinner hook skipped: " + err);
    }

    // 3. Trust-All Custom TrustManager
    try {
        var X509TrustManager = Java.use('javax.net.ssl.X509TrustManager');
        var SSLContext = Java.use('javax.net.ssl.SSLContext');
        var TrustManager = Java.registerClass({
            name: 'com.apkpostmortem.TrustAll',
            implements: [X509TrustManager],
            methods: {
                checkClientTrusted: function(chain, authType) {},
                checkServerTrusted: function(chain, authType) {
                    console.log("[+] [CustomTrustManager] Accepting any server certificate");
                },
                getAcceptedIssuers: function() { return []; }
            }
        });
        var trustManagers = [TrustManager.$new()];
        var SSLContext_init = SSLContext.init.overload('[Ljavax.net.ssl.KeyManager;', '[Ljavax.net.ssl.TrustManager;', 'java.security.SecureRandom');
        SSLContext_init.implementation = function(km, tm, random) {
            console.log("[+] [SSLContext.init] Overriding TrustManager array with trust-all manager");
            SSLContext_init.call(this, km, trustManagers, random);
        };
    } catch(err) {
        console.log("[-] TrustManager override failed: " + err);
    }

    console.log("[*] SSL Pinning Bypass active. Route traffic to port 8080.");
});`,
  });

  // 2. Root Detection Bypass Script
  scripts.push({
    id: 'frida-root-bypass',
    name: 'Anti-Root & Magisk Detection Bypass',
    category: 'ROOT_BYPASS',
    description: `Neutralizes root detection checks (/system/bin/su, test-keys, Magisk binaries) in ${pkg}.`,
    code: `/**
 * Anti-Root & Tamper Detection Bypass
 * Target: ${pkg}
 * Tool: Frida Instrumentation
 */
Java.perform(function() {
    console.log("[*] Hooking Root and Su Detection Checks for ${pkg}...");

    var rootPaths = [
        "/system/app/Superuser.apk",
        "/sbin/su",
        "/system/bin/su",
        "/system/xbin/su",
        "/data/local/xbin/su",
        "/data/local/bin/su",
        "/system/sd/xbin/su",
        "/system/bin/failsafe/su",
        "/data/local/su",
        "/su/bin/su"
    ];

    // 1. Hook java.io.File.exists()
    var File = Java.use("java.io.File");
    File.exists.implementation = function() {
        var path = this.getAbsolutePath();
        for (var i = 0; i < rootPaths.length; i++) {
            if (path.indexOf(rootPaths[i]) !== -1) {
                console.log("[+] [Anti-Root] Hiding root file probe: " + path);
                return false;
            }
        }
        return this.exists();
    };

    // 2. Hook Runtime.exec() for 'which su' or 'su'
    var Runtime = Java.use("java.lang.Runtime");
    Runtime.exec.overload('java.lang.String').implementation = function(cmd) {
        if (cmd.indexOf("su") !== -1 || cmd.indexOf("which") !== -1) {
            console.log("[+] [Anti-Root] Intercepted shell command: " + cmd + " -> spoofing not found");
            return Runtime.exec.call(this, "false");
        }
        return this.exec(cmd);
    };

    // 3. Spoof Build.TAGS
    var Build = Java.use("android.os.Build");
    Build.TAGS.value = "release-keys";
    console.log("[+] [Anti-Root] Spoofed android.os.Build.TAGS to release-keys");
});`,
  });

  // 3. Cryptographic Key & Cipher Logger
  scripts.push({
    id: 'frida-crypto-logger',
    name: 'Cryptographic Operations & Key Sniffer',
    category: 'CRYPTO_MONITOR',
    description: `Inspects all AES/RSA Cipher initialization, SecretKeySpec, and decrypt operations in memory.`,
    code: `/**
 * Cryptographic Operations Sniffer
 * Target: ${pkg}
 * Logs Cipher initialization, secret keys, IVs, and plaintexts in real-time.
 */
Java.perform(function() {
    console.log("[*] Hooking javax.crypto.Cipher and Key generators...");

    var Cipher = Java.use('javax.crypto.Cipher');
    var SecretKeySpec = Java.use('javax.crypto.spec.SecretKeySpec');
    var IvParameterSpec = Java.use('javax.crypto.spec.IvParameterSpec');

    function bytesToHex(bytes) {
        if (!bytes) return "null";
        var hex = [];
        for (var i = 0; i < bytes.length; i++) {
            var b = (bytes[i] & 0xFF).toString(16);
            if (b.length === 1) b = "0" + b;
            hex.push(b);
        }
        return hex.join(" ");
    }

    // Hook SecretKeySpec instantiation
    SecretKeySpec.$init.overload('[B', 'java.lang.String').implementation = function(keyBytes, algorithm) {
        console.log("\\n[KEY GENERATED]");
        console.log("  Algorithm : " + algorithm);
        console.log("  Key (HEX) : " + bytesToHex(keyBytes));
        try {
            var StringClass = Java.use('java.lang.String');
            console.log("  Key (STR) : " + StringClass.$new(keyBytes));
        } catch(e) {}
        return this.$init(keyBytes, algorithm);
    };

    // Hook Cipher.init
    Cipher.init.overload('int', 'java.security.Key', 'java.security.spec.AlgorithmParameterSpec').implementation = function(mode, key, spec) {
        var modeStr = mode === 1 ? "ENCRYPT_MODE" : (mode === 2 ? "DECRYPT_MODE" : "MODE_" + mode);
        console.log("\\n[CIPHER INIT]");
        console.log("  Transformation : " + this.getAlgorithm());
        console.log("  Operation Mode : " + modeStr);
        return this.init(mode, key, spec);
    };

    // Hook Cipher.doFinal
    Cipher.doFinal.overload('[B').implementation = function(input) {
        var result = this.doFinal(input);
        console.log("\\n[CIPHER DO_FINAL]");
        console.log("  Algorithm : " + this.getAlgorithm());
        console.log("  Input Len : " + (input ? input.length : 0));
        console.log("  Output Len: " + (result ? result.length : 0));
        return result;
    };
});`,
  });

  // 4. Intent & IPC Sniffer
  scripts.push({
    id: 'frida-intent-sniffer',
    name: 'Intent & Inter-Process Communication (IPC) Spy',
    category: 'INTENT_SPY',
    description: `Monitors all startActivity, sendBroadcast, and extras passed between components.`,
    code: `/**
 * IPC Intent & Broadcast Sniffer
 * Target: ${pkg}
 */
Java.perform(function() {
    console.log("[*] Hooking Intent transitions and Broadcasts for ${pkg}...");

    var Activity = Java.use("android.app.Activity");
    var Intent = Java.use("android.content.Intent");

    Activity.startActivity.overload('android.content.Intent').implementation = function(intent) {
        var action = intent.getAction();
        var comp = intent.getComponent();
        var data = intent.getDataString();
        console.log("\\n[IPC ACTIVITY LAUNCH]");
        console.log("  Action    : " + action);
        console.log("  Component : " + (comp ? comp.flattenToShortString() : "implicit"));
        console.log("  Data URI  : " + data);
        return this.startActivity(intent);
    };

    var ContextWrapper = Java.use("android.content.ContextWrapper");
    ContextWrapper.sendBroadcast.overload('android.content.Intent').implementation = function(intent) {
        console.log("\\n[IPC BROADCAST SENT]");
        console.log("  Action: " + intent.getAction());
        return this.sendBroadcast(intent);
    };
});`,
  });

  return scripts;
}

/**
 * Generates an on-demand targeted Frida hook for any method from a Smali class
 */
export function generateCustomMethodHook(
  className: string,
  methodName: string,
  parameters: string[] = [],
  returnType: string = 'V'
): string {
  const javaClass = className.replace(/^L/, '').replace(/;$/, '').replace(/\//g, '.');

  return `/**
 * Custom Frida Hook for ${javaClass}.${methodName}
 * Auto-generated by APK Postmortem Studio
 */
Java.perform(function() {
    var TargetClass = Java.use("${javaClass}");

    TargetClass.${methodName}.implementation = function(${parameters.map((_, i) => `arg${i}`).join(', ')}) {
        console.log("\\n[HOOK TRIGGERED] ${javaClass}.${methodName}");
        ${parameters
          .map(
            (p, i) =>
              `console.log("  Arg [${i}] (${p}): " + JSON.stringify(arg${i}));`
          )
          .join('\n        ')}

        var retval = this.${methodName}(${parameters.map((_, i) => `arg${i}`).join(', ')});
        console.log("  Return Value (${returnType}): " + retval);
        return retval;
    };

    console.log("[+] Hook successfully attached to ${javaClass}.${methodName}");
});`;
}
