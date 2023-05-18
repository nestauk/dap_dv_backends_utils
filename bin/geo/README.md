## downloadBoundaries

This script downloads boundaries from an arcGis server and saves them as geoJSON
to a specified output directory. In order to know which boundaries to download,
you must supply a configuration file with a list of objects, where each object
has a `boundary` and `endpoint` key. The `boundary` key will be used to name the
resulting geoJSON file for that boundary, and the `endpoint` should point to the
arcGis FeatureServer related to that boundary. Here is an example for the three
different levels of International Territorial boundaries:

```json
[
    {
        "boundary": "itl1",
        "endpoint": "https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/International_Territorial_Level_1_January_2021_UK_BFC_2022/FeatureServer"
    },
    {
        "boundary": "itl2",
        "endpoint": "https://services1.arcgis.com/ESMARspQHYMw9BZ9/ArcGIS/rest/services/International_Territorial_Level_2_January_2021_UK_BFC_V2_2022/FeatureServer"
    },
    {
        "boundary": "itl3",
        "endpoint": "https://services1.arcgis.com/ESMARspQHYMw9BZ9/ArcGIS/rest/services/International_Territorial_Level_3_January_2021_UK_BFC_V3_2022/FeatureServer"
    }
]
```

## generatePmTiles

### Requirements

[tippecanoe](https://github.com/mapbox/tippecanoe), which can be installed with
brew `brew install tippecanoe`
[pmtiles](https://github.com/protomaps/go-pmtiles/releases), download the
relevant binary at this link, and add it to your system's path.

The script was written and tested using the following versions of the software
above:

`tippecanoe v2.23.0`
`pmtiles v1.70`

### Running the script

Script for generating a pmtiles file and uploading it to s3. You specify the
directory in which the boundaries are kept (all in geojson) as the first
argument, and the s3 URI of your desired bucket as the second argument:

```sh
npx generatePmTiles boundaries/ s3://path-to-bucket
```

### Uploading to s3

You must have `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` environment
variables set in order to upload the resulting pmtiles file to s3.

To upload, simply run the following:

pmtiles upload $pmtiles --bucket=$2 $pmtiles

```sh
pmtiles upload <path-to-pmtiles> --bucket=<s3://path-to-bucket> <path-to-pmtiles>
```
