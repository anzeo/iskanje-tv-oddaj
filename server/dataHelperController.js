import {app, client, router} from "./server.js";

router.delete('/duplicateSubtitles', (req, res) => {
    if (!Object.prototype.hasOwnProperty.call(req.query, 'existing_ids')) {
        return res.status(400).send("Missing field existing_ids")
    }

    let existing_ids = req.query.existing_ids
    if (!Array.isArray(existing_ids))
        return res.status(400).send("Field existing_ids should be an array")

    let body = {
        query: {
            terms: {
                id: existing_ids
            }
        }
    }

    client.deleteByQuery({
        index: 'rtv-oddaje-podnapisi-standard',
        body
    }).then(resp => {
        res.status(200).send(resp)
    }).catch(err => {
        console.error(err)
        res.status(500).send(err);
    })
})

router.delete('/duplicateSpeech', (req, res) => {
    if (!Object.prototype.hasOwnProperty.call(req.query, 'existing_ids')) {
        return res.status(400).send("Missing field existing_ids")
    }

    let existing_ids = req.query.existing_ids
    if (!Array.isArray(existing_ids))
        return res.status(400).send("Field existing_ids should be an array")

    let body = {
        query: {
            terms: {
                id: existing_ids
            }
        }
    }

    client.deleteByQuery({
        index: 'rtv-oddaje-govor-standard',
        body
    }).then(resp => {
        res.status(200).send(resp)
    }).catch(err => {
        console.error(err)
        res.status(500).send(err);
    })
})


export {router}