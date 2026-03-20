import type { ChangeEvent } from 'react'
import type { AdvancedOptionsValue } from './AdvancedOptions'
import { AdvancedOptions } from './AdvancedOptions'

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
            Differentiation order <span className="muted">(optional)</span>
          </span>
          <input
            type="number"
            min={0}
            max={6}
            placeholder="Default is 3 * the order of the highest derivative in the equations"
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
          Equations
          <textarea
            rows={6}
            placeholder={
              inputs.format === 'latex'
                ? '\\frac{\\partial u(t,x)}{\\partial t} = \\frac{\\partial^2 u(t,x)}{\\partial x^2} + u(t,x) - u(t,x)^3'
                : inputs.format === 'mathematica'
                  ? 'D[u[t,x], t] == D[u[t,x], {x,2}] + u[t,x] - u[t,x]^3'
                  : 'Derivative(u(t,x), t) = Derivative(u(t,x),(x,2)) + u(t,x) - u(t,x)**3'
            }
            value={inputs.equations}
            onChange={handleChange('equations')}
          />
          <span className="hint">
            {inputs.format === 'latex'
              ? 'Enter equations in LaTeX (one per line).'
              : inputs.format === 'mathematica'
                ? 'Enter equations in Mathematica syntax (one per line).'
                : 'Separate multiple equations with new lines.'}
          </span>
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
    </div>
  )
}
