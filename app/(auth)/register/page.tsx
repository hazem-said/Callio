'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, User, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Registration failed.')
      setLoading(false)
      return
    }

    // Auto sign-in after registration
    await signIn('credentials', {
      email: form.email.toLowerCase(),
      password: form.password,
      redirect: false,
    })

    setLoading(false)
    router.push('/dashboard/settings')
    router.refresh()
  }

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-8 shadow-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Get started free</h1>
        <p className="text-slate-400 text-sm mt-1">Set up your AI receptionist in minutes</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-slate-300">Your name</Label>
          <div className="relative">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="John Smith"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:border-indigo-400"
              required
              minLength={2}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-slate-300">Email address</Label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="email"
              placeholder="you@restaurant.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:border-indigo-400"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-slate-300">Password</Label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="password"
              placeholder="Minimum 8 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:border-indigo-400"
              required
              minLength={8}
            />
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Create Account <ArrowRight size={16} />
        </Button>
      </form>

      <p className="text-center text-sm text-slate-400 mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
          Sign in
        </Link>
      </p>

      <p className="text-center text-xs text-slate-500 mt-4">
        By creating an account you agree to our{' '}
        <span className="text-slate-400 cursor-pointer hover:text-white">Terms of Service</span>
        {' '}and{' '}
        <span className="text-slate-400 cursor-pointer hover:text-white">Privacy Policy</span>
      </p>
    </div>
  )
}
