'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase' 
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
  User,
  Mail
} from 'lucide-react'

interface SidebarProps {
  className?: string
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Waste Pickers', href: '/wastepickers', icon: Users },
  { name: 'Contributions', href: '/contributions', icon: DollarSign },
  { name: 'Membership', href: '/membership', icon: CreditCard },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Add Admin User', href: '/registrar', icon: User },
]

export default function Sidebar({ className }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  const pathname = usePathname()

  useEffect(() => {
    const fetchUserEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        setUserEmail(user.email || '')
      }
    }

    fetchUserEmail()
  }, [])

  const getEmailPrefix = (email: string) => {
    return email.split('@')[0]
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950">
      <div className="flex items-center bg-white dark:bg-gray-900 gap-2 p-6 border-b border-green-300 dark:border-green-800">
        <div className=" flex items-center justify-center">
          <img 
            src="/logo.png" 
            alt="KiWaPWA Logo" 
            className="w-40 h-24 dark:hidden" 
          />
          <img 
            src="/logo-dark.png" 
            alt="KiWaPWA Logo" 
            className="w-40 h-24 hidden dark:block" 
          />
        </div>
       
      </div>
      <nav className="flex-1 p-4 bg-green-50 dark:bg-gray-900 space-y-2">
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
                  ? 'bg-green-500 dark:bg-green-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-gray-800'
              )}
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t border-green-200 dark:border-gray-800 bg-green-50 dark:bg-gray-900">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <Mail className="text-green-600 dark:text-green-400 w-4 h-4" />
          </div>
          <div className="flex-1 text-sm">
            <p className="font-medium text-gray-900 dark:text-gray-100">Admin {getEmailPrefix(userEmail)}</p>
            <p className="font-medium text-gray-700 dark:text-gray-400">{userEmail}</p>
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
