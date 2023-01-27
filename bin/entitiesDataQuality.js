#! /usr/bin/env node

import { saveObj } from '@svizzle/file';
import { mergeWithSum, getTruthyValuesKeys } from '@svizzle/utils';
import { Command } from 'commander';
import * as _ from 'lamb';
import mkdirp from 'mkdirp';
import { fetch } from 'undici';

import { getEntityDetails, isDisambiguation } from '../dbpedia/requests.mjs';
import { getEntities } from '../es/entities.mjs';
import { batchIterateFlatten } from '../util/array.mjs';

const program = new Command();

program.requiredOption(
	'-d, --domain <domain>',
	'ES domain on which the entities are stored',
);
program.requiredOption(
    '-i, --index <index>', 
    'ES index on which the entities are stored'
);
program.option(
    '-o, --output <directory>',
    'Output directory for the data quality results.',
    'data'
)

program.showHelpAfterError();
program.parse();
const options = program.opts();

await mkdirp(`${options.output}/outputs`)
await mkdirp(`${options.output}/quality/entities`)

const FILE_ENTITY_TITLES = `${options.output}/outputs/entity_titles.json`;
const FILE_ENTITY_DETAILS = `${options.output}/outputs/entity_details.json`;
const FILE_ENTITY_COUNTS = `${options.output}/quality/entities/entity_counts.json`;
const FILE_MISSING_ABSTRACTS = `${options.output}/quality/entities/missing_abstracts.json`;
const FILE_MISSING_DERIVED_FROM = `${options.output}/quality/entities/missing_derived_from.json`;
const FILE_MISSING_THUMBNAIL = `${options.output}/quality/entities/missing_image.json`;
const FILE_IMAGE_STATUS = `${options.output}/quality/entities/image_status.json`;
const FILE_IMAGE_404s = `${options.output}/quality/entities/image_404s.json`;
const FILE_IMAGE_EXTENSION_COUNTS = `${options.output}/quality/entities/image_extension_counts.json`;
const FILE_DISAMBIGUATION_ENTITIES = `${options.output}/quality/entities/disambiguation_entities.json`;

const save = (path, object) => saveObj(path, 4)(object);
const addStats = (entities, all) => {
	const stats = {
		count: entities.length,
		proportion: entities.length / all.length
	};
	return {
		stats,
		entities
	};
};

const main = async () => {

	// Get Titles for all entities annotated on the ai_map index
	console.log('[+] Getting Entity Titles');
	const titles = await getEntities(options.index, options.domain);
	save(FILE_ENTITY_TITLES, titles);

	// Get details for all DBpedia entities using DBpedia SPARQL endpoint
	console.log('[+] Getting Entity Details');
	const details = await batchIterateFlatten(titles, getEntityDetails);
	save(FILE_ENTITY_DETAILS, details);

	// Get the count statistics for the details
	console.log('[+] Calculating count statistics');
	const counts = _.reduce(details, (acc, curr) => {
		const ones = _.mapValues(curr, _.always(1));
		return mergeWithSum(acc, ones);
	}, {});
	const normalisedCounts = _.mapValues(counts, count => count / details.length);
	save(FILE_ENTITY_COUNTS, normalisedCounts);

	// Get the count statistics for missing details
	console.log('[+] Calculating missing statistics');
	const filterToTitles = predicate =>
		_.map(_.filter(details, predicate), _.getKey('URI'));
	save(
		FILE_MISSING_ABSTRACTS,
		addStats(filterToTitles(d => !d.abstract), titles)
	);
	save(
		FILE_MISSING_DERIVED_FROM,
		addStats(filterToTitles(d => !d.derivedFrom), titles)
	);
	save(
		FILE_MISSING_THUMBNAIL,
		addStats(filterToTitles(d => !d.imageURL), titles)
	);

	const imageURLs = _.map(
		_.filter(details, d => d.imageURL),
		d => new URL(d.imageURL)
	);

	// Count image extensions
	console.log('[+] Counting image file types by extension');
	const extensions = _.map(imageURLs, t => t.pathname.split('.').slice(-1)[0]);
	const extensionCounts = _.count(extensions, _.identity);
	saveObj(FILE_IMAGE_EXTENSION_COUNTS, extensionCounts);

	// Get the image status by fetching using imageURL
	console.log('[+] Fetching images and saving response status');
	const imageURLStatus = await batchIterateFlatten(
		imageURLs,
		async batch_ => {
			const responses = await Promise.all(
				_.map(batch_, t => fetch(t))
			);
			return _.map(
				_.zip(batch_, responses),
				([u, r]) => ({ url: u.href, status: r.status })
			);
		}
	);

	const imageURLStatusCounts = _.count(imageURLStatus, _.getKey('status'));
	const notFounds = _.filter(imageURLStatus, r => r.status === 404);

	save(FILE_IMAGE_404s, addStats(_.map(notFounds, r => r.url), titles));
	save(FILE_IMAGE_STATUS, imageURLStatusCounts);

	const disambiguationStatus = await batchIterateFlatten(
		titles,
		isDisambiguation,
		{ concat: false}
	);
	const flattened = _.reduce(
		disambiguationStatus,
		(acc, curr) => ({ ...acc, ...curr })
	);
	const disambiguations = getTruthyValuesKeys(flattened);
	save(FILE_DISAMBIGUATION_ENTITIES, addStats(disambiguations, details));
};

await main();

