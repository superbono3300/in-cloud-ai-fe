import { useEffect, useMemo, useRef } from 'react'
import './ImageAttachment.css'

type ImageAttachmentProps = {
  files: File[]
  onFilesChange: (files: File[]) => void
  onPreview: (url: string) => void
}

const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export function ImageAttachment({ files, onFilesChange, onPreview }: ImageAttachmentProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const previews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files],
  )

  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url))
    }
  }, [previews])

  const mergeImageFiles = (nextFiles: File[]) => {
    const imageOnly = nextFiles.filter((file) => SUPPORTED_IMAGE_TYPES.has(file.type))
    if (imageOnly.length === 0) return
    onFilesChange([...files, ...imageOnly])
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    mergeImageFiles(Array.from(e.target.files))
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (e.dataTransfer.files) {
      mergeImageFiles(Array.from(e.dataTransfer.files))
    }
  }

  const handleRemove = (idx: number) => {
    onFilesChange(files.filter((_, i) => i !== idx))
  }

  return (
    <div
      className="image-attachment"
      onDragOver={e => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div
        className="image-attachment-dropzone"
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
      >
        <div className={`image-attachment-list ${previews.length === 0 ? 'is-empty' : ''}`}>
          {previews.map((preview, idx) => {
            const key = `${preview.file.name}-${preview.file.lastModified}-${idx}`
            return (
              <div className="image-thumb" key={key}>
                <img
                  src={preview.url}
                  alt={preview.file.name}
                  onClick={(e) => {
                    e.stopPropagation()
                    onPreview(preview.url)
                  }}
                />
                <button
                  type="button"
                  className="remove-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemove(idx)
                  }}
                  aria-label="첨부 삭제"
                >
                  ×
                </button>
              </div>
            )
          })}
          {previews.length === 0 && (
            <p className="image-attachment-empty">
              <span className="image-attachment-empty-icon">+</span>
              <span className="image-attachment-empty-text">이미지를 드래그하거나 클릭하여 추가하세요.</span>
            </p>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  )
}
