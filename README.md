# GameLobby

Online games for a handful of friends. Sections for card games, 3D games, board games and party games live on top of a **real multiplayer foundation**: a WebSocket lobby with rooms, live seats and in-room chat. The games themselves are placeholders ("coming soon") — the room system works today.

Playable from any computer: open the lobby, pick a nickname, create a room and share its 6-character code.

## Stack

- **Client** — Vite + React 18 + TypeScript (strict), hand-rolled CSS with design tokens. `client/`
- **Server** — Node.js ESM, zero deps besides `ws`: static serving of `client/dist` + WebSocket on `/ws`. `server/`
- Single origin in production (server serves the SPA and the WS) → no CORS.

## Quickstart

```bash
npm install
npm run dev          # server :4200 + Vite :5173 with /ws proxy
npm run build        # tsc -b && vite build (client/dist)
npm start            # serve client/dist + WS on :4200 (0.0.0.0)
npm run smoke        # 2-client WS integration test → SMOKE PASS
```

`PORT` env overrides the listen port (default 4200). Server binds `0.0.0.0` so it is reachable over LAN/Tailscale.

## WS protocol (JSON over `/ws`)

Client → server: `join_lobby {nickname}` · `create_room {name, game, maxPlayers}` · `join_room {roomId}` · `leave_room` · `chat {text}` · `ping`

Server → client: `hello` · `lobby_update` · `room_joined` · `room_update` · `room_left` · `chat` · `error` · `pong`

`game` is one of `carte | 3d | tavolo | party`. Rooms get a readable 6-char id, empty rooms self-destruct, the server heartbeats every 30s and drops mute connections.

## Demo

- LAN: `http://192.168.1.104:4200`
- Tailscale: `http://100.69.55.38:4200`

## Roadmap

- Actual games per section (Briscola, Mini Golf 3D, Dama…), each plugging into the existing room lifecycle
- Room states (`waiting` → `playing`), host controls
- Persistent nicknames and room history (optional)

## License

MIT (add when ready).