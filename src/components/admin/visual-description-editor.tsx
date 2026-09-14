'use client'
import { useEffect, useRef } from 'react'
import { MDXEditor, type MDXEditorMethods, type Translation, headingsPlugin, listsPlugin, quotePlugin, linkPlugin, linkDialogPlugin, toolbarPlugin, markdownShortcutPlugin, UndoRedo, BoldItalicUnderlineToggles, BlockTypeSelect, ListsToggle, CreateLink } from '@mdxeditor/editor'
import '@mdxeditor/editor/style.css'
import '@/components/site/description-typography.css'
const labels:Record<string,string>={
  'toolbar.undo':'Буцаах {{shortcut}}','toolbar.redo':'Дахин хийх {{shortcut}}',
  'toolbar.bold':'Тод','toolbar.removeBold':'Тодруулгыг арилгах',
  'toolbar.italic':'Налуу','toolbar.removeItalic':'Налууг арилгах',
  'toolbar.bulletedList':'Цэгтэй жагсаалт','toolbar.numberedList':'Дугаартай жагсаалт',
  'toolbar.blockTypes.paragraph':'Энгийн текст · 16px','toolbar.blockTypes.quote':'Эшлэл',
  'toolbar.blockTypeSelect.selectBlockTypeTooltip':'Текстийн хэмжээ / гарчиг','toolbar.createLink':'Холбоос нэмэх',
}
const translate:Translation=(key,fallback,values)=>{
  if(key==='toolbar.blockTypes.heading')return `Гарчиг ${values?.level} · ${{1:24,2:20,3:18}[values?.level as 1|2|3]||16}px`
  return (labels[key]||fallback).replace(/\{\{(\w+)\}\}/g,(_,name)=>String(values?.[name]??''))
}
export default function VisualDescriptionEditor({ value,onChange,large=false,onError }:{value:string;onChange:(value:string)=>void;large?:boolean;onError?:()=>void}) {
  const ref=useRef<MDXEditorMethods>(null)
  const latest=useRef(value)
  useEffect(()=>{if(latest.current!==value){ref.current?.setMarkdown(value);latest.current=value}},[value])
  return <MDXEditor ref={ref} markdown={value} translation={translate} onError={onError} onChange={(text,initialNormalize)=>{if(initialNormalize)return;latest.current=text;onChange(text)}} contentEditableClassName={`description-copy overflow-y-auto px-5 py-4 ${large?'min-h-[60vh] max-h-[70vh]':'min-h-80 max-h-[480px]'}`} plugins={[headingsPlugin({allowedHeadingLevels:[1,2,3]}),listsPlugin(),quotePlugin(),linkPlugin(),linkDialogPlugin(),toolbarPlugin({toolbarContents:()=><><UndoRedo/><BoldItalicUnderlineToggles options={['Bold','Italic']}/><BlockTypeSelect/><ListsToggle/><CreateLink/></>}),markdownShortcutPlugin()]}/>
}
