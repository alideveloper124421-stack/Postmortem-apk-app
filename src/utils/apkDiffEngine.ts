/**
 * Differential APK Analysis Engine (Version / Mod Comparison)
 * Compares two APK analysis profiles side-by-side to highlight changes in permissions,
 * components, classes, and file sizes.
 */

import { ApkAnalysisResult, PermissionItem, ManifestComponent } from '../types/apk';

export interface DiffResult {
  apkA: { name: string; version: string; size: number; md5: string };
  apkB: { name: string; version: string; size: number; md5: string };
  oldApkName: string;
  newApkName: string;
  sizeDelta: number;
  sizeDeltaFormatted: string;
  permissionsDiff: {
    added: string[];
    removed: string[];
    common: string[];
  };
  addedPermissions: PermissionItem[];
  removedPermissions: PermissionItem[];
  componentsDiff: {
    added: string[];
    removed: string[];
    common: string[];
  };
  addedComponents: ManifestComponent[];
  removedComponents: ManifestComponent[];
  classesDiff: {
    addedCount: number;
    removedCount: number;
    addedSamples: string[];
    removedSamples: string[];
  };
  classesCountDelta: number;
  securityFlagsDiff: {
    flag: string;
    valueA: boolean | string;
    valueB: boolean | string;
    changed: boolean;
  }[];
}

export function compareApks(apkA: ApkAnalysisResult, apkB: ApkAnalysisResult): any {
  const sizeA = apkA.fileSize || 0;
  const sizeB = apkB.fileSize || 0;
  const sizeDelta = sizeB - sizeA;
  const sizeSign = sizeDelta > 0 ? '+' : '';
  const sizeDeltaFormatted = `${sizeSign}${(sizeDelta / 1024).toFixed(1)} KB`;

  // Permissions diff
  const permsA = new Set(apkA.manifest.permissions.map((p) => p.name));
  const permsB = new Set(apkB.manifest.permissions.map((p) => p.name));

  const permsAddedNames = Array.from(permsB).filter((p) => !permsA.has(p));
  const permsRemovedNames = Array.from(permsA).filter((p) => !permsB.has(p));
  const permsCommon = Array.from(permsA).filter((p) => permsB.has(p));

  const addedPermissions = apkB.manifest.permissions.filter((p) => !permsA.has(p.name));
  const removedPermissions = apkA.manifest.permissions.filter((p) => !permsB.has(p.name));

  // Components diff
  const compsA = new Set(apkA.manifest.components.map((c) => c.name));
  const compsB = new Set(apkB.manifest.components.map((c) => c.name));

  const compsAddedNames = Array.from(compsB).filter((c) => !compsA.has(c));
  const compsRemovedNames = Array.from(compsA).filter((c) => !compsB.has(c));
  const compsCommon = Array.from(compsA).filter((c) => compsB.has(c));

  const addedComponents = apkB.manifest.components.filter((c) => !compsA.has(c.name));
  const removedComponents = apkA.manifest.components.filter((c) => !compsB.has(c.name));

  // Classes diff
  const classesA = new Set(apkA.dex.classes.map((c) => c.className));
  const classesB = new Set(apkB.dex.classes.map((c) => c.className));

  const classesAdded = Array.from(classesB).filter((c) => !classesA.has(c));
  const classesRemoved = Array.from(classesA).filter((c) => !classesB.has(c));
  const classesCountDelta = (apkB.dex.classesCount || 0) - (apkA.dex.classesCount || 0);

  // Security Flags
  const securityFlagsDiff = [
    {
      flag: 'android:debuggable',
      valueA: apkA.manifest.debuggable,
      valueB: apkB.manifest.debuggable,
      changed: apkA.manifest.debuggable !== apkB.manifest.debuggable,
    },
    {
      flag: 'android:allowBackup',
      valueA: apkA.manifest.allowBackup,
      valueB: apkB.manifest.allowBackup,
      changed: apkA.manifest.allowBackup !== apkB.manifest.allowBackup,
    },
    {
      flag: 'android:usesCleartextTraffic',
      valueA: apkA.manifest.usesCleartextTraffic,
      valueB: apkB.manifest.usesCleartextTraffic,
      changed: apkA.manifest.usesCleartextTraffic !== apkB.manifest.usesCleartextTraffic,
    },
    {
      flag: 'minSdkVersion',
      valueA: `API ${apkA.manifest.minSdkVersion}`,
      valueB: `API ${apkB.manifest.minSdkVersion}`,
      changed: apkA.manifest.minSdkVersion !== apkB.manifest.minSdkVersion,
    },
    {
      flag: 'targetSdkVersion',
      valueA: `API ${apkA.manifest.targetSdkVersion}`,
      valueB: `API ${apkB.manifest.targetSdkVersion}`,
      changed: apkA.manifest.targetSdkVersion !== apkB.manifest.targetSdkVersion,
    },
  ];

  return {
    apkA: {
      name: apkA.fileName,
      version: `${apkA.manifest.versionName} (${apkA.manifest.versionCode})`,
      size: sizeA,
      md5: apkA.hashes.md5,
    },
    apkB: {
      name: apkB.fileName,
      version: `${apkB.manifest.versionName} (${apkB.manifest.versionCode})`,
      size: sizeB,
      md5: apkB.hashes.md5,
    },
    oldApkName: apkA.fileName,
    newApkName: apkB.fileName,
    sizeDelta,
    sizeDeltaFormatted,
    permissionsDiff: {
      added: permsAddedNames,
      removed: permsRemovedNames,
      common: permsCommon,
    },
    addedPermissions,
    removedPermissions,
    componentsDiff: {
      added: compsAddedNames,
      removed: compsRemovedNames,
      common: compsCommon,
    },
    addedComponents,
    removedComponents,
    classesDiff: {
      addedCount: classesAdded.length,
      removedCount: classesRemoved.length,
      addedSamples: classesAdded.slice(0, 10),
      removedSamples: classesRemoved.slice(0, 10),
    },
    classesCountDelta,
    securityFlagsDiff,
  };
}
