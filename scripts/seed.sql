-- JALNETRA Phase 13 Seed Script: Kolkata Metropolitan Basin Baseline
-- Enables PostGIS extension and populates pilot catchments and spatial indices

CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Catchment Sites Baseline
INSERT INTO catchment_sites (id, name, ward, "areaHectares", "runoffCoefficient", "existingStorageML", "plannedStorageML", "landUse", geometry, "createdAt", "updatedAt")
VALUES
  ('park-circus-basin', 'Park Circus Drainage Basin', 66, 42.5, 0.88, 1.2, 5.0, 'COMMERCIAL', 
   '{"type":"Point","coordinates":[88.368,22.541]}'::jsonb, NOW(), NOW()),
  ('college-street-cistern', 'College Street Academic District', 48, 28.0, 0.82, 0.8, 3.5, 'COMMERCIAL',
   '{"type":"Point","coordinates":[88.363,22.574]}'::jsonb, NOW(), NOW()),
  ('maidan-greens-sponge', 'Maidan Central Greens & Victoria Buffer', 63, 110.0, 0.35, 4.5, 12.0, 'OPEN_SPACE',
   '{"type":"Point","coordinates":[88.344,22.545]}'::jsonb, NOW(), NOW()),
  ('salt-lake-sector5', 'Sector V Tech Park Catchment', 32, 65.0, 0.85, 2.0, 8.0, 'INDUSTRIAL',
   '{"type":"Point","coordinates":[88.432,22.573]}'::jsonb, NOW(), NOW()),
  ('ballygunge-circular', 'Ballygunge Circular Detention Zone', 68, 38.0, 0.78, 1.5, 4.5, 'RESIDENTIAL',
   '{"type":"Point","coordinates":[88.360,22.528]}'::jsonb, NOW(), NOW()),
  ('kalighat-temple-basin', 'Kalighat Canal Corridor', 83, 24.5, 0.80, 0.6, 2.8, 'RESIDENTIAL',
   '{"type":"Point","coordinates":[88.345,22.518]}'::jsonb, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  "areaHectares" = EXCLUDED."areaHectares",
  "runoffCoefficient" = EXCLUDED."runoffCoefficient",
  "existingStorageML" = EXCLUDED."existingStorageML",
  "plannedStorageML" = EXCLUDED."plannedStorageML",
  "updatedAt" = NOW();

-- 2. Municipal Intervention Options Baseline
INSERT INTO intervention_options (id, "siteId", ward, "interventionType", "estimatedCostLakhs", "capturePotentialML", "drainageReliefPct", "costEffectivenessRatio", "implementationMonths", "spatialSuitability", "createdAt", "updatedAt")
VALUES
  ('int-pc-01', 'park-circus-basin', 66, 'MODULAR_CISTERN', 120.0, 4.2, 34.0, 0.035, 6, 0.92, NOW(), NOW()),
  ('int-pc-02', 'park-circus-basin', 66, 'AQUIFER_INJECTION_WELL', 45.0, 2.1, 18.0, 0.047, 3, 0.85, NOW(), NOW()),
  ('int-cs-01', 'college-street-cistern', 48, 'PERMEABLE_PAVEMENT', 65.0, 1.8, 22.0, 0.028, 4, 0.88, NOW(), NOW()),
  ('int-mg-01', 'maidan-greens-sponge', 63, 'RETENTION_POND', 210.0, 9.5, 48.0, 0.045, 8, 0.95, NOW(), NOW()),
  ('int-sl-01', 'salt-lake-sector5', 32, 'BIOSWALE_CORRIDOR', 85.0, 3.0, 26.0, 0.035, 5, 0.78, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  "estimatedCostLakhs" = EXCLUDED."estimatedCostLakhs",
  "capturePotentialML" = EXCLUDED."capturePotentialML",
  "drainageReliefPct" = EXCLUDED."drainageReliefPct",
  "costEffectivenessRatio" = EXCLUDED."costEffectivenessRatio",
  "updatedAt" = NOW();
