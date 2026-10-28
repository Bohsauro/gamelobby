import type { ReactNode } from 'react'

export type BadgeTone = 'ok' | 'warn' | 'info' | 'accent' | 'muted'

export function Badge({
  tone = 'muted',
  children,
}: {
  tone?: BadgeTone
  children: ReactNode
}) {
  return (
    <span className={`badge badge--${tone}`}>
      <span className="badge__dot" aria-hidden="true" />
      {children}
    </span>
  )
}