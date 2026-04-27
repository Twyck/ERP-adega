'use client'
import { signOut } from 'next-auth/react'
import { LogOut, Bell } from 'lucide-react'
import { PERFIL_LABELS } from '@/lib/utils'

interface TopBarProps {
  user: {
    name?: string | null
    email?: string | null
    perfil: string
  }
}

export function TopBar({ user }: TopBarProps) {
  return (
    <header className="h-14 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-4 md:px-6 shrink-0">
      <div className="md:hidden w-8" /> {/* Spacer for mobile menu button */}
      
      <div className="hidden md:block">
        <p className="text-zinc-400 text-sm">
          Bem-vindo, <span className="text-white font-medium">{user.name}</span>
        </p>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <button className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
          <Bell className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="text-right hidden sm:block">
            <p className="text-white text-sm font-medium leading-none">{user.name}</p>
            <p className="text-zinc-500 text-xs mt-0.5">{PERFIL_LABELS[user.perfil] || user.perfil}</p>
          </div>
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shrink-0">
            <span className="text-black text-xs font-bold">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-red-400 transition-colors"
          title="Sair"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
