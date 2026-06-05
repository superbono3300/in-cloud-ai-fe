type ModelSelectorProps = {
  value: number
  onChange: (value: number) => void
  models: Array<{ name: string; model: string }>
  loading?: boolean
}

export function ModelSelector({ value, onChange, models, loading }: ModelSelectorProps) {
  return (
    <label>
      모델
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        disabled={loading}
      >
        {loading ? (
          <option value={0}>불러오는 중...</option>
        ) : (
          models.map((m, i) => (
            <option key={m.model} value={i}>{m.name}</option>
          ))
        )}
      </select>
    </label>
  )
}
