'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Store,
  Bot,
  Phone,
  Clock,
  Copy,
  Check,
  Info,
  Save,
  ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import type { Restaurant } from '@prisma/client'

interface SettingsClientProps {
  restaurant: Restaurant | null
}

const DAY_LABELS: Record<string, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday',
  thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
}

const DEFAULT_HOURS = {
  mon: { open: '11:00', close: '22:00', closed: false },
  tue: { open: '11:00', close: '22:00', closed: false },
  wed: { open: '11:00', close: '22:00', closed: false },
  thu: { open: '11:00', close: '22:00', closed: false },
  fri: { open: '11:00', close: '23:00', closed: false },
  sat: { open: '10:00', close: '23:00', closed: false },
  sun: { open: '10:00', close: '21:00', closed: false },
}

export function SettingsClient({ restaurant }: SettingsClientProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)

  const [form, setForm] = useState({
    name: restaurant?.name ?? '',
    phone: restaurant?.phone ?? '',
    address: restaurant?.address ?? '',
    city: restaurant?.city ?? '',
    state: restaurant?.state ?? '',
    zipCode: restaurant?.zipCode ?? '',
    cuisineType: restaurant?.cuisineType ?? '',
    description: restaurant?.description ?? '',
    website: restaurant?.website ?? '',
    aiName: restaurant?.aiName ?? 'Aria',
    aiGreeting: restaurant?.aiGreeting ?? '',
    aiPersonality: restaurant?.aiPersonality ?? '',
    twilioNumber: restaurant?.twilioNumber ?? '',
    acceptReservations: restaurant?.acceptReservations ?? true,
    acceptOrders: restaurant?.acceptOrders ?? true,
    maxPartySize: restaurant?.maxPartySize ?? 10,
    openingHours: (() => {
      try {
        return restaurant?.openingHours
          ? JSON.parse(restaurant.openingHours)
          : DEFAULT_HOURS
      } catch {
        return DEFAULT_HOURS
      }
    })(),
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'
  const webhookUrl = restaurant
    ? `${appUrl}/api/voice/inbound?restaurantId=${restaurant.id}`
    : `${appUrl}/api/voice/inbound?restaurantId=YOUR_ID`

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    const payload = {
      ...form,
      openingHours: JSON.stringify(form.openingHours),
    }

    if (restaurant) {
      await fetch(`/api/restaurants/${restaurant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      setSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      router.refresh()
    } else {
      // First-time setup — create restaurant then go to dashboard
      await fetch('/api/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      setSaving(false)
      router.push('/dashboard')
      router.refresh()
    }
  }

  const updateHours = (day: string, field: string, value: string | boolean) => {
    setForm((prev) => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [day]: { ...prev.openingHours[day], [field]: value },
      },
    }))
  }

  return (
    <div className="max-w-3xl space-y-6">

      {/* ── First-time setup banner ──────────────────────────────── */}
      {!restaurant && (
        <div className="rounded-xl border-2 border-indigo-300 bg-indigo-50 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 shadow">
              <Store size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-indigo-900">
                Welcome! Let&apos;s set up your restaurant
              </h2>
              <p className="mt-1 text-sm text-indigo-700">
                Fill in your <strong>Restaurant Name</strong> below and click <strong>Save Settings</strong> to unlock the full dashboard — calls, reservations, orders, and menu management.
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-indigo-600">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white text-[10px]">1</span> Fill in your restaurant name
                <ArrowRight size={12} className="mx-1" />
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white text-[10px]">2</span> Click Save Settings
                <ArrowRight size={12} className="mx-1" />
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white text-[10px]">3</span> You&apos;re live!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restaurant Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Store size={18} className="text-indigo-600" />Restaurant Information</CardTitle>
          <CardDescription>Basic details about your restaurant</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Restaurant Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Mario's Bistro" />
            </div>
            <div className="space-y-1.5">
              <Label>Phone Number</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 (555) 000-0000" />
            </div>
            <div className="space-y-1.5">
              <Label>Cuisine Type</Label>
              <Input value={form.cuisineType} onChange={(e) => setForm({ ...form, cuisineType: e.target.value })} placeholder="e.g. Italian, Mexican" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123 Main Street" />
            </div>
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>State</Label>
                <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="CA" />
              </div>
              <div className="space-y-1.5">
                <Label>ZIP Code</Label>
                <Input value={form.zipCode} onChange={(e) => setForm({ ...form, zipCode: e.target.value })} />
              </div>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description of your restaurant for the AI to use"
                className="h-20"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bot size={18} className="text-indigo-600" />AI Receptionist</CardTitle>
          <CardDescription>Configure how your AI receptionist behaves on calls</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>AI Name</Label>
              <Input value={form.aiName} onChange={(e) => setForm({ ...form, aiName: e.target.value })} placeholder="Aria" />
            </div>
            <div className="space-y-1.5">
              <Label>Max Party Size</Label>
              <Input
                type="number"
                value={form.maxPartySize}
                onChange={(e) => setForm({ ...form, maxPartySize: parseInt(e.target.value) || 10 })}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Custom Greeting</Label>
              <Textarea
                value={form.aiGreeting}
                onChange={(e) => setForm({ ...form, aiGreeting: e.target.value })}
                placeholder={`Hello! Thank you for calling ${form.name || 'our restaurant'}. I'm ${form.aiName}, your AI assistant. How can I help you today?`}
                className="h-20"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Personality Notes</Label>
              <Textarea
                value={form.aiPersonality}
                onChange={(e) => setForm({ ...form, aiPersonality: e.target.value })}
                placeholder="e.g. Warm and enthusiastic about food. Mentions daily specials when relevant."
                className="h-20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Accept Reservations</p>
                <p className="text-xs text-slate-500">AI can book tables</p>
              </div>
              <Switch
                checked={form.acceptReservations}
                onCheckedChange={(v) => setForm({ ...form, acceptReservations: v })}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Accept Orders</p>
                <p className="text-xs text-slate-500">AI can take phone orders</p>
              </div>
              <Switch
                checked={form.acceptOrders}
                onCheckedChange={(v) => setForm({ ...form, acceptOrders: v })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Clock size={18} className="text-indigo-600" />Opening Hours</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {Object.entries(DAY_LABELS).map(([day, label]) => {
            const hours = form.openingHours[day] ?? { open: '11:00', close: '22:00', closed: false }
            return (
              <div key={day} className="flex items-center gap-4">
                <div className="w-28 text-sm font-medium text-slate-700">{label}</div>
                <Switch
                  checked={!hours.closed}
                  onCheckedChange={(v) => updateHours(day, 'closed', !v)}
                />
                <Input
                  type="time"
                  value={hours.open}
                  onChange={(e) => updateHours(day, 'open', e.target.value)}
                  disabled={hours.closed}
                  className="w-32"
                />
                <span className="text-slate-400 text-sm">to</span>
                <Input
                  type="time"
                  value={hours.close}
                  onChange={(e) => updateHours(day, 'close', e.target.value)}
                  disabled={hours.closed}
                  className="w-32"
                />
                {hours.closed && (
                  <span className="text-sm text-slate-400">Closed</span>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Twilio Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Phone size={18} className="text-indigo-600" />Twilio Setup</CardTitle>
          <CardDescription>Configure your Twilio phone number to connect calls to your AI</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Your Twilio Phone Number</Label>
            <Input
              value={form.twilioNumber}
              onChange={(e) => setForm({ ...form, twilioNumber: e.target.value })}
              placeholder="+1XXXXXXXXXX"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Webhook URL (copy this into Twilio console)</Label>
            <div className="flex items-center gap-2">
              <Input value={webhookUrl} readOnly className="font-mono text-xs bg-slate-50" />
              <Button variant="outline" size="icon" onClick={copyWebhook}>
                {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
              </Button>
            </div>
            <p className="text-xs text-slate-500 flex items-start gap-1.5 mt-1">
              <Info size={12} className="mt-0.5 shrink-0" />
              In your Twilio console, go to Phone Numbers → Your number → Voice Configuration, and paste this URL as the &quot;A call comes in&quot; webhook (HTTP POST).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          loading={saving}
          size="lg"
          disabled={!form.name.trim()}
          className={!restaurant ? 'px-8' : ''}
        >
          {saved ? (
            <><Check size={16} />Saved!</>
          ) : !restaurant ? (
            <><ArrowRight size={16} />Create Restaurant &amp; Go to Dashboard</>
          ) : (
            <><Save size={16} />Save Settings</>
          )}
        </Button>
      </div>
    </div>
  )
}
