## `annotate`

Running this script requires that you have data hosted on an ElasticSearch
domain and that you have a running Spotlight API endpoint.

## `annotationsDataQuality`

This script will provide a number of aggreagations relating to the data quality
of the results provided by the annotation process. The output directory will
have names relating to the kind of aggregation that was run. For further details
on the kinds of aggregations and what they do, refer to the README.md files
in each aggreagation requests directory in `bin/annotationsDataQuality/requests/<request>`.

## `entitiesDataQuality`

This script will provide data quality for the actual DBpedia entities produced
by the `annotate` script. It collects the set of all DBpedia URIs and uses
a number of SPARQL queries to determine the quality of data provided by DBpedia,
such as "how many entities have images?" and "of those images, what file type
are they?" etc. The aggregations produced have self descriptive names.
