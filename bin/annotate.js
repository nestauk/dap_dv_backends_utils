#! /usr/bin/env node

import { Command } from 'commander';
import * as _ from 'lamb';
import { performance } from 'perf_hooks';

import { arxliveCopy } from '../conf/config.mjs';
import { getMappings } from '../es/index.mjs';
import { register, trigger, status } from '../es/snapshot.mjs';
import { annotateIndex } from '../dbpedia/spotlight.mjs';
import { commanderParseInt } from '../util/commander.mjs';
import { dedent } from '../util/string.mjs';

const program = new Command();
program.option(
	'-d, --domain <domain>',
	'ES domain on which to annotate',
	arxliveCopy
);
program.requiredOption(
	'-i, --index <index>',
	'Index on which to annotate',
);
program.requiredOption(
	'-s, --spotlight <endpoint>',
	'Endpoint for spotlight annotator',
);
program.requiredOption(
	'-f, --field-name <field>',
	'Field of doc to be used as input text for annotation'
);
program.option(
	'-n, --new-field-name <annotated_field_name>',
	'Name of new field to be created',
	'dbpedia_entities'
);
program.option(
	'-p, --page-size <page size>',
	'Size of page to scroll with',
	commanderParseInt,
	10000
);
program.option(
	'-b, --batch-size <batch size>',
	'Size of batch to annotate over',
	commanderParseInt,
	10
);
program.option(
	'-g, --group-size <size>',
	'Size of group of batches, usually corresponds to the number of worker nodes',
	commanderParseInt,
	4
);
program.option(
	'-z, --pages <number of pages>',
	'Number of pages to iterate over',
	'all'
);
program.option(
	'--force',
	'Force the annotation process, even if no snapshots can be created'
);
program.option(
	'--include-metadata',
	'Include metadata fields on the index',
	true
);

program.showHelpAfterError();
program.parse();
const options = program.opts();

const main = async () => {

	const currentMapping = await getMappings(options.domain, options.index);
	if (
		options.newFieldName in currentMapping[options.index].mappings.properties &&
		!options.force
	) {
		throw new Error(
			dedent`Field already exists at index mapping, and force 
				   flag or continue flag not supplied`
		);
	}

	const startTime = performance.now();

	await annotateIndex(
		options.domain,
		options.index,
		options.spotlight,
		options.fieldName,
		options
	);

	const endTime = performance.now();
	console.log(`Total time taken (in ms): ${endTime - startTime}`);
};

main();


