import { Logo } from '@/components/site/logo'

export const metadata = {
  title: 'Админ · SOCIALTOOL.STORE',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F5F9FF]">
      {children}
    </div>
  )
}
