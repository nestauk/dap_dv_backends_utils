#! /usr/bin/env node

import { promises as fs } from 'fs';

import { Command } from 'commander';
import * as _ from 'lamb';

import { arxliveCopy } from '../conf/config.mjs';
import { bulkRequest } from '../es/bulk.mjs';
import { createIndex } from '../es/index.mjs';
import { logger } from '../logging/logging.mjs';
import { batch } from '../util/array.mjs';
import { commanderParseInt } from '../util/commander.mjs';

const program = new Command();
program.option(
	'-d, --domain <domain>',
	'ES domain on which to ingest documents',
	arxliveCopy
);
program.requiredOption('-i, --index <index>', 'Index on which to ingest');
program.requiredOption('-p, --path <path>', 'Path to JSON data');
program.option('--batch-size <size>', 'Size of batch of docs to upload', commanderParseInt, 100);
program.option(
	'--key <key>',
	'Top level key in JSON object to use as key. If not supplied, keys will be generated automatically',
	null
);
program.option(
	'--list-key <key>',
	'Key for the documents if documents are stored as a value at the root level of the json file. Not recommended',
	null
);

program.parse();
const options = program.opts();

const main = async () => {

	await createIndex(options.domain, options.index);

	const json = JSON.parse(
		await fs.readFile(options.path, { encoding: 'utf-8' })
	);
	const data = options.listKey ? json[options.listKey] : json;

	const documents = options.key
		? _.map(data, object => {
			const { [options.key]: _id, ...contents } = object;
			return { _id, data: contents };
		})
		: _.map(data, (contents, _id) => ({ _id, data: contents }));

	const docsWithId = _.filter(documents, doc => '_id' in doc);

	for (const docs of batch(docsWithId, options.batchSize)) {
		// eslint-disable-next-line no-await-in-loop
		const response = await bulkRequest(options.domain, options.index, docs, 'create');
		if (response.code !== 200) {
			logger.error(response);
		}
	};
};

main();
