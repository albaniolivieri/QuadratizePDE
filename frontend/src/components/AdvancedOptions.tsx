import type { ChangeEvent } from 'react'

export type AdvancedOptionsValue = {
  search_alg: 'bnb' | 'inn'
  sort_fun: 'by_fun' | 'by_degree_order' | 'by_order_degree'
  max_der_order: number
  nvars_bound: number
  show_nodes: boolean
}

type AdvancedOptionsProps = {
  open: boolean
  onToggle: () => void
  value: AdvancedOptionsValue
  onChange: (value: AdvancedOptionsValue) => void
}

export function AdvancedOptions({ open, onToggle, value, onChange }: AdvancedOptionsProps) {
  const handleNumberChange = (field: keyof AdvancedOptionsValue) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue = Number(event.target.value)
      onChange({ ...value, [field]: Number.isNaN(nextValue) ? 0 : nextValue })
    }

  return (
    <div className="advanced">
      <button className="ghost-button" type="button" onClick={onToggle}>
        {open ? 'Hide advanced options' : 'Show advanced options'}
      </button>
      <div className={`advanced-panel ${open ? 'open' : ''}`}>
        <div className="advanced-grid">
          <label>
            Search Algorithm
            <select
              value={value.search_alg}
              onChange={(event) => onChange({ ...value, search_alg: event.target.value as AdvancedOptionsValue['search_alg'] })}
              title="Branch and bound or iterative node-narrowing"
            >
              <option value="bnb">bnb</option>
              <option value="inn">inn</option>
            </select>
          </label>
          <label>
            Sort Function
            <select
              value={value.sort_fun}
              onChange={(event) => onChange({ ...value, sort_fun: event.target.value as AdvancedOptionsValue['sort_fun'] })}
              title="Sorting heuristic for candidate monomials"
            >
              <option value="by_fun">by_fun</option>
              <option value="by_degree_order">by_degree_order</option>
              <option value="by_order_degree">by_order_degree</option>
            </select>
          </label>
          <label>
            Max Derivative Order
            <input
              type="number"
              min={1}
              max={10}
              value={value.max_der_order}
              onChange={handleNumberChange('max_der_order')}
            />
          </label>
          <label>
            Nvars Bound
            <input
              type="number"
              min={1}
              max={50}
              value={value.nvars_bound}
              onChange={handleNumberChange('nvars_bound')}
            />
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={value.show_nodes}
              onChange={(event) => onChange({ ...value, show_nodes: event.target.checked })}
            />
            Show traversed nodes
          </label>
        </div>
      </div>
    </div>
  )
}
