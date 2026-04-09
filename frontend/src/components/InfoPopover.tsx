import type { CSSProperties } from 'react'
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'

export const DIFF_ORDER_INFO =
  'The differential order refers to the maximal spatial-derivative order of the dependent variables in the resulting quadratic PDE system. The default value is 3 times the order of the highest derivative in the equations'

export const SEARCH_ALG_INFO =
  'Choose the discrete optimization algorithm to search for a quadratization.'

type InfoPopoverProps = {
  content: string
  /** Accessible name for the trigger button */
  label?: string
}

export function InfoPopover({ content, label = 'More information' }: InfoPopoverProps) {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const panelId = useId()
  const [fixedStyle, setFixedStyle] = useState<CSSProperties>({})

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current
    if (!anchor || !open) return
    const rect = anchor.getBoundingClientRect()
    const gap = 10
    setFixedStyle({
      position: 'fixed',
      left: rect.left + rect.width / 2,
      top: rect.top - gap,
      transform: 'translate(-50%, -100%)',
      zIndex: 2000,
    })
  }, [open])

  useLayoutEffect(() => {
    if (!open) return
    updatePosition()
    const ro = new ResizeObserver(() => updatePosition())
    if (anchorRef.current) ro.observe(anchorRef.current)
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      ro.disconnect()
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open, updatePosition])

  useEffect(() => {
    if (!open) return
    const onDocDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (anchorRef.current?.contains(t)) return
      if (panelRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDocDown)
    return () => document.removeEventListener('mousedown', onDocDown)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const panel = open ? (
    <div
      ref={panelRef}
      className="info-popover info-popover--fixed"
      id={panelId}
      style={fixedStyle}
      role="tooltip"
    >
      <button
        type="button"
        className="info-popover-close"
        aria-label="Close"
        onClick={() => setOpen(false)}
      >
        ×
      </button>
      <p className="info-popover-text">{content}</p>
    </div>
  ) : null

  return (
    <>
      <div className="info-popover-anchor" ref={anchorRef}>
        <button
          type="button"
          className="info-popover-trigger"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          aria-label={label}
          onClick={() => setOpen((o) => !o)}
        >
          i
        </button>
      </div>
      {typeof document !== 'undefined' && panel ? createPortal(panel, document.body) : null}
    </>
  )
}
