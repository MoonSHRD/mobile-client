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

const msg_send_event='send_msg';
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
            cordova.channel.post(msg_send_event, peerInfo.id.toB58String());
        });

        nodeListener.handle('/chat/1.0.0', (protocol, conn) => {
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

        // nodeListener.handle('/main-node/1.0.0', (protocol, conn) => {
        //     pull(
        //         p,
        //         conn
        //     );
        //
        //     pull(
        //         conn,
        //         pull.map((data) => {
        //             let ddtt=data.toString('utf8');
        //             console.log("received message on main-node: "+ddtt);
        //             cordova.channel.post(msg_send_event, ddtt);
        //             return ddtt.replace('\n', '')
        //         }),
        //         pull.drain(console.log)
        //     );
        // });

        //console.log('Listener ready, listening on:');

        // peerListener.multiaddrs.forEach((ma) => {
        //     console.log(ma.toString() + '/ipfs/' + idListener.toB58String())
        // });


        nodeListener.dialProtocol('/ip4/'+mainNodeIp+'/tcp/10333/ipfs/'+mainNodeId, '/main-node/1.0.0', (err, conn) => {
            if (err) {
                throw err
            }

            console.log('nodeA dialed to main-node');

            // cordova.channel.on(msg_send_event, (msg) => {
            //     p.push(msg)
            // });

            // Write operation. Data sent as a buffer
            pull(
                p,
                conn
            );
            // Sink, data converted from buffer to utf8 string
            pull(
                conn,
                pull.map((data) => {
                    console.log("received peers list from Main Node");
                    let ddtt=data.toString('utf8');

                    try {
                        let normal_data=JSON.parse(ddtt);
                        cordova.channel.post(normal_data["type"], JSON.stringify(normal_data["data"]));
                        console.log("sent peers list to client side");
                    } catch (e) {
                        console.log(e);
                    }
                    return ddtt;
                }),
                pull.drain(console.log)
            );
        });

        console.log('Listener ready, listening on:');
        cordova.channel.post(msg_send_event, "Listener ready");
    })
});








//main node dealer
// async.parallel([
//     (callback) => {
//         PeerId.createFromJSON(require('./chat/peer-id-dialer'), (err, idDialer) => {
//             if (err) {
//                 throw err
//             }
//             callback(null, idDialer)
//         })
//     },
//     (callback) => {
//         PeerId.createFromJSON(require('./chat/peer-id-listener'), (err, idListener) => {
//             if (err) {
//                 throw err
//             }
//             callback(null, idListener)
//         })
//     }
// ], (err, ids) => {
//     if (err) throw err;
//     const peerDialer = new PeerInfo(ids[0]);
//     peerDialer.multiaddrs.add('/ip4/0.0.0.0/tcp/0');
//     const nodeDialer = new Node({
//         peerInfo: peerDialer
//     });
//
//     const peerListener = new PeerInfo(ids[1]);
//     idListener = ids[1];
//     peerListener.multiaddrs.add('/ip4/192.168.1.12/tcp/10333');
//     nodeDialer.start((err) => {
//         if (err) {
//             throw err
//         }
//
//         nodeDialer.dialProtocol(peerListener, '/chat/1.0.0', (err, conn) => {
//             if (err) {
//                 throw err
//             }
//
//             cordova.channel.on(msg_send_event, (msg) => {
//                 p.push(msg)
//             });
//
//             // Write operation. Data sent as a buffer
//             pull(
//                 p,
//                 conn
//             );
//             // Sink, data converted from buffer to utf8 string
//             pull(
//                 conn,
//                 pull.map((data) => {
//                     let ddtt=data.toString('utf8');
//                     try {
//                         let normal_data=JSON.parse(ddtt);
//                         cordova.channel.post(normal_data["type"], normal_data["data"]);
//                     } catch (e) {
//                         console.log(e)
//                     }
//                     return ddtt
//                 }),
//                 pull.drain(console.log)
//             );
//         })
//     })
// });
















// function dial_peer(peer_id) {
//
// }
//
// //dialer
// async.parallel([
//     (callback) => {
//         PeerId.createFromJSON(require('./chat/peer-id-dialer'), (err, idDialer) => {
//             if (err) {
//                 throw err
//             }
//             callback(null, idDialer)
//         })
//     },
//     (callback) => {
//         PeerId.createFromJSON(require('./chat/peer-id-listener'), (err, idListener) => {
//             if (err) {
//                 throw err
//             }
//             callback(null, idListener)
//         })
//     }
// ], (err, ids) => {
//     if (err) throw err;
//     const peerDialer = new PeerInfo(ids[0]);
//     peerDialer.multiaddrs.add('/ip4/0.0.0.0/tcp/0');
//     const nodeDialer = new Node({
//         peerInfo: peerDialer
//     });
//
//     const peerListener = new PeerInfo(ids[1]);
//     idListener = ids[1];
//     peerListener.multiaddrs.add('/ip4/192.168.1.11/tcp/10333') //192.168.1.11
//     //peerListener.multiaddrs.add('/ip4/127.0.0.1/tcp/10333'); //192.168.1.11
//     nodeDialer.start((err) => {
//         if (err) {
//             throw err
//         }
//
//         console.log('Dialer ready, listening on:');
//
//         peerListener.multiaddrs.forEach((ma) => {
//             console.log(ma.toString() + '/ipfs/' + idListener.toB58String())
//         });
//
//         nodeDialer.dialProtocol(peerListener, '/chat/1.0.0', (err, conn) => {
//             if (err) {
//                 throw err
//             }
//             console.log('nodeA dialed to nodeB on protocol: /chat/1.0.0');
//             console.log('Type a message and see what happens');
//
//             cordova.channel.on(msg_send_event, (msg) => {
//                 p.push(msg)
//             });
//
//             // Write operation. Data sent as a buffer
//             pull(
//                 p,
//                 conn
//             );
//             // Sink, data converted from buffer to utf8 string
//             pull(
//                 conn,
//                 pull.map((data) => {
//                     let ddtt=data.toString('utf8');
//                     cordova.channel.post(msg_send_event, ddtt);
//                     return ddtt.replace('\n', '')
//                 }),
//                 pull.drain(console.log)
//             );
//         })
//     })
// });