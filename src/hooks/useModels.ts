import { useState, useEffect } from 'react'
import axios from 'axios'
import type { ModelConfig } from '@type'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://192.168.0.171:8000/v1'
const API_KEY = import.meta.env.VITE_API_KEY || import.meta.env.VITE_API_KEY_7B || ''

type ModelsApiData = {
  id: string
  object: string
  created?: number
  owned_by?: string
}

type ModelsApiResponse = {
  object: string
  data: ModelsApiData[]
}

type UseModelsReturn = {
  models: ModelConfig[]
  loading: boolean
  error: string | null
}

export function useModels(): UseModelsReturn {
  const [models, setModels] = useState<ModelConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchModels() {
      try {
        const response = await axios.get<ModelsApiResponse>(`${API_BASE}/models`, {
          headers: {
            'X-API-Key': API_KEY,
          },
        })

        if (cancelled) return

        const fetchedModels: ModelConfig[] = response.data.data.map((m) => ({
          name: m.id,
          model: m.id,
          apiBase: API_BASE,
          apiKey: API_KEY,
          headers: {
            'X-MS-Name': '',
            'X-Branch': 'main',
          },
        }))

        setModels(fetchedModels)
      } catch {
        if (cancelled) return
        setError('모델 목록을 불러오지 못했습니다.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchModels()

    return () => {
      cancelled = true
    }
  }, [])

  return { models, loading, error }
}
