import type { WsStatus } from '../lib/ws'

const STATUS_LABEL: Record<WsStatus, { text: string; cls: string }> = {
  connecting: { text: 'Connessione…', cls: 'status-banner--muted' },
  open: { text: 'Connesso', cls: 'status-banner--ok' },
  reconnecting: { text: 'Riconnessione…', cls: 'status-banner--warn' },
  closed: { text: 'Offline', cls: 'status-banner--danger' },
}

export function StatusBanner({ status }: { status: WsStatus }) {
  const label = STATUS_LABEL[status]
  return (
    <span className={`status-banner ${label.cls}`} role="status" aria-live="polite">
      <span className="status-banner__dot" aria-hidden="true" />
      {label.text}
    </span>
  )
}