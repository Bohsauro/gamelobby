import { useEffect, useState } from 'react'
import { IconChip } from './icons'
import { wsClient } from '../lib/ws'
import type { ClientMessage, ServerMessage } from '../lib/types'

type SendFn = (msg: ClientMessage) => void

type SubscribeFn = <K extends ServerMessage['type']>(
  type: K,
  handler: (msg: Extract<ServerMessage, { type: K }>) => void,
) => () => void

interface ChipsWalletProps {
  nickname: string
  send: SendFn
  subscribe: SubscribeFn
}

const ADD_AMOUNT = 500

export function ChipsWallet({ nickname, send, subscribe }: ChipsWalletProps) {
  const [balance, setBalance] = useState<number | null>(() => wsClient.getChips())
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const offHello = subscribe('hello', (message) => {
      setBalance(message.you.chips)
      setBusy(false)
    })
    const offChips = subscribe('chips', (message) => {
      setBalance(message.balance)
      setBusy(false)
    })
    const offError = subscribe('error', () => setBusy(false))
    return () => {
      offHello()
      offChips()
      offError()
    }
  }, [subscribe])

  if (!nickname.trim()) return null

  const addChips = () => {
    if (busy) return
    setBusy(true)
    send({ type: 'add_chips', amount: ADD_AMOUNT })
  }

  return (
    <div className="chips-wallet">
      <IconChip size={18} className="chips-wallet__icon" />
      <span className="chips-wallet__balance">
        {balance === null ? '—' : balance.toLocaleString('it-IT')}
      </span>
      <span className="chips-wallet__label">fiches</span>
      <button
        type="button"
        className="btn btn--ghost btn--sm"
        aria-label="Aggiungi 500 fiches"
        onClick={addChips}
        disabled={busy}
      >
        +500 fiches
      </button>
    </div>
  )
}