import './ImagePreviewModal.css'

type ImagePreviewModalProps = {
  url: string | null
  onClose: () => void
}

export function ImagePreviewModal({ url, onClose }: ImagePreviewModalProps) {
  if (!url) return null
  return (
    <div className="image-preview-overlay" onClick={onClose}>
      <div className="image-preview-modal" onClick={e => e.stopPropagation()}>
        <img src={url} alt="미리보기" />
        <button className="image-preview-close" onClick={onClose} aria-label="닫기">×</button>
      </div>
    </div>
  )
}
