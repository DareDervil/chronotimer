'use client'

import { useState } from 'react'
import { Globe, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { setCollectionPublic } from '@/lib/actions/collections'

interface CollectionShareDialogProps {
  collectionId: string
  initialIsPublic: boolean
  initialSlug: string | null
  label?: string
}

export function CollectionShareDialog({
  collectionId,
  initialIsPublic,
  initialSlug,
  label,
}: CollectionShareDialogProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [slug, setSlug] = useState<string | null>(initialSlug)
  const [pending, setPending] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareUrl =
    slug && typeof window !== 'undefined' ? `${window.location.origin}/c/${slug}` : null

  async function handleToggle() {
    setPending(true)
    try {
      const { share_slug } = await setCollectionPublic(collectionId, !isPublic)
      setIsPublic((v) => !v)
      setSlug(share_slug)
    } finally {
      setPending(false)
    }
  }

  async function handleCopy() {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size={label ? 'sm' : 'icon-sm'}
            className="shrink-0 text-muted-foreground hover:text-foreground"
            title="Share collection"
          />
        }
      >
        <Globe className="h-4 w-4" />
        {label && <span className="ml-1.5">{label}</span>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Share collection</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Make public</p>
              <p className="text-xs text-muted-foreground">Anyone with the link can view &amp; run workouts</p>
            </div>
            <button
              role="switch"
              aria-checked={isPublic}
              onClick={handleToggle}
              disabled={pending}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${
                isPublic ? 'bg-primary' : 'bg-muted-foreground/30'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform transition-transform ${
                  isPublic ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {isPublic && shareUrl ? (
            <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
              <p className="flex-1 text-xs text-muted-foreground truncate font-mono">{shareUrl}</p>
              <Button variant="ghost" size="icon-sm" onClick={handleCopy} title="Copy link">
                {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
          ) : !isPublic ? (
            <p className="text-xs text-muted-foreground">Enable sharing to get a link.</p>
          ) : null}

          <p className="text-xs text-muted-foreground">Sharing settings are saved immediately.</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
