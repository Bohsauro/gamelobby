# GameLobby — spec di implementazione

Sito di giochi online per pochi amici. UI in **italiano**. Nessun gioco reale: ogni gioco è un placeholder "presto disponibile". Il multiplayer foundation è la **lobby con stanze reali via WebSocket** (create, unisciti, chat di stanza).

## Stack (segui il skill frontend-typescript)
- `client/`: Vite + React 18 + TypeScript strict + react-router-dom. CSS custom con token, niente framework UI.
- `server/`: Node ESM + `ws`, niente Express (usa node:http). Produzione: server serve `client/dist` + fallback SPA; WS sullo stesso origin su path `/ws`.
- Unico origin = zero CORS. Porta server: **4200**, bind **0.0.0.0** (regola fissa: accesso da LAN/Tailscale).
- Design: segui il skill web-design. Palette dark gaming sotto.

## Struttura
```
client/
  src/main.tsx  App.tsx  router.tsx
  src/styles/tokens.css  global.css
  src/components/   (Navbar, Footer, GameCard, Badge, RoomCard, PlayersList, ChatBox, MessageBox, EmptyState …)
  src/pages/        (Home, GamesSection [dinamica per slug], Lobby, Room)
  src/lib/ws.ts     (client WS con reconnect+heartbeat+status)
  src/lib/types.ts  (tipi condivisi messaggi WS + dato app)
  src/data/games.ts (catalogo statico sezioni+giochi)
server/
  index.js   # http(static+SPA fallback) + WS upgrade su /ws, heartbeat 30s
  rooms.js   # RoomManager
  smoke.mjs  # test integrazione: 2 client WS
package.json root (script: dev, dev:client, dev:server, build, start, smoke)
```

## Design system (usa questi valori ESATTI)
```css
:root{
  --bg:#0a0c14; --bg-soft:#10131f; --surface:#161a29; --surface-2:#1d2234;
  --border:#262b40; --border-strong:#353c58;
  --text:#eceefb; --muted:#a2a8c2; --faint:#6b7290;
  --accent:#8b5cf6; --accent-2:#22d3ee; --ok:#34d399; --warn:#fbbf24; --danger:#f87171;
  --accent-ink:#0e0a1f;
  --r-sm:8px; --r-md:12px; --r-lg:16px; --r-xl:24px;
  --sans:"Inter",system-ui,sans-serif; --display:"Sora",sans-serif; --mono:"JetBrains Mono",monospace;
}
```
- Font via Google Fonts: Sora (700,800), Inter (400,500,600), JetBrains Mono (400,600), `font-display: swap`.
- Tipografia fluida con `clamp()` (vedi skill web-design). Line-height heading 1.05-1.15.
- Hero glow: `radial-gradient(60% 65% at 50% 0%, rgba(139,92,246,0.14), transparent 70%)` + un secondo radial cyan alpha 0.07.
- Card: `--surface` + bordo `--border` + radius 16 + hover: translateY(-2px), border-strong, ombra.
- Badge status: pill mono 12px con dot (ok=verde `in arrivo`? NO: `in arrivo` è warn/cyan; playing=ok; waiting=warn).
- Focus visible: `outline:2px solid var(--accent-2); outline-offset:2px`. Skip link. `prefers-reduced-motion` disattiva animazioni.
- Bottoni: primary = gradiente `linear-gradient(135deg,#8b5cf6,#22d3ee)` testo scuro `--accent-ink`; ghost = bordo `--border-strong`.
- Touch target ≥ 44px.

## Pagine e contenuti (italiano)
Nav: `Lobby` (CTA accent), `Carte`, `3D`, `Da tavolo`, `Party`. Brand: **GameLobby**.

### Home `/`
- Hero: h1 "Giochi online per pochi amici." con span accent, lede "Stanze private, partite live e un posto dove ridere insieme — senza iscriversi a niente."
- CTA: "Entra nella lobby" (primary) + "Sfoglia i giochi" (ghost, ancorato a #sezioni).
- Stats row: "24 giochi previsti", "8 stanze massimo", "8 giocatori per stanza", "0 iscrizioni".
- Sezione `#sezioni` "Scegli il tuo tavolo": 4 card sezione (Carte ♠, 3D, Da tavolo, Party) → link a `/carte` ecc. Ogni card mostra n. giochi in arrivo.
- Sezione extra con 3 step "Come funziona": 01 Crea o entra in una stanza — 02 Condividi il codice — 03 Gioca insieme (presto).

### Sezione giochi `/carte`, `/3d`, `/tavolo`, `/party`
- Header: titolo sezione + tagline + CTA "Crea una stanza di prova" (crea stanza con quella categoria, game = slug, porta alla stanza).
- Griglia di GameCard dai dati sotto, ognuna: nome, descrizione breve, badge "In arrivo", info giocatori "2-6 giocatori", bottone disabilitato "Presto disponibile".
- Ogni slug ha il suo gradiente/badge colore: carte=viola, 3d=cyan, tavolo=verde, party=ambra.

### Catalogo giochi (ESATTAMENTE questi, tutti `status:'coming_soon'`)
- carte: Briscola (2-4), Scala 40 (2-6), Tresette (2-4), Cuori (3-6), Guerra (2-4), Memory (2-4)
- 3d: Mini Golf 3D (1-4), Tiro al bersaglio (1-4), Domino 3D (2-4), Labirinto 3D (2-4), Palla prigioniera (4-8), Biliardo (2-2)
- tavolo: Dama (2-2), Scacchi (2-2), Tris (2-2), Forza 4 (2-2), Battaglia navale (2-2), Indovina chi (2-2)
- party: Tabù (4-8), Sciarade (4-8), Quiz serale (3-8), Telefono senza fili (4-8), Disegna e indovina (3-8), 20 domande (3-6)
Totale esatto: 24 giochi. Hero dice "24 giochi previsti".

### Lobby `/lobby`
- Round trip WS: prima connetti, poi interagisci. Status banner: "Connesso"/"Riconnessione…"/"Offline".
- Ingresso nickname (1-16 char, salvato in localStorage, pre-compilato). Cambio nickname = ricollegamento con nuovo nome.
- Griglia stanze live da `lobby_update`: nome stanza, icona categoria, giocatori `n/max`, badge stato (in attesa/in gioco). Bottone "Entra".
- Form "Nuova stanza": nome (≤40), gioco (select dalle 4 categorie), maxPlayers (2/4/6/8). Bottone "Crea e unisciti".
- Empty state se nessuna stanza: messaggio + suggerimento creazione.

### Stanza `/stanza/:roomId`
- Header: nome stanza, codice condivisibile (bottone "Copia codice"), badge stato, categoria.
- Lista giocatori (host marcato), contatore `n/max`.
- Pannello "Presto disponibile": card della categoria con testo "Il gioco {categoria} arriverà presto. La stanza funziona già: invita i tuoi!".
- Chat di stanza: lista messaggi (nickname + orario + testo), input + invio. aria-live polite.
- Bottone "Esci dalla stanza" → torna a `/lobby`.
- Se la stanza non esiste: messaggio chiaro + link alla lobby.

## Protocollo WebSocket (JSON, tutto su `/ws`)
Client→Server:
- `{type:'join_lobby', nickname}` → risposta `hello`
- `{type:'create_room', name, game, maxPlayers}` → `room_joined`
- `{type:'join_room', roomId}` → `room_joined` (o `error`)
- `{type:'leave_room'}` → `room_left`
- `{type:'chat', text}` (solo in stanza) → broadcast `chat`
- `{type:'ping'}` → `pong`
Server→Client:
- `{type:'hello', you:{id,nickname}, rooms:[...RoomSummary]}`
- `{type:'lobby_update', rooms:[...RoomSummary]}` broadcast globale su ogni cambio stanza
- `{type:'room_joined', room: RoomDetail, you:{id,nickname,host}}`
- `{type:'room_update', room: RoomDetail}` broadcast ai membri stanza
- `{type:'room_left'}`
- `{type:'chat', from, text, ts}` a tutti i membri stanza
- `{type:'error', message}` (italiano)
- `{type:'pong'}`

Tipi:
```
RoomSummary = {id, name, game, maxPlayers, players:number, status:'waiting'|'playing'}
RoomDetail  = RoomSummary + {players:[{id,nickname,host}], createdAt}
```
Regole RoomManager: id 6 char leggibile (escludi O0I1); stanza vuota → distruggi + lobby_update; piena → error "Stanza piena."; già in stanza → error; nickname duplicati ammessi ma con suffisso univoco `#2`; heartbeat server 30s termina mute >60s. Tutti i messaggi in ingresso validati a mano (shape check), type ignoto → error gentile.

## Server
- `index.js`: `http.createServer` serve `client/dist` (mime base) + fallback `index.html` per route SPA (`/lobby`, `/stanza/*`…). `WebSocketServer({noServer:true})` + `upgrade` su pathname `/ws`. Ping timer 30s. `console.log` con timestamp su eventi chiave. Port 4200 host 0.0.0.0 (leggibile da env `PORT`).
- `rooms.js`: classe RoomManager con metodi per ogni azione; nessuna logica nei socket handler oltre la validazione + chiamata a RoomManager.
- `smoke.mjs`: avvia il server su porta 4299, connette 2 client WS, esegue: A crea stanza carte "Stanza A", B riceve lobby_update con la stanza, B entra, A riceve room_update con 2 giocatori, B manda chat, A riceve chat con testo giusto, A esce, B resta in stanza, chiudi, stampa `SMOKE PASS` (o exit 1 con dettaglio su fallimento).

## Client WS (lib/ws.ts)
- Classe/instanzia singleton con: connect(url), stato `connecting|open|reconnecting|closed` (callback onStatusChange), send(tipizzato) con coda quando chiuso, ping ogni 25s, reconnect con backoff 1s/2s/5s (max 5 tentativi poi stato `closed` + banner), parse sicurezza JSON + dispatch a mappa handler.
- `useWebSocket()` hook: espone status + send + registra handler; si ricollega quando il nickname cambia (join_lobby nuovo).

## Qualità / verifiche (DA ESEGUIRE PRIMA DI FERMARTI)
1. `npm run build` → deve passare `tsc -b` strict senza errori.
2. `npm run smoke` → `SMOKE PASS`.
3. `npm run dev:server` + aprire `/lobby`: banner "Connesso", creare stanza, ricevere room_joined.
4. Nessun `any`, nessun TODO lasciato, nessun console.error spuri nel client.
5. Screenshot-check mentale: Home e Lobby su 1440px e 390px (overflow? contrasti?).

## Fuori scope (NON fare)
- Nessun gioco giocabile, niente logica di partita, niente auth/account (nickname basta).
- Niente framework CSS/storybook/test unitari (solo smoke), niente i18n (solo italiano), niente analytics.
- Niente immagini esterne: icone inline SVG custom (carta, cubo 3d, tavolo/pedina, festa/maschera, casa, terminale).

## Git
- Commit convenzionali (`feat:`, `fix:`, `chore:`). `.gitignore`: node_modules/, dist/, .env, *.log.
- Ultimo commit messaggio: `feat: GameLobby — sezioni giochi, lobby e stanze WebSocket`.
- Non pushare (remote lo gestisce l'orchestratore).