import type { ExampleDetail, ExampleSummary } from '../services/api'
import { LatexRenderer } from './LatexRenderer'
import type { AdvancedOptionsValue } from './AdvancedOptions'
import { AdvancedOptions } from './AdvancedOptions'

type ExampleTabProps = {
  examples: ExampleSummary[]
  selectedId: string | null
  detail: ExampleDetail | null
  diffOrd: number
  onSelect: (id: string) => void
  onDiffOrdChange: (value: number) => void
  advancedOpen: boolean
  advancedOptions: AdvancedOptionsValue
  onAdvancedToggle: () => void
  onAdvancedChange: (value: AdvancedOptionsValue) => void
  onSubmit: () => void
  isLoading: boolean
}

export function ExampleTab({
  examples,
  selectedId,
  detail,
  diffOrd,
  onSelect,
  onDiffOrdChange,
  advancedOpen,
  advancedOptions,
  onAdvancedToggle,
  onAdvancedChange,
  onSubmit,
  isLoading,
}: ExampleTabProps) {
  return (
    <div className="tab-panel">
      <div className="panel-grid">
        <label className="full">
          Example
          <select
            value={selectedId ?? ''}
            onChange={(event) => onSelect(event.target.value)}
          >
            <option value="" disabled>
              Select an example
            </option>
            {examples.map((example) => (
              <option key={example.id} value={example.id}>
                {example.name}
              </option>
            ))}
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
        <div className="helper-card">
          <h4>Description</h4>
          <p>{detail?.description || 'Select an example to see details.'}</p>
        </div>
        <div className="helper-card">
          <h4>Equations Preview</h4>
          {detail?.equations_latex?.length ? (
            detail.equations_latex.map((eq, index) => (
              <LatexRenderer key={`${detail.id}-${index}`} latex={eq} />
            ))
          ) : (
            <p className="muted">No equations available.</p>
          )}
        </div>
      </div>

      <AdvancedOptions
        open={advancedOpen}
        onToggle={onAdvancedToggle}
        value={advancedOptions}
        onChange={onAdvancedChange}
      />

      <button className="primary-button" type="button" onClick={onSubmit} disabled={isLoading || !selectedId}>
        {isLoading ? 'Quadratizing...' : 'Quadratize'}
      </button>
    </div>
  )
}
