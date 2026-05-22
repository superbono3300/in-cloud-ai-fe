type MessageInputProps = {
  value: string
  onChange: (value: string) => void
}

export function MessageInput({ value, onChange }: MessageInputProps) {
  return (
    <label>
      사용자 메시지
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' || event.shiftKey) {
            return
          }

          event.preventDefault()
          event.currentTarget.form?.requestSubmit()
        }}
        rows={4}
        placeholder="질문을 입력하세요"
      />
    </label>
  )
}
