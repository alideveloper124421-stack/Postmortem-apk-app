/**
 * 🩸 GLITCH GATE UTILS v1.0
 * APK magic-byte validation, ZIP EOCD/Central-Directory forensics,
 * streaming SHA-256 (memory-safe), IndexedDB analysis cache.
 */

export interface ApkForensics {
  validZip: boolean;
  hasManifest: boolean;
  hasDex: boolean;
  dexCount: number;
  soCount: number;
  resCount: number;
  assetCount: number;
  totalEntries: number;
  splitBase: string | null;
  errors: string[];
}

export interface GateOptions {
  deepNative: boolean;
  il2cppProbe: boolean;
  deobStrings: boolean;
}

export interface GateRecord {
  id: string;
  name: string;
  size: number;
  sha256: string;
  ts: number;
  forensics: ApkForensics;
  report?: string;
}

/* ============ STREAMING SHA-256 (Pure TS, incremental) ============ */
const K256 = new Uint32Array([
  0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
  0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
  0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
  0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
  0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
  0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
  0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
  0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2]);
const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));

export class Sha256Stream {
  private h = new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]);
  private buf = new Uint8Array(64);
  private bufLen = 0;
  private totalLen = 0;
  private w = new Uint32Array(64);

  update(data: Uint8Array): void {
    this.totalLen += data.length;
    this.feedRaw(data);
  }

  private feedRaw(p: Uint8Array): void {
    let i = 0;
    if (this.bufLen) {
      const take = Math.min(64 - this.bufLen, p.length);
      this.buf.set(p.subarray(0, take), this.bufLen);
      this.bufLen += take; i = take;
      if (this.bufLen === 64) { this.compress(this.buf, 0); this.bufLen = 0; }
    }
    for (; i + 64 <= p.length; i += 64) this.compress(p, i);
    if (i < p.length) { this.buf.set(p.subarray(i), 0); this.bufLen = p.length - i; }
  }

  private compress(d: Uint8Array, off: number): void {
    const w = this.w, h = this.h;
    for (let t = 0; t < 16; t++) w[t] = (d[off+t*4]<<24)|(d[off+t*4+1]<<16)|(d[off+t*4+2]<<8)|d[off+t*4+3];
    for (let t = 16; t < 64; t++) {
      const s0 = rotr(w[t-15],7)^rotr(w[t-15],18)^(w[t-15]>>>3);
      const s1 = rotr(w[t-2],17)^rotr(w[t-2],19)^(w[t-2]>>>10);
      w[t] = (w[t-16]+s0+w[t-7]+s1) >>> 0;
    }
    let a=h[0],b=h[1],c=h[2],e0=h[3],e=h[4],f=h[5],g=h[6],hh=h[7];
    for (let t = 0; t < 64; t++) {
      const S1 = rotr(e,6)^rotr(e,11)^rotr(e,25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (hh+S1+ch+K256[t]+w[t]) >>> 0;
      const S0 = rotr(a,2)^rotr(a,13)^rotr(a,22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0+maj) >>> 0;
      hh=g; g=f; f=e; e=(e0+t1)>>>0; e0=c; c=b; b=a; a=(t1+t2)>>>0;
    }
    h[0]=(h[0]+a)>>>0; h[1]=(h[1]+b)>>>0; h[2]=(h[2]+c)>>>0; h[3]=(h[3]+e0)>>>0;
    h[4]=(h[4]+e)>>>0; h[5]=(h[5]+f)>>>0; h[6]=(h[6]+g)>>>0; h[7]=(h[7]+hh)>>>0;
  }

  digestHex(): string {
    const totalBits = this.totalLen * 8;
    const rem = this.bufLen;
    const padLen = rem < 56 ? 56 - rem : 120 - rem;
    const pad = new Uint8Array(padLen + 8);
    pad[0] = 0x80;
    const dv = new DataView(pad.buffer);
    dv.setUint32(pad.length - 8, Math.floor(totalBits / 0x100000000), false);
    dv.setUint32(pad.length - 4, totalBits >>> 0, false);
    this.feedRaw(pad);
    return Array.from(this.h).map(x => x.toString(16).padStart(8, '0')).join('');
  }
}

export async function streamSha256(file: File, onProgress?: (pct: number) => void): Promise<string> {
  const hasher = new Sha256Stream();
  const CHUNK = 8 * 1024 * 1024;
  for (let off = 0; off < file.size; off += CHUNK) {
    const buf = new Uint8Array(await file.slice(off, off + CHUNK).arrayBuffer());
    hasher.update(buf);
    onProgress?.(Math.min(100, Math.round(((off + CHUNK) / file.size) * 100)));
  }
  return hasher.digestHex();
}

/* ============ ZIP EOCD / CENTRAL-DIRECTORY FORENSICS ============ */
export async function analyzeApkStructure(file: File): Promise<ApkForensics> {
  const out: ApkForensics = { validZip:false, hasManifest:false, hasDex:false, dexCount:0, soCount:0, resCount:0, assetCount:0, totalEntries:0, splitBase:null, errors:[] };
  const head = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  if (!(head[0]===0x50 && head[1]===0x4b && head[2]===0x03 && head[3]===0x04)) {
    out.errors.push('Magic bytes galat hain — yeh ZIP/APK nahi hai');
    return out;
  }
  const tailSize = Math.min(file.size, 65557);
  const tail = new Uint8Array(await file.slice(file.size - tailSize).arrayBuffer());
  let eocd = -1;
  for (let i = tail.length - 22; i >= 0; i--) {
    if (tail[i]===0x50 && tail[i+1]===0x4b && tail[i+2]===0x05 && tail[i+3]===0x06) { eocd = i; break; }
  }
  if (eocd < 0) { out.errors.push('EOCD record nahi mila — file corrupt hai'); return out; }
  const dv = new DataView(tail.buffer, tail.byteOffset, tail.byteLength);
  out.totalEntries = dv.getUint16(eocd + 10, true);
  const cdSize = dv.getUint32(eocd + 12, true);
  const cdOff = dv.getUint32(eocd + 16, true);
  const cd = new Uint8Array(await file.slice(cdOff, cdOff + cdSize).arrayBuffer());
  const cv = new DataView(cd.buffer, cd.byteOffset, cd.byteLength);
  const dec = new TextDecoder();
  let off = 0;
  for (let n = 0; n < out.totalEntries && off + 46 <= cd.length; n++) {
    if (cv.getUint32(off, true) !== 0x02014b50) break;
    const nameLen = cv.getUint16(off + 28, true);
    const extraLen = cv.getUint16(off + 30, true);
    const commentLen = cv.getUint16(off + 32, true);
    const name = dec.decode(cd.slice(off + 46, off + 46 + nameLen));
    if (name === 'AndroidManifest.xml') out.hasManifest = true;
    if (/^classes\d*\.dex$/.test(name)) { out.hasDex = true; out.dexCount++; }
    if (name.endsWith('.so')) out.soCount++;
    if (name.startsWith('res/')) out.resCount++;
    if (name.startsWith('assets/')) out.assetCount++;
    if (!out.splitBase && /base\.apk$/.test(name)) out.splitBase = name;
    off += 46 + nameLen + extraLen + commentLen;
  }
  out.validZip = true;
  if (!out.hasManifest) out.errors.push('AndroidManifest.xml missing — shayad split APK hai');
  if (!out.hasDex && !out.splitBase) out.errors.push('Koi classes.dex nahi mila');
  return out;
}

export function validateFile(file: File): string | null {
  if (!/\.(apk|xapk|apks|zip)$/i.test(file.name)) return 'Sirf .apk / .xapk / .apks / .zip files allowed hain';
  if (file.size < 10000) return 'File bohat chhoti hai — yeh real APK nahi hai';
  if (file.size > 1500000000) return '1.5GB se bari files support nahi';
  return null;
}

/* ============ INDEXEDDB CACHE (Recent Analyses) ============ */
const DB = 'glitch_gate_db', STORE = 'analyses';
function openDb(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const rq = indexedDB.open(DB, 1);
    rq.onupgradeneeded = () => { rq.result.createObjectStore(STORE, { keyPath: 'id' }); };
    rq.onsuccess = () => res(rq.result);
    rq.onerror = () => rej(rq.error);
  });
}
export async function cachePut(rec: GateRecord): Promise<void> {
  const db = await openDb();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(rec);
    const list = tx.objectStore(STORE).getAll();
    list.onsuccess = () => {
      const all = (list.result as GateRecord[]).sort((a, b) => b.ts - a.ts);
      all.slice(10).forEach(old => tx.objectStore(STORE).delete(old.id));
    };
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}
export async function cacheList(): Promise<GateRecord[]> {
  const db = await openDb();
  return new Promise((res, rej) => {
    const rq = db.transaction(STORE).objectStore(STORE).getAll();
    rq.onsuccess = () => res((rq.result as GateRecord[]).sort((a, b) => b.ts - a.ts));
    rq.onerror = () => rej(rq.error);
  });
}
export async function cacheGet(id: string): Promise<GateRecord | undefined> {
  const db = await openDb();
  return new Promise((res, rej) => {
    const rq = db.transaction(STORE).objectStore(STORE).get(id);
    rq.onsuccess = () => res(rq.result);
    rq.onerror = () => rej(rq.error);
  });
}