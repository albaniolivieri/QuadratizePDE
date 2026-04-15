import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'

import { LatexRenderer } from './LatexRenderer'

/** Canonical LaTeX example: shared with the Equations field placeholder in CustomPDETab. */
export const LATEX_EQUATION_PLACEHOLDER =
  String.raw`\frac{\partial u(t,x)}{\partial t} = \frac{\partial^2 u(t,x)}{\partial x^2} + u(t,x) - u(t,x)^3`

type LatexHelpModalProps = {
  open: boolean
  onClose: () => void
}

export function LatexHelpModal({ open, onClose }: LatexHelpModalProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => {
      panelRef.current?.focus()
    }, 0)
    return () => window.clearTimeout(t)
  }, [open])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-dialog-header">
          <h2 id={titleId} className="modal-dialog-title">
            LaTeX equation syntax
          </h2>
          <button type="button" className="modal-dialog-close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-dialog-body">
          <p className="modal-dialog-lead">
            One equation per line. This tool only supports 1D PDEs of the form: The left-hand side is a first-order
             partial derivative in one of the independent variables, and the right-hand side is the remainder of 
             the PDE, which depends only on the unknown functions and their partial derivatives with respect to 
             the other independent variable.
          </p>

          <h3 className="modal-dialog-subtitle">Example</h3>
          <div className="latex-help-preview">
            <LatexRenderer latex={LATEX_EQUATION_PLACEHOLDER} />
          </div>
          <pre className="latex-help-code" tabIndex={0}>
            {LATEX_EQUATION_PLACEHOLDER}
          </pre>

          <h3 className="modal-dialog-subtitle">Rules</h3>
          <ul className="latex-help-rules">
            <li>
              Write unknown functions with explicit arguments, for example <code className="inline-code">u(t,x)</code>
            </li>
            <li>
              Write powers after the function and its arguments,{' '} e.g.,
              <code className="inline-code">u(t,x)^3</code> or <code className="inline-code">{'u(t,x)^{3}'}</code>.
            </li>
            <li>
              Use Leibniz notation for partial derivatives, for example{' '}
              <code className="inline-code">{'\\frac{\\partial u}{\\partial t}'}</code>.
            </li>
          </ul>
        </div>
      </div>
    </div>,
    document.body
  )
}
