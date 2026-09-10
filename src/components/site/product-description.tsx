import ReactMarkdown from 'react-markdown'

export function ProductDescription({ text }: { text: string }) {
  return <div className="product-description min-w-0 text-base leading-8 text-[#243B53] [overflow-wrap:anywhere] [&_p]:my-4 [&_p]:whitespace-pre-line [&_strong]:font-extrabold [&_strong]:text-[#102A43] [&_em]:italic [&_h1]:text-2xl [&_h2]:text-xl [&_h3]:text-lg [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-bold [&_h1]:mt-6 [&_h2]:mt-6 [&_h3]:mt-5 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-2 [&_a]:text-blue-700 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-blue-400 [&_blockquote]:pl-4 [&_blockquote]:bg-blue-50 [&_hr]:my-6 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-slate-100 [&_pre]:p-3">
    <ReactMarkdown skipHtml components={{ a: ({ children, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer">{children}</a> }}>{text || 'Тайлбар удахгүй нэмэгдэнэ.'}</ReactMarkdown>
  </div>
}
