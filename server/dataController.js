import {app, client, router} from "./server.js";
import axios from "axios";

const client_id = '82013fb3a531d5414f478747c1aca622'

router.get("/media/video/:id", (req, res) => {
    if (!req.params)
        return res.status(400).send("Missing parameters")
    if (!req.params.id)
        return res.status(400).send("Missing parameter id")
    console.log(req.params.id)

    axios.get('https://api.rtvslo.si/ava/getRecordingDrm/' + req.params.id, {params: {'client_id': client_id}})
        .then(resp => {
            let video_meta = resp.data.response;
            if (video_meta && video_meta.jwt) {
                axios.get('https://api.rtvslo.si/ava/getMedia/' + req.params.id, {params: {'client_id': client_id, 'jwt': video_meta.jwt}})
                    .then(resp1 => {
                        return res.send(resp1.data)
                    })
                    .catch(err1 => {
                        console.error(err1)
                        return res.status(400).send(err1.response?.message)
                    })

            } else{
                return res.status(resp.data.error?.status || 500).send(resp.data.error?.message || 'jwt field was missing in response')
            }
        })
        .catch(err => {
            console.error(err)
            return res.send(err)
        })
})


export {router}