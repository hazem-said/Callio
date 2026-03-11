'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Plus, Pencil, Trash2, Leaf, Wheat, UtensilsCrossed,
  Bot, ChevronDown, ChevronUp, Save, Info,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/utils'

interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number
  category: string
  isAvailable: boolean
  isVegetarian: boolean
  isVegan: boolean
  isGlutenFree: boolean
}

const EMPTY_ITEM = {
  name: '',
  description: '',
  price: '',
  category: '',
  isAvailable: true,
  isVegetarian: false,
  isVegan: false,
  isGlutenFree: false,
}

interface MenuClientProps {
  restaurantId: string
  aiMenuNotes: string
  initialMenuItems: MenuItem[]
}

/** Build the exact text the AI sees for the menu */
function buildAIMenuPreview(items: MenuItem[], notes: string): string {
  const available = items.filter((i) => i.isAvailable)
  if (available.length === 0 && !notes.trim()) return '(no menu items added yet)'

  const grouped = available.reduce<Record<string, MenuItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})

  const menuText = Object.entries(grouped)
    .map(([category, catItems]) => {
      const lines = catItems.map((item) => {
        const tags: string[] = []
        if (item.isVegetarian) tags.push('V')
        if (item.isVegan) tags.push('VG')
        if (item.isGlutenFree) tags.push('GF')
        const tagStr = tags.length > 0 ? ` [${tags.join(',')}]` : ''
        return `  • ${item.name}${tagStr} – $${item.price.toFixed(2)}${item.description ? `: ${item.description}` : ''}`
      })
      return `${category}:\n${lines.join('\n')}`
    })
    .join('\n\n')

  return [menuText, notes.trim() ? `\nSPECIAL NOTES:\n${notes.trim()}` : '']
    .filter(Boolean)
    .join('\n')
}

export function MenuClient({ restaurantId, aiMenuNotes: initialNotes, initialMenuItems }: MenuClientProps) {
  const [items, setItems] = useState<MenuItem[]>(initialMenuItems)
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<MenuItem | null>(null)
  const [form, setForm] = useState(EMPTY_ITEM)
  const [saving, setSaving] = useState(false)

  // AI Notes state
  const [aiNotes, setAiNotes] = useState(initialNotes)
  const [savingNotes, setSavingNotes] = useState(false)
  const [notesSaved, setNotesSaved] = useState(false)

  // AI Preview toggle
  const [previewOpen, setPreviewOpen] = useState(false)

  const fetchItems = useCallback(() => {
    setLoading(true)
    fetch(`/api/menu?restaurantId=${restaurantId}`)
      .then((r) => r.json())
      .then(setItems)
      .finally(() => setLoading(false))
  }, [restaurantId])

  const openCreate = () => {
    setEditItem(null)
    setForm(EMPTY_ITEM)
    setDialogOpen(true)
  }

  const openEdit = (item: MenuItem) => {
    setEditItem(item)
    setForm({
      name: item.name,
      description: item.description ?? '',
      price: item.price.toString(),
      category: item.category,
      isAvailable: item.isAvailable,
      isVegetarian: item.isVegetarian,
      isVegan: item.isVegan,
      isGlutenFree: item.isGlutenFree,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    const payload = {
      ...form,
      price: parseFloat(form.price as string) || 0,
      restaurantId,
    }

    if (editItem) {
      await fetch(`/api/menu/${editItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } else {
      await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }
    setSaving(false)
    setDialogOpen(false)
    fetchItems()
  }

  const toggleAvailable = async (item: MenuItem) => {
    await fetch(`/api/menu/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAvailable: !item.isAvailable }),
    })
    fetchItems()
  }

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this menu item?')) return
    await fetch(`/api/menu/${id}`, { method: 'DELETE' })
    fetchItems()
  }

  const saveNotes = async () => {
    setSavingNotes(true)
    await fetch(`/api/restaurants/${restaurantId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aiMenuNotes: aiNotes }),
    })
    setSavingNotes(false)
    setNotesSaved(true)
    setTimeout(() => setNotesSaved(false), 2500)
  }

  // Group by category
  const grouped = items.reduce<Record<string, MenuItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})

  const availableCount = items.filter((i) => i.isAvailable).length

  return (
    <div className="space-y-6">

      {/* ── AI Status Banner ────────────────────────────────────── */}
      <div className="flex items-start gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
        <Bot className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-indigo-900">
            AI reads your menu in real-time
          </p>
          <p className="text-xs text-indigo-700 mt-0.5">
            Every item marked <strong>Available</strong> is immediately included in the AI&apos;s knowledge. Toggle an item off and the AI will stop mentioning it on the next call.
          </p>
        </div>
        <button
          onClick={() => setPreviewOpen((v) => !v)}
          className="flex items-center gap-1 shrink-0 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          {previewOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {previewOpen ? 'Hide' : 'Preview'}
        </button>
      </div>

      {/* ── AI Menu Preview (collapsible) ───────────────────────── */}
      {previewOpen && (
        <Card className="border-indigo-200 bg-slate-950">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm text-indigo-400 flex items-center gap-2">
              <Bot size={14} />
              What the AI currently sees
              <span className="ml-auto text-xs font-normal text-slate-500">
                {availableCount} available item{availableCount !== 1 ? 's' : ''}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <pre className="whitespace-pre-wrap text-xs leading-5 text-slate-300 font-mono">
              {buildAIMenuPreview(items, aiNotes)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* ── Special Notes for AI ────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bot size={15} className="text-indigo-500" />
            Special notes for the AI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-slate-500 flex items-start gap-1.5">
            <Info size={12} className="mt-0.5 shrink-0 text-slate-400" />
            Use this for daily specials, items temporarily unavailable, seasonal changes, chef&apos;s recommendations, or anything else the AI should mention on calls.
          </p>
          <Textarea
            placeholder={`e.g.\nToday's special: Lobster Bisque at $14\n86'd: Truffle Pasta (out of stock)\nChef recommends: The 8oz Ribeye tonight`}
            value={aiNotes}
            onChange={(e) => setAiNotes(e.target.value)}
            className="h-28 font-mono text-xs resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {aiNotes.length} characters
            </span>
            <Button
              size="sm"
              onClick={saveNotes}
              loading={savingNotes}
              variant={notesSaved ? 'outline' : 'default'}
              className={notesSaved ? 'border-green-500 text-green-600' : ''}
            >
              {notesSaved ? '✓ Saved' : <><Save size={13} /> Save Notes</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Menu Items Header ───────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-500">
          {items.length} items across {Object.keys(grouped).length} categories
          {' · '}
          <span className="text-indigo-600 font-medium">{availableCount} visible to AI</span>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} />
          Add Item
        </Button>
      </div>

      {/* ── Menu Items List ─────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-slate-400">
            <UtensilsCrossed size={48} className="opacity-20 mb-4" />
            <p className="text-lg font-medium text-slate-500">No menu items yet</p>
            <p className="text-sm mt-1">Add your first item — the AI will know it immediately.</p>
            <Button className="mt-4" onClick={openCreate}><Plus size={16} />Add First Item</Button>
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([category, catItems]) => (
          <Card key={category}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                {category}
                <span className="text-xs font-normal text-slate-400">
                  {catItems.filter((i) => i.isAvailable).length}/{catItems.length} available to AI
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {catItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 px-6 py-3 border-b last:border-b-0 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-medium ${item.isAvailable ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                        {item.name}
                      </span>
                      {item.isVegan && (
                        <Badge variant="success" className="text-[10px] px-1.5 py-0 h-4">Vegan</Badge>
                      )}
                      {item.isVegetarian && !item.isVegan && (
                        <Badge variant="success" className="text-[10px] px-1.5 py-0 h-4">Veg</Badge>
                      )}
                      {item.isGlutenFree && (
                        <Badge variant="warning" className="text-[10px] px-1.5 py-0 h-4">GF</Badge>
                      )}
                      {!item.isAvailable && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">Hidden from AI</Badge>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-sm text-slate-500 truncate mt-0.5">{item.description}</p>
                    )}
                  </div>

                  <div className="font-semibold text-slate-800 shrink-0">
                    {formatCurrency(item.price)}
                  </div>

                  <div className="flex flex-col items-center shrink-0">
                    <Switch
                      checked={item.isAvailable}
                      onCheckedChange={() => toggleAvailable(item)}
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      {item.isAvailable ? 'AI knows' : 'Hidden'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                      <Pencil size={15} className="text-slate-400" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteItem(item.id)}>
                      <Trash2 size={15} className="text-red-400" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))
      )}

      {/* ── Add/Edit Dialog ─────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Item' : 'Add Menu Item'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Item Name *</Label>
                <Input
                  placeholder="e.g. Margherita Pizza"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Category *</Label>
                <Input
                  placeholder="e.g. Pizza, Pasta, Drinks"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Price ($) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  placeholder="Brief description of the dish"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="h-20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'isVegetarian', label: 'Vegetarian' },
                { key: 'isVegan', label: 'Vegan' },
                { key: 'isGlutenFree', label: 'Gluten-Free' },
                { key: 'isAvailable', label: 'Visible to AI' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                  <Label className="cursor-pointer">{label}</Label>
                  <Switch
                    checked={!!form[key as keyof typeof form]}
                    onCheckedChange={(v) => setForm({ ...form, [key]: v })}
                  />
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              loading={saving}
              disabled={!form.name || !form.category || !form.price}
            >
              {editItem ? 'Save Changes' : 'Add Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
