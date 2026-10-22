/**
 * apktool.yml Generator
 * Reconstructs the exact apktool.yml configuration needed for recompiling with Apktool
 */

import { ManifestInfo, FileEntrySummary, ApkAnalysisResult } from '../types/apk';

export function generateApktoolYml(
  manifestOrApk: ManifestInfo | ApkAnalysisResult,
  fileName?: string,
  files?: FileEntrySummary[]
): string {
  let manifest: ManifestInfo;
  let targetFileName: string;
  let fileList: FileEntrySummary[] = [];

  if ('manifest' in manifestOrApk) {
    // Passed an ApkAnalysisResult
    manifest = manifestOrApk.manifest;
    targetFileName = fileName || manifestOrApk.fileName || 'app-release.apk';
    fileList = files || manifestOrApk.files || [];
  } else {
    // Passed ManifestInfo directly
    manifest = manifestOrApk;
    targetFileName = fileName || 'app-release.apk';
    fileList = files || [];
  }

  const uncompressedExtensions = new Set<string>();
  // Include standard Android uncompressed types by default
  ['.png', '.arsc', '.so', '.webp'].forEach((ext) => uncompressedExtensions.add(ext.replace('.', '')));

  fileList.forEach((f) => {
    if (f.name && f.name.includes('.')) {
      const ext = f.name.split('.').pop()?.toLowerCase();
      if (ext && ['png', 'jpg', 'jpeg', 'webp', 'mp3', 'ogg', 'wav', 'arsc', 'so'].includes(ext)) {
        uncompressedExtensions.add(ext);
      }
    }
  });

  const lines: string[] = [
    `version: 2.11.0`,
    `apkFileName: ${targetFileName}`,
    `isFrameworkApk: false`,
    `usesFramework:`,
    `  ids:`,
    `  - 1`,
    `  tag: null`,
    `sdkInfo:`,
    `  minSdkVersion: '${manifest.minSdkVersion}'`,
    `  targetSdkVersion: '${manifest.targetSdkVersion}'`,
    `packageInfo:`,
    `  cur_package: ${manifest.packageName}`,
    `  rename_manifest_package: null`,
    `versionInfo:`,
    `  versionCode: '${manifest.versionCode}'`,
    `  versionName: '${manifest.versionName}'`,
    `sharedLibrary: false`,
    `sparseResources: false`,
    `compressionType: false`,
    `unknownFiles: {}`,
    `doNotCompress:`,
  ];

  Array.from(uncompressedExtensions).sort().forEach((ext) => {
    lines.push(`- ${ext}`);
  });

  return lines.join('\n');
}
