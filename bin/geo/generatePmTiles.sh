#! /bin/bash

if [ "$#" -ne 2 ]; then
    echo "Please supply path to the geojson files and s3 URI"
    exit 1
fi

if [ ! -d $1 ]; then
    echo "Plase supply a valid path"
    exit 1
fi

tiles=""
files=""

for file in `ls $1/*.geojson`; do
    files="$file $files"
    file=`basename -- $file`
    file="${file%.*}"
    tiles="$file"_"$tiles"
done

tiles=${tiles%?}
mbtiles="$tiles.mbtiles"
pmtiles="$tiles.pmtiles"

tippecanoe -o $mbtiles -zg $files
pmtiles convert $mbtiles $pmtiles
pmtiles upload $pmtiles --bucket=$2 $pmtiles