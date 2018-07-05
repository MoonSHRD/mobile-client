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
const path_to_id="./peer-id.json";

if (!fs.existsSync(path_to_id)) {
    PeerId.create({ bits: 1024 }, (err, id) => {
        if (err) { throw err }
        let id_file = fs.writeFileSync(path_to_id, JSON.stringify(id.toJSON(), null, 2));
        console.log(id_file)
    });
}


// fs.writeFile("hello.txt", "Hello мир!", function(error){
//
//     if(error) throw error; // если возникла ошибка
//     console.log("Асинхронная запись файла завершена. Содержимое файла:");
//     var data = fs.readFileSync("hello.txt", "utf8");
//     console.log(data);  // выводим считанные данные
// });

PeerId.createFromJSON(require('./peer-id-listener'), (err, idListener) => {
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
            console.log(peerInfo.id.toB58String())
        });

        nodeListener.handle('/chat/1.0.0', (protocol, conn) => {
            pull(
                p,
                conn
            );

            // pull.map((data) => {
            //     let ddtt=data.toString('utf8');
            //     try {
            //         let normal_data=JSON.parse(ddtt);
            //         console.log(normal_data);
            //     } catch (e) {
            //         console.log(e);
            //     }
            //     //cordova.channel.post(normal_data["type"], normal_data["data"]);
            //     console.log(ddtt.replace('\n', ''))
            //     //return data.toString('utf8').replace('\n', '')
            // });

            // pull(
            //     conn,
            //     pull.map((data) => {
            //         let ddtt=data.toString('utf8');
            //         try {
            //             let normal_data=JSON.parse(ddtt);
            //             console.log(normal_data);
            //         } catch (e) {
            //             console.log(e);
            //         }
            //         //cordova.channel.post(normal_data["type"], normal_data["data"]);
            //         return ddtt.replace('\n', '')
            //         //return data.toString('utf8').replace('\n', '')
            //     }),
            //     pull.drain(console.log)

            try {
                pull(
                    conn,
                    pull.map((data) => {
                        let ddtt=data.toString('utf8');
                        try {
                            let normal_data=JSON.parse(ddtt);
                            console.log(normal_data);
                        } catch (e) {
                            console.log(e);
                        }
                        //cordova.channel.post(normal_data["type"], normal_data["data"]);
                        return ddtt.replace('\n', '')
                        //return data.toString('utf8').replace('\n', '')
                    }),
                    pull.drain(console.log)
                );
            } catch (e) {
                console.log(e)
            }


            process.stdin.setEncoding('utf8');
            process.openStdin().on('data', (chunk) => {
                let data = chunk.toString();
                // cordova.channel.post(msg_send_event, data);
                p.push(data)
            })
        });

        console.log('Listener ready, listening on:');
        peerListener.multiaddrs.forEach((ma) => {
            console.log(ma.toString() + '/ipfs/' + idListener.toB58String())
        })
    })
});
