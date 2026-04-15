import { useState } from 'react'
import type { QuadratizeResponse } from '../services/api'
import {
  LatexRenderer,
  rewriteDerivativeLikeSubscripts,
  type DerivativeLabels,
} from './LatexRenderer'

/** Split at the first comma with brace/paren depth 0 (for tuple-like LaTeX from SymPy). */
function splitLatexTupleInner(s: string): [string, string] | null {
  let depth = 0
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (c === '{' || c === '(') depth += 1
    else if (c === '}' || c === ')') depth = Math.max(0, depth - 1)
    else if (c === ',' && depth === 0) {
      const left = s.slice(0, i).trim()
      const right = s.slice(i + 1).trim()
      if (left && right) return [left, right]
      return null
    }
  }
  return null
}

/** Turn `(q_{0}, \\rho)` or `\\left( q_{0}, \\rho \\right)` into `q_{0} = \\rho`. */
function rationalFracVarLatexToAssignment(latex: string): string | null {
  let s = latex.trim()
  if (/^\\left\s*\(/.test(s) && /\\right\s*\)\s*$/.test(s)) {
    s = s.replace(/^\\left\s*\(\s*/, '(').replace(/\s*\\right\s*\)\s*$/, ')')
  }
  if (!s.startsWith('(') || !s.endsWith(')')) return null
  const inner = s.slice(1, -1)
  const parts = splitLatexTupleInner(inner)
  if (!parts) return null
  return `${parts[0]} = ${parts[1]}`
}

function formatQuadratizeDuration(ms: number) {
  if (ms < 1000) return `${Math.round(ms)} ms`
  return `${(ms / 1000).toFixed(2)} s`
}

type ResultsDisplayProps = {
  results: QuadratizeResponse | null
  error: string | null
  isLoading: boolean
  /** Wall time for the last successful `/api/quadratize` round-trip (browser → server → browser). */
  quadratizeDurationMs: number | null
}

function derivativeLabelsFromResults(results: QuadratizeResponse | null): DerivativeLabels | null {
  const ev = results?.evolution_var?.trim()
  const sp = results?.spatial_var?.trim()
  if (!ev || !sp) return null
  const labels: DerivativeLabels = { evolutionVar: ev, spatialVar: sp }
  const evL = results?.evolution_var_latex?.trim()
  const spL = results?.spatial_var_latex?.trim()
  if (evL) labels.evolutionVarLatex = evL
  if (spL) labels.spatialVarLatex = spL
  return labels
}

function renderPolynomialAuxVarsList(
  items: string[] | undefined,
  fallback: string[],
  labels: DerivativeLabels | null
) {
  const source = items && items.length ? items : fallback
  if (!source.length) {
    return <p className="muted">No polynomial auxiliary variables.</p>
  }

  return (
    <div className="equation-list">
      {source.map((item, index) => (
        <LatexRenderer
          key={`${item}-${index}`}
          latex={`w_{${index}} = ${item}`}
          derivativeLabels={labels}
        />
      ))}
    </div>
  )
}

function renderRationalAuxVarsList(
  items: string[] | undefined,
  fallback: string[],
  labels: DerivativeLabels | null
) {
  const source = items && items.length ? items : fallback
  if (!source.length) {
    return <p className="muted">No rational auxiliary variables.</p>
  }

  return (
    <div className="equation-list">
      {source.map((item, index) => {
        const assignment = rationalFracVarLatexToAssignment(item) ?? item
        return (
          <LatexRenderer key={`${item}-${index}`} latex={assignment} derivativeLabels={labels} />
        )
      })}
    </div>
  )
}

function renderLatexList(
  items: string[] | undefined,
  fallback: string[],
  labels: DerivativeLabels | null
) {
  const source = items && items.length ? items : fallback
  if (!source.length) {
    return <p className="muted">No equations to display.</p>
  }

  return (
    <div className="equation-list">
      {source.map((item, index) => (
        <LatexRenderer key={`${item}-${index}`} latex={item} derivativeLabels={labels} />
      ))}
    </div>
  )
}

async function copyTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  // Fallback for older browsers / non-secure contexts.
  const el = document.createElement('textarea')
  el.value = text
  el.setAttribute('readonly', 'true')
  el.style.position = 'fixed'
  el.style.left = '-9999px'
  document.body.appendChild(el)
  el.select()
  document.execCommand('copy')
  document.body.removeChild(el)
}

export function ResultsDisplay({
  results,
  error,
  isLoading,
  quadratizeDurationMs,
}: ResultsDisplayProps) {
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)

  if (isLoading) {
    return (
      <div className="results-card loading">
        <h3>Quadratizing…</h3>
        <p>Searching for a quadratic system. This can take a moment.</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="results-card error">
        <h3>Quadratization failed</h3>
        <p>{error}</p>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="results-card">
        <h3>Results</h3>
        <p className="muted">Run an example or custom PDE to see the quadratic system.</p>
      </div>
    )
  }

  const labels = derivativeLabelsFromResults(results)
  const latex = results.latex_output
  const latexQuadSys = latex?.quad_sys?.length ? latex.quad_sys : null
  const quadSysLatexForCopy = latexQuadSys?.map((line) => rewriteDerivativeLikeSubscripts(line, labels))
  const quadSysLatexSource = quadSysLatexForCopy?.length
    ? `\\begin{aligned}\n${quadSysLatexForCopy.join(' \\\\\n')}\n\\end{aligned}`
    : ''

  return (
    <div className="results-card">
      <div className="results-header">
        <h3>Quadratization Results</h3>
        <div className="meta">
          <span>Auxiliary variables: {results.aux_vars.length}</span>
          <span>Rational auxiliary variables: {results.frac_vars.length}</span>
          <span>Quadratic system size: {results.quad_sys.length}</span>
          {typeof results.traversed === 'number' ? <span>Traversed nodes: {results.traversed}</span> : null}
        </div>
        {quadratizeDurationMs != null ? (
          <div className="meta meta-duration">
            <span>Quadratization found by QuPDE in: {formatQuadratizeDuration(quadratizeDurationMs)}</span>
          </div>
        ) : null}
      </div>

      <section>
        <h4>Polynomial Auxiliary Variables</h4>
        {renderPolynomialAuxVarsList(latex?.aux_vars, results.aux_vars, labels)}
      </section>
      <section>
        <h4>Rational Auxiliary Variables</h4>
        {renderRationalAuxVarsList(latex?.frac_vars, results.frac_vars, labels)}
      </section>
      <section className="quadratic-system">
        <h4>Quadratic System</h4>
        <div className="quadratic-system-scroll" role="region" aria-label="Quadratic system equations">
          {renderLatexList(latex?.quad_sys, results.quad_sys, labels)}
        </div>
        <div className="results-actions">
          <button
            type="button"
            className="ghost-button"
            disabled={!quadSysLatexSource}
            onClick={async () => {
              try {
                await copyTextToClipboard(quadSysLatexSource)
                setToast({ kind: 'success', message: 'Copied LaTeX to clipboard.' })
                window.setTimeout(() => setToast(null), 1800)
              } catch {
                setToast({ kind: 'error', message: 'Copy failed.' })
                window.setTimeout(() => setToast(null), 2200)
              }
            }}
          >
            Copy LaTeX
          </button>
        </div>
      </section>
      {toast ? (
        <div className={`toast ${toast.kind === 'success' ? 'success' : 'error'}`} role="status" aria-live="polite">
          {toast.message}
        </div>
      ) : null}
    </div>
  )
}
