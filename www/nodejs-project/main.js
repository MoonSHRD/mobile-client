'use strict';
/* eslint-disable no-console */

const Messenger = require ('./libs/core/messaging');
const cordova = require('cordova-bridge');

const chat_protocol = '/chat/1.0.0';
const main_node_channel = 'news';
const mainNodeId = 'QmYcuVrDn76jLz62zAQDmfttX9oSFH1cGXSH9rdisbHoGP';
const mainNodeIp = '192.168.1.12';
const mainNodeAddr = '/ip4/'+mainNodeIp+'/tcp/10333/ipfs/'+mainNodeId;

cordova.app.on('pause', (pauseLock) => {
    console.log('[node] app paused.');
    pauseLock.release();
});

cordova.app.on('resume', () => {
    console.log('[node] app resumed.');
    //cordova.channel.post('engine', 'resumed');
});

const config = {
    main_func: function (messenger) {

        messenger.handle(chat_protocol,(protocol, conn) => {
            console.log("start handling");
            messenger.read_msg((msg)=>{
                console.log("msg: " + msg);
                cordova.channel.post(msg_send_event, msg);
            },conn);
        });

        messenger.pubsub(main_node_channel,(data) => {
            console.log(data);
            cordova.channel.post(data["type"], data["data"]);
        });

        messenger.dial(mainNodeAddr,(conn)=>{});

        cordova.channel.on(system_event, (event) => {
            console.log("received system event");
            console.log(event);
            if (typeof event === "object"){
                if (event.type === "dial_peer") {
                    console.log("trying to connect to peer");
                    messenger.dial_protocol(addr,protocol,(conn)=>{
                        messenger.read_msg((msg)=>{
                            console.log("msg: " + msg);
                            cordova.channel.post(msg_send_event, msg);
                        },conn);

                        cordova.channel.on(msg_send_event, (msg) => {
                            messenger.send_msg(msg);
                        });
                    });
                }
            }
        });
    }
};

let messenger = new Messenger('./id');
messenger.node_start(config);