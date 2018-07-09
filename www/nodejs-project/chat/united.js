'use strict'
/* eslint-disable no-console */

const PeerId = require('peer-id');
const PeerInfo = require('peer-info');
const Node = require('./libp2p-bundle.js');
const pull = require('pull-stream');
const Pushable = require('pull-pushable');
const p = Pushable();

const fs = require("fs");
// const cordova = require('cordova-bridge');

// const msg_send_event='send_msg';

// cordova.channel.on(msg_send_event, (msg) => {
//     cordova.channel.post(msg_send_event, "got msg: "+msg);
// });
// const path_to_id="./peer-id.json";
//
// if (!fs.existsSync(path_to_id)) {
//     PeerId.create({ bits: 1024 }, (err, id) => {
//         if (err) { throw err }
//         let id_file = fs.writeFileSync(path_to_id, JSON.stringify(id.toJSON(), null, 2));
//         console.log(id_file)
//     });
// }

const chat_protocol='/chat/1.0.0';

PeerId.createFromJSON(require('./peer-id-dialer'), (err, idListener) => {
    if (err) {
        throw err
    }
    const peerListener = new PeerInfo(idListener);
    peerListener.multiaddrs.add('/ip4/0.0.0.0/tcp/10332');
    const nodeListener = new Node({
        peerInfo: peerListener
    });

    nodeListener.start((err) => {
        if (err) {
            //throw err
            console.log(err);
        }

        nodeListener.on('peer:disconnect', (peerInfo) => {
            console.log("disconnect: "+peerInfo.id.toB58String());
        });

        nodeListener.handle(chat_protocol, (protocol, conn) => {
            pull(
                p,
                conn
            );

            // catchError(pull(
            //     conn,
            //     pull.map((data) => {
            //         let ddtt=data.toString('utf8');
            //         console.log("received message on chat: "+ddtt);
            //         //cordova.channel.post(msg_send_event, ddtt);
            //         return ddtt.replace('\n', '')
            //     }),
            //     pull.drain(console.log)
            // ));

            pull(
                //conn,
                pull.map((v) => v.toString()),
                // pull.log()
            )

            // pull(
            //     conn,
            //     pull.map((data) => {
            //         let ddtt=data.toString('utf8');
            //         console.log("received message on chat: "+ddtt);
            //         //cordova.channel.post(msg_send_event, ddtt);
            //         return ddtt.replace('\n', '')
            //     }),
            //     pull.drain(console.log)
            // );

            process.stdin.setEncoding('utf8');
            process.openStdin().on('data', (chunk) => {
                let data = chunk.toString();
                p.push(data)
            })
        });

        nodeListener.pubsub.subscribe('news', (msg) => {
            console.log(msg.from, msg.data.toString());
            try {
                let data = JSON.parse(msg.data.toString());
                //cordova.channel.post(data["type"], data["data"]);
                console.log(data);
            } catch (e) {
                console.log(e);
            }
        }, () => {});

        nodeListener.dial('/ip4/127.0.0.1/tcp/10333/ipfs/QmYcuVrDn76jLz62zAQDmfttX9oSFH1cGXSH9rdisbHoGP', (err, conn) => {
            if (err) {
                throw err
            }
        });



        console.log('Listener ready, listening on:');
        peerListener.multiaddrs.forEach((ma) => {
            console.log(ma.toString() + '/ipfs/' + idListener.toB58String())
        });
    });
});
