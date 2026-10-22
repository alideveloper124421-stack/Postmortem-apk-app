/**
 * Android Binary XML (AXML) Parser and Manifest Decoder
 * Decodes Android's binary XML format (RES_XML_TYPE 0x00080003) into human-readable XML
 * and extracts security-critical manifest properties.
 */

import { ManifestInfo, ManifestComponent, PermissionItem, SeverityLevel } from '../types/apk';

const KNOWN_PERMISSIONS_DB: Record<string, { desc: string; dangerous: boolean }> = {
  'android.permission.INTERNET': { desc: 'Full network access to the internet', dangerous: false },
  'android.permission.ACCESS_NETWORK_STATE': { desc: 'View network connections', dangerous: false },
  'android.permission.ACCESS_WIFI_STATE': { desc: 'View Wi-Fi connections', dangerous: false },
  'android.permission.CAMERA': { desc: 'Take pictures and videos directly without user confirmation', dangerous: true },
  'android.permission.READ_EXTERNAL_STORAGE': { desc: 'Read contents of shared external storage / SD card', dangerous: true },
  'android.permission.WRITE_EXTERNAL_STORAGE': { desc: 'Modify or delete shared external storage contents', dangerous: true },
  'android.permission.ACCESS_FINE_LOCATION': { desc: 'Access precise GPS location', dangerous: true },
  'android.permission.ACCESS_COARSE_LOCATION': { desc: 'Access approximate network-based location', dangerous: true },
  'android.permission.RECORD_AUDIO': { desc: 'Record audio via device microphone', dangerous: true },
  'android.permission.READ_CONTACTS': { desc: 'Read user contacts and address book data', dangerous: true },
  'android.permission.WRITE_CONTACTS': { desc: 'Modify or delete user contacts', dangerous: true },
  'android.permission.READ_SMS': { desc: 'Read SMS text messages (potential 2FA bypass risk)', dangerous: true },
  'android.permission.RECEIVE_SMS': { desc: 'Intercept incoming SMS messages', dangerous: true },
  'android.permission.SEND_SMS': { desc: 'Send SMS messages without user intervention', dangerous: true },
  'android.permission.READ_PHONE_STATE': { desc: 'Read phone status, IMEI, active calls, cellular info', dangerous: true },
  'android.permission.CALL_PHONE': { desc: 'Directly initiate phone calls', dangerous: true },
  'android.permission.SYSTEM_ALERT_WINDOW': { desc: 'Display overlay windows on top of all other apps (Tapjacking risk)', dangerous: true },
  'android.permission.REQUEST_INSTALL_PACKAGES': { desc: 'Request installing additional unknown packages', dangerous: true },
  'android.permission.USE_BIOMETRIC': { desc: 'Use biometric hardware (fingerprint/face)', dangerous: false },
  'android.permission.VIBRATE': { desc: 'Control vibration', dangerous: false },
  'android.permission.WAKE_LOCK': { desc: 'Prevent phone from sleeping', dangerous: false },
  'android.permission.RECEIVE_BOOT_COMPLETED': { desc: 'Run services automatically at system startup', dangerous: false },
  'android.permission.FOREGROUND_SERVICE': { desc: 'Run long-lasting foreground tasks with notification', dangerous: false },
};

/**
 * Parses binary AXML buffer or plain text XML into structured ManifestInfo and decoded XML string
 */
export function parseAndroidManifest(buffer: Uint8Array): ManifestInfo {
  // Check if buffer is plain text XML (starts with '<' or '<?xml')
  const isPlainText = buffer.length > 5 && (buffer[0] === 0x3c || (buffer[0] === 0xef && buffer[1] === 0xbb));
  if (isPlainText) {
    const text = new TextDecoder('utf-8').decode(buffer);
    return parseTextXmlManifest(text);
  }

  // Check magic number for AXML: 0x00080003
  const isAxml = buffer.length >= 8 &&
    buffer[0] === 0x03 && buffer[1] === 0x00 && buffer[2] === 0x08 && buffer[3] === 0x00;

  if (isAxml) {
    try {
      return decodeAxmlBuffer(buffer);
    } catch (e) {
      console.warn('AXML binary parsing error, falling back to string pool scraper:', e);
      return fallbackExtractManifest(buffer);
    }
  }

  // Fallback string scraper for non-standard / obfuscated AXML
  return fallbackExtractManifest(buffer);
}

/**
 * Decodes Android Binary XML format
 */
function decodeAxmlBuffer(buffer: Uint8Array): ManifestInfo {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  let offset = 8; // skip header (type + size)

  let stringPool: string[] = [];
  const xmlLines: string[] = ['<?xml version="1.0" encoding="utf-8"?>'];
  let currentIndent = 0;

  let packageName = 'unknown.package';
  let versionCode = '1';
  let versionName = '1.0';
  let minSdkVersion = '21';
  let targetSdkVersion = '33';
  let appLabel = '';
  let debuggable = false;
  let allowBackup = true;
  let usesCleartextTraffic = false;
  let networkSecurityConfig: string | undefined = undefined;

  const permissions: PermissionItem[] = [];
  const components: ManifestComponent[] = [];

  let currentComponent: Partial<ManifestComponent> | null = null;
  let currentIntentFilter: { actions: string[]; categories: string[]; dataSchemes?: string[] } | null = null;

  while (offset < buffer.byteLength) {
    if (offset + 8 > buffer.byteLength) break;
    const chunkType = view.getUint32(offset, true);
    const chunkSize = view.getUint32(offset + 4, true);

    if (chunkSize <= 0 || offset + chunkSize > buffer.byteLength + 8) {
      break;
    }

    if (chunkType === 0x00010001 || chunkType === 0x001C0001) {
      // RES_STRING_POOL_TYPE
      stringPool = parseStringPool(buffer, offset);
    } else if (chunkType === 0x00100102) {
      // RES_XML_START_ELEMENT_TYPE
      const lineNum = view.getUint32(offset + 8, true);
      const nameIdx = view.getUint32(offset + 20, true);
      const attrStart = view.getUint16(offset + 24, true);
      const attrSize = view.getUint16(offset + 26, true);
      const attrCount = view.getUint16(offset + 28, true);

      const tagName = stringPool[nameIdx] || 'element';
      const attrs: Record<string, string> = {};

      let attrOffset = offset + 36;
      for (let i = 0; i < attrCount; i++) {
        if (attrOffset + 20 <= offset + chunkSize) {
          const attrNsIdx = view.getInt32(attrOffset, true);
          const attrNameIdx = view.getInt32(attrOffset + 4, true);
          const attrValIdx = view.getInt32(attrOffset + 8, true);
          const attrDataType = view.getUint8(attrOffset + 15);
          const attrData = view.getUint32(attrOffset + 16, true);

          const attrName = stringPool[attrNameIdx] || `attr_${i}`;
          let attrVal = '';

          if (attrValIdx !== -1 && stringPool[attrValIdx] !== undefined) {
            attrVal = stringPool[attrValIdx];
          } else if (attrDataType === 18) {
            // TYPE_INT_BOOLEAN
            attrVal = attrData !== 0 ? 'true' : 'false';
          } else if (attrDataType === 16 || attrDataType === 17) {
            // TYPE_INT_DEC or TYPE_INT_HEX
            attrVal = attrData.toString();
          } else if (attrDataType === 1) {
            // TYPE_REFERENCE
            attrVal = `@0x${attrData.toString(16)}`;
          } else {
            attrVal = attrData.toString();
          }

          attrs[attrName] = attrVal;
          attrOffset += 20;
        }
      }

      // Process Manifest elements
      if (tagName === 'manifest') {
        if (attrs['package']) packageName = attrs['package'];
        if (attrs['versionCode']) versionCode = attrs['versionCode'];
        if (attrs['versionName']) versionName = attrs['versionName'];
      } else if (tagName === 'uses-sdk') {
        if (attrs['minSdkVersion']) minSdkVersion = attrs['minSdkVersion'];
        if (attrs['targetSdkVersion']) targetSdkVersion = attrs['targetSdkVersion'];
      } else if (tagName === 'uses-permission' || tagName === 'permission') {
        const permName = attrs['name'] || attrs['android:name'] || '';
        if (permName && !permissions.some((p) => p.name === permName)) {
          const info = KNOWN_PERMISSIONS_DB[permName];
          permissions.push({
            name: permName,
            shortName: permName.split('.').pop() || permName,
            description: info?.desc || 'Custom or system permission requested by app',
            isDangerous: info?.dangerous || false,
            status: info?.dangerous ? 'HIGH_RISK' : 'NORMAL',
          });
        }
      } else if (tagName === 'application') {
        if (attrs['label']) appLabel = attrs['label'];
        if (attrs['debuggable'] === 'true') debuggable = true;
        if (attrs['allowBackup'] === 'false') allowBackup = false;
        if (attrs['usesCleartextTraffic'] === 'true') usesCleartextTraffic = true;
        if (attrs['networkSecurityConfig']) networkSecurityConfig = attrs['networkSecurityConfig'];
      } else if (['activity', 'activity-alias', 'service', 'receiver', 'provider'].includes(tagName)) {
        const compName = attrs['name'] || attrs['android:name'] || `unknown_${tagName}`;
        const isExported = attrs['exported'] === 'true';
        const compType = tagName === 'activity-alias' ? 'activity' : (tagName as ManifestComponent['type']);

        currentComponent = {
          name: compName,
          type: compType,
          exported: isExported,
          permission: attrs['permission'],
          intentFilters: [],
          riskLevel: isExported && !attrs['permission'] ? 'HIGH' : 'LOW',
          riskReason: isExported && !attrs['permission'] ? 'Exported component accessible by other apps without permission protection' : undefined,
        };
      } else if (tagName === 'intent-filter' && currentComponent) {
        currentIntentFilter = { actions: [], categories: [] };
      } else if (tagName === 'action' && currentIntentFilter) {
        const act = attrs['name'] || attrs['android:name'];
        if (act) currentIntentFilter.actions.push(act);
      } else if (tagName === 'category' && currentIntentFilter) {
        const cat = attrs['name'] || attrs['android:name'];
        if (cat) currentIntentFilter.categories.push(cat);
      } else if (tagName === 'data' && currentIntentFilter) {
        const scheme = attrs['scheme'] || attrs['android:scheme'];
        if (scheme) {
          currentIntentFilter.dataSchemes = currentIntentFilter.dataSchemes || [];
          currentIntentFilter.dataSchemes.push(scheme);
        }
      }

      // Build XML representation
      const indentStr = '  '.repeat(currentIndent);
      const attrStr = Object.entries(attrs)
        .map(([k, v]) => `android:${k}="${v}"`)
        .join(' ');
      xmlLines.push(`${indentStr}<${tagName}${attrStr ? ' ' + attrStr : ''}>`);
      currentIndent++;
    } else if (chunkType === 0x00100103) {
      // RES_XML_END_ELEMENT_TYPE
      const nameIdx = view.getUint32(offset + 20, true);
      const tagName = stringPool[nameIdx] || 'element';
      currentIndent = Math.max(0, currentIndent - 1);
      const indentStr = '  '.repeat(currentIndent);
      xmlLines.push(`${indentStr}</${tagName}>`);

      if (['activity', 'activity-alias', 'service', 'receiver', 'provider'].includes(tagName)) {
        if (currentComponent) {
          // If intent filter is defined and exported is not explicitly defined, Android defaults to exported=true on API < 31
          if (currentComponent.intentFilters && currentComponent.intentFilters.length > 0 && currentComponent.exported === undefined) {
            currentComponent.exported = true;
          }
          components.push(currentComponent as ManifestComponent);
          currentComponent = null;
        }
      } else if (tagName === 'intent-filter') {
        if (currentComponent && currentIntentFilter) {
          currentComponent.intentFilters = currentComponent.intentFilters || [];
          currentComponent.intentFilters.push(currentIntentFilter);
          currentIntentFilter = null;
        }
      }
    }

    offset += chunkSize;
  }

  const rawXml = xmlLines.join('\n');

  return {
    packageName,
    versionCode,
    versionName,
    minSdkVersion,
    targetSdkVersion,
    appLabel: appLabel || packageName.split('.').pop() || 'Android App',
    debuggable,
    allowBackup,
    usesCleartextTraffic,
    networkSecurityConfig,
    permissions,
    components,
    rawXml,
  };
}

/**
 * Helper to parse AXML String Pool Chunk
 */
function parseStringPool(buffer: Uint8Array, offset: number): string[] {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const stringCount = view.getUint32(offset + 8, true);
  const flags = view.getUint32(offset + 16, true);
  const stringsStart = view.getUint32(offset + 20, true);
  const isUtf8 = (flags & (1 << 8)) !== 0;

  const strings: string[] = [];
  const poolBase = offset + stringsStart;

  for (let i = 0; i < stringCount; i++) {
    const stringOffset = view.getUint32(offset + 28 + i * 4, true);
    const target = poolBase + stringOffset;

    if (target >= buffer.byteLength) continue;

    if (isUtf8) {
      // UTF-8 string: length prefix followed by utf-8 bytes
      let sIdx = target;
      // Skip length bytes
      if (sIdx < buffer.byteLength && (buffer[sIdx] & 0x80)) sIdx += 2;
      else sIdx += 1;
      if (sIdx < buffer.byteLength && (buffer[sIdx] & 0x80)) sIdx += 2;
      else sIdx += 1;

      let end = sIdx;
      while (end < buffer.byteLength && buffer[end] !== 0) {
        end++;
      }
      const strBytes = buffer.slice(sIdx, end);
      strings.push(new TextDecoder('utf-8').decode(strBytes));
    } else {
      // UTF-16LE string
      let sIdx = target;
      let len = view.getUint16(sIdx, true);
      sIdx += 2;
      if (len & 0x8000) {
        len = ((len & 0x7fff) << 16) | view.getUint16(sIdx, true);
        sIdx += 2;
      }
      let str = '';
      for (let j = 0; j < len; j++) {
        if (sIdx + j * 2 + 1 < buffer.byteLength) {
          str += String.fromCharCode(view.getUint16(sIdx + j * 2, true));
        }
      }
      strings.push(str);
    }
  }

  return strings;
}

/**
 * Parser for plain text XML Manifest
 */
function parseTextXmlManifest(text: string): ManifestInfo {
  const pkgMatch = text.match(/package\s*=\s*["']([^"']+)["']/);
  const vCodeMatch = text.match(/android:versionCode\s*=\s*["']([^"']+)["']/);
  const vNameMatch = text.match(/android:versionName\s*=\s*["']([^"']+)["']/);
  const minSdkMatch = text.match(/android:minSdkVersion\s*=\s*["']([^"']+)["']/);
  const targetSdkMatch = text.match(/android:targetSdkVersion\s*=\s*["']([^"']+)["']/);
  const debuggableMatch = text.match(/android:debuggable\s*=\s*["']([^"']+)["']/);
  const backupMatch = text.match(/android:allowBackup\s*=\s*["']([^"']+)["']/);
  const cleartextMatch = text.match(/android:usesCleartextTraffic\s*=\s*["']([^"']+)["']/);
  const labelMatch = text.match(/android:label\s*=\s*["']([^"']+)["']/);

  const permissions: PermissionItem[] = [];
  const permRegex = /<uses-permission[^>]*android:name\s*=\s*["']([^"']+)["'][^>]*\/?>/g;
  let pMatch: RegExpExecArray | null;
  while ((pMatch = permRegex.exec(text)) !== null) {
    const permName = pMatch[1];
    const info = KNOWN_PERMISSIONS_DB[permName];
    permissions.push({
      name: permName,
      shortName: permName.split('.').pop() || permName,
      description: info?.desc || 'Permission declared in manifest',
      isDangerous: info?.dangerous || false,
      status: info?.dangerous ? 'HIGH_RISK' : 'NORMAL',
    });
  }

  const components: ManifestComponent[] = [];
  const compRegex = /<(activity|service|receiver|provider)[^>]*android:name\s*=\s*["']([^"']+)["']([^>]*)>/g;
  let cMatch: RegExpExecArray | null;
  while ((cMatch = compRegex.exec(text)) !== null) {
    const type = cMatch[1] as ManifestComponent['type'];
    const name = cMatch[2];
    const rest = cMatch[3];
    const exported = rest.includes('android:exported="true"') || (rest.includes('<intent-filter') && !rest.includes('android:exported="false"'));

    components.push({
      name,
      type,
      exported,
      intentFilters: [],
      riskLevel: exported ? 'HIGH' : 'LOW',
      riskReason: exported ? 'Exported component exposed to system' : undefined,
    });
  }

  return {
    packageName: pkgMatch ? pkgMatch[1] : 'com.example.app',
    versionCode: vCodeMatch ? vCodeMatch[1] : '1',
    versionName: vNameMatch ? vNameMatch[1] : '1.0',
    minSdkVersion: minSdkMatch ? minSdkMatch[1] : '21',
    targetSdkVersion: targetSdkMatch ? targetSdkMatch[1] : '33',
    appLabel: labelMatch ? labelMatch[1] : 'Android App',
    debuggable: debuggableMatch ? debuggableMatch[1] === 'true' : false,
    allowBackup: backupMatch ? backupMatch[1] !== 'false' : true,
    usesCleartextTraffic: cleartextMatch ? cleartextMatch[1] === 'true' : false,
    permissions,
    components,
    rawXml: text,
  };
}

/**
 * Fallback string scraper for non-standard / obfuscated AXML
 */
function fallbackExtractManifest(buffer: Uint8Array): ManifestInfo {
  // Extract all ASCII/UTF8 strings from the binary
  const strings: string[] = [];
  let current: number[] = [];

  for (let i = 0; i < buffer.length; i++) {
    const byte = buffer[i];
    if (byte >= 32 && byte <= 126) {
      current.push(byte);
    } else {
      if (current.length >= 4) {
        strings.push(String.fromCharCode(...current));
      }
      current = [];
    }
  }

  const joined = strings.join(' ');
  const pkg = strings.find((s) => s.includes('.') && s.length > 5 && !s.startsWith('http') && !s.includes('/') && /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/i.test(s)) || 'com.target.androidapp';

  const permissions: PermissionItem[] = strings
    .filter((s) => s.startsWith('android.permission.') || s.includes('.permission.'))
    .map((name) => {
      const info = KNOWN_PERMISSIONS_DB[name];
      return {
        name,
        shortName: name.split('.').pop() || name,
        description: info?.desc || 'System permission',
        isDangerous: info?.dangerous || false,
        status: info?.dangerous ? 'HIGH_RISK' : 'NORMAL',
      };
    });

  const debuggable = joined.includes('debuggable') && joined.includes('true');
  const allowBackup = !joined.includes('allowBackup') || !joined.includes('false');
  const usesCleartext = joined.includes('usesCleartextTraffic');

  const components: ManifestComponent[] = [];
  const activityNames = strings.filter((s) => s.endsWith('Activity') || s.endsWith('Activity;') || s.includes('.activity.'));
  activityNames.slice(0, 15).forEach((name, idx) => {
    components.push({
      name: name.replace(/;$/, ''),
      type: 'activity',
      exported: idx === 0, // usually first activity is launcher
      intentFilters: idx === 0 ? [{ actions: ['android.intent.action.MAIN'], categories: ['android.intent.category.LAUNCHER'] }] : [],
      riskLevel: idx === 0 ? 'INFO' : 'LOW',
    });
  });

  return {
    packageName: pkg,
    versionCode: '1',
    versionName: '1.0.0',
    minSdkVersion: '24',
    targetSdkVersion: '33',
    appLabel: pkg.split('.').pop() || 'Target App',
    debuggable,
    allowBackup,
    usesCleartextTraffic: usesCleartext,
    permissions,
    components,
    rawXml: `<!-- Decoded Manifest via Static Parser -->\n<manifest package="${pkg}">\n  <application android:debuggable="${debuggable}" android:allowBackup="${allowBackup}" android:usesCleartextTraffic="${usesCleartext}">\n    ${components.map((c) => `<activity android:name="${c.name}" android:exported="${c.exported}" />`).join('\n    ')}\n  </application>\n</manifest>`,
  };
}
