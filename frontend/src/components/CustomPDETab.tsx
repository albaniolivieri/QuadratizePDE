import type { ChangeEvent } from 'react'
import type { AdvancedOptionsValue } from './AdvancedOptions'
import { AdvancedOptions } from './AdvancedOptions'

type CustomInputs = {
  format: 'sympy' | 'mathematica'
  vars: string
  funcs: string
  equations: string
}

type CustomPDETabProps = {
  inputs: CustomInputs
  diffOrd: number
  onInputsChange: (inputs: CustomInputs) => void
  onDiffOrdChange: (value: number) => void
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
      <div className="panel-grid">
        <label>
          Format
          <select value={inputs.format} onChange={handleChange('format')}>
            <option value="sympy">SymPy</option>
            <option value="mathematica">Mathematica</option>
          </select>
        </label>
        <label>
          Differentiation Order
          <input
            type="number"
            min={1}
            max={6}
            value={diffOrd}
            onChange={(event) => onDiffOrdChange(Number(event.target.value))}
          />
        </label>
        <label>
          Independent Variables
          <input
            type="text"
            placeholder="t,x"
            value={inputs.vars}
            onChange={handleChange('vars')}
          />
        </label>
        <label>
          Functions
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
            placeholder="Derivative(u(t,x), t) = Derivative(u(t,x),(x,2)) + u(t,x) - u(t,x)**3"
            value={inputs.equations}
            onChange={handleChange('equations')}
          />
          <span className="hint">Separate multiple equations with new lines.</span>
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
