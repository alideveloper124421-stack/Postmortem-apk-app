/**
 * Vulnerabilities & Deep Security Audit Tab
 */

import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, Info, CheckCircle2, Search, ExternalLink, Shield } from 'lucide-react';
import { ApkAnalysisResult, SecurityFinding, SeverityLevel } from '../types/apk';

interface VulnerabilitiesTabProps {
  apk: ApkAnalysisResult;
}

export const VulnerabilitiesTab: React.FC<VulnerabilitiesTabProps> = ({ apk }) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const findings = apk.securityAudit.findings;

  const filteredFindings = findings.filter((f) => {
    const matchesSeverity = selectedSeverity === 'ALL' || f.severity === selectedSeverity;
    const matchesSearch =
      searchQuery === '' ||
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.affectedItem && f.affectedItem.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (f.masvsId && f.masvsId.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSeverity && matchesSearch;
  });

  const getSeverityBadge = (sev: SeverityLevel) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-red-950/90 text-red-300 border-red-800';
      case 'HIGH':
        return 'bg-orange-950/90 text-orange-300 border-orange-800';
      case 'MEDIUM':
        return 'bg-amber-950/90 text-amber-300 border-amber-800';
      case 'LOW':
        return 'bg-blue-950/90 text-blue-300 border-blue-800';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
          <input
            type="text"
            placeholder="Search findings by title, CWE, component, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-700/80 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => {
            const count =
              sev === 'ALL'
                ? findings.length
                : findings.filter((f) => f.severity === sev).length;

            return (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                  selectedSeverity === sev
                    ? 'bg-zinc-100 text-zinc-950 shadow'
                    : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                {sev} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Findings List */}
      <div className="space-y-3">
        {filteredFindings.length === 0 ? (
          <div className="p-12 text-center rounded-xl bg-zinc-900/30 border border-zinc-800 text-zinc-400">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-2 opacity-80" />
            <p className="text-sm font-semibold text-zinc-200">No findings match this filter</p>
            <p className="text-xs text-zinc-500 mt-1">Try resetting search or severity filter</p>
          </div>
        ) : (
          filteredFindings.map((finding) => {
            const isExpanded = expandedId === finding.id || true; // expanded by default for full audit visibility

            return (
              <div
                key={finding.id}
                className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700/80 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2.5 flex-wrap">
                    <span
                      className={`text-[11px] font-mono font-black uppercase px-2 py-0.5 rounded border ${getSeverityBadge(
                        finding.severity
                      )}`}
                    >
                      {finding.severity}
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                      {finding.category}
                    </span>
                    {finding.masvsId && (
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 font-bold">
                        {finding.masvsId}
                      </span>
                    )}
                    <span className="text-xs font-mono text-zinc-500">
                      {finding.id}
                    </span>
                  </div>

                  {finding.cwe && (
                    <span className="text-[11px] font-mono text-zinc-400">
                      {finding.cwe}
                    </span>
                  )}
                </div>

                <h4 className="text-base font-bold text-zinc-100">
                  {finding.title}
                </h4>

                {finding.affectedItem && (
                  <div className="text-xs font-mono p-2 rounded bg-zinc-950 border border-zinc-800 text-zinc-300 break-all">
                    <span className="text-zinc-500 mr-2">Target:</span>
                    {finding.affectedItem}
                  </div>
                )}

                <div className="text-xs text-zinc-300 leading-relaxed space-y-2">
                  <p>{finding.description}</p>
                </div>

                <div className="mt-2 p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-xs">
                  <div className="font-semibold text-emerald-400 flex items-center gap-1.5 mb-1">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Security Remediation & Defense Strategy</span>
                  </div>
                  <p className="text-zinc-300 leading-relaxed">
                    {finding.recommendation}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
