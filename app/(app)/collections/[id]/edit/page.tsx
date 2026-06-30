import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EditCollectionForm } from './edit-collection-form'

export const metadata = { title: 'Edit Collection — Chronotimer' }

export default async function EditCollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: collection } = await supabase
    .from('collections')
    .select('name, description')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!collection) notFound()

  return (
    <EditCollectionForm
      id={id}
      initialName={collection.name}
      initialDescription={collection.description ?? ''}
    />
  )
}
