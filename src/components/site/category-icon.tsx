import { LayoutGrid, Facebook, Instagram, Sparkles, Music2, Monitor, ShieldCheck, Code2, Mail, Gamepad2, Cloud, ChartNoAxesCombined, FileText, PanelsTopLeft, Clapperboard, Hash, Folder, Download } from 'lucide-react'
export function CategoryIcon({name,slug=''}:{name:string;slug?:string}) {
  const value=(name+' '+slug).toLowerCase()
  const Icon=slug==='all'?LayoutGrid
    :slug==='__free'?Download
    :/facebook/.test(value)?Facebook
    :/instagram/.test(value)?Instagram
    :/windows/.test(value)?PanelsTopLeft
    :/office|бүтээмж/.test(value)?FileText
    :/vpn|аюулгүй/.test(value)?ShieldCheck
    :/cloud|storage/.test(value)?Cloud
    :/gaming|network/.test(value)?Gamepad2
    :/видео|дизайн|video|design/.test(value)?Clapperboard
    :/хөгжим|аудио|music|audio/.test(value)?Music2
    :/код|хөгжүүлэлт|code|develop/.test(value)?Code2
    :/мэйл|аккаунт|mail|account/.test(value)?Mail
    :/аналитик|маркетинг|analytic|marketing/.test(value)?ChartNoAxesCombined
    :/программ|лиценз|software|license/.test(value)?Monitor
    :/\bai\b|хиймэл/.test(value)?Sparkles
    :/twitter|^x\b/.test(value)?Hash:Folder
  return <span className="category-icon" aria-hidden="true"><Icon size={18}/></span>
}
