import { createServer } from 'http'
import { Server } from 'socket.io'

const PORT = Number(process.env.CHAT_SERVICE_PORT || 3003)

const httpServer = createServer()
const io = new Server(httpServer, {
  path: '/',
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// rooms: customer-<sessionId>, admin
const customers = new Map() // sessionId -> socketId
const admins = new Set<string>()

io.on('connection', (socket) => {
  console.log(`[chat] connected ${socket.id}`)

  socket.on('chat:join', ({ sessionId, role, name }) => {
    socket.data.sessionId = sessionId
    socket.data.role = role
    socket.data.name = name
    if (role === 'customer' && sessionId) {
      customers.set(sessionId, socket.id)
      socket.join(`customer-${sessionId}`)
      console.log(`[chat] customer joined ${sessionId}`)
      // notify admins a customer came online
      for (const adminId of admins) {
        io.to(adminId).emit('chat:presence', { sessionId, name, online: true })
      }
    } else if (role === 'admin') {
      admins.add(socket.id)
      socket.join('admins')
      console.log(`[chat] admin joined`)
    }
  })

  // customer -> admin message
  // admin -> customer message
  socket.on('chat:message', (payload) => {
    const { sessionId, sender, content, name } = payload || {}
    if (!sessionId || !content) return
    const msg = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      sessionId,
      sender,
      content,
      name,
      createdAt: new Date().toISOString(),
    }
    if (sender === 'customer') {
      // relay to all admins
      io.to('admins').emit('chat:message', msg)
    } else if (sender === 'admin') {
      // relay to the customer session
      io.to(`customer-${sessionId}`).emit('chat:message', msg)
    }
  })

  socket.on('chat:typing', ({ sessionId, role }) => {
    if (role === 'customer') {
      io.to('admins').emit('chat:typing', { sessionId })
    } else {
      io.to(`customer-${sessionId}`).emit('chat:typing', { sessionId })
    }
  })

  socket.on('disconnect', () => {
    const { sessionId, role, name } = socket.data || {}
    if (role === 'admin') {
      admins.delete(socket.id)
    } else if (role === 'customer' && sessionId) {
      customers.delete(sessionId)
      for (const adminId of admins) {
        io.to(adminId).emit('chat:presence', { sessionId, name, online: false })
      }
    }
    console.log(`[chat] disconnected ${socket.id}`)
  })

  socket.on('error', (err) => console.error(`[chat] socket error`, err))
})

// Bind on :: for dual-stack IPv4 + IPv6 so the Caddy gateway (which may resolve
// localhost to ::1) can reach the service on both stacks.
httpServer.listen(PORT, '::', () => {
  console.log(`[chat] socket.io server running on port ${PORT}`)
})

process.on('SIGTERM', () => {
  console.log('[chat] SIGTERM, shutting down...')
  httpServer.close(() => process.exit(0))
})
process.on('SIGINT', () => {
  console.log('[chat] SIGINT, shutting down...')
  httpServer.close(() => process.exit(0))
})
