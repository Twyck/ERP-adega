'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  CheckSquare,
  BarChart2,
  Users,
  AlertTriangle,
  Wine,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, perfis: ['DONO', 'GERENTE', 'ESTOQUISTA', 'CAIXA'] },
  { href: '/pdv', label: 'PDV / Caixa', icon: ShoppingCart, perfis: ['DONO', 'GERENTE', 'CAIXA'] },
  { href: '/estoque', label: 'Estoque', icon: Package, perfis: ['DONO', 'GERENTE', 'ESTOQUISTA'] },
  { href: '/tarefas', label: 'Tarefas', icon: CheckSquare, perfis: ['DONO', 'GERENTE', 'ESTOQUISTA', 'CAIXA'] },
  { href: '/ocorrencias', label: 'Ocorrências', icon: AlertTriangle, perfis: ['DONO', 'GERENTE', 'ESTOQUISTA'] },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart2, perfis: ['DONO', 'GERENTE'] },
  { href: '/usuarios', label: 'Usuários', icon: Users, perfis: ['DONO'] },
]

export function Sidebar({ perfil }: { perfil: string }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const itemsVisiveis = navItems.filter(item => item.perfis.includes(perfil))

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-zinc-800">
        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shrink-0">
          <Wine className="w-4 h-4 text-black" />
        </div>
        <span className="text-white font-semibold text-sm">Adega Pro</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {itemsVisiveis.map(item => {
          const Icon = item.icon
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                active
                  ? 'bg-orange-500 text-black'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="md:hidden fixed top-3 left-3 z-50 p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div className={cn(
        'md:hidden fixed inset-y-0 left-0 z-40 w-60 bg-zinc-950 border-r border-zinc-800 flex flex-col transition-transform duration-200',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <NavContent />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex w-56 bg-zinc-950 border-r border-zinc-800 flex-col shrink-0">
        <NavContent />
      </div>
    </>
  )
}
