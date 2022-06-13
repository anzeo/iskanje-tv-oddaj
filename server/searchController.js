import {app, client, router} from "./server.js";

// Klic za iskanje s pomočjo inner hits
// router.get('/search', (req, res) => {
//
//     // if (!Object.prototype.hasOwnProperty.call(req.query, 'searchQuery')) {
//     //     throw new Error("Missing field searchQuery")
//     // }
//
//     console.log(req.query)
//     let query;
//     if (req.query.searchQuery || req.query.searchQuery === '') {    // || req.query.searchQuery === ''
//         if (req.query.searchQuery === '') {
//             query = {
//                 match_all: {}
//             }
//         } else {
//             query = {
//                 bool: {
//                     should: [
//                         {
//                             match_phrase: {
//                                 "metadata.showName": escapeSpecialChars(req.query.searchQuery)
//                             }
//                         },
//                         {
//                             match_phrase: {
//                                 "metadata.title": escapeSpecialChars(req.query.searchQuery)
//                             }
//                         },
//                         {
//                             match_phrase: {
//                                 "metadata.description": escapeSpecialChars(req.query.searchQuery)
//                             }
//                         },
//                         {
//                             nested: {
//                                 path: "subtitles",
//                                 inner_hits: { size: 100},
//                                 query: {
//                                     match_phrase: {
//                                         "subtitles.text": escapeSpecialChars(req.query.searchQuery)
//                                     }
//                                 }
//                             }
//                         }
//                     ]
//                 }
//             }
//         }
//     } else {
//         query = {
//             bool: {
//                 must: [
//                     ...req.query.showName ? [{
//                         match_phrase: {
//                             "metadata.showName": escapeSpecialChars(req.query.showName)
//                         }
//                     }] : [],
//                     ...req.query.title ? [{
//                         match_phrase: {
//                             "metadata.title": escapeSpecialChars(req.query.title)
//                         }
//                     }] : [],
//                     ...req.query.description ? [{
//                         match_phrase: {
//                             "metadata.description": escapeSpecialChars(req.query.description)
//                         }
//                     }] : [],
//                     ...req.query.subtitles ? [{
//                         nested: {
//                             path: "subtitles",
//                             inner_hits: { size: 100},
//                             query: {
//                                 match_phrase: {
//                                     "subtitles.text": escapeSpecialChars(req.query.subtitles)
//                                 }
//                             }
//                         }
//                     }] : []
//                 ]
//             }
//         }
//     }
//
//     let body = {
//         index: 'rtv-oddaje-nested-standard',     //oddaje-nested | tv-oddaje
//         query: query,
//         // highlight: {
//         //     fields: {
//         //         "subtitles.text": {}
//         //     }
//         // },
//         _source: ["metadata"]
//     }
//
//     if (req.query.params) {
//         let params = JSON.parse(req.query.params);
//         console.log(params)
//
//         if (params.take) {
//             body.size = params.take;
//             if (params.page) {
//                 body.from = (params.page - 1) * params.take;
//             }
//         }
//     }
//
//     client.search(body)
//         .then(resp => {
//             // let result = getSubtitles(resp.hits.hits, req.query.searchQuery || req.query.subtitles)
//             res.send({data: resp.hits.hits, totalHits: resp.hits.total.value})
//         })
//         .catch(err => {
//             res.status(err.meta.statusCode).send(err);
//         })
// })

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
                match_all: {}
            }
        } else {
            query = {
                bool: {
                    should: [
                        {
                            match_phrase: {
                                "metadata.showName": escapeSpecialChars(req.query.searchQuery)
                            }
                        },
                        {
                            match_phrase: {
                                "metadata.title": escapeSpecialChars(req.query.searchQuery)
                            }
                        },
                        {
                            match_phrase: {
                                "metadata.description": escapeSpecialChars(req.query.searchQuery)
                            }
                        },
                        {
                            nested: {
                                path: "subtitles",
                                query: {
                                    match_phrase: {
                                        "subtitles.text": escapeSpecialChars(req.query.searchQuery)
                                    }
                                }
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
                    ...req.query.showName ? [{
                        match_phrase: {
                            "metadata.showName": escapeSpecialChars(req.query.showName)
                        }
                    }] : [],
                    ...req.query.title ? [{
                        match_phrase: {
                            "metadata.title": escapeSpecialChars(req.query.title)
                        }
                    }] : [],
                    ...req.query.description ? [{
                        match_phrase: {
                            "metadata.description": escapeSpecialChars(req.query.description)
                        }
                    }] : [],
                    ...req.query.subtitles ? [{
                        nested: {
                            path: "subtitles",
                            query: {
                                match_phrase: {
                                    "subtitles.text": escapeSpecialChars(req.query.subtitles)
                                }
                            }
                        }
                    }] : []
                ]
            }
        }
    }

    let body = {
        index: 'rtv-oddaje-nested-standard',     //oddaje-nested | tv-oddaje
        query: query,
        highlight: {
            fields: {
                ...((req.query.searchQuery && req.query.searchQuery !== '') || req.query.subtitles) ? {"subtitles.text": {}} : {}
            }
        },
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
            if ((req.query.searchQuery && req.query.searchQuery !== '') || (req.query.subtitles && req.query.subtitles !== ''))
                for (const entry of resp.hits.hits) {
                    await getSubtitles(entry._source.metadata.id, req.query.searchQuery || req.query.subtitles).then(val => {
                        let tmp = entry
                        tmp._source.matchedSubtitles = val
                        result.push(tmp)
                    })
                }
            else
                result = resp.hits.hits
            res.send({data: result, totalHits: resp.hits.total.value})
        })
        .catch(err => {
            res.status(err.meta?.statusCode || 400).send(err);
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
                {
                    match_phrase: {
                        "text": escapeSpecialChars(text)
                    }
                }
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
                    order: "asc"
                }
            }
        ]
    }

    const respQueue = []
    let subtitles = []
    try {
        const resp = await client.search(body)
        if (resp.hits.total.value <= 500)
            return resp.hits.hits
        respQueue.push(resp)

        while (respQueue.length) {
            const body = respQueue.shift()

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
        return subtitles
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