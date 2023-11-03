const express = require('express')
const { Server } = require('socket.io')
const https = require('https')
const fs = require('fs')
const cors = require('cors')
const { connectToDatabase } = require('../lib/connectToDatabase')
const { clientele, message, cons } = require('pos/lexicon')
const { ObjectId } = require('mongodb')
const http = require('http')

const app = express()
app.use(cors())

const devmode = true
let server, io
let sockets = {}
let sockets_notify = {}
let dashboard_notify = {}
// let socketsForGroup = {};
// let busyStatus = {};
if (devmode) {
  server = http.createServer(app)
  io = new Server(server, {
    cors: {
      origin: 'http://localhost:3000',
    },
  })
} else {
  server = https.createServer(
    {
      cert: fs.readFileSync('../cert.pem'),
      key: fs.readFileSync('../privkey.pem'),
    },
    app
  )

  io = new Server(server, {
    cors: {
      origin: 'https://reson.app', // Replace this with your Next.js app URL
      methods: ['GET', 'POST'],
    },
  })
}

let client
;(async () => {
  client = await connectToDatabase()
})()

console.log(client)
const messagesCollection = () => client.db().collection('messages')
io.on('connection', (socket) => {
  socket.emit('getid', socket.id)

  socket.on('disconnect', () => {
    for (const [email, socketId] of Object.entries(sockets)) {
      if (socketId == socket.id) {
        delete sockets[email]
        return
      }
    }
    for (const [email, socketId] of Object.entries(sockets_notify)) {
      if (socketId == socket.id) {
        delete sockets_notify[email]
        return
      }
    }
    for (const [email, socketId] of Object.entries(dashboard_notify)) {
      if (socketId == socket.id) {
        delete dashboard_notify[email]
        break
      }
    }
  })

  // Sockets' events for notification
  socket.on('register_notificationSocket', (data) => {
    sockets_notify[data.email] = socket.id
  })

  socket.on('dashboard_notification', (data) => {
    dashboard_notify[data.email] = socket.id
  })

  // Socket's events for text and voice chat
  socket.on('emailMapId', ({ email }) => {
    sockets[email] = socket.id
    socket['email'] = email
    // console.log(`${email} is connected as socket ${sockets[email]}`)
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
    const messageId = new ObjectId(message._id)
    const updateMessage = await (
      await messagesCollection()
    ).updateOne({ _id: messageId }, { $set: { read: true } })
  })

  socket.on('sendMessage', async (message) => {
    await (await messagesCollection()).insertOne(message)
    socket.emit('newMessage', message)
    // console.log(sockets[message.to])
    io.to(sockets[message.to]).emit('newMessage', message)
    io.to(sockets_notify[message.to]).emit('newUnreadMsg')
    io.to(dashboard_notify[message.to]).emit('newChat')
  })

  socket.on('reactEmoji', ({ msgId, emojiId, to }) => {
    // console.log(msgId, emojiId, to)
    io.to(sockets[to]).emit('newReactEmoji', { msgId, emojiId })
  })

  socket.on('callUser', async (data) => {
    console.log(sockets, 'callUser')
    // socket.to(data.to).emit('callUser', { signal: data.signal, from: socket.id });
    io.to(sockets[data.to]).emit('callingMe', {
      signal: data.signal,
      from: data.from,
      to: data.to,
    })
  })

  socket.on('acceptCall', async (data) => {
    console.log(sockets, 'acceptcall')
    // socket.to(data.to).emit('acceptCall', { signal: data.signal });
    io.to(sockets[data.to]).emit('acceptCall', {
      signal: data.signal,
      from: data.from,
      to: data.to,
    })
  })

  socket.on('Iambusy', (data) => {
    io.to(sockets[data.to]).emit('busy', { from: data.from, to: data.to })
  })

  socket.on('destroyP2P', async (data) => {
    io.to(sockets[data.to]).emit('destroyP2P', { from: data.from })
  })

  socket.on('missedCall', (data) => {
    io.to(sockets_notify[data.to]).emit('newUnreadMsg')
    io.to(dashboard_notify[data.to]).emit('newChat')
  })
})

// const chatCallSockets = {}
// let chatCallSockets_notify = {}
// const chatCall = io.of('/chatCall')
// chatCall.on('connection', (socket) => {
//   socket.emit('getid', socket.id)

//   socket.on('disconnect', () => {
//     for (const [email, socketId] of Object.entries(chatCallSockets)) {
//       if (socketId == socket.id) {
//         delete chatCallSockets[email]
//         return
//       }
//     }
//     for (const [email, socketId] of Object.entries(chatCallSockets_notify)) {
//       if (socketId == socket.id) {
//         delete chatCallSockets_notify[email]
//         return
//       }
//     }
//     for (const [email, socketId] of Object.entries(dashboard_notify)) {
//       if (socketId == socket.id) {
//         delete dashboard_notify[email]
//         break
//       }
//     }
//   })

//   // chatCallSockets' events for notification
//   socket.on('register_notificationSocket', (data) => {
//     chatCallSockets_notify[data.email] = socket.id
//   })

//   socket.on('dashboard_notification', (data) => {
//     dashboard_notify[data.email] = socket.id
//   })

//   // Socket's events for text and voice chat
  // socket.on('emailMapId', ({ email }) => {
  //   chatCallSockets[email] = socket.id
  //   socket['email'] = email
  //   console.log(`${email} is connected as socket ${chatCallSockets[email]}`)
  // })

//   socket.on('callUser', async (data) => {
//     console.log(chatCallSockets, 'callUser')
//     // socket.to(data.to).emit('callUser', { signal: data.signal, from: socket.id });
//     chatCall.to(chatCallSockets[data.to]).emit('callingMe', {
//       signal: data.signal,
//       from: data.from,
//       to: data.to,
//     })
//   })

  // socket.on('acceptCall', async (data) => {
  //   console.log(chatCallSockets, 'acceptcall')
  //   // socket.to(data.to).emit('acceptCall', { signal: data.signal });
  //   chatCall.to(chatCallSockets[data.to]).emit('acceptCall', {
  //     signal: data.signal,
  //     from: data.from,
  //     to: data.to,
  //   })
  // })

//   socket.on('Iambusy', (data) => {
//     chatCall.to(chatCallSockets[data.to]).emit('busy', { from: data.from, to: data.to })
//   })

//   socket.on('destroyP2P', async (data) => {
//     chatCall.to(chatCallSockets[data.to]).emit('destroyP2P', { from: data.from })
//   })

//   socket.on('missedCall', (data) => {
//     chatCall.to(chatCallSockets_notify[data.to]).emit('newUnreadMsg')
//     chatCall.to(dashboard_notify[data.to]).emit('newChat')
//   })
// })

let chatUsers = {}
let chatSocketRoom = {}
const chatCall = io.of('/chatCall')
chatCall.on('connection', (socket) => {
  // start video call
  socket.on('join_room', (data) => {
    if (chatUsers[data.room]) {
      const length = chatUsers[data.room].length
      if (length === maximum) {
        chatCall.to(socket.id).emit('room_full')
        return
      }
      chatUsers[data.room].push({
        id: socket.id,
        email: data.email,
        nickname: data.nickname,
      })
    } else {
      chatUsers[data.room] = [
        { id: socket.id, email: data.email, nickname: data.nickname },
      ]
    }
    socketToRoom[socket.id] = data.room

    socket.join(data.room)

    const chatUsersInThisRoom = chatUsers[data.room].filter(
      (user) => user.id !== socket.id
    )

    chatCall.to(socket.id).emit('all_users', chatUsersInThisRoom)
  })

  socket.on('offer', (data) => {
    chatCall.to(data.offerReceiveID).emit('getOffer', {
      sdp: data.sdp,
      offerSendID: data.offerSendID,
      offerSendEmail: data.offerSendEmail,
      offerSendNickName: data.offerSendNickName,
    })
  })

  socket.on('acceptCall', (data) => {
    // socket.to(data.to).emit('acceptCall', { signal: data.signal });
    socket.broadcast.emit('acceptCall', {
      from: data.from,
      to: data.to,
    })
  })
  socket.on('callUser', (data) => {
    console.log("callUser", data)
    socket.broadcast.emit
    ('callingMe', {
      from: data.from,
      to: data.to
    })
  })

  socket.on('answer', (data) => {
    chatCall.to(data.answerReceiveID).emit('getAnswer', {
      sdp: data.sdp,
      answerSendID: data.answerSendID,
    })
  })

  socket.on('candidate', (data) => {
    chatCall.to(data.candidateReceiveID).emit('getCandidate', {
      candidate: data.candidate,
      candidateSendID: data.candidateSendID,
    })
  })

  socket.on('disconnect', () => {
    console.log(`[${chatSocketRoom[socket.id]}]: ${socket.id} exit`)
    const roomID = chatSocketRoom[socket.id]
    let room = chatUsers[roomID]
    if (room) {
      room = room.filter((user) => user.id !== socket.id)
      chatUsers[roomID] = room
      if (room.length === 0) {
        delete chatUsers[roomID]
        return
      }
    }
    chatCall.to(roomID).emit('user_exit', { id: socket.id })
    console.log(chatUsers)
  })

  // end multi call part
})

let users = {}
let socketToRoom = {}
const maximum = process.env.MAXIMUM || 6
const gCall = io.of('/groupCall')
gCall.on('connection', (socket) => {
  // start video call
  socket.on('join_room', (data) => {
    if (users[data.room]) {
      const length = users[data.room].length
      if (length === maximum) {
        gCall.to(socket.id).emit('room_full')
        return
      }
      users[data.room].push({
        id: socket.id,
        email: data.email,
        nickname: data.nickname,
      })
    } else {
      users[data.room] = [
        { id: socket.id, email: data.email, nickname: data.nickname },
      ]
    }
    socketToRoom[socket.id] = data.room

    socket.join(data.room)

    const usersInThisRoom = users[data.room].filter(
      (user) => user.id !== socket.id
    )

    gCall.to(socket.id).emit('all_users', usersInThisRoom)
  })

  socket.on('offer', (data) => {
    gCall.to(data.offerReceiveID).emit('getOffer', {
      sdp: data.sdp,
      offerSendID: data.offerSendID,
      offerSendEmail: data.offerSendEmail,
      offerSendNickName: data.offerSendNickName,
    })
  })

  socket.on('answer', (data) => {
    gCall.to(data.answerReceiveID).emit('getAnswer', {
      sdp: data.sdp,
      answerSendID: data.answerSendID,
    })
  })

  socket.on('candidate', (data) => {
    gCall.to(data.candidateReceiveID).emit('getCandidate', {
      candidate: data.candidate,
      candidateSendID: data.candidateSendID,
    })
  })

  socket.on('disconnect', () => {
    console.log(`[${socketToRoom[socket.id]}]: ${socket.id} exit`)
    const roomID = socketToRoom[socket.id]
    let room = users[roomID]
    if (room) {
      room = room.filter((user) => user.id !== socket.id)
      users[roomID] = room
      if (room.length === 0) {
        delete users[roomID]
        return
      }
    }
    gCall.to(roomID).emit('user_exit', { id: socket.id })
    console.log(users)
  })

  // end multi call part
})

const gchat = io.of('/groupchat')
gchat.on('connection', (socket) => {
  socket.on('identity_group', (data) => {
    socket.join(`room-${data.groupId}`)
    gchat
      .to(`room-${data.groupId}`)
      .emit('connectToRoom', { email: data.email, name: data.name })
  })

  socket.on('disconnecting', () => {
    socket.leave(`room-${socket.rooms}`)
  })

  socket.on('disconnect', () => {
    socket.leave(`room-${socket.rooms}`)
  })

  socket.on('sendMessageFirst', (data) => {
    gchat.to(`room-${data.groupId}`).emit('newMessageFirst', data)
  })

  socket.on('sendMessage', (data) => {
    const { message, groupInfo } = data
    console.log(message.groupId)
    gchat.to(`room-${message.groupId}`).emit('newMessage', message)
    for (let i = 0; i < groupInfo.members.length; i++) {
      io.to(sockets_notify[groupInfo.members[i]]).emit('newUnreadGroupChat')
      io.to(dashboard_notify[groupInfo.members[i]]).emit('newChat')
    }
  })

  socket.on('reactEmojiGroup', (data) => {
    const { msgId, groupInfo } = data
    gchat.to(`room-${groupInfo._id}`).emit('newReactEmoji', { msgId, emojiId })
  })
})

server.listen(4000, () => {
  console.log(`server is running.`)
})
