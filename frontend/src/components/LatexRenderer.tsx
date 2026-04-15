import { BlockMath, InlineMath } from 'react-katex'

export type DerivativeLabels = {
  evolutionVar: string
  spatialVar: string
  /** LaTeX for \\partial denominator; when omitted, derived from the ASCII names. */
  evolutionVarLatex?: string
  spatialVarLatex?: string
}

type LatexRendererProps = {
  latex: string
  inline?: boolean
  derivativeLabels?: DerivativeLabels | null
}

function partialPow(n: number) {
  return n > 1 ? `^{${n}}` : ''
}

function textInMathVar(name: string): string {
  if (/^[a-zA-Z]$/.test(name)) return name
  return `\\text{${name.replace(/\\/g, '\\\\').replace(/}/g, '\\}').replace(/%/g, '\\%')}}`
}
function rewriteWithDerivativeLabels(
  full: string,
  name: string,
  sub: string,
  labels: DerivativeLabels
): string {
  const { evolutionVar, spatialVar } = labels
  const denSpatial = labels.spatialVarLatex ?? textInMathVar(spatialVar)
  const denEvolution = labels.evolutionVarLatex ?? textInMathVar(evolutionVar)
  if (!sub) return full

  for (let order = 40; order >= 1; order -= 1) {
    const suf = `${spatialVar}${order}`
    if (sub.endsWith(suf)) {
      const prefix = sub.slice(0, sub.length - suf.length)
      const baseVar = prefix ? `${name}_{${prefix}}` : name
      const den = denSpatial
      const np = partialPow(order)
      const dp = partialPow(order)
      return `\\frac{\\partial${np} ${baseVar}}{\\partial ${den}${dp}}`
    }
  }

  if (sub.endsWith(evolutionVar)) {
    const prefix = sub.slice(0, sub.length - evolutionVar.length)
    const baseVar = prefix ? `${name}_{${prefix}}` : name
    const den = denEvolution
    return `\\frac{\\partial ${baseVar}}{\\partial ${den}}`
  }

  return full
}

function rewriteLegacyXtSubscript(
  full: string,
  name: string,
  bracedSub: string | undefined,
  bareSub: string | undefined
) {
  const sub = (bracedSub ?? bareSub ?? '').trim()
  if (!sub) return full

  const idx = sub.search(/[xt]/)
  if (idx < 0) return full

  const derivVar = sub[idx] as 'x' | 't'
  const prefix = sub.slice(0, idx).trim()
  const tail = sub.slice(idx).trim()

  let order: number
  if (tail === derivVar) {
    order = 1
  } else {
    const m = tail.match(new RegExp(`^${derivVar}(\\d+)$`))
    if (!m) return full
    order = Number.parseInt(m[1], 10)
    if (!Number.isFinite(order) || order < 1) return full
  }

  const baseVar = prefix ? `${name}_{${prefix}}` : name
  return `\\frac{\\partial${partialPow(order)} ${baseVar}}{\\partial ${derivVar}${partialPow(order)}}`
}

function rewriteOneDerivativeSubscript(
  full: string,
  name: string,
  bracedSub: string | undefined,
  bareSub: string | undefined,
  labels?: DerivativeLabels | null
) {
  const sub = (bracedSub ?? bareSub ?? '').trim()
  if (labels?.evolutionVar && labels?.spatialVar) {
    const out = rewriteWithDerivativeLabels(full, name, sub, labels)
    if (out !== full) return out
  }
  return rewriteLegacyXtSubscript(full, name, bracedSub, bareSub)
}

/** Normalizes qupde/SymPy subscript-style derivatives for KaTeX and copy-to-clipboard. */
export function rewriteDerivativeLikeSubscripts(input: string, labels?: DerivativeLabels | null) {
  const reCommand = /(\\[A-Za-z]+)_(?:\{([^}]+)\}|([A-Za-z0-9]+))/g
  const rePlain = /(?<![\\{])([A-Za-z]+)_(?:\{([^}]+)\}|([A-Za-z0-9]+))/g

  return input
    .replace(reCommand, (full, cmdName, braced, bare) =>
      rewriteOneDerivativeSubscript(full, cmdName, braced, bare, labels)
    )
    .replace(rePlain, (full, wordName, braced, bare) =>
      rewriteOneDerivativeSubscript(full, wordName, braced, bare, labels)
    )
}

export function LatexRenderer({ latex, inline = false, derivativeLabels = null }: LatexRendererProps) {
  if (!latex) {
    return <span className="muted">No LaTeX provided.</span>
  }

  const normalized = rewriteDerivativeLikeSubscripts(latex, derivativeLabels)
  return inline ? <InlineMath math={normalized} /> : <BlockMath math={normalized} />
}
