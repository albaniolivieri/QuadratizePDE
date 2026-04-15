import type { ChangeEvent } from 'react'
import { useEffect, useState } from 'react'
import { AdvancedOptions, type AdvancedOptionsValue } from './AdvancedOptions'
import { LatexHelpModal, LATEX_EQUATION_PLACEHOLDER } from './LatexHelpModal'
import { DIFF_ORDER_INFO, InfoPopover } from './InfoPopover'

export type CustomInputs = {
  format: 'sympy' | 'mathematica' | 'latex'
  vars: string
  funcs: string
  equations: string
}

type CustomPDETabProps = {
  inputs: CustomInputs
  diffOrd: number | ''
  onInputsChange: (inputs: CustomInputs) => void
  onDiffOrdChange: (value: number | '') => void
  advancedOpen: boolean
  advancedOptions: AdvancedOptionsValue
  onAdvancedToggle: () => void
  onAdvancedChange: (value: AdvancedOptionsValue) => void
  onSubmit: () => void
  isLoading: boolean
}

export function CustomPDETab({
  inputs,
  diffOrd,
  onInputsChange,
  onDiffOrdChange,
  advancedOpen,
  advancedOptions,
  onAdvancedToggle,
  onAdvancedChange,
  onSubmit,
  isLoading,
}: CustomPDETabProps) {
  const [latexHelpOpen, setLatexHelpOpen] = useState(false)

  useEffect(() => {
    if (inputs.format !== 'latex') setLatexHelpOpen(false)
  }, [inputs.format])

  const handleChange = (field: keyof CustomInputs) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      onInputsChange({ ...inputs, [field]: event.target.value })
    }

  return (
    <div className="tab-panel">
      <p className="tab-description">Paste a PDE in SymPy, Mathematica, or LaTeX syntax.</p>
      <div className="panel-grid">
        <label>
          Format
          <select value={inputs.format} onChange={handleChange('format')}>
            <option value="sympy">SymPy</option>
            <option value="mathematica">Mathematica</option>
            <option value="latex">LaTeX</option>
          </select>
        </label>
        <label>
          <span className="label-inline">
            Differential order <span className="muted">(optional)</span>
            <InfoPopover content={DIFF_ORDER_INFO} label="About the differential order" />
          </span>
          <input
            type="number"
            min={0}
            max={100}
            placeholder=""
            value={diffOrd === '' ? '' : diffOrd}
            onChange={(e) => {
              const v = e.target.value
              onDiffOrdChange(v === '' ? '' : Number(v))
            }}
          />
        </label>
        <label>
          Independent variables
          <input
            type="text"
            placeholder="t,x"
            value={inputs.vars}
            onChange={handleChange('vars')}
          />
        </label>
        <label>
          Dependent variables
          <input
            type="text"
            placeholder="u,v"
            value={inputs.funcs}
            onChange={handleChange('funcs')}
          />
        </label>
        <label className="full">
          <span className="label-inline label-inline--equations-heading">
            <span>Equations</span>
            {inputs.format === 'latex' ? (
              <button
                type="button"
                className="ghost-button latex-help-trigger"
                onClick={() => setLatexHelpOpen(true)}
              >
                LaTeX syntax help
              </button>
            ) : null}
          </span>
          <textarea
            rows={6}
            placeholder={
              inputs.format === 'latex'
                ? LATEX_EQUATION_PLACEHOLDER
                : inputs.format === 'mathematica'
                  ? 'D[u[t,x], t] == D[u[t,x], {x,2}] + u[t,x] - u[t,x]^3'
                  : 'Derivative(u(t,x), t) = Derivative(u(t,x),(x,2)) + u(t,x) - u(t,x)**3'
            }
            value={inputs.equations}
            onChange={handleChange('equations')}
          />
          <div className="field-hints">
            <span className="hint">
              One equation per line.
            </span>
            <span className="hint">
              Use explicit notation for dependent variables.
            </span>
          </div>
        </label>
      </div>

      <AdvancedOptions
        open={advancedOpen}
        onToggle={onAdvancedToggle}
        value={advancedOptions}
        onChange={onAdvancedChange}
      />

      <button className="primary-button" type="button" onClick={onSubmit} disabled={isLoading}>
        {isLoading ? 'Quadratizing...' : 'Quadratize'}
      </button>

      <LatexHelpModal open={latexHelpOpen} onClose={() => setLatexHelpOpen(false)} />
    </div>
  )
}
