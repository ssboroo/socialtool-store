import ReactMarkdown from 'react-markdown'

export function ProductDescription({ text }: { text: string }) {
  return (
    <div className="product-description min-w-0 text-[11px] font-medium leading-5 text-[#5E7691] [overflow-wrap:anywhere] [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-2 [&_p]:whitespace-normal [&_strong]:font-extrabold [&_strong]:text-[#102A43] [&_h1]:mb-2 [&_h1]:mt-4 [&_h1]:text-base [&_h1]:font-extrabold [&_h1]:text-[#102A43] [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-[13px] [&_h2]:font-extrabold [&_h2]:text-[#102A43] [&_h3]:mb-1.5 [&_h3]:mt-3 [&_h3]:text-[12px] [&_h3]:font-bold [&_h3]:text-[#102A43] [&_ul]:my-2.5 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_ol]:my-2.5 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_li]:leading-5 [&_li::marker]:font-bold [&_li::marker]:text-[#1677FF] [&_a]:font-semibold [&_a]:text-[#1677FF] [&_a]:underline [&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-[#1677FF] [&_blockquote]:bg-[#F6F9FD] [&_blockquote]:px-3 [&_blockquote]:py-2 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-[#102A43] [&_pre]:p-3 [&_pre]:text-[10px] [&_pre]:text-white [&_code]:break-words [&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_table]:text-[10px] [&_th]:border [&_th]:border-[#DCE8F7] [&_th]:bg-[#F3F7FC] [&_th]:p-2 [&_th]:text-left [&_td]:border [&_td]:border-[#DCE8F7] [&_td]:p-2">
      <ReactMarkdown skipHtml components={{ a: ({ children, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer">{children}</a> }}>
        {text || 'Тайлбар удахгүй нэмэгдэнэ.'}
      </ReactMarkdown>
    </div>
  )
}
