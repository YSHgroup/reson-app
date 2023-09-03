const express = require('express');
const { Server } = require('socket.io');
const https = require('https');
const fs = require('fs');
const cors = require('cors');
const {connectToDatabase} = require('../lib/connectToDatabase');
const { clientele, message, cons } = require('pos/lexicon');
const { ObjectId } = require('mongodb');
const http = require('http');


const app = express();
app.use(cors());

const devmode = true;
let server, io;
let sockets = {};
let sockets_notify = {};
let dashboard_notify = {};
// let socketsForGroup = {};
// let busyStatus = {};
if (devmode) {
  server = http.createServer(app)
  io = new Server(server, {
    cors: {
      origin: "http://localhost:3000"
    }
  })
} else {
  server = https.createServer({
    cert: fs.readFileSync('../cert.pem'),
    key: fs.readFileSync('../privkey.pem'),
  }, app);
  
  io = new Server(server, {
    cors: {
        origin: "https://reson.app", // Replace this with your Next.js app URL
        methods: ["GET", "POST"],
      },
  });
}


let client;
(async () => {
	client = await connectToDatabase();
})();

console.log(client)
const messagesCollection = () => client.db().collection('messages');
io.on('connection', (socket) => {
  socket.emit("getid", socket.id);

  socket.on('disconnect', () => {
    for (const [email, socketId] of Object.entries(sockets)) {
      if (socketId == socket.id){
        delete sockets[email];
        return;
      }
    }
    for (const [email, socketId] of Object.entries(sockets_notify)) {
      if (socketId == socket.id){
        delete sockets_notify[email];
        return;
      }
    }
    for (const [email, socketId] of Object.entries(dashboard_notify)) {
      if (socketId == socket.id){
        delete dashboard_notify[email];
        break;
      }
    }
  });

  // Sockets' events for notification
  socket.on('register_notificationSocket', (data) => {
    sockets_notify[data.email] = socket.id;
  })

  socket.on('dashboard_notification', (data) => {
    dashboard_notify[data.email] = socket.id;
  })

  // Socket's events for text and voice chat
  socket.on('emailMapId', ({email}) => {
    sockets[email] = socket.id;
    socket['email'] = email;
    console.log(`${email} is connected as socket ${sockets[email]}`);
  })

  // socket.on('getMessages', async (message) => {
  //   const { to, author } = message;
  //   const messages = await(await messagesCollection()).find({
  //     $or:[
  //       {author:author, to:to},
  //       {author:to, to:author},
  //     ],}).toArray();
  //   socket.emit('messages', messages);
  // });

  socket.on('readMessage', async (message) => {
    const messageId = new ObjectId(message._id);
    const updateMessage = await(await messagesCollection()).updateOne(
      { _id: messageId },
      { $set: { read: true } }
    )
  })

  socket.on('sendMessage', async (message) => {
    await(await messagesCollection()).insertOne(message);
    socket.emit('newMessage', message);
    // console.log(sockets[message.to])
    io.to(sockets[message.to]).emit('newMessage', message);
    io.to(sockets_notify[message.to]).emit('newUnreadMsg');
    io.to(dashboard_notify[message.to]).emit('newChat');
  });

  socket.on('reactEmoji', ({msgId, emojiId, to}) => {
    // console.log(msgId, emojiId, to)
    io.to(sockets[to]).emit('newReactEmoji', {msgId, emojiId});
  });

  socket.on('callUser', async (data) => {
    // socket.to(data.to).emit('callUser', { signal: data.signal, from: socket.id });
    io.to(sockets[data.to]).emit('callingMe', { signal: data.signal, from: data.from, to: data.to });
  });

  socket.on('acceptCall', async (data) => {
    // socket.to(data.to).emit('acceptCall', { signal: data.signal });
    io.to(sockets[data.to]).emit('acceptCall', { signal: data.signal, from: data.from, to: data.to });
  });

  socket.on('Iambusy', (data) => {
    io.to(sockets[data.to]).emit('busy', {from: data.from, to: data.to});
  });

  socket.on('destroyP2P', async (data) => {
    io.to(sockets[data.to]).emit('destroyP2P', {from: data.from})
  });

  socket.on('missedCall', (data) => {
    io.to(sockets_notify[data.to]).emit('newUnreadMsg');
    io.to(dashboard_notify[data.to]).emit('newChat');
  })

});

const gchat = io.of('/groupchat');
gchat.on('connection', (socket) => {

  socket.on('identity_group', (data) => {
    socket.join(`room-${data.groupId}`);
    console.log(`${socket.id} connected in ${data.groupId}`)
    gchat.to(`room-${data.groupId}`).emit('connectToRoom', {email: data.email, name: data.name});
  });

  socket.on("disconnecting", () => {
    socket.leave(`room-${socket.rooms}`)
  });

  socket.on("disconnect", () => {
    socket.leave(`room-${socket.rooms}`)
  });

  socket.on("sendMessageFirst", (data) => {
    console.log(data);
    gchat.to(`room-${data.groupId}`).emit('newMessageFirst', data);
  });

  socket.on('sendMessage', (data) => {
    const { message, groupInfo } = data;
    console.log(message.groupId);
    gchat.to(`room-${message.groupId}`).emit('newMessage', message);
    for (let i = 0; i < groupInfo.members.length; i ++) {
      io.to(sockets_notify[groupInfo.members[i]]).emit('newUnreadGroupChat');
      io.to(dashboard_notify[groupInfo.members[i]]).emit('newChat');
    }
  });

  socket.on('reactEmojiGroup', (data) => {
    const { msgId, groupInfo } = data;
    gchat.to(`room-${groupInfo._id}`).emit('newReactEmoji', {msgId, emojiId});
  });

})

server.listen(4000, () => {
  console.log(`server is running.`)
});