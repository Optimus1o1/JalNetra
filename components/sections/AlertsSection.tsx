"use client";

import React, { useState } from "react";
import { INITIAL_ALERTS } from "@/lib/data/alertsData";
import { AlertItem } from "@/lib/types";
import { Bell, AlertTriangle, ShieldCheck, CheckCircle2, Clock, Check, Building2, User } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

export const AlertsSection: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertItem[]>(INITIAL_ALERTS);
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  const handleAcknowledge = async (alertId: string) => {
    setAcknowledgingId(alertId);
    try {
      const res = await fetch("/api/v1/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alertId,
          operatorName: "KMC Central Disaster Control Desk",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAlerts((prev) =>
          prev.map((a) => (a.id === alertId ? data.updatedAlert : a))
        );
      }
    } catch (err) {
      console.error("Failed to acknowledge alert", err);
    } finally {
      setAcknowledgingId(null);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filterSeverity === "all") return true;
    return a.severity === filterSeverity;
  });

  const activeCount = alerts.filter((a) => a.status === "active").length;

  return (
    <section id="alerts" className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-rose-400" />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
              Alerts & Emergency Decision Triage
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-mono mt-1">
            Impact-based probabilistic early warnings with civil defence response protocols
          </p>
        </div>

        {/* Severity Filter Pills */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400 mr-1 hidden sm:inline">Severity:</span>
          {["all", "critical", "high", "medium"].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1 rounded-lg border capitalize transition-colors ${
                filterSeverity === sev
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500 font-bold"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Grid */}
      <div className="space-y-4">
        {filteredAlerts.map((alert) => {
          const isCritical = alert.severity === "critical";
          const isAcknowledged = alert.status === "acknowledged";

          return (
            <GlassCard
              key={alert.id}
              tone={isCritical ? "danger" : "standard"}
              className="p-5"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      {alert.alertCode}
                    </span>
                    <Badge
                      variant={
                        alert.severity === "critical"
                          ? "rose"
                          : alert.severity === "high"
                          ? "amber"
                          : "cyan"
                      }
                      size="sm"
                    >
                      {alert.severity.toUpperCase()}
                    </Badge>
                    <span className="text-xs font-mono text-slate-400">
                      {alert.category}
                    </span>
                    <span className="text-xs font-mono text-slate-500">• {alert.issuedAt}</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-100">{alert.title}</h3>

                  <p className="text-xs text-slate-300 font-mono leading-relaxed">
                    {alert.primaryCause}
                  </p>

                  {/* Impacted Infrastructure */}
                  <div className="pt-2">
                    <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold block mb-1">
                      Threatened Critical Infrastructure:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {alert.affectedInfrastructure.map((infra, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center gap-1"
                        >
                          <Building2 className="w-3 h-3 text-cyan-400" />
                          {infra}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Civil Defence Recommended Protocols */}
                  <div className="pt-2">
                    <span className="text-[11px] font-mono text-emerald-400 uppercase font-semibold block mb-1">
                      Recommended Action Protocols:
                    </span>
                    <ul className="space-y-1 text-xs text-slate-300 font-mono">
                      {alert.recommendedCivilActions.map((act, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Right Status / Acknowledge Block */}
                <div className="flex flex-col items-end justify-between self-stretch shrink-0 pt-2 md:pt-0">
                  <div className="text-right font-mono text-xs">
                    <span className="text-slate-400 text-[10px] uppercase block">
                      AI Model Confidence
                    </span>
                    <span className="text-lg font-bold text-cyan-300 telemetry-num">
                      {(alert.confidenceScore * 100).toFixed(0)}%
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Composite Risk: {alert.compositeRisk.toFixed(2)}
                    </span>
                  </div>

                  <div className="mt-4">
                    {isAcknowledged ? (
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-xs font-mono text-emerald-300">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Acknowledged
                        </span>
                        {alert.acknowledgedBy && (
                          <span className="text-[10px] font-mono text-slate-400 block mt-1">
                            By {alert.acknowledgedBy} ({alert.acknowledgedAt})
                          </span>
                        )}
                      </div>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<Check className="w-3.5 h-3.5" />}
                        loading={acknowledgingId === alert.id}
                        onClick={() => handleAcknowledge(alert.id)}
                      >
                        Acknowledge & Dispatch
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </section>
  );
};
