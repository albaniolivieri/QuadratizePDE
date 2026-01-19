import type { QuadratizeResponse } from '../services/api'
import { LatexRenderer } from './LatexRenderer'

type ResultsDisplayProps = {
  results: QuadratizeResponse | null
  error: string | null
  isLoading: boolean
}

function renderLatexList(items: string[] | undefined, fallback: string[]) {
  const source = items && items.length ? items : fallback
  if (!source.length) {
    return <p className="muted">No entries.</p>
  }

  return (
    <div className="equation-list">
      {source.map((item, index) => (
        <LatexRenderer key={`${item}-${index}`} latex={item} />
      ))}
    </div>
  )
}

export function ResultsDisplay({ results, error, isLoading }: ResultsDisplayProps) {
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

  const latex = results.latex_output

  return (
    <div className="results-card">
      <div className="results-header">
        <h3>Quadratization Results</h3>
        <div className="meta">
          <span>Aux vars: {results.aux_vars.length}</span>
          <span>Frac vars: {results.frac_vars.length}</span>
          <span>Quad sys size: {results.quad_sys.length}</span>
          {typeof results.traversed === 'number' ? <span>Nodes: {results.traversed}</span> : null}
        </div>
      </div>

      <section>
        <h4>Auxiliary Variables</h4>
        {renderLatexList(latex?.aux_vars, results.aux_vars)}
      </section>
      <section>
        <h4>Fractional Variables</h4>
        {renderLatexList(latex?.frac_vars, results.frac_vars)}
      </section>
      <section>
        <h4>Quadratic System</h4>
        {renderLatexList(latex?.quad_sys, results.quad_sys)}
      </section>
    </div>
  )
}
