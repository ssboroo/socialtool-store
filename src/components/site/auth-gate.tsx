'use client'

import { useUIStore } from '@/store/cart'
import { useCustomer } from '@/hooks/use-customer'
import { AuthModal } from './auth-modal'
import { AccountModal } from './account-modal'

export function AuthGate() {
  const { authOpen, authMode, closeAuth, accountOpen, closeAccount } = useUIStore()
  const { customer, refresh, logout, setCustomer } = useCustomer()

  return (
    <>
      <AuthModal
        open={authOpen}
        onClose={closeAuth}
        initialMode={authMode}
        onAuthed={(c) => setCustomer(c)}
      />
      <AccountModal
        open={accountOpen}
        onClose={closeAccount}
        customer={customer}
        onLogout={async () => { await logout(); await refresh() }}
        onProfileUpdate={(c) => setCustomer(c)}
      />
    </>
  )
}
