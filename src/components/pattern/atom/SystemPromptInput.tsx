type SystemPromptInputProps = {
  value: string
  onChange: (value: string) => void
}

export function SystemPromptInput({ value, onChange }: SystemPromptInputProps) {
  return (
    <label> 
      시스템 프롬프트
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="챗봇의 동작 방식을 지정합니다"
      />
    </label>
  )
}


// export function SystemPromptInput() {
//   return (
//     <label>
//     </label>
//   )
// }