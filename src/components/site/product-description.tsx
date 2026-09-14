import ReactMarkdown from 'react-markdown'
import './description-typography.css'

export function ProductDescription({ text }: { text: string }) {
  return <div className="product-description description-copy">
    <ReactMarkdown skipHtml components={{ a: ({ children, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer">{children}</a> }}>
      {text || 'Тайлбар удахгүй нэмэгдэнэ.'}
    </ReactMarkdown>
  </div>
}
