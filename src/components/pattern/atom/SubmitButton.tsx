type SubmitButtonProps = {
  disabled: boolean
  loading: boolean
  onStop: () => void
}

export function SubmitButton({ disabled, loading, onStop }: SubmitButtonProps) {
  if (loading) {
    return (
      <button type="button" className="chat-submit-button stop-button" onClick={onStop}>
        <span className="chat-submit-icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor"/>
          </svg>
        </span>
      </button>
    )
  }

  return (
    <button
      type="submit"
      className="chat-submit-button"
      disabled={disabled}
      aria-label="메시지 전송"
      title="전송"
    >
      <span className="chat-submit-icon" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3.5 11.5L20.5 4.5L13.5 21.5L11.2 13.8L3.5 11.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
          <path d="M11.2 13.8L20.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
    </button>
  )
}
