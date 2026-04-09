import { useEffect, useState } from 'react'
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
import { CustomPDETab, type CustomInputs } from './components/CustomPDETab'
import { AboutUsTab } from './components/AboutUsTab'
import { ResultsDisplay } from './components/ResultsDisplay'
import { LatexRenderer } from './components/LatexRenderer'
import type { AdvancedOptionsValue } from './components/AdvancedOptions'

const defaultAdvanced: AdvancedOptionsValue = {
  search_alg: 'bnb',
  sort_fun: 'by_fun',
  nvars_bound: 10,
  show_nodes: false,
}

const defaultCustomInputs: CustomInputs = {
  format: 'sympy',
  vars: 't,x',
  funcs: 'u',
  equations: '',
}

function App() {
  const [apiStatus, setApiStatus] = useState<string>('checking')
  const [activeTab, setActiveTab] = useState<'examples' | 'custom' | 'about'>('examples')
  const [examples, setExamples] = useState<ExampleSummary[]>([])
  const [selectedExampleId, setSelectedExampleId] = useState<string | null>(null)
  const [selectedExample, setSelectedExample] = useState<ExampleDetail | null>(null)
  const [examplesError, setExamplesError] = useState<string | null>(null)

  const [exampleDiffOrd, setExampleDiffOrd] = useState<number | ''>('')
  const [customDiffOrd, setCustomDiffOrd] = useState<number | ''>('')
  const [customInputs, setCustomInputs] = useState<CustomInputs>(defaultCustomInputs)

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
        setExampleDiffOrd('')
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
        ...(exampleDiffOrd !== '' && { diff_ord: exampleDiffOrd }),
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
        ...(customDiffOrd !== '' && { diff_ord: customDiffOrd }),
        ...advancedOptions,
      })
      setResults(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Quadratization failed.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <p className="kicker">QuadratizeIt</p>
          <h1>Find quadratic transformations for polynomial and rational PDEs</h1>
          <p>A quadratization for a PDE is the set of auxiliary variables introduced to rewrite 
          the right-hand side differential equations as quadratic polynomials.</p>
          <p>This tool provides a simple interface to obtain and visualize quadratizations for polynomial and rational PDEs.</p>
          <details className="header-example-dropdown">
            <summary> See an example</summary>
            <div className="header-example">
              <p className="header-example-intro">
                <em>Consider the PDE for the unknown function u(x,t) as</em>
              </p>
              <LatexRenderer
                latex={`\\frac{\\partial u}{\\partial t} = \\frac{\\partial u}{\\partial x} + u^3`}
              />
              <p className="header-example-intro">
                <em>To bring this equation into quadratic form, we define the auxiliary variable</em>
              </p>
              <LatexRenderer
                latex={`w = w(u):= u^2`}
              />
              <p className="header-example-intro">
                <em>Adding a differential equation for w(u), and rewriting the original equation in terms of w(u), we obtain the quadratic system</em>
              </p>
              <LatexRenderer
                latex={`\\begin{aligned}
                  \\frac{\\partial w}{\\partial t} &= 2u\\frac{\\partial u}{\\partial x} + 2w^2, \\\\
                  \\frac{\\partial u}{\\partial t} &= \\frac{\\partial u}{\\partial x} + uw.
                \\end{aligned}`}
              />
            </div>
          </details>

          <p className="subtitle" aria-hidden="true">&nbsp;</p>
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
        <button
          className={`tab-button ${activeTab === 'about' ? 'active' : ''}`}
          type="button"
          onClick={() => setActiveTab('about')}
        >
          About Us
        </button>
        {examplesError ? <span className="inline-alert">{examplesError}</span> : null}
      </div>

      <section className="workspace">
        {activeTab === 'examples' && (
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
        )}
        {activeTab === 'custom' && (
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
        {activeTab === 'about' && <AboutUsTab />}
      </section>

      {activeTab !== 'about' && (
        <section className="results">
          <ResultsDisplay results={results} error={error} isLoading={isLoading} />
        </section>
      )}
    </div>
  )
}

export default App
