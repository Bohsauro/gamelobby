import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ChatMessage } from '../lib/types'
import { MessageBox } from './MessageBox'

const INPUT_ID = 'chat-input'

export function ChatBox({
  messages,
  ownNickname,
  onSend,
  disabled = false,
}: {
  messages: ChatMessage[]
  ownNickname: string | null
  onSend: (text: string) => void
  disabled?: boolean
}) {
  const [text, setText] = useState('')
  const listRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useLayoutEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  useEffect(() => {
    if (!disabled && inputRef.current) inputRef.current.focus()
  }, [disabled])

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = text.trim()
    if (!value || disabled) return
    onSend(value)
    setText('')
  }

  return (
    <section className="chat" aria-label="Chat di stanza">
      <div className="chat__header">
        <span className="chat__title">Chat di stanza</span>
        <span className="chat__count">{messages.length} messaggi</span>
      </div>
      <div
        className="chat__messages"
        ref={listRef}
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.length === 0 ? (
          <p className="chat__empty">Nessun messaggio ancora. Rompi il ghiaccio!</p>
        ) : (
          messages.map((message, index) => (
            <MessageBox
              key={`${message.ts}-${message.from}-${index}`}
              message={message}
              own={message.from === ownNickname}
            />
          ))
        )}
      </div>
      <form className="chat__form" onSubmit={submit}>
        <label htmlFor={INPUT_ID} className="field__label" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
          Messaggio
        </label>
        <input
          id={INPUT_ID}
          ref={inputRef}
          className="input chat__input"
          type="text"
          placeholder="Scrivi un messaggio…"
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={500}
          autoComplete="off"
          disabled={disabled}
        />
        <button
          className="btn btn--primary"
          type="submit"
          disabled={disabled || text.trim() === ''}
        >
          Invia
        </button>
      </form>
    </section>
  )
}