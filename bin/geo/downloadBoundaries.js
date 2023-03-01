#! /usr/bin/env node

import fs from 'fs';

import json from '@discoveryjs/json-ext'
import { readJson } from '@svizzle/file';
import { Command } from 'commander';
import * as _ from 'lamb';

import { collectAllFeatures } from '../../geo/download.js';


const { stringifyStream } = json;

const program = new Command();
program.requiredOption('-i, --config <configuration>', 'Configuration file. More on this in the README');
program.requiredOption('-o, --output <path>', 'Path in which to save the outputp data');

program.parse();
const options = program.opts();

const downloadBoundaries = async inputs => {
    for await (const { boundary, endpoint } of inputs) {
        console.log(`Collecting ${boundary}...`)
        const writeStream = fs.createWriteStream(`${options.output}/${boundary}.geojson`);
        const collection = await collectAllFeatures(endpoint);
        stringifyStream(collection).pipe(writeStream);
    }
}

const main = async () => {
    readJson(options.config)
    .then(downloadBoundaries)
    .catch(() => { throw new Error('Unable to parse configuration') });
}

main();