import type { ExampleDetail, ExampleSummary } from '../services/api'
import { AdvancedOptions, type AdvancedOptionsValue } from './AdvancedOptions'
import { DIFF_ORDER_INFO, InfoPopover } from './InfoPopover'
import { LatexRenderer } from './LatexRenderer'

type ExampleTabProps = {
  examples: ExampleSummary[]
  selectedId: string | null
  detail: ExampleDetail | null
  diffOrd: number | ''
  onSelect: (id: string) => void
  onDiffOrdChange: (value: number | '') => void
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
      <p className="tab-description">Run a PDE example and select the differential order.</p>
      <div className="panel-grid panel-grid--examples">
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
          <span className="label-inline">
            Differentiation order <span className="muted">(optional)</span>
            <InfoPopover content={DIFF_ORDER_INFO} label="About differentiation order" />
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
        <div className="helper-card">
          <h4>Description</h4>
          <p>{detail?.description || 'Select an example to see details.'}</p>
        </div>
        <div className="helper-card equations-preview-card full">
          <h4>Equations preview</h4>
          <div className="equations-preview-list">
            {detail?.equations_latex?.length ? (
              detail.equations_latex.map((eq, index) => (
                <LatexRenderer key={`${detail.id}-eq-${index}`} latex={eq} />
              ))
            ) : (
              <p className="muted">No equations available.</p>
            )}
          </div>
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
