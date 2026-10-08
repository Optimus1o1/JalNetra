'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  Waves,
  Zap,
  ArrowRight,
  Flame,
  CheckCircle2,
} from 'lucide-react';

export function StormModeSection() {
  const [activeStage, setActiveStage] = useState<'WATCH' | 'WARNING' | 'EMERGENCY'>('WARNING');
  const [tankDepletionPercent, setTankDepletionPercent] = useState<number>(65);

  const stages = [
    {
      level: 'WATCH',
      threshold: '25-50 mm/hr forecast',
      color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
      action: 'Targeted Pre-drawdown (30%)',
    },
    {
      level: 'WARNING',
      threshold: '50-80 mm/hr convective band',
      color: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
      action: 'Aggressive Depletion (65%)',
    },
    {
      level: 'EMERGENCY',
      threshold: '>80 mm/hr Cloudburst & High Tide Lock',
      color: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
      action: 'Maximum Emergency Detention (100%)',
    },
  ];

  return (
    <section className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-950/40 via-slate-900 to-amber-950/30 p-6 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 rounded-full bg-rose-500 animate-ping" />
              <Badge variant="outline" className="border-rose-500 text-rose-400 font-mono">
                CRITICAL DISPATCH ENGINE · KMC COMMAND
              </Badge>
              <Badge variant="outline" className="border-cyan-500/40 text-cyan-400 font-mono text-[10px]">
                CALIBRATED SURROGATE
              </Badge>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Pre-Storm Detention & Lockup Relief Dispatcher
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              When heavy rainfall coincides with Hooghly River high tide lock at outfalls, secondary storage
              must be pre-emptively drained to create active retention buffers and alleviate urban waterlogging.
            </p>
          </div>
          <div className="flex flex-col items-end justify-center bg-slate-950/80 border border-rose-500/20 p-4 rounded-xl">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">
              Hooghly Lock Status
            </div>
            <div className="text-lg font-bold text-rose-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 animate-bounce" />
              LOCKUP ACTIVE (5.12m)
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-1">
              Gates closed at Palmer&apos;s Bridge &amp; Dhapa
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Alert Trigger Matrix & Action Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stage Selector */}
        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader>
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Flame className="h-4 w-4 text-amber-400" />
              Storm Alert Tier
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stages.map((st) => (
              <div
                key={st.level}
                onClick={() => {
                  setActiveStage(st.level as 'WATCH' | 'WARNING' | 'EMERGENCY');
                  setTankDepletionPercent(st.level === 'WATCH' ? 30 : st.level === 'WARNING' ? 65 : 100);
                }}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  activeStage === st.level
                    ? `${st.color} shadow-lg shadow-rose-950/20 ring-1 ring-rose-500/50`
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between font-mono font-bold text-sm">
                  <span>STAGE: {st.level}</span>
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {st.threshold}
                  </Badge>
                </div>
                <div className="text-xs mt-1 text-slate-300 font-medium">{st.action}</div>
              </div>
            ))}

            <div className="pt-4 border-t border-slate-800/80">
              <div className="text-xs text-slate-400 mb-2 flex justify-between">
                <span>Active Pre-detention Target</span>
                <span className="font-mono text-cyan-400 font-bold">{tankDepletionPercent}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={tankDepletionPercent}
                onChange={(e) => setTankDepletionPercent(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Real-Time Impact Projection */}
        <Card className="bg-slate-900/60 border-slate-800 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-cyan-400" />
                Live Hydraulic Relief Metrics (Kolkata Core Catchments)
              </span>
              <Badge variant="outline" className="border-cyan-500/40 text-cyan-300 font-mono text-[11px]">
                PROVENANCE: SIMULATED / CALIBRATED SURROGATE
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-1">
                <div className="text-xs text-slate-400 font-mono uppercase">Detention Volume Freed</div>
                <div className="text-2xl font-bold text-cyan-400 font-mono">
                  {((tankDepletionPercent / 100) * 16.4).toFixed(1)} ML
                </div>
                <div className="text-[11px] text-slate-500">Across 18 municipal RWH tanks</div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-1">
                <div className="text-xs text-slate-400 font-mono uppercase">Peak Drainage Relieved</div>
                <div className="text-2xl font-bold text-emerald-400 font-mono">
                  {((tankDepletionPercent / 100) * 24.2).toFixed(1)}%
                </div>
                <div className="text-[11px] text-slate-500">Palmer&apos;s Bridge Outfall basin</div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-1">
                <div className="text-xs text-slate-400 font-mono uppercase">Waterlogging Delay</div>
                <div className="text-2xl font-bold text-amber-400 font-mono">
                  +{Math.round((tankDepletionPercent / 100) * 140)} mins
                </div>
                <div className="text-[11px] text-slate-500">Buffer window for gravity discharge</div>
              </div>
            </div>

            {/* Recommended Automated Dispatches */}
            <div className="space-y-3">
              <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Action Protocol Sequence
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/40 border border-slate-800/80">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-0.5">
                    <div className="font-semibold text-slate-200">
                      Step 1: Divert existing secondary water to tertiary injection borewells
                    </div>
                    <div className="text-slate-400">
                      Discharges 4.2 ML into deep sandy aquifer zones (Ward 66) without entering stormwater gullies.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/40 border border-slate-800/80">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-0.5">
                    <div className="font-semibold text-slate-200">
                      Step 2: Command SCADA motorized valves at College Street &amp; Maidan Cisterns
                    </div>
                    <div className="text-slate-400">
                      Opens bottom drain sluices 3.5 hours prior to high-tide lock onset.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/40 border border-slate-800/80">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-0.5">
                    <div className="font-semibold text-slate-200">
                      Step 3: Lock stormwater intake grates to capture first-flush sediment
                    </div>
                    <div className="text-slate-400">
                      Bypasses initial 15mm sediment load directly to silt traps before main tank detention.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                className="border-rose-500/50 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 font-mono text-xs flex items-center gap-2"
              >
                <span>EXECUTE SCADA PRE-DETENTION PROTOCOL</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
