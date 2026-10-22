/**
 * Types for APK Postmortem & Reverse Engineering Studio
 */

export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export interface SecurityFinding {
  id: string;
  title: string;
  severity: SeverityLevel;
  category: 'MANIFEST' | 'CRYPTO' | 'NETWORK' | 'STORAGE' | 'IPC' | 'SECRETS' | 'PERMISSIONS';
  description: string;
  recommendation: string;
  affectedItem?: string;
  cwe?: string;
  masvsId?: string;
}

export interface OwaspCategory {
  id: string;
  name: string;
  score: number; // 0-100
  status: 'PASS' | 'WARN' | 'FAIL';
  summary: string;
}

export interface ManifestComponent {
  name: string;
  type: 'activity' | 'service' | 'receiver' | 'provider';
  exported: boolean;
  permission?: string;
  intentFilters: {
    actions: string[];
    categories: string[];
    dataSchemes?: string[];
  }[];
  riskLevel: SeverityLevel;
  riskReason?: string;
}

export interface PermissionItem {
  name: string;
  shortName: string;
  description: string;
  isDangerous: boolean;
  protectionLevel?: string;
  status: 'HIGH_RISK' | 'NORMAL' | 'SIGNATURE' | 'CUSTOM';
}

export interface SmaliMethod {
  name: string;
  signature: string;
  accessFlags: string[];
  instructions: string[];
  parameters: string[];
  returnType: string;
  cfg?: CfgGraph;
}

export interface SmaliField {
  name: string;
  type: string;
  accessFlags: string[];
  value?: string;
}

export interface SmaliClass {
  className: string;
  packageName: string;
  simpleName: string;
  superclass: string;
  interfaces: string[];
  accessFlags: string[];
  fields: SmaliField[];
  methods: SmaliMethod[];
  rawSmali: string;
  decompiledJava: string;
  decompiledKotlin: string;
  detectedSecrets?: string[];
  hasCryptoUsage?: boolean;
  hasNetworkUsage?: boolean;
}

export interface CfgNode {
  id: string;
  label: string;
  type: 'entry' | 'block' | 'condition' | 'return';
  instructions: string[];
  branches?: { targetId: string; label?: string }[];
}

export interface CfgGraph {
  className: string;
  methodName: string;
  nodes: CfgNode[];
}

export interface JniFunction {
  name: string;
  signature: string;
  library: string;
  offsetHex: string;
  isExported: boolean;
  targetJavaMethod?: string;
}

export interface NativeLibAnalysis {
  libraryName: string;
  arch: string;
  path: string;
  size: number;
  jniFunctions: JniFunction[];
  symbolsCount: number;
  symbols: string[];
  securityHardening: {
    pie: boolean;
    stackCanary: boolean;
    nx: boolean;
    relro: 'Full' | 'Partial' | 'None';
  };
}

export interface AntiTamperRoutine {
  type: 'ROOT' | 'EMULATOR' | 'SSL_PINNING' | 'ANTI_DEBUG' | 'INTEGRITY';
  name: string;
  location: string;
  detectionMethod: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  codeSnippet: string;
}

export interface DynamicTraceEvent {
  id: string;
  timestamp: string;
  category: 'NETWORK' | 'CRYPTO' | 'FILE_IO' | 'IPC' | 'SECURITY';
  apiCall: string;
  details: string;
  stackTrace: string;
  severity?: 'NORMAL' | 'ALERT';
}

export interface XrefItem {
  targetApi: string;
  category: 'CRYPTO' | 'NETWORK' | 'DEVICE_ID' | 'FILE' | 'IPC' | 'EXEC';
  risk: SeverityLevel;
  description: string;
  callers: {
    className: string;
    methodName: string;
    lineHint: string;
  }[];
}

export interface DexInfo {
  dexCount: number;
  classesCount: number;
  methodsCount: number;
  stringsCount: number;
  classes: SmaliClass[];
  strings: string[];
  interestingStrings: {
    category: 'API_KEY' | 'URL' | 'IP' | 'CREDENTIAL' | 'PATH' | 'SUSPICIOUS';
    value: string;
    sourceClass?: string;
  }[];
}

export interface ManifestInfo {
  packageName: string;
  versionCode: string;
  versionName: string;
  minSdkVersion: string;
  targetSdkVersion: string;
  appLabel: string;
  appIcon?: string;
  debuggable: boolean;
  allowBackup: boolean;
  usesCleartextTraffic: boolean;
  networkSecurityConfig?: string;
  permissions: PermissionItem[];
  components: ManifestComponent[];
  rawXml: string;
}

export interface FileEntrySummary {
  name: string;
  path: string;
  size: number;
  compressedSize: number;
  isDex: boolean;
  isSmali: boolean;
  isResource: boolean;
  isNativeLib: boolean;
  isCert: boolean;
  category: 'DEX' | 'SMALI' | 'RESOURCE' | 'NATIVE_LIB' | 'CERT' | 'ASSET' | 'OTHER';
}

export interface CertificateInfo {
  present: boolean;
  files: string[];
  signatureAlgorithm?: string;
  issuer?: string;
  subject?: string;
  md5Fingerprint?: string;
  sha1Fingerprint?: string;
  sha256Fingerprint?: string;
  v1Signed: boolean;
  v2Signed: boolean;
}

export interface FridaScriptDef {
  id: string;
  name: string;
  description: string;
  category: 'SSL_PINNING' | 'ROOT_BYPASS' | 'CRYPTO_MONITOR' | 'INTENT_SPY' | 'CUSTOM_HOOK';
  code: string;
  target?: string;
}

export interface ApkAnalysisResult {
  fileName: string;
  fileSize: number;
  fileSizeBytesFormatted: string;
  hashes: {
    md5: string;
    sha1: string;
    sha256: string;
  };
  manifest: ManifestInfo;
  dex: DexInfo;
  files: FileEntrySummary[];
  certificates: CertificateInfo;
  nativeAnalysis: NativeLibAnalysis[];
  antiTamperRoutines: AntiTamperRoutine[];
  dynamicTraceLogs: DynamicTraceEvent[];
  xrefs: XrefItem[];
  securityAudit: {
    score: number; // 0 (catastrophic) to 100 (hardened)
    riskRating: SeverityLevel;
    findings: SecurityFinding[];
    owaspMatrix: OwaspCategory[];
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    infoCount: number;
  };
  fridaScripts: FridaScriptDef[];
  postmortemTextReport: string;
  analyzedAt: string;
}
