import ReactMarkdown from 'react-markdown'

export function ProductDescription({ text }: { text: string }) {
  return (
    <div className="product-description mt-4 min-w-0 rounded-2xl border border-[#E1EAF6] bg-[#F8FBFF] p-4 text-[15px] leading-7 text-[#334E68] shadow-[0_8px_30px_rgba(16,42,67,0.04)] sm:p-6 sm:text-base sm:leading-8 [overflow-wrap:anywhere] [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-4 [&_p]:max-w-[72ch] [&_p]:whitespace-normal [&_strong]:font-bold [&_strong]:text-[#102A43] [&_em]:italic [&_h1]:mb-3 [&_h1]:mt-8 [&_h1]:text-2xl [&_h1]:font-extrabold [&_h1]:leading-tight [&_h1]:tracking-[-0.02em] [&_h1]:text-[#102A43] [&_h2]:mb-3 [&_h2]:mt-7 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:leading-snug [&_h2]:text-[#102A43] [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:leading-snug [&_h3]:text-[#102A43] [&_ul]:my-4 [&_ul]:max-w-[72ch] [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_ol]:my-4 [&_ol]:max-w-[72ch] [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_li]:pl-1 [&_li]:leading-7 [&_li::marker]:font-semibold [&_li::marker]:text-[#1677FF] [&_a]:font-medium [&_a]:text-[#0B63CE] [&_a]:underline [&_a]:decoration-[#9CC7FF] [&_a]:underline-offset-2 [&_blockquote]:my-5 [&_blockquote]:max-w-[72ch] [&_blockquote]:rounded-r-xl [&_blockquote]:border-l-4 [&_blockquote]:border-[#1677FF] [&_blockquote]:bg-white [&_blockquote]:px-4 [&_blockquote]:py-2 [&_blockquote]:text-[#486581] [&_hr]:my-7 [&_hr]:border-[#DCE8F8] [&_pre]:my-5 [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-[#DCE8F8] [&_pre]:bg-[#102A43] [&_pre]:p-4 [&_pre]:text-sm [&_pre]:leading-6 [&_pre]:text-white [&_code]:break-words [&_code]:rounded [&_code]:bg-[#E8F1FF] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.9em] [&_code]:text-[#0B4DBA] [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit [&_table]:my-5 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm [&_th]:border [&_th]:border-[#DCE8F8] [&_th]:bg-[#EEF4FF] [&_th]:p-2.5 [&_th]:text-left [&_th]:font-bold [&_th]:text-[#102A43] [&_td]:border [&_td]:border-[#DCE8F8] [&_td]:bg-white [&_td]:p-2.5">
      <ReactMarkdown
        skipHtml
        components={{
          a: ({ children, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {text || 'Тайлбар удахгүй нэмэгдэнэ.'}
      </ReactMarkdown>
    </div>
  )
}
