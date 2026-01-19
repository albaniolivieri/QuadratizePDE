export type ExampleSummary = {
  id: string
  name: string
  description: string
  diff_ord: number
  first_indep: string
  equations_latex?: string[]
}

export type ExampleDetail = ExampleSummary & {
  equations: string[]
  vars: string
  funcs: string
}

export type QuadratizeRequest = {
  mode: 'example' | 'custom'
  example_id?: string
  equations?: string[]
  vars?: string
  funcs?: string
  format?: 'sympy' | 'mathematica'
  diff_ord: number
  search_alg: 'bnb' | 'inn'
  sort_fun: 'by_fun' | 'by_degree_order' | 'by_order_degree'
  max_der_order: number
  nvars_bound: number
  show_nodes: boolean
}

export type QuadratizeResponse = {
  aux_vars: string[]
  frac_vars: string[]
  quad_sys: string[]
  traversed?: number | null
  latex_output?: {
    aux_vars?: string[]
    frac_vars?: string[]
    quad_sys?: string[]
  }
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response
      .json()
      .then((data) => data.detail || data.message)
      .catch(() => null)
    throw new Error(message || `Request failed (${response.status})`)
  }
  return response.json() as Promise<T>
}

export async function fetchExamples(): Promise<ExampleSummary[]> {
  const response = await fetch(`${API_BASE}/api/examples`)
  return handleResponse<ExampleSummary[]>(response)
}

export async function fetchExampleDetail(id: string): Promise<ExampleDetail> {
  const response = await fetch(`${API_BASE}/api/examples/${id}`)
  return handleResponse<ExampleDetail>(response)
}

export async function quadratize(payload: QuadratizeRequest): Promise<QuadratizeResponse> {
  const response = await fetch(`${API_BASE}/api/quadratize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse<QuadratizeResponse>(response)
}

export async function fetchHealth(): Promise<'healthy' | string> {
  const response = await fetch(`${API_BASE}/health`)
  return handleResponse<{ status: string }>(response).then((data) => data.status)
}
