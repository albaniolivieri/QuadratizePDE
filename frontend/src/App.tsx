import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [apiStatus, setApiStatus] = useState<string>('checking...')

  useEffect(() => {
    fetch('http://localhost:8000/health')
      .then(res => res.json())
      .then(data => setApiStatus(data.status))
      .catch(() => setApiStatus('error'))
  }, [])

  return (
    <div className="App">
      <header className="App-header">
        <h1>QuadratizePDE</h1>
        <p>A web app for quadratizing PDEs</p>
        <div className="status">
          API Status: <span className={apiStatus === 'healthy' ? 'healthy' : 'error'}>
            {apiStatus}
          </span>
        </div>
      </header>
      <main>
        <div className="input-section">
          <h2>Enter your PDE</h2>
          <textarea
            placeholder="e.g., u_t = u_xx + u - u^3"
            rows={4}
          />
          <button>Quadratize</button>
        </div>
      </main>
    </div>
  )
}

export default App
