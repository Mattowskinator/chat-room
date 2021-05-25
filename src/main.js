class ChatRoom {
  constructor() {
  }
  static initialize(connection, container) {
    connection.addMessageCallback('*', function(message) {
      switch (message.type) {
        // playerio user join message
        case 'Join': {
            let user = message.getString(1);
            console.log(user + ' joined');
            if (ChatRoom.users.size == 0) {
              ChatRoom.self = user;
            }
            ChatRoom.users.set(user, {});
          }
          break;
        // playerio user left message
        case 'Left':
          break;
        // custom user left message
        case 'user-left': {
            let user = message.getString(0);
            ChatRoom.users.delete(user);
            console.log(user + ' left');
          }
          break;
        case 'chat': {
            let user = message.getString(0);
            let chatMsg = message.getString(1);
            console.log('[' + user + ']: ' + chatMsg);
            ChatRoom.receiveCallback(user, chatMsg);
          }
          break;
        default:
      }
    });

    connection.addDisconnectCallback(function() {
      console.log("disconnected from room");
    });

    this.connection = connection;
    this.container = container;

    this.users = new Map();
    this.self;

    this.sendMessage = function(chatMsg) {
      this.connection.send('chat', this.self, chatMsg);
    }
    this.disconnect = function() {
      this.connection.send('user-left', this.self);
      this.connection.disconnect();
      this.connection = undefined;
      this.users.clear();
    }

    this.createElement = function(user, msg) {
      let msgdiv = document.createElement('p');
      msgdiv.classList.add('chat-message');
      msgdiv.innerHTML = "<b>" + user + ":</b> " + msg;
      return msgdiv;
    }
    this.appendElement = function(elm) {
      this.container.appendChild(elm);
      this.container.scrollTop = this.container.scrollHeight;
    }

    this.receiveCallback;
    this.setReceiveCallback = function(callback) {
      this.receiveCallback = callback;
    }
  }
}

// ref https://playerio.com/documentation/
function main() {
  console.log("PlayerIO Chat");
}

function authenticate(userId, roomId, callback = undefined) {
  PlayerIO.useSecureApiRequests = true;
  console.log("authenticating");
  PlayerIO.authenticate(
    // game id
    "game-nupr3ebrhkuegwft3a2xog",
     // connection id i.e. "public"
    "public",
    // authentication arguments
    {
      userId: userId,
    },
    // player insight
    undefined,
    // success callback
    function(client) {
      console.log("connection success");
      authenticateSuccess(client, userId, roomId, callback);
    },
    // error callback
    function(err) {
      console.error("connection failed");
    }
  );
}

function authenticateSuccess(client, userId, roomId, callback) {
  client.multiplayer.useSecureConnections = true;
  console.log("creating/joining room");
  client.multiplayer.createJoinRoom(
    // room id
    roomId,
    // room type i.e. "bounce"
    "bounce",
    // visible
    true,
    // room data
    {

    },
    // join data
    {

    },
    // success callback
    function(connection) {
      console.log("created/joined room");
      ChatRoom.initialize(connection, document.querySelector('#chat-log'));
      ChatRoom.setReceiveCallback(function(user, msg) {
        let newElm = ChatRoom.createElement(user, msg);
        ChatRoom.appendElement(newElm);
      });
      if (callback) {
        callback.call(this, userId, roomId);
      }
    },
    // error callback
    function(err) {
      console.error("failed to create/join room");
    }
  );
}
