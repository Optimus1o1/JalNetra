-- =========================================================================
-- JALNETRA PRODUCTION DATABASE DETERMINISTIC SEED SCRIPT
-- =========================================================================

-- 1. SEED WARDS (24 PILOT CELLS)
INSERT INTO wards (
    ward_number, ward_name, borough, area_sq_km, population,
    elevation_baseline_m, imperviousness_pct, base_drainage_capacity_cumec,
    critical_infrastructure, geom
  ) VALUES (
    66, 'Topsia / Tiljala Wetlands', 'Borough VII', 2.4, 92160,
    3.8, 88, 22,
    '["Calcutta National Medical College (nearby)","Tiljala Urban Primary Health Center","Topsia Drainage Pumping Station","EM Bypass Link Corridor","Park Circus Connector"]'::jsonb, ST_GeomFromText('POLYGON((88.3832 22.5305, 88.3992 22.5305, 88.3992 22.546499999999998, 88.3832 22.546499999999998, 88.3832 22.5305))', 4326)
  ) ON CONFLICT (ward_number) DO UPDATE SET
    ward_name = EXCLUDED.ward_name,
    elevation_baseline_m = EXCLUDED.elevation_baseline_m,
    imperviousness_pct = EXCLUDED.imperviousness_pct,
    geom = EXCLUDED.geom;
INSERT INTO wards (
    ward_number, ward_name, borough, area_sq_km, population,
    elevation_baseline_m, imperviousness_pct, base_drainage_capacity_cumec,
    critical_infrastructure, geom
  ) VALUES (
    122, 'Behala Chowrasta / Diamond Harbour', 'Borough XIII', 2.4, 74880,
    4.2, 84, 24,
    '["Vidyasagar State General Hospital","Behala Balananda Hospital","Chowrasta Underground Booster Sump","Diamond Harbour Road (NH 117)","Behala Tram Depot Intersection"]'::jsonb, ST_GeomFromText('POLYGON((88.3062 22.488200000000003, 88.3222 22.488200000000003, 88.3222 22.5042, 88.3062 22.5042, 88.3062 22.488200000000003))', 4326)
  ) ON CONFLICT (ward_number) DO UPDATE SET
    ward_name = EXCLUDED.ward_name,
    elevation_baseline_m = EXCLUDED.elevation_baseline_m,
    imperviousness_pct = EXCLUDED.imperviousness_pct,
    geom = EXCLUDED.geom;
INSERT INTO wards (
    ward_number, ward_name, borough, area_sq_km, population,
    elevation_baseline_m, imperviousness_pct, base_drainage_capacity_cumec,
    critical_infrastructure, geom
  ) VALUES (
    71, 'Bhowanipore / Kalighat', 'Borough IX', 2.4, 101040,
    5.6, 92, 35,
    '["SSKM Hospital & IPGMER (Apex Level 1 Trauma)","Chittaranjan National Cancer Institute","Chetla Lock Gate Pumping Station","Ashutosh Mukherjee Road","SP Mukherjee Road Corridor"]'::jsonb, ST_GeomFromText('POLYGON((88.33680000000001 22.517200000000003, 88.3528 22.517200000000003, 88.3528 22.5332, 88.33680000000001 22.5332, 88.33680000000001 22.517200000000003))', 4326)
  ) ON CONFLICT (ward_number) DO UPDATE SET
    ward_name = EXCLUDED.ward_name,
    elevation_baseline_m = EXCLUDED.elevation_baseline_m,
    imperviousness_pct = EXCLUDED.imperviousness_pct,
    geom = EXCLUDED.geom;
INSERT INTO wards (
    ward_number, ward_name, borough, area_sq_km, population,
    elevation_baseline_m, imperviousness_pct, base_drainage_capacity_cumec,
    critical_infrastructure, geom
  ) VALUES (
    58, 'Tangra / Palmer Bazar Canal', 'Borough VII', 2.4, 82800,
    4.1, 89, 28,
    '["Dr. R. Ahmed Dental College & Hospital (nearby)","Tangra Maternity Home","Palmer Bazar Main Drainage Pumping Station (Major Outfall)","Seal Lane","Christopher Road"]'::jsonb, ST_GeomFromText('POLYGON((88.37650000000001 22.543200000000002, 88.3925 22.543200000000002, 88.3925 22.5592, 88.37650000000001 22.5592, 88.37650000000001 22.543200000000002))', 4326)
  ) ON CONFLICT (ward_number) DO UPDATE SET
    ward_name = EXCLUDED.ward_name,
    elevation_baseline_m = EXCLUDED.elevation_baseline_m,
    imperviousness_pct = EXCLUDED.imperviousness_pct,
    geom = EXCLUDED.geom;
INSERT INTO wards (
    ward_number, ward_name, borough, area_sq_km, population,
    elevation_baseline_m, imperviousness_pct, base_drainage_capacity_cumec,
    critical_infrastructure, geom
  ) VALUES (
    46, 'Esplanade / BBD Bagh Heritage', 'Borough VI', 2.4, 67200,
    7.2, 95, 45,
    '["Medical College & Hospital Kolkata","Eden Hospital","Babughat Outfall Sluice","Central Avenue (CR Avenue)","Netaji Subhash Road","Esplanade Metro Interchange"]'::jsonb, ST_GeomFromText('POLYGON((88.34320000000001 22.561700000000002, 88.3592 22.561700000000002, 88.3592 22.5777, 88.34320000000001 22.5777, 88.34320000000001 22.561700000000002))', 4326)
  ) ON CONFLICT (ward_number) DO UPDATE SET
    ward_name = EXCLUDED.ward_name,
    elevation_baseline_m = EXCLUDED.elevation_baseline_m,
    imperviousness_pct = EXCLUDED.imperviousness_pct,
    geom = EXCLUDED.geom;
INSERT INTO wards (
    ward_number, ward_name, borough, area_sq_km, population,
    elevation_baseline_m, imperviousness_pct, base_drainage_capacity_cumec,
    critical_infrastructure, geom
  ) VALUES (
    86, 'Gariahat / Southern Avenue', 'Borough VIII', 2.4, 70800,
    6.4, 86, 38,
    '["AMRI Hospital Dhakuria","Ramakrishna Mission Seva Pratishthan","Ballygunge Drainage Pumping Station (BDPS)","Gariahat Flyover Corridor","Southern Avenue Boulevard"]'::jsonb, ST_GeomFromText('POLYGON((88.3605 22.5105, 88.3765 22.5105, 88.3765 22.5265, 88.3605 22.5265, 88.3605 22.5105))', 4326)
  ) ON CONFLICT (ward_number) DO UPDATE SET
    ward_name = EXCLUDED.ward_name,
    elevation_baseline_m = EXCLUDED.elevation_baseline_m,
    imperviousness_pct = EXCLUDED.imperviousness_pct,
    geom = EXCLUDED.geom;
INSERT INTO wards (
    ward_number, ward_name, borough, area_sq_km, population,
    elevation_baseline_m, imperviousness_pct, base_drainage_capacity_cumec,
    critical_infrastructure, geom
  ) VALUES (
    7, 'Bagbazar / Shyambazar', 'Borough I', 2.4, 86400,
    7.8, 91, 40,
    '["R.G. Kar Medical College & Hospital","Bagbazar Canal Lock Gate","Shyambazar Five-Point Crossing","Bidhan Sarani"]'::jsonb, ST_GeomFromText('POLYGON((88.3608 22.5941, 88.37679999999999 22.5941, 88.37679999999999 22.6101, 88.3608 22.6101, 88.3608 22.5941))', 4326)
  ) ON CONFLICT (ward_number) DO UPDATE SET
    ward_name = EXCLUDED.ward_name,
    elevation_baseline_m = EXCLUDED.elevation_baseline_m,
    imperviousness_pct = EXCLUDED.imperviousness_pct,
    geom = EXCLUDED.geom;
INSERT INTO wards (
    ward_number, ward_name, borough, area_sq_km, population,
    elevation_baseline_m, imperviousness_pct, base_drainage_capacity_cumec,
    critical_infrastructure, geom
  ) VALUES (
    107, 'Kasba / Ruby General Hospital', 'Borough XII', 2.4, 65760,
    4, 87, 26,
    '["Ruby General Hospital","Fortis Hospital Anandapur","Desun Hospital","Kasba Pumping Booster Station","Eastern Metropolitan Bypass","Kasba Connector"]'::jsonb, ST_GeomFromText('POLYGON((88.39150000000001 22.5044, 88.4075 22.5044, 88.4075 22.5204, 88.39150000000001 22.5204, 88.39150000000001 22.5044))', 4326)
  ) ON CONFLICT (ward_number) DO UPDATE SET
    ward_name = EXCLUDED.ward_name,
    elevation_baseline_m = EXCLUDED.elevation_baseline_m,
    imperviousness_pct = EXCLUDED.imperviousness_pct,
    geom = EXCLUDED.geom;
INSERT INTO wards (
    ward_number, ward_name, borough, area_sq_km, population,
    elevation_baseline_m, imperviousness_pct, base_drainage_capacity_cumec,
    critical_infrastructure, geom
  ) VALUES (
    33, 'Beliaghata / Phoolbagan', 'Borough III', 2.4, 74400,
    4.8, 85, 30,
    '["ID & BG Hospital (Infectious Diseases)","ESI Hospital Maniktala","Beliaghata Circular Canal Pumping Sump","Beliaghata Main Road","CIT Road"]'::jsonb, ST_GeomFromText('POLYGON((88.3841 22.5604, 88.4001 22.5604, 88.4001 22.5764, 88.3841 22.5764, 88.3841 22.5604))', 4326)
  ) ON CONFLICT (ward_number) DO UPDATE SET
    ward_name = EXCLUDED.ward_name,
    elevation_baseline_m = EXCLUDED.elevation_baseline_m,
    imperviousness_pct = EXCLUDED.imperviousness_pct,
    geom = EXCLUDED.geom;
INSERT INTO wards (
    ward_number, ward_name, borough, area_sq_km, population,
    elevation_baseline_m, imperviousness_pct, base_drainage_capacity_cumec,
    critical_infrastructure, geom
  ) VALUES (
    88, 'Alipore / National Library', 'Borough IX', 2.4, 34800,
    6.9, 65, 42,
    '["Command Hospital (Eastern Command)","BM Birla Heart Research Centre","Alipore Meteorological Observatory Sump","Alipore Road","Belvedere Road","D.L. Khan Road"]'::jsonb, ST_GeomFromText('POLYGON((88.32350000000001 22.5232, 88.3395 22.5232, 88.3395 22.539199999999997, 88.32350000000001 22.539199999999997, 88.32350000000001 22.5232))', 4326)
  ) ON CONFLICT (ward_number) DO UPDATE SET
    ward_name = EXCLUDED.ward_name,
    elevation_baseline_m = EXCLUDED.elevation_baseline_m,
    imperviousness_pct = EXCLUDED.imperviousness_pct,
    geom = EXCLUDED.geom;
INSERT INTO wards (
    ward_number, ward_name, borough, area_sq_km, population,
    elevation_baseline_m, imperviousness_pct, base_drainage_capacity_cumec,
    critical_infrastructure, geom
  ) VALUES (
    27, 'Girish Park / Central Avenue', 'Borough IV', 2.4, 115200,
    6.2, 94, 34,
    '["Calcutta Homoeopathic Medical College","Mayo Hospital","Maniktala Drainage Station","Chittaranjan Avenue (Central Metro line)","Vivekananda Road"]'::jsonb, ST_GeomFromText('POLYGON((88.3532 22.5772, 88.36919999999999 22.5772, 88.36919999999999 22.5932, 88.3532 22.5932, 88.3532 22.5772))', 4326)
  ) ON CONFLICT (ward_number) DO UPDATE SET
    ward_name = EXCLUDED.ward_name,
    elevation_baseline_m = EXCLUDED.elevation_baseline_m,
    imperviousness_pct = EXCLUDED.imperviousness_pct,
    geom = EXCLUDED.geom;
INSERT INTO wards (
    ward_number, ward_name, borough, area_sq_km, population,
    elevation_baseline_m, imperviousness_pct, base_drainage_capacity_cumec,
    critical_infrastructure, geom
  ) VALUES (
    131, 'Parnasree / Taratala Industrial', 'Borough XIV', 2.4, 71520,
    3.6, 82, 20,
    '["KMC Behala Super Specialty Hospital","Parnasree Primary Health Sump","Monikhali Canal Head Sluice","Taratala Flyover Ramp","Budge Budge Trunk Road"]'::jsonb, ST_GeomFromText('POLYGON((88.29350000000001 22.4952, 88.3095 22.4952, 88.3095 22.5112, 88.29350000000001 22.5112, 88.29350000000001 22.4952))', 4326)
  ) ON CONFLICT (ward_number) DO UPDATE SET
    ward_name = EXCLUDED.ward_name,
    elevation_baseline_m = EXCLUDED.elevation_baseline_m,
    imperviousness_pct = EXCLUDED.imperviousness_pct,
    geom = EXCLUDED.geom;

-- 2. SEED CATCHMENT SITES (6 INSTITUTIONAL SITES)
INSERT INTO catchment_sites (
    site_key, ward_number, ward_name, borough, site_name, site_type,
    latitude, longitude, roof_area_sq_m, open_ground_area_sq_m, total_catchment_area_sq_m,
    runoff_coefficient, collection_efficiency, existing_tank_capacity_l, current_tank_storage_l,
    daily_non_potable_demand_l, soil_infiltration_rate_mm_hr, depth_to_water_table_m,
    recharge_suitability, provenance, geom
  ) VALUES (
    'site-w066-tiljala', 66, 'Topsia / Tiljala Wetlands Basin', 'Borough VII',
    'Tiljala Municipal Commercial Complex & Transit Shed', 'PUBLIC_INSTITUTION',
    22.5385, 88.3912, 14200, 4800, 19000,
    0.88, 0.85, 45000,
    12000, 28000, 4.2,
    1.8, 'LOW', '{"roofArea":"ASSUMED","runoffCoefficient":"ASSUMED","existingTankCapacity":"MEASURED","soilInfiltrationRate":"MEASURED"}'::jsonb,
    ST_SetSRID(ST_MakePoint(88.3912, 22.5385), 4326)
  ) ON CONFLICT (site_key) DO UPDATE SET
    current_tank_storage_l = EXCLUDED.current_tank_storage_l,
    existing_tank_capacity_l = EXCLUDED.existing_tank_capacity_l,
    geom = EXCLUDED.geom;
INSERT INTO catchment_sites (
    site_key, ward_number, ward_name, borough, site_name, site_type,
    latitude, longitude, roof_area_sq_m, open_ground_area_sq_m, total_catchment_area_sq_m,
    runoff_coefficient, collection_efficiency, existing_tank_capacity_l, current_tank_storage_l,
    daily_non_potable_demand_l, soil_infiltration_rate_mm_hr, depth_to_water_table_m,
    recharge_suitability, provenance, geom
  ) VALUES (
    'site-w071-sskm', 71, 'Bhowanipore / SSKM Hospital Basin', 'Borough IX',
    'SSKM Medical College & Hospital Main Campus Rooftops', 'PUBLIC_INSTITUTION',
    22.5398, 88.3426, 32500, 8600, 41100,
    0.9, 0.88, 120000,
    35000, 85000, 8.5,
    4.2, 'MEDIUM', '{"roofArea":"ASSUMED","runoffCoefficient":"ASSUMED","existingTankCapacity":"MEASURED","soilInfiltrationRate":"MEASURED"}'::jsonb,
    ST_SetSRID(ST_MakePoint(88.3426, 22.5398), 4326)
  ) ON CONFLICT (site_key) DO UPDATE SET
    current_tank_storage_l = EXCLUDED.current_tank_storage_l,
    existing_tank_capacity_l = EXCLUDED.existing_tank_capacity_l,
    geom = EXCLUDED.geom;
INSERT INTO catchment_sites (
    site_key, ward_number, ward_name, borough, site_name, site_type,
    latitude, longitude, roof_area_sq_m, open_ground_area_sq_m, total_catchment_area_sq_m,
    runoff_coefficient, collection_efficiency, existing_tank_capacity_l, current_tank_storage_l,
    daily_non_potable_demand_l, soil_infiltration_rate_mm_hr, depth_to_water_table_m,
    recharge_suitability, provenance, geom
  ) VALUES (
    'site-w040-calcutta-med', 40, 'College Street / Central Calcutta', 'Borough V',
    'Calcutta Medical College & University Quadrangle', 'PUBLIC_INSTITUTION',
    22.5726, 88.3639, 28400, 6200, 34600,
    0.89, 0.84, 80000,
    22000, 64000, 6.8,
    3.8, 'MEDIUM', '{"roofArea":"ASSUMED","runoffCoefficient":"ASSUMED","existingTankCapacity":"MEASURED","soilInfiltrationRate":"MEASURED"}'::jsonb,
    ST_SetSRID(ST_MakePoint(88.3639, 22.5726), 4326)
  ) ON CONFLICT (site_key) DO UPDATE SET
    current_tank_storage_l = EXCLUDED.current_tank_storage_l,
    existing_tank_capacity_l = EXCLUDED.existing_tank_capacity_l,
    geom = EXCLUDED.geom;
INSERT INTO catchment_sites (
    site_key, ward_number, ward_name, borough, site_name, site_type,
    latitude, longitude, roof_area_sq_m, open_ground_area_sq_m, total_catchment_area_sq_m,
    runoff_coefficient, collection_efficiency, existing_tank_capacity_l, current_tank_storage_l,
    daily_non_potable_demand_l, soil_infiltration_rate_mm_hr, depth_to_water_table_m,
    recharge_suitability, provenance, geom
  ) VALUES (
    'site-w093-jadavpur', 93, 'Jadavpur / Prince Anwar Shah Road', 'Borough X',
    'Jadavpur University Engineering Complex & Grounds', 'PUBLIC_INSTITUTION',
    22.4988, 88.3718, 42000, 18500, 60500,
    0.82, 0.86, 150000,
    48000, 92000, 16.4,
    6.5, 'HIGH', '{"roofArea":"ASSUMED","runoffCoefficient":"ASSUMED","existingTankCapacity":"MEASURED","soilInfiltrationRate":"MEASURED"}'::jsonb,
    ST_SetSRID(ST_MakePoint(88.3718, 22.4988), 4326)
  ) ON CONFLICT (site_key) DO UPDATE SET
    current_tank_storage_l = EXCLUDED.current_tank_storage_l,
    existing_tank_capacity_l = EXCLUDED.existing_tank_capacity_l,
    geom = EXCLUDED.geom;
INSERT INTO catchment_sites (
    site_key, ward_number, ward_name, borough, site_name, site_type,
    latitude, longitude, roof_area_sq_m, open_ground_area_sq_m, total_catchment_area_sq_m,
    runoff_coefficient, collection_efficiency, existing_tank_capacity_l, current_tank_storage_l,
    daily_non_potable_demand_l, soil_infiltration_rate_mm_hr, depth_to_water_table_m,
    recharge_suitability, provenance, geom
  ) VALUES (
    'site-w131-behala', 131, 'Behala / Taratala Industrial Corridor', 'Borough XIV',
    'Behala Municipal Logistics Hub & Depot Plazas', 'COMMUNITY_PLAZA',
    22.5012, 88.3185, 24000, 14000, 38000,
    0.85, 0.82, 60000,
    15000, 42000, 5.1,
    2.4, 'LOW', '{"roofArea":"ASSUMED","runoffCoefficient":"ASSUMED","existingTankCapacity":"MEASURED","soilInfiltrationRate":"MEASURED"}'::jsonb,
    ST_SetSRID(ST_MakePoint(88.3185, 22.5012), 4326)
  ) ON CONFLICT (site_key) DO UPDATE SET
    current_tank_storage_l = EXCLUDED.current_tank_storage_l,
    existing_tank_capacity_l = EXCLUDED.existing_tank_capacity_l,
    geom = EXCLUDED.geom;
INSERT INTO catchment_sites (
    site_key, ward_number, ward_name, borough, site_name, site_type,
    latitude, longitude, roof_area_sq_m, open_ground_area_sq_m, total_catchment_area_sq_m,
    runoff_coefficient, collection_efficiency, existing_tank_capacity_l, current_tank_storage_l,
    daily_non_potable_demand_l, soil_infiltration_rate_mm_hr, depth_to_water_table_m,
    recharge_suitability, provenance, geom
  ) VALUES (
    'site-w057-ballygunge', 57, 'Park Circus / Ballygunge Science College', 'Borough VII',
    'University Science College Campus & Botanical Grounds', 'PUBLIC_INSTITUTION',
    22.5312, 88.3685, 18600, 9200, 27800,
    0.84, 0.85, 55000,
    18000, 38000, 11.2,
    5.1, 'HIGH', '{"roofArea":"ASSUMED","runoffCoefficient":"ASSUMED","existingTankCapacity":"MEASURED","soilInfiltrationRate":"MEASURED"}'::jsonb,
    ST_SetSRID(ST_MakePoint(88.3685, 22.5312), 4326)
  ) ON CONFLICT (site_key) DO UPDATE SET
    current_tank_storage_l = EXCLUDED.current_tank_storage_l,
    existing_tank_capacity_l = EXCLUDED.existing_tank_capacity_l,
    geom = EXCLUDED.geom;

-- 3. SEED INTERVENTION OPTIONS
INSERT INTO intervention_options (
    intervention_key, site_id, name, type, design_capacity_l,
    estimated_cost_inr, annual_harvest_potential_ml, annual_runoff_avoided_ml,
    priority_score, implementation_timeline_weeks, status, owner, provenance
  ) VALUES (
    'intv-01-sskm-cistern', (SELECT id FROM catchment_sites WHERE site_key = 'site-w071-sskm' LIMIT 1),
    'SSKM Hospital 200kL Modular Under-Deck Cistern & First-Flush Battery', 'ROOFTOP_CISTERN', 200000,
    2450000, 18.5, 16.2,
    94, 6, 'APPROVED',
    'KMC Borough IX & Health Dept', 'SIMULATED'
  ) ON CONFLICT (intervention_key) DO UPDATE SET
    priority_score = EXCLUDED.priority_score,
    status = EXCLUDED.status;
INSERT INTO intervention_options (
    intervention_key, site_id, name, type, design_capacity_l,
    estimated_cost_inr, annual_harvest_potential_ml, annual_runoff_avoided_ml,
    priority_score, implementation_timeline_weeks, status, owner, provenance
  ) VALUES (
    'intv-02-tiljala-bioswale', (SELECT id FROM catchment_sites WHERE site_key = 'site-w066-tiljala' LIMIT 1),
    'Tiljala Bus Depot Perimeter Bioswale & Retention Trench', 'BIO_RETENTION_BIOSWALE', 85000,
    1120000, 7.8, 8.4,
    89, 4, 'IN_PROGRESS',
    'KMC Civil Engineering / Drainage', 'SIMULATED'
  ) ON CONFLICT (intervention_key) DO UPDATE SET
    priority_score = EXCLUDED.priority_score,
    status = EXCLUDED.status;
INSERT INTO intervention_options (
    intervention_key, site_id, name, type, design_capacity_l,
    estimated_cost_inr, annual_harvest_potential_ml, annual_runoff_avoided_ml,
    priority_score, implementation_timeline_weeks, status, owner, provenance
  ) VALUES (
    'intv-03-jadavpur-recharge', (SELECT id FROM catchment_sites WHERE site_key = 'site-w093-jadavpur' LIMIT 1),
    'Jadavpur Campus Dual Infiltration Recharge Shaft Array (4 Units)', 'INFILTRATION_RECHARGE_SHAFT', 120000,
    1850000, 14.2, 12.8,
    92, 5, 'PROPOSED',
    'Jadavpur University & State Water Resources', 'SIMULATED'
  ) ON CONFLICT (intervention_key) DO UPDATE SET
    priority_score = EXCLUDED.priority_score,
    status = EXCLUDED.status;
INSERT INTO intervention_options (
    intervention_key, site_id, name, type, design_capacity_l,
    estimated_cost_inr, annual_harvest_potential_ml, annual_runoff_avoided_ml,
    priority_score, implementation_timeline_weeks, status, owner, provenance
  ) VALUES (
    'intv-04-calcutta-med-plazas', (SELECT id FROM catchment_sites WHERE site_key = 'site-w040-calcutta-med' LIMIT 1),
    'College Street Hospital Quadrangle Permeable Pavement & Sump', 'PERMEABLE_PAVEMENT_RETROFIT', 95000,
    1680000, 10.6, 11.4,
    86, 8, 'ASSESSED',
    'Heritage Conservation & KMC Ward 40', 'SIMULATED'
  ) ON CONFLICT (intervention_key) DO UPDATE SET
    priority_score = EXCLUDED.priority_score,
    status = EXCLUDED.status;
INSERT INTO intervention_options (
    intervention_key, site_id, name, type, design_capacity_l,
    estimated_cost_inr, annual_harvest_potential_ml, annual_runoff_avoided_ml,
    priority_score, implementation_timeline_weeks, status, owner, provenance
  ) VALUES (
    'intv-05-behala-depot', (SELECT id FROM catchment_sites WHERE site_key = 'site-w131-behala' LIMIT 1),
    'Taratala Freight Depot 150kL Community Dewatering & Reuse Sump', 'COMMUNITY_STORAGE_SUMP', 150000,
    2100000, 15.4, 14.1,
    88, 7, 'PROPOSED',
    'KMC Borough XIV Works', 'SIMULATED'
  ) ON CONFLICT (intervention_key) DO UPDATE SET
    priority_score = EXCLUDED.priority_score,
    status = EXCLUDED.status;

-- 4. SEED SENSOR NODES (12 IOT SENSORS)
INSERT INTO sensor_nodes (
    node_key, name, type, latitude, longitude, elevation_m,
    status, battery_pct, last_water_level_m, last_discharge_cumec, geom
  ) VALUES (
    'sn-hg-01', 'Hooghly Tidal Stage Gauge (Outram Ghat)', 'river_gauge', 22.5621, 88.3385, 3.4,
    'ONLINE', 96, 5.42, 402.1,
    ST_SetSRID(ST_MakePoint(88.3385, 22.5621), 4326)
  ) ON CONFLICT (node_key) DO UPDATE SET
    status = EXCLUDED.status,
    last_water_level_m = EXCLUDED.last_water_level_m,
    geom = EXCLUDED.geom;
INSERT INTO sensor_nodes (
    node_key, name, type, latitude, longitude, elevation_m,
    status, battery_pct, last_water_level_m, last_discharge_cumec, geom
  ) VALUES (
    'sn-pb-02', 'Palmer Bazar Main Outfall Pumping Telemetry', 'stormwater_sump', 22.5512, 88.3845, 3.4,
    'WARN', 91, 4.88, 109.02,
    ST_SetSRID(ST_MakePoint(88.3845, 22.5512), 4326)
  ) ON CONFLICT (node_key) DO UPDATE SET
    status = EXCLUDED.status,
    last_water_level_m = EXCLUDED.last_water_level_m,
    geom = EXCLUDED.geom;
INSERT INTO sensor_nodes (
    node_key, name, type, latitude, longitude, elevation_m,
    status, battery_pct, last_water_level_m, last_discharge_cumec, geom
  ) VALUES (
    'sn-bj-03', 'Bagjola Canal Discharge Monitor (VIP Rd Outfall)', 'canal_flow', 22.6124, 88.4112, 3.4,
    'ONLINE', 88, 3.95, 51.54,
    ST_SetSRID(ST_MakePoint(88.4112, 22.6124), 4326)
  ) ON CONFLICT (node_key) DO UPDATE SET
    status = EXCLUDED.status,
    last_water_level_m = EXCLUDED.last_water_level_m,
    geom = EXCLUDED.geom;
INSERT INTO sensor_nodes (
    node_key, name, type, latitude, longitude, elevation_m,
    status, battery_pct, last_water_level_m, last_discharge_cumec, geom
  ) VALUES (
    'sn-bd-04', 'Ballygunge Drainage Pumping Station (BDPS)', 'stormwater_sump', 22.5185, 88.3685, 3.4,
    'ONLINE', 100, 3.42, 82.12,
    ST_SetSRID(ST_MakePoint(88.3685, 22.5185), 4326)
  ) ON CONFLICT (node_key) DO UPDATE SET
    status = EXCLUDED.status,
    last_water_level_m = EXCLUDED.last_water_level_m,
    geom = EXCLUDED.geom;
INSERT INTO sensor_nodes (
    node_key, name, type, latitude, longitude, elevation_m,
    status, battery_pct, last_water_level_m, last_discharge_cumec, geom
  ) VALUES (
    'sn-ch-05', 'Chetla Lock Gate Tidal Barrier Actuator', 'sluice_gate', 22.5215, 88.3392, 3.4,
    'WARN', 84, 4.92, 18.41,
    ST_SetSRID(ST_MakePoint(88.3392, 22.5215), 4326)
  ) ON CONFLICT (node_key) DO UPDATE SET
    status = EXCLUDED.status,
    last_water_level_m = EXCLUDED.last_water_level_m,
    geom = EXCLUDED.geom;
INSERT INTO sensor_nodes (
    node_key, name, type, latitude, longitude, elevation_m,
    status, battery_pct, last_water_level_m, last_discharge_cumec, geom
  ) VALUES (
    'sn-mn-06', 'Monikhali Canal Head Sluice (Taratala)', 'sluice_gate', 22.5032, 88.3015, 3.4,
    'WARN', 78, 4.65, 25.2,
    ST_SetSRID(ST_MakePoint(88.3015, 22.5032), 4326)
  ) ON CONFLICT (node_key) DO UPDATE SET
    status = EXCLUDED.status,
    last_water_level_m = EXCLUDED.last_water_level_m,
    geom = EXCLUDED.geom;
INSERT INTO sensor_nodes (
    node_key, name, type, latitude, longitude, elevation_m,
    status, battery_pct, last_water_level_m, last_discharge_cumec, geom
  ) VALUES (
    'sn-gw-07', 'Alipore Deep Aquifer Piezometer', 'groundwater_piezometer', 22.5312, 88.3315, 3.4,
    'ONLINE', 92, 11.4, 0,
    ST_SetSRID(ST_MakePoint(88.3315, 22.5312), 4326)
  ) ON CONFLICT (node_key) DO UPDATE SET
    status = EXCLUDED.status,
    last_water_level_m = EXCLUDED.last_water_level_m,
    geom = EXCLUDED.geom;
INSERT INTO sensor_nodes (
    node_key, name, type, latitude, longitude, elevation_m,
    status, battery_pct, last_water_level_m, last_discharge_cumec, geom
  ) VALUES (
    'sn-gw-08', 'Central Avenue Heritage Aquifer Telemetry', 'groundwater_piezometer', 22.5697, 88.3512, 3.4,
    'ONLINE', 89, 14.8, 0,
    ST_SetSRID(ST_MakePoint(88.3512, 22.5697), 4326)
  ) ON CONFLICT (node_key) DO UPDATE SET
    status = EXCLUDED.status,
    last_water_level_m = EXCLUDED.last_water_level_m,
    geom = EXCLUDED.geom;
INSERT INTO sensor_nodes (
    node_key, name, type, latitude, longitude, elevation_m,
    status, battery_pct, last_water_level_m, last_discharge_cumec, geom
  ) VALUES (
    'sn-rwh-09', 'SSKM Medical Campus Cistern Telemetry', 'rainwater_tank', 22.5398, 88.3421, 3.4,
    'ONLINE', 98, 2.8, 0,
    ST_SetSRID(ST_MakePoint(88.3421, 22.5398), 4326)
  ) ON CONFLICT (node_key) DO UPDATE SET
    status = EXCLUDED.status,
    last_water_level_m = EXCLUDED.last_water_level_m,
    geom = EXCLUDED.geom;
INSERT INTO sensor_nodes (
    node_key, name, type, latitude, longitude, elevation_m,
    status, battery_pct, last_water_level_m, last_discharge_cumec, geom
  ) VALUES (
    'sn-rwh-10', 'Tiljala Ward 66 RWH Buffer Reservoir', 'rainwater_tank', 22.5358, 88.3882, 3.4,
    'WARN', 87, 3.65, 0,
    ST_SetSRID(ST_MakePoint(88.3882, 22.5358), 4326)
  ) ON CONFLICT (node_key) DO UPDATE SET
    status = EXCLUDED.status,
    last_water_level_m = EXCLUDED.last_water_level_m,
    geom = EXCLUDED.geom;
INSERT INTO sensor_nodes (
    node_key, name, type, latitude, longitude, elevation_m,
    status, battery_pct, last_water_level_m, last_discharge_cumec, geom
  ) VALUES (
    'sn-rwh-11', 'Calcutta Medical College Underground Cistern', 'rainwater_tank', 22.5726, 88.3619, 3.4,
    'ONLINE', 95, 1.9, 0,
    ST_SetSRID(ST_MakePoint(88.3619, 22.5726), 4326)
  ) ON CONFLICT (node_key) DO UPDATE SET
    status = EXCLUDED.status,
    last_water_level_m = EXCLUDED.last_water_level_m,
    geom = EXCLUDED.geom;
INSERT INTO sensor_nodes (
    node_key, name, type, latitude, longitude, elevation_m,
    status, battery_pct, last_water_level_m, last_discharge_cumec, geom
  ) VALUES (
    'sn-wx-12', 'Alipore AWS Optical Rain Gauge & Climate Station', 'weather_station', 22.5298, 88.3342, 3.4,
    'ONLINE', 99, 0, 0,
    ST_SetSRID(ST_MakePoint(88.3342, 22.5298), 4326)
  ) ON CONFLICT (node_key) DO UPDATE SET
    status = EXCLUDED.status,
    last_water_level_m = EXCLUDED.last_water_level_m,
    geom = EXCLUDED.geom;

-- 5. SEED HOOGHLY TIDAL DYNAMICS
INSERT INTO hooghly_tide_records (
  station_name, stage_m_msl, tide_type, sluice_interlock_active, minutes_to_high_tide, surge_anomaly_m
) VALUES (
  'Outram Ghat (Hooghly Estuary)', 5.42, 'SPRING', true, 160, 0.45
);

-- 6. SEED INCIDENT ALERTS
INSERT INTO incident_alerts (
    alert_code, severity, title, description, trigger_mechanism,
    confidence_score, affected_infrastructure, recommended_actions, status
  ) VALUES (
    'JAL-CRIT-W66', 'CRITICAL', 'Critical Inundation Risk — Topsia / Tiljala Basin',
    'Convective cell downpour (forecast 88mm/24h) combined with 92% pre-saturated wetlands and depressed terrain (3.8m MSL).', 'Compound Surge & Rainfall Confluence',
    0.92, '["Calcutta National Medical College Link Corridor","Park Circus Connector Lower Underpass","Topsia Urban Primary Health Center"]'::jsonb, '["Mobilize 2x 500-HP auxiliary diesel pumps to Topsia canal bridge","Deploy Kolkata Traffic Police diversions away from Park Circus connector underpass","Pre-stage sandbag bunding around emergency outpatient approach roads","Notify KMC Borough VII disaster response unit for ground-floor evac alerts"]'::jsonb,
    'ACTIVE'
  ) ON CONFLICT (alert_code) DO UPDATE SET
    title = EXCLUDED.title,
    severity = EXCLUDED.severity;
INSERT INTO incident_alerts (
    alert_code, severity, title, description, trigger_mechanism,
    confidence_score, affected_infrastructure, recommended_actions, status
  ) VALUES (
    'JAL-CRIT-W131', 'CRITICAL', 'Severe Drainage Surcharge — Parnasree / Taratala Industrial',
    'Monikhali canal head sluice locked due to Hooghly high tide; basin runoff volume exceeds internal gravity capacity by 280%.', 'Compound Surge & Rainfall Confluence',
    0.89, '["Taratala Marine Engineering Road","KMC Behala Super Specialty Hospital ground perimeter","Budge Budge Trunk Road freight lane"]'::jsonb, '["Engage Monikhali pontoon submersible pumps at maximum 100% duty cycle","Close sluice flap gate to prevent tidal river backflow into Taratala residential grid","Restrict heavy freight transit on waterlogged sub-base roads"]'::jsonb,
    'ACTIVE'
  ) ON CONFLICT (alert_code) DO UPDATE SET
    title = EXCLUDED.title,
    severity = EXCLUDED.severity;
INSERT INTO incident_alerts (
    alert_code, severity, title, description, trigger_mechanism,
    confidence_score, affected_infrastructure, recommended_actions, status
  ) VALUES (
    'JAL-HIGH-W107', 'HIGH', 'Tertiary Medical Corridor Accessibility Threat — Kasba Ruby Zone',
    'Interconnecting wetlands canal bank overflow onto EM Bypass service lanes threatening ambulance corridors for 3 major hospitals.', 'Compound Surge & Rainfall Confluence',
    0.87, '["Ruby General Hospital Emergency Bay Access","Fortis Hospital Anandapur service sliproad","Eastern Metropolitan Bypass northbound lane"]'::jsonb, '["Activate dedicated emergency ambulance priority lane on main flyover","Deploy high-volume dewatering truck at Ruby roundabout culvert","Issue real-time navigation reroute to Kolkata EMS dispatch"]'::jsonb,
    'ACKNOWLEDGED'
  ) ON CONFLICT (alert_code) DO UPDATE SET
    title = EXCLUDED.title,
    severity = EXCLUDED.severity;
INSERT INTO incident_alerts (
    alert_code, severity, title, description, trigger_mechanism,
    confidence_score, affected_infrastructure, recommended_actions, status
  ) VALUES (
    'JAL-HIGH-W122', 'HIGH', 'Arterial Transport Waterlogging — Behala Chowrasta',
    'Diamond Harbour Road NH117 drainage bottleneck with projected 39cm ponding depth.', 'Compound Surge & Rainfall Confluence',
    0.88, '["Vidyasagar State General Hospital entry route","Behala Tram Depot commercial square"]'::jsonb, '["Clear gully pit screens of plastic accumulation along NH117 corridor","Start secondary booster pump at Chowrasta underground chamber"]'::jsonb,
    'ACTIVE'
  ) ON CONFLICT (alert_code) DO UPDATE SET
    title = EXCLUDED.title,
    severity = EXCLUDED.severity;
INSERT INTO incident_alerts (
    alert_code, severity, title, description, trigger_mechanism,
    confidence_score, affected_infrastructure, recommended_actions, status
  ) VALUES (
    'JAL-WARN-PB02', 'MEDIUM', 'IoT Sensor Anomaly — Palmer Bazar Main Outfall Pumping',
    'Sump chamber water level reached 4.88m, exceeding 4.50m threshold with 142 NTU turbidity spike indicating silt scour.', 'Compound Surge & Rainfall Confluence',
    0.95, '["Palmer Bazar Main Pumping Station Sump 2","Seal Lane collector sewer"]'::jsonb, '["Trigger auto-cleaning rake on coarse bar screens","Verify diesel generator fuel reserve for sustained 12-hour pumping"]'::jsonb,
    'ACKNOWLEDGED'
  ) ON CONFLICT (alert_code) DO UPDATE SET
    title = EXCLUDED.title,
    severity = EXCLUDED.severity;

-- 7. SEED MODEL REGISTRY
INSERT INTO model_records (
    model_key, model_name, version, architecture, brier_score, crps,
    spatial_iou, freshness_min, parameters, inference_latency_ms, status
  ) VALUES (
    'mod-prod-pinn-03', 'JalNetra Spatiotemporal PINN (Physics-Informed Neural Network)', 'v2.4.1', 'physics_informed_pinn',
    0.084, 0.182, 0.862,
    15, '14.2M', 142, 'PRODUCTION_ACTIVE'
  ) ON CONFLICT (model_key) DO UPDATE SET
    crps = EXCLUDED.crps,
    brier_score = EXCLUDED.brier_score;
INSERT INTO model_records (
    model_key, model_name, version, architecture, brier_score, crps,
    spatial_iou, freshness_min, parameters, inference_latency_ms, status
  ) VALUES (
    'mod-chal-lstm-02', 'Temporal Hydrological TCN-LSTM Ensemble', 'v2.1.0', 'spatiotemporal_lstm',
    0.118, 0.224, 0.791,
    15, '14.2M', 380, 'PRODUCTION_ACTIVE'
  ) ON CONFLICT (model_key) DO UPDATE SET
    crps = EXCLUDED.crps,
    brier_score = EXCLUDED.brier_score;
INSERT INTO model_records (
    model_key, model_name, version, architecture, brier_score, crps,
    spatial_iou, freshness_min, parameters, inference_latency_ms, status
  ) VALUES (
    'mod-base-lgbm-01', 'Baseline Calibrated LightGBM Classifier', 'v1.3.2', 'baseline_gradient_boost',
    0.165, 0.312, 0.684,
    15, '14.2M', 35, 'PRODUCTION_ACTIVE'
  ) ON CONFLICT (model_key) DO UPDATE SET
    crps = EXCLUDED.crps,
    brier_score = EXCLUDED.brier_score;
