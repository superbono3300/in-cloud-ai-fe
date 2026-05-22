type SubmitButtonProps = {
  disabled: boolean
  loading: boolean
  onStop: () => void
}

export function SubmitButton({ disabled, loading, onStop }: SubmitButtonProps) {
  if (loading) {
    return (
      <button type="button" className="chat-submit-button stop-button" onClick={onStop}>
        <span className="chat-submit-label">■ 중지</span>
      </button>
    )
  }

  return (
    <button type="submit" className="chat-submit-button" disabled={disabled}>
      <span className="chat-submit-label">전송</span>
    </button>
  )
}
