import React from "react";
import { Shield, ExternalLink, Globe, Database } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-[#02050e] py-8 px-4 sm:px-6 text-xs font-mono text-slate-500 mt-16">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold text-xs">
            J
          </div>
          <div>
            <span className="text-slate-300 font-bold tracking-tight">JALNETRA GLOBAL v2.0</span>
            <span className="mx-2 text-slate-700">•</span>
            <span>AI-Powered Climate, Rainfall & Water Intelligence Digital Twin</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-[11px]">
          <span className="text-slate-400">
            Engineered by <strong className="text-slate-200">CIPHER</strong> — <em>Decode. Build. Evolve.</em>
          </span>
          <span className="text-slate-700">•</span>
          <span className="text-cyan-400/80">Kolkata Pilot Basin [22.57°N, 88.36°E]</span>
          <span className="text-slate-700">•</span>
          <span className="text-slate-400">NASA GPM • Copernicus Sentinel • NOAA CPC</span>
        </div>
      </div>
    </footer>
  );
};
