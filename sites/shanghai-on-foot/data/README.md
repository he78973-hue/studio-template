# Map data and attribution

- `streets.json`: derived local route, projected building footprints and road features used by the template.
- `neighborhood.geojson`: decoded source-tile snapshot retained for attribution and reproducibility.
- Source: © OpenStreetMap contributors, delivered through [OpenFreeMap](https://openfreemap.org/) and [OpenMapTiles](https://openmaptiles.org/). The original tile endpoint and projection metadata are recorded in `streets.json`.
- Database license: [Open Database License 1.0 (ODbL)](https://opendatacommons.org/licenses/odbl/1-0/); [OpenStreetMap copyright and attribution](https://www.openstreetmap.org/copyright).
- These distributed derived database files are provided under ODbL 1.0. Retain attribution and meet the license's share-alike requirements when redistributing an adapted database.
- WGS84 origin: `[121.4351, 31.2105]`; one projected world unit is one metre. Geometry, route centreline and editorial POI placement are illustrative rather than surveyed pedestrian guidance. Heights and shop parcels include inferences.
- Refreshing tiles can change feature IDs. Review landmark matches and run `npm run check` before replacing the bundled data.
