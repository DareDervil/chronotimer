'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { updateCollection } from '@/lib/actions/collections'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function EditCollectionPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('collections')
        .select('name, description')
        .eq('id', id)
        .single()
      if (data) {
        setName(data.name)
        setDescription(data.description ?? '')
      }
      setLoading(false)
    }
    load()
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      await updateCollection(id, name, description)
      toast.success('Collection updated')
      router.push(`/collections/${id}`)
    } catch {
      toast.error('Failed to update collection')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="px-6 md:px-10 py-8 max-w-2xl mx-auto">
        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
      </div>
    )
  }

  return (
    <div className="px-6 md:px-10 py-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Collection</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Collection details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description (optional)</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm resize-none placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !name.trim()}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
