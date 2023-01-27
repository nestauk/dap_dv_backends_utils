#! /usr/bin/env node

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { Command } from 'commander';
import * as _ from 'lamb';

import { buildRequest, makeRequest } from '../../es/requests.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();
program.requiredOption(
	'-d, --domain <domain>',
	'ES domain on which to aggregate',
);
program.requiredOption('-i, --index <index>', 'ES index on which to aggregate');
program.option(
	'-p, --path <path>',
	'Path to directory containing requests',
	`${__dirname}/requests`
);
program.requiredOption(
	'-o, --out <path>',
	'Path to directory in which to save results.',
);

program.showHelpAfterError();
program.parse();
const options = program.opts();

const filterDirectory = predicate => _.pipe([
	dirPath => fs.readdirSync(dirPath, { withFileTypes: true }),
	_.filterWith(predicate),
	_.mapWith(_.getKey('name'))
]);

const getSubDirectories = filterDirectory(dirEnt => dirEnt.isDirectory());

const main = async () => {
	const aggregationDirectories = getSubDirectories(options.path);

	const payloads = await Promise.all(
		_.map(aggregationDirectories, dir => {
			const subPath = path.join(options.path, dir);

			// if file is generated using script, regenerate
			if (fs.existsSync(path.join(subPath, 'request.mjs'))) {
				exec(`node ${path.join(subPath, 'request.mjs')}`);
			}
			const payload = fs.readFileSync(
				path.join(subPath, 'request.json'), { encoding: 'utf-8' });
			return { name: dir, payload };
		}));

	const responses = await Promise.all(
		_.map(payloads, async ({ name, payload }) => {
			const requestPath = `${options.index}/_search`;
			const request = buildRequest(
				options.domain,
				requestPath,
				'POST',
				{ payload }
			);
			const { body: response } = await makeRequest(request);
			return { name, payload, response };
		}));

	if (options.out) {
		if (!fs.existsSync(options.out)) {
			fs.mkdirSync(options.out, { recursive: true });
		}
	}
	await Promise.all(
		_.map(responses, response => {
			const outputPath = options.out
				? path.join(options.out, `${response.name}.json`)
				: path.join(options.path, response.name, 'response.json');
			fs.writeFileSync(
				outputPath,
				JSON.stringify(response.response, null, 4)
			);
		}));
};

main();
