'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { cloneCollection } from '@/lib/actions/collections'

export function CopyCollectionButton({ slug }: { slug: string }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function handleCopy() {
    setPending(true)
    try {
      await cloneCollection(slug)
      toast.success('Collection copied to your account')
      router.push('/collections')
    } catch {
      toast.error('Failed to copy collection')
      setPending(false)
    }
  }

  return (
    <button
      onClick={handleCopy}
      disabled={pending}
      className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-60"
    >
      {pending ? 'Copying…' : 'Copy to my collections'}
    </button>
  )
}
