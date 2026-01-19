import { useEffect, useMemo, useState } from 'react'
import './App.css'
import 'katex/dist/katex.min.css'

import {
  fetchExampleDetail,
  fetchExamples,
  fetchHealth,
  quadratize,
  type ExampleDetail,
  type ExampleSummary,
  type QuadratizeResponse,
} from './services/api'
import { ExampleTab } from './components/ExampleTab'
import { CustomPDETab } from './components/CustomPDETab'
import { ResultsDisplay } from './components/ResultsDisplay'
import type { AdvancedOptionsValue } from './components/AdvancedOptions'

const defaultAdvanced: AdvancedOptionsValue = {
  search_alg: 'bnb',
  sort_fun: 'by_fun',
  max_der_order: 2,
  nvars_bound: 10,
  show_nodes: false,
}

const defaultCustomInputs = {
  format: 'sympy' as const,
  vars: 't,x',
  funcs: 'u',
  equations: '',
}

function App() {
  const [apiStatus, setApiStatus] = useState<string>('checking')
  const [activeTab, setActiveTab] = useState<'examples' | 'custom'>('examples')
  const [examples, setExamples] = useState<ExampleSummary[]>([])
  const [selectedExampleId, setSelectedExampleId] = useState<string | null>(null)
  const [selectedExample, setSelectedExample] = useState<ExampleDetail | null>(null)
  const [examplesError, setExamplesError] = useState<string | null>(null)

  const [exampleDiffOrd, setExampleDiffOrd] = useState<number>(2)
  const [customDiffOrd, setCustomDiffOrd] = useState<number>(2)
  const [customInputs, setCustomInputs] = useState(defaultCustomInputs)

  const [advancedOptions, setAdvancedOptions] = useState<AdvancedOptionsValue>(defaultAdvanced)
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const [results, setResults] = useState<QuadratizeResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchHealth()
      .then(setApiStatus)
      .catch(() => setApiStatus('error'))
  }, [])

  useEffect(() => {
    fetchExamples()
      .then((data) => {
        setExamples(data)
        if (data.length) {
          setSelectedExampleId((prev) => prev ?? data[0].id)
        }
        setExamplesError(null)
      })
      .catch((err) => setExamplesError(err.message))
  }, [])

  useEffect(() => {
    if (!selectedExampleId) {
      setSelectedExample(null)
      return
    }
    fetchExampleDetail(selectedExampleId)
      .then((detail) => {
        setSelectedExample(detail)
        setExampleDiffOrd(detail.diff_ord)
      })
      .catch((err) => setExamplesError(err.message))
  }, [selectedExampleId])

  const handleQuadratizeExample = async () => {
    if (!selectedExampleId) {
      setError('Select an example to quadratize.')
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const response = await quadratize({
        mode: 'example',
        example_id: selectedExampleId,
        diff_ord: exampleDiffOrd,
        ...advancedOptions,
      })
      setResults(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Quadratization failed.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuadratizeCustom = async () => {
    const equations = customInputs.equations
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    if (!customInputs.vars || !customInputs.funcs || equations.length === 0) {
      setError('Provide variables, functions, and at least one equation.')
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const response = await quadratize({
        mode: 'custom',
        equations,
        vars: customInputs.vars,
        funcs: customInputs.funcs,
        format: customInputs.format,
        diff_ord: customDiffOrd,
        ...advancedOptions,
      })
      setResults(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Quadratization failed.')
    } finally {
      setIsLoading(false)
    }
  }

  const tabSubtitle = useMemo(() => {
    return activeTab === 'examples'
      ? 'Run a curated PDE example and tweak the differentiation order.'
      : 'Paste your own PDEs in SymPy or Mathematica syntax.'
  }, [activeTab])

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <p className="kicker">QuadratizePDE</p>
          <h1>Quadratize partial differential equations with clarity.</h1>
          <p className="subtitle">{tabSubtitle}</p>
        </div>
        <div className="status-card">
          <span>API</span>
          <strong className={apiStatus === 'healthy' ? 'healthy' : 'error'}>
            {apiStatus}
          </strong>
        </div>
      </header>

      <div className="tabs">
        <button
          className={`tab-button ${activeTab === 'examples' ? 'active' : ''}`}
          type="button"
          onClick={() => setActiveTab('examples')}
        >
          Examples
        </button>
        <button
          className={`tab-button ${activeTab === 'custom' ? 'active' : ''}`}
          type="button"
          onClick={() => setActiveTab('custom')}
        >
          Custom PDE
        </button>
        {examplesError ? <span className="inline-alert">{examplesError}</span> : null}
      </div>

      <section className="workspace">
        {activeTab === 'examples' ? (
          <ExampleTab
            examples={examples}
            selectedId={selectedExampleId}
            detail={selectedExample}
            diffOrd={exampleDiffOrd}
            onSelect={setSelectedExampleId}
            onDiffOrdChange={setExampleDiffOrd}
            advancedOpen={advancedOpen}
            advancedOptions={advancedOptions}
            onAdvancedToggle={() => setAdvancedOpen((prev) => !prev)}
            onAdvancedChange={setAdvancedOptions}
            onSubmit={handleQuadratizeExample}
            isLoading={isLoading}
          />
        ) : (
          <CustomPDETab
            inputs={customInputs}
            diffOrd={customDiffOrd}
            onInputsChange={setCustomInputs}
            onDiffOrdChange={setCustomDiffOrd}
            advancedOpen={advancedOpen}
            advancedOptions={advancedOptions}
            onAdvancedToggle={() => setAdvancedOpen((prev) => !prev)}
            onAdvancedChange={setAdvancedOptions}
            onSubmit={handleQuadratizeCustom}
            isLoading={isLoading}
          />
        )}
      </section>

      <section className="results">
        <ResultsDisplay results={results} error={error} isLoading={isLoading} />
      </section>
    </div>
  )
}

export default App
