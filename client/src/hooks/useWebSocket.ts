import { useCallback, useEffect, useState } from 'react'
import { wsClient } from '../lib/ws'
import type { WsStatus } from '../lib/ws'
import type { ClientMessage, ServerMessage } from '../lib/types'

type MessageOf<K extends ServerMessage['type']> = Extract<ServerMessage, { type: K }>

export function useWebSocket(nickname: string): {
  status: WsStatus
  send: (msg: ClientMessage) => void
  subscribe: <K extends ServerMessage['type']>(
    type: K,
    handler: (msg: MessageOf<K>) => void,
  ) => () => void
} {
  const [status, setStatus] = useState<WsStatus>(wsClient.getStatus())

  useEffect(() => wsClient.onStatus(setStatus), [])

  useEffect(() => {
    wsClient.joinLobby(nickname)
  }, [nickname])

  const send = useCallback((msg: ClientMessage) => {
    wsClient.send(msg)
  }, [])

  const subscribe = useCallback(
    <K extends ServerMessage['type']>(type: K, handler: (msg: MessageOf<K>) => void) =>
      wsClient.on(type, handler),
    [],
  )

  return { status, send, subscribe }
}