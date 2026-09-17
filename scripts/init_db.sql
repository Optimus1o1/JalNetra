-- JalNetra Global v2.0 - Production Database Initialization DDL
-- Target: PostgreSQL 15+ / Supabase
-- Basin: Greater Kolkata Metropolitan & Hooghly Delta

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Wards & Pilot Grid Cells
CREATE TABLE IF NOT EXISTS wards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ward_number INTEGER UNIQUE NOT NULL,
  ward_name VARCHAR(255) NOT NULL,
  borough VARCHAR(50) NOT NULL,
  area_sq_km DOUBLE PRECISION NOT NULL,
  population INTEGER NOT NULL,
  elevation_baseline_m DOUBLE PRECISION NOT NULL,
  imperviousness_pct DOUBLE PRECISION NOT NULL,
  base_drainage_capacity_cumec DOUBLE PRECISION NOT NULL,
  critical_infrastructure JSONB DEFAULT '[]'::jsonb,
  geometry JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. IoT Sensor Fleet
CREATE TABLE IF NOT EXISTS sensor_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  node_key VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'SUMP', 'CANAL_STAGE', 'RIVER_GAUGE', 'DOPPLER_RADAR', 'SLUICE_GATE'
  ward_id UUID REFERENCES wards(id) ON DELETE SET NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  elevation_m DOUBLE PRECISION NOT NULL,
  hardware_spec VARCHAR(100) DEFAULT 'ESP32-S3',
  firmware_version VARCHAR(50) DEFAULT 'v2.4.1-rc3',
  status VARCHAR(50) DEFAULT 'ONLINE', -- 'ONLINE', 'WARN', 'CRITICAL', 'OFFLINE'
  battery_pct INTEGER DEFAULT 100,
  last_water_level_m DOUBLE PRECISION,
  last_discharge_cumec DOUBLE PRECISION,
  last_ping_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sensor_nodes_type ON sensor_nodes(type);
CREATE INDEX IF NOT EXISTS idx_sensor_nodes_status ON sensor_nodes(status);

-- 3. Sensor Observations (Time-Series partitioned by timestamp)
CREATE TABLE IF NOT EXISTS sensor_observations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sensor_id UUID NOT NULL REFERENCES sensor_nodes(id) ON DELETE CASCADE,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  water_level_m DOUBLE PRECISION,
  discharge_rate_cumec DOUBLE PRECISION,
  siltation_depth_cm DOUBLE PRECISION,
  pump_operating_rate_pct DOUBLE PRECISION,
  salinity_ppt DOUBLE PRECISION,
  quality_flag VARCHAR(50) DEFAULT 'QC_PASSED',
  raw_payload JSONB
);

CREATE INDEX IF NOT EXISTS idx_obs_sensor_recorded ON sensor_observations(sensor_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_obs_quality_flag ON sensor_observations(quality_flag);

-- 4. Multi-Horizon Rainfall Nowcasts
CREATE TABLE IF NOT EXISTS rainfall_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_name VARCHAR(100) DEFAULT 'TCN_Spatiotemporal_Ensemble',
  forecast_run_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  horizon VARCHAR(20) NOT NULL, -- '15m', '1h', '3h', '6h', '24h', '72h'
  p10_mm DOUBLE PRECISION NOT NULL,
  p50_mm DOUBLE PRECISION NOT NULL,
  p90_mm DOUBLE PRECISION NOT NULL,
  pop_heavy_pct DOUBLE PRECISION NOT NULL,
  intensity_category VARCHAR(50) NOT NULL,
  return_period_years DOUBLE PRECISION DEFAULT 1.0
);

CREATE INDEX IF NOT EXISTS idx_rainfall_forecast_run ON rainfall_forecasts(forecast_run_at DESC, horizon);

-- 5. Hooghly Estuary Tidal Stage Records
CREATE TABLE IF NOT EXISTS hooghly_tide_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  station_name VARCHAR(100) DEFAULT 'Outram Ghat',
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  stage_m_msl DOUBLE PRECISION NOT NULL,
  tide_type VARCHAR(50) DEFAULT 'SPRING',
  sluice_interlock_active BOOLEAN DEFAULT false,
  minutes_to_high_tide INTEGER DEFAULT 0,
  surge_anomaly_m DOUBLE PRECISION DEFAULT 0.0
);

CREATE INDEX IF NOT EXISTS idx_hooghly_tide_recorded ON hooghly_tide_records(recorded_at DESC);

-- 6. Spatial Risk Snapshots
CREATE TABLE IF NOT EXISTS risk_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ward_id UUID NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
  computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  hazard_index DOUBLE PRECISION NOT NULL,
  exposure_index DOUBLE PRECISION NOT NULL,
  vulnerability_index DOUBLE PRECISION NOT NULL,
  composite_risk_score DOUBLE PRECISION NOT NULL,
  ponding_depth_cm DOUBLE PRECISION NOT NULL,
  treeshap_decomposition JSONB DEFAULT '[]'::jsonb,
  flood_status VARCHAR(50) DEFAULT 'NORMAL'
);

CREATE INDEX IF NOT EXISTS idx_risk_snapshots_ward_computed ON risk_snapshots(ward_id, computed_at DESC);

-- 7. Incident Alerts & Decision Triage
CREATE TABLE IF NOT EXISTS incident_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_code VARCHAR(100) UNIQUE NOT NULL,
  ward_id UUID REFERENCES wards(id) ON DELETE SET NULL,
  severity VARCHAR(50) NOT NULL, -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  trigger_mechanism VARCHAR(255) NOT NULL,
  confidence_score DOUBLE PRECISION DEFAULT 0.85,
  affected_infrastructure JSONB DEFAULT '[]'::jsonb,
  recommended_actions JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(50) DEFAULT 'ACTIVE', -- 'ACTIVE', 'ACKNOWLEDGED', 'DISPATCHED', 'RESOLVED'
  acknowledged_by VARCHAR(100),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidents_status_severity ON incident_alerts(status, severity);

-- 8. What-If Simulation Runs & Dispatch Logs
CREATE TABLE IF NOT EXISTS simulation_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scenario_name VARCHAR(255) NOT NULL,
  created_by VARCHAR(100) DEFAULT 'OPERATOR_CONSOLE',
  inputs JSONB NOT NULL,
  outcomes JSONB NOT NULL,
  dispatched_resources JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sim_runs_created ON simulation_runs(created_at DESC);

-- 9. Model Registry & MLOps
CREATE TABLE IF NOT EXISTS model_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_key VARCHAR(100) UNIQUE NOT NULL,
  model_name VARCHAR(255) NOT NULL,
  version VARCHAR(50) NOT NULL,
  architecture VARCHAR(255) NOT NULL,
  brier_score DOUBLE PRECISION NOT NULL,
  crps DOUBLE PRECISION NOT NULL,
  spatial_iou DOUBLE PRECISION NOT NULL,
  freshness_min INTEGER NOT NULL,
  parameters VARCHAR(50) DEFAULT '14.2M',
  inference_latency_ms INTEGER DEFAULT 45,
  status VARCHAR(50) DEFAULT 'PRODUCTION_ACTIVE',
  last_trained_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
