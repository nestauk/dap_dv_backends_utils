# v0.0.14

Fix `#getEntities` function
Fix `entitiesDataQuality` bug

# v0.0.13

Fix Arcgis FeatureServer bug

# v0.0.12

Update package dependencies

# v0.0.11

Due to uknown bug, the changes below were never pushed to GH

# v0.0.10

Fix Arcgis FeatureServer bug where features weren't returning all properties.

# v0.0.9

Fix ES query bug

# v0.0.8

Add scripts for downloading geographic boundaries from an arcGis FeatureServer,
and for converting these boundaries to mbtiles/pmtiles, and uploading the
pmtiles file to an s3 bucket.

# v0.0.7

Fix authentication bug. Authentication endpoint expects a GET request with
email and token provided in the URLSearchParams, but instead was being passed
as the body of a POST request. This change fixes that bug.

# v0.0.6

Add authentication logic formerly contained in the
annotation service

# v0.0.5

Patch import errors in `jsonToEsIndex.js` script 
and patch a bulk request bug.

# v0.0.4

Add the jsonToEsIndex script to `bin/`

# v0.0.3

Port Terraform configuration to nestauk/dap_dv_backends

# v0.0.2

Added some executable scripts in `bin/`

# v0.0.1

Copy of utilities from nestauk/dap_dv_backends@ce64d0c
