
export const metadata = {
  title: 'Админ · SOCIALTOOL.STORE',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="store-admin min-h-screen bg-[#F5F9FF]">
      {children}
    </div>
  )
}
