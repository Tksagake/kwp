'use client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { ThemeToggle } from '@/components/ThemeProvider'
import { LogOut, Bell, Settings } from 'lucide-react'

export default function Header() {
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 px-6 py-4 lg:pl-4 shadow-sm">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-bold text-green-600 dark:text-green-400">
            KISUMU WASTE PICKERS WELFARE ASSOCIATION INFORMATION MANAGEMENT SYSTEM
          </h1>
        </div>
        <div className="flex items-center gap-4">
          
          <ThemeToggle />
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">Online</Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
