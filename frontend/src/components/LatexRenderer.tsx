import { BlockMath, InlineMath } from 'react-katex'

type LatexRendererProps = {
  latex: string
  inline?: boolean
}

export function LatexRenderer({ latex, inline = false }: LatexRendererProps) {
  if (!latex) {
    return <span className="muted">No LaTeX provided.</span>
  }

  return inline ? <InlineMath math={latex} /> : <BlockMath math={latex} />
}
