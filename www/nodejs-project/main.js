// Require the 'cordova-bridge' to enable communications between the
// Node.js app and the Cordova app.
// const cordova = require('cordova-bridge');
//
// let msg_send_event='send_msg';
// // Send a message to Cordova.
// cordova.channel.send('main.js loaded');
//
// // Post an event to Cordova.
// cordova.channel.post('started');
//
// // Post an event with a message.
// cordova.channel.post('started', 'main.js loaded');
// cordova.channel.post(msg_send_event, 'chat init');
//
// // A sample object to show how the channel supports generic
// // JavaScript objects.
// class Reply {
//   constructor(replyMsg, originalMsg) {
//     this.reply = replyMsg;
//     this.original = originalMsg;
//   }
// }
//
// // Listen to messages from Cordova.
// cordova.channel.on('message', (msg) => {
//   console.log('[node] MESSAGE received: "%s"', msg);
//   // Reply sending a user defined object.
//   cordova.channel.send(new Reply('Message received!', msg));
// });
//
// // Listen to event 'myevent' from Cordova.
// cordova.channel.on('myevent', (msg) => {
//   console.log('[node] MYEVENT received with message: "%s"', msg);
// });
//
// // Handle the 'pause' and 'resume' events.
// // These are events raised automatically when the app switched to the
// // background/foreground.
// cordova.app.on('pause', (pauseLock) => {
//   console.log('[node] app paused.');
//   pauseLock.release();
// });
//
// cordova.app.on('resume', () => {
//   console.log('[node] app resumed.');
//   cordova.channel.post('engine', 'resumed');
// });
//
//
//
// cordova.channel.on(msg_send_event, (msg) => {
//   cordova.channel.post(msg_send_event, "got msg: "+msg);
// });

'use strict';
/* eslint-disable no-console */

const PeerId = require('peer-id');
const PeerInfo = require('peer-info');
const Node = require('./chat/libp2p-bundle.js');
const pull = require('pull-stream');
const Pushable = require('pull-pushable');
const p = Pushable();
const cordova = require('cordova-bridge');
const async = require('async');
let idListener;

const chat_protocol='/chat/1.0.0';
const msg_send_event='send_msg';
const system_event='system_event';
const mainNodeId='QmYcuVrDn76jLz62zAQDmfttX9oSFH1cGXSH9rdisbHoGP';
const mainNodeIp='192.168.1.12';

const fs = require("fs");
const path_to_id="./peer-id";
const path_to_id_json=path_to_id+".json";



// if (!fs.existsSync(path_to_id_json)) {
//     PeerId.create({ bits: 1024 }, (err, id) => {
//         if (err) { throw err }
//         let id_file = fs.writeFileSync(path_to_id_json, JSON.stringify(id.toJSON(), null, 2));
//         console.log(id_file)
//     });
// }

// cordova.channel.on(msg_send_event, (msg) => {
//     cordova.channel.post(msg_send_event, msg);
// });

PeerId.createFromJSON(require(path_to_id), (err, idListener) => {
    if (err) {
        throw err
    }
    const peerListener = new PeerInfo(idListener);
    const my_id=peerListener.id.toB58String();
    peerListener.multiaddrs.add('/ip4/0.0.0.0/tcp/10333');
    const nodeListener = new Node({
        peerInfo: peerListener
    });

    nodeListener.start((err) => {
        if (err) {
            throw err
        }

        nodeListener.on('peer:connect', (peerInfo) => {
            console.log("connected to: "+peerInfo.id.toB58String());
            cordova.channel.post(system_event, ("connected to: "+peerInfo.id.toB58String()));
        });

        nodeListener.handle(chat_protocol, (protocol, conn) => {
            pull(
                p,
                conn
            );

            pull(
                conn,
                pull.map((data) => {
                    let ddtt=data.toString('utf8');
                    console.log("received message on chat: "+ddtt);
                    cordova.channel.post(msg_send_event, ddtt);
                    return ddtt.replace('\n', '')
                }),
                pull.drain(console.log)
            );
        });

        nodeListener.pubsub.subscribe('news', (msg) => {
            console.log(msg.from, msg.data.toString());
            try {
                let data = JSON.parse(msg.data.toString());
                delete data["data"][my_id];
                cordova.channel.post(data["type"], data["data"]);
                console.log(data);
            } catch (e) {
                console.log(e);
            }
        }, () => {});

        nodeListener.dial('/ip4/'+mainNodeIp+'/tcp/10333/ipfs/'+mainNodeId, (err, conn) => {
            if (err) {
                throw err
            }
        });

        cordova.channel.on(system_event, (event) => {
            console.log("received system event");
            console.log(event);
            if (typeof event === "object"){
                if (event.type === "dial_peer") {
                    console.log("trying to connect to peer");
                    connect_peer(event.addr)
                }
            }
        });

        function connect_peer(addr){
            nodeListener.dialProtocol(addr, chat_protocol, (err, conn) => {
                if (err) {
                    throw err
                }

                pull(
                    p,
                    conn
                );

                pull(
                    conn,
                    pull.map((data) => {
                        let ddtt=data.toString('utf8');
                        console.log("received message on chat: "+ddtt);
                        cordova.channel.post(msg_send_event, ddtt);
                        return ddtt.replace('\n', '')
                    }),
                    pull.drain(console.log)
                );

                cordova.channel.on(msg_send_event, (msg) => {
                    p.push(msg)
                });


                cordova.channel.post(msg_send_event, "connected to peer");
                console.log("connected to peer");
            });
        }

        console.log('Listener ready, listening');
        cordova.channel.post(system_event, "Listener ready");
    })
});