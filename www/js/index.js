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

  // As an alternative to 'nodejs.channel.setListener', the 'nodejs.channel.on'
  // method can be used:
  // nodejs.channel.on('message', channelListener);

  // Start the Node.js for Mobile Apps engine, passing the main script filename
  // and a callback to receive the result of the startup process.
  nodejs.start('main.js', startupCallback);
  // To disable the stdout/stderr redirection to the Android logcat:
  // nodejs.start('main.js', startupCallback, { redirectOutputToLogcat: false });
}


$('#msg_send').click(function(e){
    e.preventDefault();
    let text=$('#msg_text'),
        msg=text.val();
    text.val('');
    //nodejs.channel.send(text);
    nodejs.channel.post(msg_send_event, msg);
});

function peersReceivedEvent(msg) {
    alert(msg);
    let container=$("peers_storager");
    container.empty();
    container.append("<a data-type='peer_connect' data-id='"+item+"'>"+item+"</a>")
    msg.forEach(function (item) {
        container.append("<a data-type='peer_connect' data-id='"+item+"'>"+item+"</a>")
    });
}


function msgSendEvent(msg) {
    if (msg) {

        if (typeof msg === 'string') {
            $('#msg_storager').append("<p>"+msg+"</p>")
        } else if (typeof msg === 'object') {
            // Add your own logic there
        } else {
            console.log('[cordova] "unexpected object type: ' + typeof msg);
        }
    } else {
        console.log('[cordova] "STARTED" event received from Node');
    }
}