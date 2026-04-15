import { BlockMath, InlineMath } from 'react-katex'

type LatexRendererProps = {
  latex: string
  inline?: boolean
}

function partialPow(n: number) {
  return n > 1 ? `^{${n}}` : ''
}

function rewriteOneDerivativeSubscript(
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

/** Normalizes subscript-style x/t derivatives for KaTeX and for copy-to-clipboard. */
export function rewriteDerivativeLikeSubscripts(input: string) {
  const reCommand = /(\\[A-Za-z]+)_(?:\{([^}]+)\}|([A-Za-z0-9]+))/g
  const rePlain = /(?<![\\{])([A-Za-z]+)_(?:\{([^}]+)\}|([A-Za-z0-9]+))/g

  return input
    .replace(reCommand, (full, name, braced, bare) =>
      rewriteOneDerivativeSubscript(full, name, braced, bare)
    )
    .replace(rePlain, (full, name, braced, bare) =>
      rewriteOneDerivativeSubscript(full, name, braced, bare)
    )
}

export function LatexRenderer({ latex, inline = false }: LatexRendererProps) {
  if (!latex) {
    return <span className="muted">No LaTeX provided.</span>
  }

  const normalized = rewriteDerivativeLikeSubscripts(latex)
  return inline ? <InlineMath math={normalized} /> : <BlockMath math={normalized} />
}
