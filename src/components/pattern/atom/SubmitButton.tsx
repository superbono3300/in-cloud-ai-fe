type SubmitButtonProps = {
  disabled: boolean
  loading: boolean
  onStop: () => void
}

export function SubmitButton({ disabled, loading, onStop }: SubmitButtonProps) {
  if (loading) {
    return (
      <button type="button" className="stop-button" onClick={onStop}>
        ■ 중지
      </button>
    )
  }

  return (
    <button type="submit" disabled={disabled}>
      전송
    </button>
  )
}
