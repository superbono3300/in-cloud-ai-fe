type ModelSelectorProps = {
  value: number
  onChange: (value: number) => void
  models: Array<{ name: string; model: string }>
}

export function ModelSelector({ value, onChange, models }: ModelSelectorProps) {
  return (
    <label>
      모델
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      >
        {models.map((m, i) => (
          <option key={m.model} value={i}>{m.name}</option>
        ))}
      </select>
    </label>
  )
}
