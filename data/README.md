# Seattle Parcel Datasets

## Data Source
- **Portal:** [Seattle GeoData — Parcels (`SeattleCityGIS::parcels-1`)](https://data-seattlecitygis.opendata.arcgis.com/datasets/SeattleCityGIS::parcels-1/explore?location=47.615614%2C-122.338233%2C11&showTable=true)
- **ArcGIS FeatureServer Layer:** `https://services.arcgis.com/ZOyb2t4B0UYuYNYH/arcgis/rest/services/Zoned_Development_Capacity_Layers_2016/FeatureServer/2`
- **Raw Full Dataset (`raw/Zoned_Development_Capacity_Layers_2016.geojson`):** 178,897 Seattle parcels with polygon geometry (`esriGeometryPolygon`) and 72 zoning/valuation attributes. Loaded locally into Docker PostgreSQL (`seattle-parcels-postgres` on port `5433`, database `seattle_parcels`, table `parcels`).

## Filtered Datasets (`processed/` — Untracked)

1. **Seattle Parks & Green Spaces (`processed/seattle-parks.geojson`)**
   - **Filter:** `land_use_code IN (149, 143, 326, 328, 331, 333)`
   - **Scope:** 1,729 parcels covering public parks/zoos/arboretums, golf courses, open spaces, timber/greenbelts, wilderness reserves, and rivers/creeks/streams.

2. **U-District & Ravenna (`processed/seattle-udistrict.geojson`)**
   - **Filter:** `uv_name IN ('University District Northwest', 'University Campus', 'Ravenna')`
   - **Scope:** 1,374 parcels across the University District and Ravenna urban villages.

## Sample Dataset (`sample/` — Tracked in Git)
- **`sample/seattle-udistrict-sample.geojson`:** A random sample of 100 parcels drawn from the U-District & Ravenna dataset for lightweight testing and local development.
