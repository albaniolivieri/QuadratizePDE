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
  format?: 'sympy' | 'mathematica' | 'latex'
  diff_ord?: number
  search_alg: 'bnb' | 'inn'
  sort_fun: 'by_fun' | 'by_degree_order' | 'by_order_degree'
  nvars_bound: number
  show_nodes: boolean
}

export type QuadratizeResponse = {
  aux_vars: string[]
  frac_vars: string[]
  quad_sys: string[]
  traversed?: number | null
  quadratize_compute_ms?: number | null
  evolution_var?: string | null
  spatial_var?: string | null
  evolution_var_latex?: string | null
  spatial_var_latex?: string | null
  latex_output?: {
    aux_vars?: string[]
    frac_vars?: string[]
    quad_sys?: string[]
  }
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

function detailToMessage(detail: unknown): string {
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail
      .map((item) => (typeof item === 'object' && item && 'msg' in item ? String((item as { msg: unknown }).msg) : String(item)))
      .filter(Boolean)
      .join('; ')
  }
  if (detail != null && typeof detail === 'object' && 'msg' in detail) {
    return String((detail as { msg: unknown }).msg)
  }
  return ''
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response
      .json()
      .then((data) => detailToMessage(data?.detail) || detailToMessage(data?.message))
      .catch(() => '')
    throw new Error(message.trim() || `Request failed (${response.status})`)
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

/** Shown when the browser cannot complete the request (e.g. network/CORS); avoids raw "Failed to fetch". */
const QUADRATIZE_FETCH_FAILED_CUSTOM =
  'There is an error in the formula for the equations.'
const QUADRATIZE_FETCH_FAILED_EXAMPLE =
  'There was an error while finding the quadratization.'

function isFailedFetchError(err: unknown): boolean {
  return err instanceof Error && /failed to fetch/i.test(err.message)
}

export async function quadratize(payload: QuadratizeRequest): Promise<QuadratizeResponse> {
  try {
    const response = await fetch(`${API_BASE}/api/quadratize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return handleResponse<QuadratizeResponse>(response)
  } catch (err) {
    if (isFailedFetchError(err)) {
      const message =
        payload.mode === 'custom' ? QUADRATIZE_FETCH_FAILED_CUSTOM : QUADRATIZE_FETCH_FAILED_EXAMPLE
      throw new Error(message)
    }
    throw err
  }
}

export async function fetchHealth(): Promise<'healthy' | string> {
  const response = await fetch(`${API_BASE}/health`)
  return handleResponse<{ status: string }>(response).then((data) => data.status)
}
