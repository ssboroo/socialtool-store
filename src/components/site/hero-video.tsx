'use client'
import { useEffect, useRef, useState } from 'react'
export function HeroVideo({src,poster}:{src:string;poster?:string}) {
 const ref=useRef<HTMLVideoElement>(null)
 const [failed,setFailed]=useState(false)
 useEffect(()=>{
   const media=window.matchMedia('(prefers-reduced-motion: reduce)')
   const update=()=>{if(media.matches)ref.current?.pause();else void ref.current?.play().catch(()=>{})}
   update();media.addEventListener('change',update)
   return()=>media.removeEventListener('change',update)
 },[src])
 return failed?<div role="status" className="p-4">{poster&&<img src={poster} alt="Нүүрний баннер" className="w-full"/>}<p>Видео ачаалсангүй.</p></div>:<video ref={ref} src={src} poster={poster} muted loop playsInline controls preload="metadata" onError={()=>setFailed(true)} className="hero-wide-video" aria-label="Socialtool танилцуулга видео"/>
}
