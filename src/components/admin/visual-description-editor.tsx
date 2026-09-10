'use client'
import { useEffect, useRef } from 'react'
import { MDXEditor, type MDXEditorMethods, headingsPlugin, listsPlugin, quotePlugin, linkPlugin, linkDialogPlugin, toolbarPlugin, markdownShortcutPlugin, UndoRedo, BoldItalicUnderlineToggles, BlockTypeSelect, ListsToggle, CreateLink, diffSourcePlugin, DiffSourceToggleWrapper } from '@mdxeditor/editor'
import '@mdxeditor/editor/style.css'
export default function VisualDescriptionEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const ref = useRef<MDXEditorMethods>(null)
  const latest = useRef(value)
  useEffect(() => { if (latest.current !== value) { ref.current?.setMarkdown(value); latest.current = value } }, [value])
  return <MDXEditor ref={ref} markdown={value} onChange={text => { latest.current = text; onChange(text) }} contentEditableClassName="min-h-64 max-h-[480px] overflow-y-auto px-5 py-4 text-base leading-7 text-slate-900 [&_strong]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_ul]:list-disc [&_ol]:list-decimal" plugins={[headingsPlugin(), listsPlugin(), quotePlugin(), linkPlugin(), linkDialogPlugin(), markdownShortcutPlugin(), diffSourcePlugin({ viewMode: 'rich-text' }), toolbarPlugin({ toolbarContents: () => <DiffSourceToggleWrapper><UndoRedo /><BoldItalicUnderlineToggles options={['Bold', 'Italic']} /><BlockTypeSelect /><ListsToggle /><CreateLink /></DiffSourceToggleWrapper> })]} />
}
