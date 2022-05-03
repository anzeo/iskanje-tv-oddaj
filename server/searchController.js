import {app, client, router} from "./server.js";

router.get('/search', (req, res) => {

    // if (!Object.prototype.hasOwnProperty.call(req.query, 'searchQuery')) {
    //     throw new Error("Missing field searchQuery")
    // }

    console.log(req.query)
    let query;
    if (req.query.searchQuery) {    // || req.query.searchQuery === ''
        query = {
            bool: {
                should: [
                    {
                        "regexp": {
                            "metadata.title": {
                                value: `.*${escapeSpecialChars(req.query.searchQuery)}.*`,
                                flags: "ALL",
                                case_insensitive: true,
                                max_determinized_states: 10000
                            }
                        }
                    },
                    {
                        "regexp": {
                            "metadata.subtitle": {
                                value: `.*${escapeSpecialChars(req.query.searchQuery)}.*`,
                                flags: "ALL",
                                case_insensitive: true,
                                max_determinized_states: 10000
                            }
                        }
                    },
                    {
                        "regexp": {
                            "metadata.description": {
                                value: `.*${escapeSpecialChars(req.query.searchQuery)}.*`,
                                flags: "ALL",
                                case_insensitive: true,
                                max_determinized_states: 10000
                            }
                        }
                    },
                    {
                        nested: {
                            path: "speech",
                            inner_hits: {},
                            query: {
                                "regexp": {
                                    "speech.text": {
                                        value: `.*${escapeSpecialChars(req.query.searchQuery)}.*`,
                                        flags: "ALL",
                                        case_insensitive: true,
                                        max_determinized_states: 10000
                                    }
                                }
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
                    ...req.query.title ? [{
                        "regexp": {
                            "metadata.title": {
                                value: `.*${escapeSpecialChars(req.query.title)}.*`,
                                flags: "ALL",
                                case_insensitive: true,
                                max_determinized_states: 10000
                            }
                        }
                    }] : [],
                    ...req.query.subtitle ? [{
                        "regexp": {
                            "metadata.subtitle": {
                                value: `.*${escapeSpecialChars(req.query.subtitle)}.*`,
                                flags: "ALL",
                                case_insensitive: true,
                                max_determinized_states: 10000
                            }
                        }
                    }] : [],
                    ...req.query.description ? [{
                        "regexp": {
                            "metadata.description": {
                                value: `.*${escapeSpecialChars(req.query.description)}.*`,
                                flags: "ALL",
                                case_insensitive: true,
                                max_determinized_states: 10000
                            }
                        }
                    }] : [],
                    ...req.query.text ? [{
                        nested: {
                            path: "speech",
                            inner_hits: {},
                            query: {
                                "regexp": {
                                    "speech.text": {
                                        value: `.*${escapeSpecialChars(req.query.text)}.*`,
                                        flags: "ALL",
                                        case_insensitive: true,
                                        max_determinized_states: 10000
                                    }
                                }
                            }
                        }
                    }] : []
                ]
            }
        }
    }

    let body = {
        size: 30,
        from: 0,
        index: 'oddaje-nested',
        query: query
    }

    client.search(body)
        .then(resp => {
            res.send({data: resp.hits.hits})
        })
        .catch(err => {
            res.status(err.meta.statusCode).send(err);
        })
})

const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

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