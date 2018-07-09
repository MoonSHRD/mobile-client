let app = {
  // Application Constructor
  initialize: function() {
      document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
  },

  // deviceready Event Handler
  //
  // Bind any cordova events here. Common events are:
  // 'pause', 'resume', etc.
  onDeviceReady: function() {
      this.receivedEvent('deviceready');
      startNodeProject();
  },

  // Update DOM on a Received Event
  receivedEvent: function(id) {
    let parentElement = document.getElementById(id);
    let listeningElement = parentElement.querySelector('.listening');
    let receivedElement = parentElement.querySelector('.received');

    listeningElement.setAttribute('style', 'display:none;');
    receivedElement.setAttribute('style', 'display:block;');

    console.log('Received Event: ' + id);
  }
};

app.initialize();

let msg_send_event='send_msg';
let peers_received_event='connected_peers_list';
let system_event='system_event';

// In this example the channel listener handles only two types of messages:
// - the 'Reply' object type that is defined in the www/nodejs-project/main.js
// - the string type
// But any other valid JavaScript type can be handled if desired.
function channelListener(msg) {
  if (typeof msg === 'string') {
    console.log('[cordova] MESSAGE from Node: "' + msg + '"');
  } else if (typeof msg === 'object') {
    console.log('[cordova] MESSAGE from Node: "' + msg.reply + '" - In reply to: "' + msg.original + '"');
  } else {
    console.log('[cordova] unexpected object type: ' + typeof msg);
  }
}

// Events listener
function startedEventistener(msg) {
  if (msg) {
    if (typeof msg === 'string') {
      console.log('[cordova] "STARTED" event received from Node with a message: "' + msg + '"');
    } else if (typeof msg === 'object') {
      // Add your own logic there
    } else {
      console.log('[cordova] "unexpected object type: ' + typeof msg);
    }
  } else {
    console.log('[cordova] "STARTED" event received from Node');
  }
}

// This is the callback passed to 'nodejs.start()' to be notified if the Node.js
// engine has started successfully.
function startupCallback(err) {
  if (err) {
    console.log(err);
  } else {
    console.log ('Node.js Mobile Engine started');
    // Send a message to the Node.js app. The reply from the Node.js app will be
    // processed by the message channel listener 'channelListener()`.
    nodejs.channel.send('Hello from Cordova!');

    // Send a sample event to the Node.js app.
    nodejs.channel.post('myevent', 'An event from Cordova');
  }
}

// The entry point to start the Node.js app.
function startNodeProject() {
  // Register the callbacks for the message channel and for the events channel
  // before starting the Node.js engine.
  nodejs.channel.setListener(channelListener);
  nodejs.channel.on('started', startedEventistener);
  nodejs.channel.on(msg_send_event, msgSendEvent);
  nodejs.channel.on(peers_received_event, peersReceivedEvent);
  nodejs.channel.on(system_event, receivedSystemEvent);

  // As an alternative to 'nodejs.channel.setListener', the 'nodejs.channel.on'
  // method can be used:
  // nodejs.channel.on('message', channelListener);

  // Start the Node.js for Mobile Apps engine, passing the main script filename
  // and a callback to receive the result of the startup process.
  nodejs.start('main.js', startupCallback);
  // To disable the stdout/stderr redirection to the Android logcat:
  // nodejs.start('main.js', startupCallback, { redirectOutputToLogcat: false });
}

let peers = $("#available_peers");
let msg_box = $("#msg_box");
let chat = $("#chat_box");
let loading = $("#loading");
let loading_text = $("#loading_text");
let app_part = $("#main_app_part");


function receivedSystemEvent(event){
    console.log(event);
    if (event==="Listener ready") {
        loading.fadeOut();
        app_part.fadeIn();
    }
}


$('#msg_send').click(function(e){
    e.preventDefault();
    let text=$('#msg_text'),
        msg=text.val();
    text.val('');
    add_message(msg);
    nodejs.channel.post(msg_send_event, msg);
});

function peersReceivedEvent(msg) {
    if (msg) {
        if (typeof msg === 'string') {
            //
        } else if (typeof msg === 'object') {
            let container=$("#peers_storager");
            container.empty();
            for (let id in msg) {
                container.append("<a data-type='peer_connect' data-id='"+id+"' data-addr='"+msg[id]+"'>"+id+"</a></br>")
            }
        } else {
            //
        }
    } else {
        console.log('empty msg instead of peers');
    }
}

$(document).on('click','[data-type=peer_connect]',function (e) {
    e.preventDefault();

    let id=$(this).attr('data-type');
    let addr=$(this).attr('data-addr');
    nodejs.channel.post(system_event, {"type":"dial_peer","id":id,"addr":addr});
});


function msgSendEvent(msg) {
    if (msg) {

        if (typeof msg === 'string') {
            add_message(msg);
        } else if (typeof msg === 'object') {
            // Add your own logic there
        } else {
            console.log('[cordova] "unexpected object type: ' + typeof msg);
        }
    } else {
        console.log('[cordova] "STARTED" event received from Node');
    }
}

function add_message(msg) {
    if (typeof msg === 'string') {
        $('#msg_storager').append("<p>"+msg+"</p>");
    } else if (typeof msg === 'object') {
        // Add your own logic there
    } else {
        console.log('unexpected object type: ' + typeof msg);
    }
}