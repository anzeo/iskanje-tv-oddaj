import {app, client, router} from "./server.js";
import bodyParser from "body-parser";

router.use(bodyParser.json({limit: '10mb', extended: false}))

// klic za brisanje vseh podnapisov, ki že obstajajo
router.post('/duplicateSubtitles', (req, res) => {
    if (!Object.prototype.hasOwnProperty.call(req.body, 'existing_ids')) {
        return res.status(400).send("Missing field existing_ids")
    }

    let existing_ids = req.body.existing_ids
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
        body,
        refresh: true
    }).then(resp => {
        res.status(200).send(resp)
    }).catch(err => {
        console.error(err)
        res.status(500).send(err);
    })
})

// klic za brisanje vsega govora, ki že obstaja
router.post('/duplicateSpeech', (req, res) => {
    if (!Object.prototype.hasOwnProperty.call(req.body, 'existing_ids')) {
        return res.status(400).send("Missing field existing_ids")
    }

    let existing_ids = req.body.existing_ids
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
        body,
        refresh: true
    }).then(resp => {
        res.status(200).send(resp)
    }).catch(err => {
        console.error(err)
        res.status(500).send(err);
    })
})


export {router}