'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/actions/require-user'
import type { ExerciseCategory } from '@/types/database'

export async function createCustomExercise(data: {
  name: string
  category: ExerciseCategory
  instructions: string
  primary_muscles: string[]
  secondary_muscles: string[]
  equipment: string[]
}): Promise<void> {
  const { supabase, user } = await requireUser()

  const { error } = await supabase.from('exercises').insert({
    name: data.name.trim(),
    category: data.category,
    instructions: data.instructions.trim(),
    primary_muscles: data.primary_muscles,
    secondary_muscles: data.secondary_muscles,
    equipment: data.equipment,
    is_custom: true,
    created_by: user.id,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/exercises')
}

export async function deleteCustomExercise(exerciseId: string): Promise<void> {
  const { supabase, user } = await requireUser()

  const { error } = await supabase
    .from('exercises')
    .delete()
    .eq('id', exerciseId)
    .eq('created_by', user.id)
    .eq('is_custom', true)

  if (error) throw new Error(error.message)
  revalidatePath('/exercises')
}
