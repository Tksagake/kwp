'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  LayoutDashboard, 
  Users, 
  MapPin, 
  UserCheck, 
  DollarSign, 
  CreditCard, 
  Bell, 
  Shield,
  Menu,
  X,
  User
} from 'lucide-react'

interface SidebarProps {
  className?: string
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Waste Pickers', href: '/wastepickers', icon: Users },
  { name: 'County Managers', href: '/county-managers', icon: UserCheck },
  { name: 'Counties', href: '/counties', icon: MapPin },
  { name: 'Contributions', href: '/contributions', icon: DollarSign },
  { name: 'Membership', href: '/membership', icon: CreditCard },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Add Admin User', href: '/registrar', icon: User },
]

export default function Sidebar({ className }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center bg-indigo-300 gap-2 p-6 border-b">
        <div className="w-8 h-8 flex items-center justify-center">
          <img src="/logo.jpg" alt="KeNaWPWA Logo" className="w-6 h-6" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-[#003776]">KeNaWPWA</span>
          <span className="text-xs text-gray-500">Admin Dashboard</span>
        </div>
      </div>

      <nav className="flex-1 p-4 bg-indigo-400 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[#003776] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t bg-indigo-400">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-green-600 font-bold text-xs">A</span>
          </div>
          <div className="flex-1 text-sm">
            <p className="font-medium text-gray-900">Admin</p>
            
          </div>
        </div>
        <Badge variant="outline" className="text-xs">
          Admin
        </Badge>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        className="lg:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Mobile sidebar */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setIsOpen(false)}>
          <div className="w-64 bg-white h-full" onClick={(e) => e.stopPropagation()}>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className={cn('hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r', className)}>
        <SidebarContent />
      </div>
    </>
  )
}