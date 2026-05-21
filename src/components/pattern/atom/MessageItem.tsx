type MessageItemProps = {
  role: 'user' | 'assistant' | 'system'
  content: string
}

const roleLabelMap: Record<string, string> = {
  'user': '사용자',
  'assistant': 'AI',
  'system': '시스템',
}

export function MessageItem({ role, content }: MessageItemProps) {
  return (
    <article className={`chat-item ${role}`}>
      <h2>{roleLabelMap[role]}</h2>
      <p>{content}</p>
    </article>
  )
}
