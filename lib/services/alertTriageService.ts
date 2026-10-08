export interface AlertEvent {
  id: string;
  wardId: number;
  severity: 'CRITICAL' | 'WARNING' | 'WATCH';
  eventType: 'WATERLOGGING_PREDICTION' | 'OUTFALL_LOCKUP' | 'SENSOR_ANOMALY';
  predictedDepthCm?: number;
  leadTimeHours?: number;
  timestamp: string;
}

export interface TriagedResponse {
  alertId: string;
  recommendedAction: string;
  dispatchUrgency: 'IMMEDIATE' | 'STAGED' | 'MONITOR';
  mitigationSteps: string[];
  coordinationUnit: 'KMC_DRAINAGE' | 'IRRIGATION_DEPT' | 'DISASTER_MANAGEMENT';
  provenance: 'SIMULATED';
}

/**
 * Triages an incoming flood/storm alert into actionable municipal emergency dispatch orders.
 */
export function triageAlert(alert: AlertEvent): TriagedResponse {
  if (alert.severity === 'CRITICAL' || (alert.predictedDepthCm && alert.predictedDepthCm >= 30)) {
    return {
      alertId: alert.id,
      recommendedAction: 'ACTIVATE_EMERGENCY_DETENTION_AND_HIGH_CAPACITY_PORTABLE_PUMPS',
      dispatchUrgency: 'IMMEDIATE',
      mitigationSteps: [
        'Pre-deplete secondary storage tanks by 100% into tertiary injection wells',
        'Deploy heavy tractor-mounted pump units to low-lying arterial intersections',
        'Notify Kolkata Traffic Police for localized vehicular diversions',
        'Close gravity sluices at Palmer Bridge & Ballygunge before river tide peak reaches 4.8m',
      ],
      coordinationUnit: 'DISASTER_MANAGEMENT',
      provenance: 'SIMULATED',
    };
  }

  if (alert.severity === 'WARNING') {
    return {
      alertId: alert.id,
      recommendedAction: 'STAGED_RETENTION_PRE_DRAWDOWN',
      dispatchUrgency: 'STAGED',
      mitigationSteps: [
        'Open secondary storage cistern drain valves by 65% across Ward ' + alert.wardId,
        'Verify trash-screen clearance at Dhapa lockout channels',
        'Alert drainage maintenance crews for standby response within 2 hours',
      ],
      coordinationUnit: 'KMC_DRAINAGE',
      provenance: 'SIMULATED',
    };
  }

  return {
    alertId: alert.id,
    recommendedAction: 'CONTINUOUS_TELEMETRY_MONITORING',
    dispatchUrgency: 'MONITOR',
    mitigationSteps: [
      'Track 15-minute Doppler radar reflectivity updates over catchment basin',
      'Maintain automated stage-level ping intervals at 5-minute sampling rate',
    ],
    coordinationUnit: 'KMC_DRAINAGE',
    provenance: 'SIMULATED',
  };
}
