'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: { preventDefault: () => void }) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        setError(error.message)
      } else {
        router.push('/dashboard')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">

      {/* LEFT SIDE — Institutional Identity Panel */}
      <div className="hidden lg:flex relative flex-col justify-center px-16 py-16 bg-[#0E3B2E] text-white">

        <div className="max-w-md">
          
          {/* Logo */}
          <div className="mb-14">
            <div className="w-20 h-20 bg-white rounded-md flex items-center justify-center">
              <img
                src="/logo.png"
                alt="KiWaPWA Logo"
                className="w-16 h-16 object-contain"
              />
            </div>
          </div>

          {/* Organization Name */}
          <h1 className="text-4xl font-semibold tracking-wide mb-4">
            KIWAPWA
          </h1>

          <p className="text-lg text-white/85 mb-6 leading-relaxed">
            Kisumu Waste Pickers Welfare Association
          </p>

          <div className="w-16 h-px bg-white/30 mb-6"></div>

          <p className="text-xs uppercase tracking-[0.2em] text-white/70 mb-6">
            Information Management System
          </p>

          <p className="text-sm text-white/75 leading-relaxed max-w-sm">
            Secure member records and administrative access portal for authorized personnel.
          </p>
        </div>

        {/* Footer */}
        <div className="absolute bottom-10 left-16 text-white/50 text-xs">
          <p>© KiWaPWA {new Date().getFullYear()} • Powered by MaraTech</p>
        </div>
      </div>


      {/* RIGHT SIDE — Login Panel */}
      <div className="bg-white lg:bg-gray-50 flex flex-col items-center justify-center px-6 py-12">

        {/* Mobile Branding */}
        <div className="lg:hidden mb-10 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 bg-gray-100 border border-gray-300 rounded-md flex items-center justify-center">
              <img
                src="/logo.png"
                alt="KiWaPWA Logo"
                className="w-12 h-12 object-contain"
              />
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2 tracking-wide">
            KIWAPWA
          </h1>
          <p className="text-sm text-gray-700">
            Kisumu Waste Pickers Welfare Association
          </p>
          <p className="text-xs uppercase tracking-widest text-gray-600 mt-2">
            Information Management System
          </p>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-md shadow-sm">

          <div className="px-10 py-10 border-b border-gray-100">
            <h2 className="text-2xl font-semibold text-gray-900 text-center mb-2">
              System Login
            </h2>
            <p className="text-sm text-gray-600 text-center">
              Enter your credentials to access the system
            </p>
          </div>

          <div className="px-10 py-10">
            <form onSubmit={handleLogin} className="space-y-6">

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-900">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-gray-300 focus:ring-[#0E3B2E] focus:border-[#0E3B2E]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-900">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="border-gray-300 focus:ring-[#0E3B2E] focus:border-[#0E3B2E] pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-300 rounded-md p-3">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#0E3B2E] hover:bg-[#0B3026] disabled:bg-gray-400 text-white font-medium rounded-md transition-colors"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>

            </form>
          </div>
        </div>

        <p className="text-center text-gray-500 text-xs mt-6">
          For account support, contact administration
        </p>

        {/* Footer */}
        <footer className="mt-auto pt-12 text-center border-t border-gray-200 lg:border-t-0">
          <p className="text-gray-600 text-xs">
            © KiWaPWA {new Date().getFullYear()} • Powered by MaraTech
          </p>
        </footer>

      </div>
    </div>
  )
}