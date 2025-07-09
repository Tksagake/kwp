'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        setError(error.message)
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500 to-indigo-600">
      <div className="flex flex-col items-center mb-6">
        <h1 className="mt-4 text-4xl text-white text-center">
          KENYA NATIONAL WASTE PICKERS
        </h1>
        <h2 className="text-3xl text-white text-center">
          WELFARE ASSOCIATION
        </h2>
        <p className="text-sm text-white text-center">
          Information Management System
        </p>
        <div className="w-36 h-36 bg-[#003776] rounded-full flex items-center justify-center mt-4">
          <img src="/logo.jpg" alt="KeNaWPWA Logo" className="w-30 h-30 rounded-full" />
        </div>
      </div>
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold text-[#003776]">Log In</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="flex justify-center">
              <Button
              type="submit"
              className="w-auto px-6 bg-[#003776] hover:bg-[#4e73df]"
              disabled={loading}
              >
              {loading ? (
                <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing in...
                </>
              ) : (
                'Sign in'
              )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <footer className="mt-8 text-white text-center">
        <p>
          Copyright © KeNaWPWA {new Date().getFullYear()} powered by MaraTech
        </p>
      </footer>
    </div>
  )
}
