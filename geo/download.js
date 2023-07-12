import * as _ from 'lamb'

import { batchIterateFlatten } from '../util/array.mjs'

// API docs: https://developers.arcgis.com/rest/services-reference/enterprise/query-feature-service-layer-.htm

export const getAllFeatureIds = async featureServerEndpoint => {

    const url = new URL(`${featureServerEndpoint}/0/query`)
    url.search = new URLSearchParams({
        f: 'json',
        returnIdsOnly: true,
        where: '1=1',
        outFields: '*'
    }).toString()

    const response = await fetch(url, { method: 'POST' });
    const result = await response.json();
    return result.objectIds;
}

export const collectAllFeatures = async featureServerEndpoint => {

    const ids = await getAllFeatureIds(featureServerEndpoint)
    const url = new URL(`${featureServerEndpoint}/0/query`)

    const downloadFeatures = async batch => {
        url.search = new URLSearchParams({
            f: 'geoJSON',
            where: '1=1',
            objectIds: batch,
            outFields: '*',
        })
        const response = await fetch(url, { method: 'POST' });
        const result = await response.json();
        return result;
    }
    const results = await batchIterateFlatten(ids, downloadFeatures, { batchSize: 100 });
    const collection = _.reduce(
        results,
        (acc, curr) => {
            acc.features.push(...curr.features);
            return acc
        }
    )
    return {
        type: "FeatureCollection",
        ...collection
    }
}
