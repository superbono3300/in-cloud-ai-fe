type SubmitButtonProps = {
  disabled: boolean
  loading: boolean
  onStop: () => void
}

export function SubmitButton({ disabled, loading, onStop }: SubmitButtonProps) {
  if (loading) {
    return (
      <button type="button" className="chat-submit-button stop-button" onClick={onStop}>
        ■ 중지
      </button>
    )
  }

  return (
    <button type="submit" className="chat-submit-button" disabled={disabled}>
      전송
    </button>
  )
}
