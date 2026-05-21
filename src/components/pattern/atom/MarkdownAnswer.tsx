import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './MarkdownAnswer.css'

type MarkdownAnswerProps = {
  content: string
}

type CodeBlockProps = {
  code: string
  language: string
}

function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="markdown-codeblock">
      <div className="markdown-codeblock-header">
        <span className="markdown-code-lang">{language || 'code'}</span>
        <button
          type="button"
          className="markdown-copy-btn"
          onClick={copyToClipboard}
          aria-label="코드 복사"
        >
          {copied ? '복사됨' : '복사'}
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  )
}

export function MarkdownAnswer({ content }: MarkdownAnswerProps) {
  return (
    <div className="markdown-answer">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children }) {
            const text = String(children ?? '').replace(/\n$/, '')
            const language = className?.replace('language-', '') ?? ''
            const isBlock = Boolean(className?.includes('language-')) || text.includes('\n')

            if (!isBlock) {
              return <code className="markdown-inline-code">{children}</code>
            }

            return <CodeBlock code={text} language={language} />
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
