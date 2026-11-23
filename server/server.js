require('dotenv').config({ path: ['.env.local', '.env'] })

const express = require('express')
const { Server } = require('socket.io')
const https = require('https')
const fs = require('fs')
const cors = require('cors')
const { clientele, message, cons } = require('pos/lexicon')
const http = require('http')
const { saveDirectMessage, markDirectMessageRead } = require('./postgres')

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

  socket.on('readMessage', async (message) => {
    try {
      await markDirectMessageRead(message._id, socket.email)
    } catch (error) {
      console.error('Could not mark direct message as read:', error)
      socket.emit('messageError', { message: 'Could not update message status.' })
    }
  })

  socket.on('sendMessage', async (message) => {
    try {
      const savedMessage = await saveDirectMessage(message, socket.email)
      socket.emit('newMessage', savedMessage)
      io.to(sockets[savedMessage.to]).emit('newMessage', savedMessage)
      io.to(sockets_notify[savedMessage.to]).emit('newUnreadMsg')
      io.to(dashboard_notify[savedMessage.to]).emit('newChat')
    } catch (error) {
      console.error('Could not save direct message:', error)
      socket.emit('messageError', { message: 'Could not send message.' })
    }
  })

  socket.on('reactEmoji', ({ msgId, emojiId, to }) => {
    // console.log(msgId, emojiId, to)
    io.to(sockets[to]).emit('newReactEmoji', { msgId, emojiId })
  })
})

let chatUsers = {}
let chatSocketRoom = {}
const chatCall = io.of('/chatCall')
chatCall.on('connection', (socket) => {
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
    chatSocketRoom[socket.id] = data.room

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
    // console.log('callUser', data)
    socket.broadcast.emit('callingMe', {
      from: data.from,
      to: data.to,
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

  socket.on('cancelCall', (data) => {
    // console.log(data, "cancelcall")
    socket.broadcast.emit('cancelCall', {
      from: data.from,
      to: data.to,
    })
  })

  socket.on('endCall', () => {
    console.log(`[${chatSocketRoom[socket.id]}]: ${socket.id} exit`)
    const roomID = chatSocketRoom[socket.id]
    delete chatUsers[roomID]
    chatCall.to(roomID).emit('user_exit', { id: socket.id })
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
    const { msgId, emojiId, groupInfo } = data
    gchat.to(`room-${groupInfo._id}`).emit('newReactEmoji', { msgId, emojiId })
  })
})

server.listen(4000, () => {
  console.log(`server is running.`)
})
