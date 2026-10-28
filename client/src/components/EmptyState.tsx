import type { ReactNode } from 'react'

export function EmptyState({
  icon,
  title,
  text,
  action,
  actionLabel,
  children,
}: {
  icon?: ReactNode
  title: string
  text: string
  action?: () => void
  actionLabel?: string
  children?: ReactNode
}) {
  return (
    <div className="empty-state">
      {icon && <span className="empty-state__icon">{icon}</span>}
      <h2 className="empty-state__title">{title}</h2>
      <p className="empty-state__text">{text}</p>
      {action && actionLabel && (
        <button className="btn btn--primary" type="button" onClick={action}>
          {actionLabel}
        </button>
      )}
      {children}
    </div>
  )
}