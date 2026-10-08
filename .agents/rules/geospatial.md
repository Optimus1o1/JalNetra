---
trigger: always_on
description: "Guidelines for geospatial data representation, PostGIS queries, and coordinate handling."
---

# JALNETRA Geospatial Engineering Rule

1. **Spatial Representation**:
   - Primary reference coordinate system: WGS84 (EPSG:4326) for coordinates `[latitude, longitude]`.
   - Kolkata Metropolitan Basin bounds: Latitudes $[22.45, 22.65]$, Longitudes $[88.25, 88.48]$.
   - Catchment geometries stored in PostGIS using `GEOMETRY(Polygon, 4326)` or normalized GeoJSON.

2. **Query Performance**:
   - Filter spatial assets using spatial indices (GiST) and bounding boxes (`ST_Intersects`, `ST_BBox`).
   - Never fetch all city features to compute distances in memory when PostGIS can perform the query in SQL.
