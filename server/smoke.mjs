import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import WebSocket from 'ws'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = 4299
const WS_URL = `ws://127.0.0.1:${PORT}/ws`
const TIMEOUT_MS = 5000

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function openClient() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL)
    ws.on('open', () => resolve(ws))
    ws.on('error', reject)
  })
}

function collect(ws) {
  const messages = []
  ws.on('message', (raw) => {
    try {
      messages.push(JSON.parse(raw.toString()))
    } catch {
      // messaggio non JSON: si ignora
    }
  })
  return messages
}

async function waitFor(messages, predicate, label) {
  const start = Date.now()
  while (Date.now() - start < TIMEOUT_MS) {
    const found = messages.find(predicate)
    if (found) return found
    await wait(20)
  }
  throw new Error(`timeout in attesa di "${label}"`)
}

const type = (t) => (msg) => msg.type === t

function send(ws, msg) {
  ws.send(JSON.stringify(msg))
}

function assert(condition, detail) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${detail}`)
  }
}

async function main() {
  const server = spawn(process.execPath, [path.join(__dirname, 'index.js')], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  let stdout = ''
  const logs = []
  server.stdout.on('data', (d) => {
    stdout += d.toString()
    logs.push(d.toString().trim())
  })
  server.stderr.on('data', (d) => logs.push(`ERR ${d.toString().trim()}`))

  const kill = () => {
    server.kill('SIGTERM')
    return new Promise((resolve) => {
      if (server.exitCode !== null) {
        resolve()
        return
      }
      server.once('exit', resolve)
      setTimeout(resolve, 1000)
    })
  }

  try {
    const start = Date.now()
    while (!/server in ascolto/.test(stdout)) {
      if (Date.now() - start > 8000) {
        throw new Error(`server non partito. Log:\n${logs.join('\n')}`)
      }
      if (server.exitCode !== null) {
        throw new Error(`server uscito con codice ${server.exitCode}. Log:\n${logs.join('\n')}`)
      }
      await wait(100)
    }

    let A
    let B
    try {
      A = await openClient()
      B = await openClient()
    } catch {
      throw new Error('impossibile connettere i client WS')
    }
    const aMsg = collect(A)
    const bMsg = collect(B)

    // 1. A entra in lobby
    send(A, { type: 'join_lobby', nickname: 'Alice' })
    const helloA = await waitFor(aMsg, type('hello'), 'hello di A')
    assert(helloA.you.nickname === 'Alice', 'hello di A con nickname Alice')
    assert(Array.isArray(helloA.rooms) && helloA.rooms.length === 0, 'nessuna stanza all’inizio')

    // 2. B entra in lobby
    send(B, { type: 'join_lobby', nickname: 'Bob' })
    await waitFor(bMsg, type('hello'), 'hello di B')

    // 3. A crea una stanza carte "Stanza A"
    send(A, { type: 'create_room', name: 'Stanza A', game: 'carte', maxPlayers: 4 })
    const joinedA = await waitFor(aMsg, type('room_joined'), 'room_joined di A')
    assert(joinedA.room.name === 'Stanza A', 'A riceve room_joined con la stanza creata')
    assert(joinedA.room.game === 'carte', 'la stanza è della categoria carte')
    assert(joinedA.room.maxPlayers === 4, 'maxPlayers della stanza è 4')
    assert(joinedA.room.players.length === 1, 'un solo giocatore in stanza all’inizio')
    assert(joinedA.you.host === true, 'A è host')
    const roomId = joinedA.room.id
    assert(/^[A-Z2-9]{6}$/.test(roomId), `id stanza leggibile a 6 char: ${roomId}`)

    // 4. B riceve lobby_update con la stanza
    const lobbyB = await waitFor(
      bMsg,
      (msg) => type('lobby_update')(msg) && msg.rooms.some((r) => r.id === roomId),
      'lobby_update di B con la stanza',
    )
    const found = lobbyB.rooms.find((r) => r.id === roomId)
    assert(found, 'lobby_update di B contiene la stanza')
    assert(found.players === 1, 'la stanza mostra 1 giocatore nel riepilogo')

    // 5. B entra nella stanza
    send(B, { type: 'join_room', roomId })
    const joinedB = await waitFor(
      bMsg,
      (msg) => type('room_joined')(msg) && msg.room.id === roomId,
      'room_joined di B',
    )
    assert(joinedB.room.players.length === 2, 'B riceve room_joined con 2 giocatori')
    assert(joinedB.you.host === false, 'B non è host')
    const updateA = await waitFor(
      aMsg,
      (msg) =>
        type('room_update')(msg) && msg.room.id === roomId && msg.room.players.length === 2,
      'room_update di A con 2 giocatori',
    )
    assert(
      updateA.room.players.some((p) => p.nickname === 'Bob'),
      'il secondo giocatore è Bob',
    )

    // 6. B manda un messaggio in chat
    send(B, { type: 'chat', text: 'ciao stanza!' })
    const chatA = await waitFor(
      aMsg,
      (msg) => type('chat')(msg) && msg.text === 'ciao stanza!',
      'chat di B su A',
    )
    assert(chatA.from === 'Bob', 'chi parla è Bob')

    // 7. A esce dalla stanza
    send(A, { type: 'leave_room' })
    await waitFor(aMsg, type('room_left'), 'room_left per A')
    const updateB = await waitFor(
      bMsg,
      (msg) =>
        type('room_update')(msg) && msg.room.id === roomId && msg.room.players.length === 1,
      'room_update di B dopo l’uscita di A',
    )
    assert(updateB.room.players[0].nickname === 'Bob', 'Bob è ancora nella stanza')
    // riepilogo: A è tornato in lobby senza stanza
    const relobbyA = await waitFor(
      aMsg,
      (msg) => type('hello')(msg) || type('lobby_update')(msg),
      'aggiornamento lobby dopo l’uscita',
    )
    assert(!relobbyA.rooms.some((r) => r.id === roomId), 'la stanza vuota è stata distrutta')

    // 8. B resta in stanza: può ancora parlare e ricevere il proprio messaggio
    send(B, { type: 'chat', text: 'ci sono ancora!' })
    const chatB = await waitFor(
      bMsg,
      (msg) => type('chat')(msg) && msg.from === 'Bob' && msg.text === 'ci sono ancora!',
      'chat broadcast a B',
    )
    assert(chatB.from === 'Bob', 'B riceve il proprio messaggio')

    // 9. ping/pong
    send(A, { type: 'ping' })
    await waitFor(aMsg, type('pong'), 'pong per A')

    // 10. ricollegamento B in lobby
    B.close()
    A.close()
    await wait(200)

    console.log('SMOKE PASS')
  } catch (err) {
    console.error('SMOKE FAIL')
    console.error(err && err.message ? err.message : String(err))
    process.exitCode = 1
  } finally {
    await kill()
  }
}

main()