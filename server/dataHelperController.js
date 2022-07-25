import {app, client, router} from "./server.js";
import bodyParser from "body-parser";

router.use(bodyParser.json({limit: '10mb', extended: false}))

// klic za brisanje vseh podnapisov, ki že obstajajo
router.post('/duplicateSubtitles', async (req, res) => {
    if (!Object.prototype.hasOwnProperty.call(req.body, 'existing_ids')) {
        return res.status(400).send("Missing field existing_ids")
    }

    let existing_ids = req.body.existing_ids
    if (!Array.isArray(existing_ids))
        return res.status(400).send("Field existing_ids should be an array")

    await client.indices.refresh({index: 'rtv-oddaje-podnapisi-standard'})

    try {
        let resps = []
        while (existing_ids.length) {
            let sub_array = existing_ids.splice(0, 1000)
            let body = {
                query: {
                    terms: {
                        id: sub_array
                    }
                }
            }
            await client.deleteByQuery({
                index: 'rtv-oddaje-podnapisi-standard',
                body,
                conflicts: "proceed",
                refresh: true,
                slices: "auto",
                timeout: "10h"
            }).then(resp => {
                resps.push(resp)
            })
        }
        res.status(200).send(resps)
    } catch (e) {
        console.error(e, new Date())
        res.status(500).send(e);
    }
    // await client.deleteByQuery({
    //     index: 'rtv-oddaje-podnapisi-standard',
    //     body,
    //     conflicts: "proceed",
    //     refresh: true,
    //     slices: "auto",
    //     timeout: "10h"
    // }).then(resp => {
    //     console.log(resp, new Date())
    //     res.status(200).send(resp)
    // }).catch(err => {
    //     console.error(err, new Date())
    //     res.status(500).send(err);
    // })
})

// klic za brisanje vsega govora, ki že obstaja
router.post('/duplicateSpeech', async (req, res) => {
    if (!Object.prototype.hasOwnProperty.call(req.body, 'existing_ids')) {
        return res.status(400).send("Missing field existing_ids")
    }

    let existing_ids = req.body.existing_ids
    if (!Array.isArray(existing_ids))
        return res.status(400).send("Field existing_ids should be an array")

    await client.indices.refresh({index: 'rtv-oddaje-govor-standard'})

    try {
        let resps = []
        while (existing_ids.length) {
            let sub_array = existing_ids.splice(0, 1000)
            let body = {
                query: {
                    terms: {
                        id: sub_array
                    }
                }
            }
            await client.deleteByQuery({
                index: 'rtv-oddaje-govor-standard',
                body,
                conflicts: "proceed",
                refresh: true,
                slices: "auto",
                timeout: "10h"
            }).then(resp => {
                resps.push(resp)
            })
        }
        res.status(200).send(resps)
    } catch (e) {
        console.error(e, new Date())
        res.status(500).send(e);
    }

    // await client.deleteByQuery({
    //     index: 'rtv-oddaje-govor-standard',
    //     body,
    //     conflicts: "proceed",
    //     refresh: true,
    //     slices: "auto",
    //     timeout: "10h",
    // }).then(resp => {
    //     res.status(200).send(resp)
    // }).catch(err => {
    //     console.error(err)
    //     res.status(500).send(err);
    // })
})


export {router}