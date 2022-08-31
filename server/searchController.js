import {app, client, router} from "./server.js";

// Klic za iskanje po dveh indeksih
router.get('/search', (req, res) => {

    // if (!Object.prototype.hasOwnProperty.call(req.query, 'searchQuery')) {
    //     throw new Error("Missing field searchQuery")
    // }

    console.log(req.query)
    let query;
    if (req.query.searchQuery || req.query.searchQuery === '') {
        if (req.query.searchQuery === '') {
            query = {
                bool: {
                    must: [
                        {
                            range: {
                                "metadata.duration": {
                                    gte: req.query.durationMin * 60,
                                    ...(parseInt(req.query.durationMax) !== 120 ? {lte: req.query.durationMax * 60} : {})
                                }
                            }
                        },
                        {
                            range: {
                                "metadata.broadcastDate": {
                                    ...(req.query.dateStart ? {gte: req.query.dateStart} : {}),
                                    ...(req.query.dateEnd ? {lte: req.query.dateEnd} : {})
                                }
                            }
                        }
                    ]
                }
            }
        } else {
            query = {
                bool: {
                    must: [
                        {
                            range: {
                                "metadata.duration": {
                                    gte: req.query.durationMin * 60,
                                    ...(parseInt(req.query.durationMax) !== 120 ? {lte: req.query.durationMax * 60} : {})
                                }
                            }
                        },
                        {
                            range: {
                                "metadata.broadcastDate": {
                                    ...(req.query.dateStart ? {gte: req.query.dateStart} : {}),
                                    ...(req.query.dateEnd ? {lte: req.query.dateEnd} : {})
                                }
                            }
                        },
                        {
                            bool: {
                                should: [
                                    {
                                        bool: {
                                            must: req.query.searchQuery?.split(',')?.map(subquery => {
                                                return {
                                                    match_phrase: {
                                                        "metadata.showName": escapeSpecialChars(subquery)
                                                    }
                                                }
                                            }) || []
                                        }
                                    },
                                    {
                                        bool: {
                                            must: req.query.searchQuery?.split(',')?.map(subquery => {
                                                return {
                                                    match_phrase: {
                                                        "metadata.title": escapeSpecialChars(subquery)
                                                    }
                                                }
                                            }) || []
                                        }
                                    },
                                    {
                                        bool: {
                                            must: req.query.searchQuery?.split(',')?.map(subquery => {
                                                return {
                                                    match_phrase: {
                                                        "metadata.description": escapeSpecialChars(subquery)
                                                    }
                                                }
                                            }) || []
                                        }
                                    },
                                    {
                                        nested: {
                                            path: "subtitles",
                                            query: {
                                                bool: {
                                                    must: req.query.searchQuery?.split(',')?.map(subquery => {
                                                        return {
                                                            match_phrase: {
                                                                "subtitles.text": escapeSpecialChars(subquery)
                                                            }
                                                        }
                                                    }) || []
                                                }
                                            }
                                        }
                                    },
                                    {
                                        nested: {
                                            path: "speech",
                                            query: {
                                                bool: {
                                                    must: req.query.searchQuery?.split(',')?.map(subquery => {
                                                        return {
                                                            match_phrase: {
                                                                "speech.text": escapeSpecialChars(subquery)
                                                            }
                                                        }
                                                    }) || []
                                                }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
        }
    } else {
        query = {
            bool: {
                must: [
                    ...req.query.showName ? req.query.showName.split(',')?.map(subquery => {
                        return {
                            match_phrase: {
                                "metadata.showName": escapeSpecialChars(subquery)
                            }
                        }
                    }) || [] : [],
                    ...req.query.title ? req.query.title.split(',')?.map(subquery => {
                        return {
                            match_phrase: {
                                "metadata.title": escapeSpecialChars(subquery)
                            }
                        }
                    }) || [] : [],
                    ...req.query.description ? req.query.description.split(',')?.map(subquery => {
                        return {
                            match_phrase: {
                                "metadata.description": escapeSpecialChars(subquery)
                            }
                        }
                    }) || [] : [],
                    ...req.query.subtitles ? [{
                        nested: {
                            path: "subtitles",
                            query: {
                                bool: {
                                    must: req.query.subtitles.split(',')?.map(subquery => {
                                        return {
                                            match_phrase: {
                                                "subtitles.text": escapeSpecialChars(subquery)
                                            }
                                        }
                                    }) || []
                                }
                            }
                        }
                    }] : [],
                    ...req.query.speech ? [{
                        nested: {
                            path: "speech",
                            query: {
                                bool: {
                                    must: req.query.speech.split(',')?.map(subquery => {
                                        return {
                                            match_phrase: {
                                                "speech.text": escapeSpecialChars(subquery)
                                            }
                                        }
                                    }) || []
                                }
                            }
                        }
                    }] : [],
                    {
                        range: {
                            "metadata.duration": {
                                gte: req.query.durationMin * 60,
                                ...(parseInt(req.query.durationMax) !== 120 ? {lte: req.query.durationMax * 60} : {})
                            }
                        }
                    },
                    {
                        range: {
                            "metadata.broadcastDate": {
                                ...(req.query.dateStart ? {gte: req.query.dateStart} : {}),
                                ...(req.query.dateEnd ? {lte: req.query.dateEnd} : {})
                            }
                        }
                    }
                ]
            }
        }
    }

    let body = {
        index: 'rtv-oddaje-nested-standard',     //oddaje-nested | tv-oddaje
        query: query,
        // highlight: {
        //     fields: {
        //         ...((req.query.searchQuery && req.query.searchQuery !== '') || req.query.subtitles) ? {"subtitles.text": {}} : {}
        //     }
        // },
    }

    if (req.query.params) {
        let params = JSON.parse(req.query.params);
        console.log(params)

        if (params.take) {
            body.size = params.take;
            if (params.page) {
                body.from = (params.page - 1) * params.take;
            }
        }
    }

    client.search(body)
        .then(async resp => {
            let result = []
            if ((req.query.searchQuery && req.query.searchQuery !== '') || (req.query.subtitles && req.query.subtitles !== '') || (req.query.speech && req.query.speech !== ''))
                for (const entry of resp.hits.hits) {
                    let tmp = entry
                    tmp._source.matchedSubtitles = []
                    tmp._source.matchedSpeech = []
                    if ((req.query.searchQuery && req.query.searchQuery !== '') || (req.query.subtitles && req.query.subtitles !== ''))
                        await getSubtitles(entry._source.metadata.id, req.query.searchQuery || req.query.subtitles).then(val => {
                            tmp._source.matchedSubtitles = val
                        })
                    if ((req.query.searchQuery && req.query.searchQuery !== '') || (req.query.speech && req.query.speech !== ''))
                        await getSpeech(entry._source.metadata.id, req.query.searchQuery || req.query.speech).then(val => {
                            tmp._source.matchedSpeech = val
                        })
                    result.push(tmp)
                }
            else
                result = resp.hits.hits
            res.send({data: result, totalHits: resp.hits.total.value})
        })
        .catch(err => {
            res.status(500).send(err);
        })
})


async function getSubtitles(id, text) {
    let query = {
        bool: {
            must: [
                {
                    term: {
                        id: {
                            value: id
                        }
                    }
                },
                ...text.split(',')?.map(subquery => {
                    return {
                        match_phrase: {
                            "text": escapeSpecialChars(subquery)
                        }
                    }
                }) || []
            ]
        }
    }

    let body = {
        index: 'rtv-oddaje-podnapisi-standard',     //oddaje-nested | tv-oddaje
        size: 500,
        scroll: '1m',
        query: query,
        sort: [
            {
                start: {
                    order: "asc",
                    unmapped_type: "float"
                }
            }
        ]
    }

    const respQueue = []
    let subtitles = []
    let scroll_ids = []
    try {
        const resp = await client.search(body)
        if (resp.hits.total.value <= 500) {
            await client.clearScroll({scroll_id: resp._scroll_id})
            return resp.hits.hits
        }
        respQueue.push(resp)

        while (respQueue.length) {
            const body = respQueue.shift()
            if (scroll_ids.indexOf(body._scroll_id) === -1) {
                scroll_ids.push(body._scroll_id)
            }

            body.hits.hits.forEach(hit => {
                subtitles.push(hit)
            })

            if (body.hits.total.value === subtitles.length)
                break

            respQueue.push(await client.scroll({
                scroll_id: body._scroll_id,
                scroll: '1m'
            }))
        }
        if (scroll_ids.length)
            await client.clearScroll({scroll_id: scroll_ids})
        return subtitles
    } catch (e) {
        console.error(e)
        return []
    }
}

async function getSpeech(id, text) {
    let query = {
        bool: {
            must: [
                {
                    term: {
                        id: {
                            value: id
                        }
                    }
                },
                ...text.split(',')?.map(subquery => {
                    return {
                        match_phrase: {
                            "text": escapeSpecialChars(subquery)
                        }
                    }
                }) || []
            ]
        }
    }

    let body = {
        index: 'rtv-oddaje-govor-standard',
        size: 500,
        scroll: '1m',
        query: query,
        sort: [
            {
                start: {
                    order: "asc",
                    unmapped_type: "float"
                }
            }
        ]
    }

    const respQueue = []
    let speech = []
    let scroll_ids = []
    try {
        const resp = await client.search(body)
        if (resp.hits.total.value <= 500) {
            await client.clearScroll({scroll_id: resp._scroll_id})
            return resp.hits.hits
        }
        respQueue.push(resp)

        while (respQueue.length) {
            const body = respQueue.shift()
            if (scroll_ids.indexOf(body._scroll_id) === -1) {
                scroll_ids.push(body._scroll_id)
            }

            body.hits.hits.forEach(hit => {
                speech.push(hit)
            })

            if (body.hits.total.value === speech.length)
                break

            respQueue.push(await client.scroll({
                scroll_id: body._scroll_id,
                scroll: '1m'
            }))
        }
        if (scroll_ids.length)
            await client.clearScroll({scroll_id: scroll_ids})
        return speech
    } catch (e) {
        console.error(e)
        return []
    }
}

const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ';

function generateString(length) {
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}

// Napolni nested bazo s testnimi podatki
router.post("/fillData", async (req, res) => {
    let bulkData = [];
    for (let i = 0; i < 1000; i++) {
        let len;

        let document = {
            "metadata": {},
            "speech": []
        }

        len = Math.floor(Math.random() * (31 - 10) + 10);
        document.metadata.title = generateString(len);

        len = Math.floor(Math.random() * (31 - 10) + 10);
        document.metadata.subtitle = generateString(len)

        document.metadata.duration = Math.floor(Math.random() * (6501 - 1000) + 1000);

        document.metadata.playDate = '2022-04-15';

        len = Math.floor(Math.random() * (101 - 30) + 30);
        document.metadata.description = generateString(len)

        for (let j = 0; j < 1000; j++) {
            let subtitle = {};
            len = Math.floor(Math.random() * (71 - 30) + 30);
            subtitle.text = generateString(len)
            subtitle.offset = Math.floor(Math.random() * (document.metadata.duration));
            document.speech.push(subtitle)
        }
        bulkData.push(document)
    }

    const operations = bulkData.flatMap(doc => [{index: {_index: 'oddaje-nested'}}, doc])

    const bulkResponse = await client.bulk({refresh: true, operations})

    if (bulkResponse.errors) {
        const erroredDocuments = []
        // The items array has the same order of the dataset we just indexed.
        // The presence of the `error` key indicates that the operation
        // that we did for the document has failed.
        bulkResponse.items.forEach((action, i) => {
            const operation = Object.keys(action)[0]
            if (action[operation].error) {
                erroredDocuments.push({
                    // If the status is 429 it means that you can retry the document,
                    // otherwise it's very likely a mapping error, and you should
                    // fix the document before to try it again.
                    status: action[operation].status,
                    error: action[operation].error,
                    operation: body[i * 2],
                    document: body[i * 2 + 1]
                })
            }
        })
        console.log(erroredDocuments)
    }

    const count = await client.count({index: 'oddaje-nested'})
    console.log(count)
    res.sendStatus(200);

})

//Napolni bazo z 2 indeksoma
router.post('/fillData2', async (req, res) => {
    let bulkData = [];
    let len;
    for (let i = 0; i < 1000; i++) {

        let document = {
            metadata: {}
        };

        len = Math.floor(Math.random() * (31 - 10) + 10);
        document.metadata.title = generateString(len);

        len = Math.floor(Math.random() * (31 - 10) + 10);
        document.metadata.subtitle = generateString(len)

        document.metadata.duration = Math.floor(Math.random() * (6501 - 1000) + 1000);

        document.metadata.playDate = '2022-04-15';

        len = Math.floor(Math.random() * (101 - 30) + 30);
        document.metadata.description = generateString(len)

        bulkData.push(document)
    }

    const operations = bulkData.flatMap(doc => [{index: {_index: 'oddaje'}}, doc])

    await client.bulk({refresh: true, operations}).then(async resp => {
        for (const item of resp.items) {
            bulkData = []
            for (let j = 0; j < 1000; j++) {
                let document = {
                    subtitle: {}
                };
                len = Math.floor(Math.random() * (71 - 30) + 30);

                document.subtitle.showId = item.index._id;
                document.subtitle.text = generateString(len)
                document.subtitle.offset = Math.floor(Math.random() * (6501 - 1000) + 1000);

                bulkData.push(document)
            }

            const operations = bulkData.flatMap(doc => [{index: {_index: 'podnapisi'}}, doc])

            await client.bulk({refresh: true, operations})
        }
    })
    res.sendStatus(200);
})


function escapeSpecialChars(string) {
    return string.replace(/([.?+*|{}[\]()"\\])/g, '\\$1')
}

export {router}