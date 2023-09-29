#! /usr/bin/env node

import { Command } from 'commander';
import * as _ from 'lamb';

import { arxliveCopy } from '../conf/config.mjs';
import { sleep } from '../util/time.mjs';
import { commanderParseInt } from '../util/commander.mjs';


const { NESTA_EMAIL, NESTA_TOKEN } = process.env;

if (!NESTA_EMAIL || !NESTA_TOKEN) {
    throw new Error(`
    Please export your NESTA_EMAIL and NESTA_TOKEN as environment variables.
    More information on how to retrieve these can be found here:
    https://github.com/nestauk/dap_dv_backends/tree/dev/src/services/authentication`
    )
}

const program = new Command();
program.requiredOption(
    '-d, --domain <domain>',
    'ES domain on which to annotate',
    arxliveCopy
);
program.requiredOption(
    '-i, --index <index>',
    'Index on which to annotate',
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
    '--include-metadata',
    'Include metadata fields on the index',
    true
);
program.option(
    '--workers <value>',
    'Number of workers to use',
    commanderParseInt,
    2
);

program.showHelpAfterError();
program.parse();
const options = program.opts();

const main = async () => {

    const authHeader = `Basic ${Buffer.from(NESTA_EMAIL + ':' + NESTA_TOKEN).toString('base64')}`;

    const query = {
        domain: options.domain,
        index: options.index,
        field: options.fieldName,
        newField: options.newFieldName,
        includeMetaData: options.includeMetadata,
        workers: options.workers
    }

    const queryString = new URLSearchParams(query);
    const url = `https://api.dap-tools.uk/annotate/es?${queryString.toString()}`;

    let requestOptions = {
        method: 'GET',
        headers: {
            Authorization: authHeader
        }
    };

    let response = await fetch(url, requestOptions);
    const { id } = await response.json();

    console.log(id);

    const progressEndpoint = 'https://api.dap-tools.uk/annotate/progress/'
    response = await fetch(`${progressEndpoint}/${id}`)
    let progress = await response.json();

    while (progress.status !== 'finished') {
        response = await fetch(`${progressEndpoint}/${id}`)
        progress = await response.json();
        console.log(progress);

        await sleep(1000 * 10);
    }
};

main();