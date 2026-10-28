import http from 'node:http'
import path from 'node:path'
import { readFile, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { WebSocketServer } from 'ws'
import { RoomManager, GAME_SLUGS, MAX_PLAYERS_CHOICES, NICKNAME_MAX, ROOM_NAME_MAX, CHAT_MAX } from './rooms.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT || 4200)
const HOST = '0.0.0.0'
const DIST_DIR = path.join(__dirname, '..', 'client', 'dist')
const INDEX_HTML = path.join(DIST_DIR, 'index.html')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
}

function ts() {
  return new Date().toISOString()
}

function log(message) {
  console.log(`[${ts()}] ${message}`)
}

const manager = new RoomManager((message) => log(message))

function stripControl(value) {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, '')
}

function sendJson(ws, msg) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(msg))
  }
}

function sendError(ws, message) {
  sendJson(ws, { type: 'error', message })
}

// ---------- statica + fallback SPA ----------

async function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase()
  const mime = MIME[ext] || 'application/octet-stream'
  let data
  try {
    data = await readFile(filePath)
  } catch {
    res.writeHead(500)
    res.end('Errore interno')
    return
  }
  res.writeHead(200, {
    'Content-Type': mime,
    'Cache-Control': 'no-cache',
    'Content-Length': data.length,
  })
  res.end(data)
}

async function serveStatic(req, res) {
  let pathname = ''
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
  } catch {
    return false
  }
  if (pathname === '/') pathname = '/index.html'

  const filePath = path.normalize(path.join(DIST_DIR, pathname))
  if (!filePath.startsWith(DIST_DIR)) return false

  try {
    const info = await stat(filePath)
    if (!info.isFile()) return false
  } catch {
    return false
  }
  await serveFile(res, filePath)
  return true
}

async function serveIndex(req, res) {
  await serveFile(res, INDEX_HTML)
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost')
  if (req.method === 'GET' && url.pathname === '/ws') {
    res.writeHead(426, { Upgrade: 'websocket' })
    res.end('Aggiornare a WebSocket: usa ws://…/ws')
    return
  }
  if (req.method === 'GET' && (await serveStatic(req, res))) return
  if (req.method === 'GET') {
    await serveIndex(req, res)
    return
  }
  res.writeHead(405, { Allow: 'GET, HEAD' })
  res.end('Metodo non consentito')
})

// ---------- websocket ----------

const wss = new WebSocketServer({ noServer: true })

server.on('upgrade', (req, socket, head) => {
  let pathname = ''
  try {
    pathname = new URL(req.url, 'http://localhost').pathname
  } catch {
    socket.destroy()
    return
  }
  if (pathname === '/ws') {
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req))
  } else {
    socket.destroy()
  }
})

function handleMessage(client, raw) {
  let msg
  try {
    msg = JSON.parse(raw.toString())
  } catch {
    sendError(client.ws, 'Messaggio non valido.')
    return
  }
  const send = (payload) => sendJson(client.ws, payload)

  if (!msg || typeof msg !== 'object' || typeof msg.type !== 'string') {
    sendError(client.ws, 'Messaggio non valido.')
    return
  }

  switch (msg.type) {
    case 'join_lobby': {
      const nickname = stripControl(msg.nickname).trim().slice(0, NICKNAME_MAX)
      if (!nickname) {
        sendError(client.ws, 'Nickname non valido (1-16 caratteri).')
        return
      }
      send(manager.joinLobby(client.id, nickname))
      return
    }
    case 'create_room': {
      const name = stripControl(msg.name).trim().slice(0, ROOM_NAME_MAX)
      if (!name) {
        sendError(client.ws, 'Nome stanza non valido (max 40 caratteri).')
        return
      }
      if (!GAME_SLUGS.has(msg.game)) {
        sendError(client.ws, 'Categoria non valida.')
        return
      }
      if (!MAX_PLAYERS_CHOICES.has(msg.maxPlayers)) {
        sendError(client.ws, 'Numero di giocatori non valido.')
        return
      }
      send(manager.createRoom(client.id, name, msg.game, msg.maxPlayers))
      return
    }
    case 'join_room': {
      const roomId = stripControl(msg.roomId).trim().toUpperCase()
      if (!/^[A-Z2-9]{6}$/.test(roomId)) {
        sendError(client.ws, 'Codice stanza non valido.')
        return
      }
      send(manager.joinRoom(client.id, roomId))
      return
    }
    case 'leave_room':
      send(manager.leaveRoom(client.id))
      return
    case 'chat': {
      const text = stripControl(msg.text).trim().slice(0, CHAT_MAX)
      if (!text) {
        sendError(client.ws, 'Messaggio non valido.')
        return
      }
      const result = manager.chat(client.id, text)
      if (result) send(result)
      return
    }
    case 'ping':
      send({ type: 'pong' })
      return
    default:
      sendError(client.ws, 'Tipo di messaggio non riconosciuto.')
  }
}

wss.on('connection', (ws) => {
  ws.isAlive = true
  const clientId = manager.newClient(ws)
  const client = manager.clients.get(clientId)

  ws.on('pong', () => {
    ws.isAlive = true
  })

  ws.on('message', (raw) => {
    handleMessage(client, raw)
  })

  ws.on('close', () => {
    manager.removeClient(clientId)
  })

  log(`connect ${clientId}`)
})

// Heartbeat server: termina le connessioni mute da più di un ciclo (60s)
const heartbeat = setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) {
      ws.terminate()
      log('terminate connessione muta')
      continue
    }
    ws.isAlive = false
    ws.ping()
  }
}, 30_000)

wss.on('close', () => {
  clearInterval(heartbeat)
})

server.on('error', (err) => {
  log(`errore server: ${err.message}`)
})

server.listen(PORT, HOST, () => {
  log(`server in ascolto su http://0.0.0.0:${PORT} (WS su /ws)`)
})