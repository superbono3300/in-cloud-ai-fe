import { useState } from 'react'
import type { ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import './MarkdownAnswer.css'

type MarkdownAnswerProps = {
  content: string
}

type CodeBlockProps = {
  code: ReactNode
  rawCode: string
  language: string
  className?: string
}

function extractText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node)
  }

  if (!node) {
    return ''
  }

  if (Array.isArray(node)) {
    return node.map(extractText).join('')
  }

  if (typeof node === 'object' && 'props' in node) {
    return extractText((node as { props?: { children?: ReactNode } }).props?.children)
  }

  return ''
}

function CodeBlock({ code, rawCode, language, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(rawCode)
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
        <code className={className}>{code}</code>
      </pre>
    </div>
  )
}

export function MarkdownAnswer({ content }: MarkdownAnswerProps) {
  return (
    <div className="markdown-answer">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          code({ className, children }) {
            const text = extractText(children).replace(/\n$/, '')
            const language = className?.replace('language-', '') ?? ''
            const isBlock = Boolean(className?.includes('language-')) || text.includes('\n')

            if (!isBlock) {
              return <code className="markdown-inline-code">{children}</code>
            }

            return <CodeBlock code={children} rawCode={text} language={language} className={className} />
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
