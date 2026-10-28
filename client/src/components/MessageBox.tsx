import type { ChatMessage } from '../lib/types'

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function MessageBox({
  message,
  own = false,
}: {
  message: ChatMessage
  own?: boolean
}) {
  return (
    <div className={`message${own ? ' message--own' : ''}`}>
      <div className="message__head">
        <span className="message__from">{message.from}</span>
        <time className="message__ts" dateTime={new Date(message.ts).toISOString()}>
          {formatTime(message.ts)}
        </time>
      </div>
      <p className="message__text">{message.text}</p>
    </div>
  )
}