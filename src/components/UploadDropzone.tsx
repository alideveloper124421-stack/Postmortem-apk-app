/**
 * Drag and Drop Upload Zone with Animated Processing Steps and Presets
 */

import React, { useRef, useState } from 'react';
import { UploadCloud, FileCode2, ShieldAlert, Cpu, Sparkles, AlertCircle } from 'lucide-react';

interface UploadDropzoneProps {
  onFileSelected: (file: File) => void;
  onLoadPreset: (presetKey: 'vulnbank' | 'securevault' | 'neogame') => void;
  isProcessing: boolean;
  progressPercent: number;
  currentStage: string;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  onFileSelected,
  onLoadPreset,
  isProcessing,
  progressPercent,
  currentStage,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelected(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      {/* Upload Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all cursor-pointer overflow-hidden ${
          isDragging
            ? 'border-emerald-400 bg-emerald-950/20 scale-[1.005]'
            : 'border-zinc-700/80 hover:border-zinc-500 bg-zinc-900/60 hover:bg-zinc-900/90'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".apk,.xapk,.zip"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isProcessing}
        />

        {isProcessing ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-4">
            <div className="relative w-16 h-16">
              <div className="w-16 h-16 rounded-full border-4 border-zinc-800 border-t-emerald-400 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold text-emerald-400">
                {progressPercent}%
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-semibold text-zinc-100">
                Deep Decompilation & Reverse Engineering in Progress...
              </h3>
              <p className="text-xs font-mono text-emerald-400 animate-pulse">
                {currentStage || 'Processing APK archive...'}
              </p>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full max-w-md bg-zinc-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center space-x-4 text-[11px] font-mono text-zinc-400 pt-2">
              <span className={progressPercent >= 30 ? 'text-emerald-400' : 'text-zinc-600'}>
                ✓ ZIP Unpack
              </span>
              <span>→</span>
              <span className={progressPercent >= 50 ? 'text-emerald-400' : 'text-zinc-600'}>
                ✓ Manifest AXML
              </span>
              <span>→</span>
              <span className={progressPercent >= 70 ? 'text-emerald-400' : 'text-zinc-600'}>
                ✓ Smali Disassembly
              </span>
              <span>→</span>
              <span className={progressPercent >= 90 ? 'text-emerald-400' : 'text-zinc-600'}>
                ✓ Frida & Postmortem
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-300 shadow-inner group-hover:text-emerald-400">
              <UploadCloud className="w-8 h-8 text-emerald-400" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-zinc-100 tracking-tight">
                Upload Target APK or Drag & Drop Here
              </h2>
              <p className="text-sm text-zinc-400 mt-0.5">
                Koe bhi Android APK upload karein — static analysis, Smali files, Frida scripts aur deep report tayyar hogi.
              </p>
              <p className="text-xs font-mono text-zinc-500 mt-1">
                Supported formats: <span className="text-zinc-300">.apk, .xapk, .zip</span> (No file size limit)
              </p>
            </div>

            <div className="inline-flex items-center px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs tracking-wide shadow-md transition-all mt-2">
              Browse APK File from Computer
            </div>
          </div>
        )}
      </div>

      {/* Preset Quick-Loaders */}
      {!isProcessing && (
        <div className="mt-4 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Quick Test Without APK File (Sample Real-World Profiles)
              </span>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">1-Click Instant Load</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Preset 1 */}
            <button
              onClick={() => onLoadPreset('vulnbank')}
              className="flex flex-col items-start p-3 rounded-lg bg-zinc-950/70 hover:bg-zinc-900 border border-red-500/30 hover:border-red-500/60 transition-all text-left group"
            >
              <div className="flex items-center space-x-2 w-full justify-between">
                <span className="text-xs font-bold text-red-300 group-hover:text-red-200">
                  🏦 VulnBank Pro (Insecure)
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-950 border border-red-800 text-red-400 font-bold">
                  HIGH RISK
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                Contains debuggable flag, cleartext HTTP, hardcoded AWS/Stripe keys, weak AES/ECB cipher & SMS intercept hooks.
              </p>
            </button>

            {/* Preset 2 */}
            <button
              onClick={() => onLoadPreset('securevault')}
              className="flex flex-col items-start p-3 rounded-lg bg-zinc-950/70 hover:bg-zinc-900 border border-emerald-500/30 hover:border-emerald-500/60 transition-all text-left group"
            >
              <div className="flex items-center space-x-2 w-full justify-between">
                <span className="text-xs font-bold text-emerald-300 group-hover:text-emerald-200">
                  🛡️ SecureVault Messenger
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold">
                  HARDENED
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                OWASP MASVS compliant, cert pinning active, strict exported component rules, no cleartext traffic.
              </p>
            </button>

            {/* Preset 3 */}
            <button
              onClick={() => onLoadPreset('neogame')}
              className="flex flex-col items-start p-3 rounded-lg bg-zinc-950/70 hover:bg-zinc-900 border border-cyan-500/30 hover:border-cyan-500/60 transition-all text-left group"
            >
              <div className="flex items-center space-x-2 w-full justify-between">
                <span className="text-xs font-bold text-cyan-300 group-hover:text-cyan-200">
                  🎮 NeoGame 3D Controller
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-400 font-bold">
                  NATIVE SO
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                Features native C++ .so shared libraries (ARM64/x86), JNI bridges, Bluetooth permissions, and Unity assets.
              </p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
