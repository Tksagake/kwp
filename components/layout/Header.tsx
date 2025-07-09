'use client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { LogOut, Bell, Settings } from 'lucide-react'

export default function Header() {
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="bg-white border-b px-6 py-4 lg:pl-72">
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="flex items-left justify-between w-full">
            <h1 className="text-sm font-bold text-[#003776] text-left">
          KENYA NATIONAL WASTE PICKERS WELFARE ASSOCIATION MANAGEMENT SYSTEM
           </h1>
        </div>
        <div className="flex items-center justify-between w-full">
          
          <div className="flex items-center gap-4">
             
          </div>
          <div className="flex items-center gap-4">
           
            <Button variant="ghost" size="sm">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Online</Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Log Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
