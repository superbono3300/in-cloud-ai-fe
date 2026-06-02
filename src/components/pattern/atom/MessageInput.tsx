import type { RefObject } from 'react'

type MessageInputProps = {
  value: string
  onChange: (value: string) => void
  textareaRef?: RefObject<HTMLTextAreaElement | null>
}

export function MessageInput({ value, onChange, textareaRef }: MessageInputProps) {
  return (
    <label>
      사용자 메시지
      <textarea
        ref={textareaRef}
        style={{ minHeight: '350px' }}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing) {
            return
          }

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
