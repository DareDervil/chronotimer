'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/actions/require-user'
import { parseOrThrow } from '@/lib/validation/parse'
import { createExerciseSchema } from '@/lib/validation/exercise'
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
  const validated = parseOrThrow(createExerciseSchema, data)

  const { error } = await supabase.from('exercises').insert({
    name: validated.name,
    category: validated.category,
    instructions: validated.instructions,
    primary_muscles: validated.primary_muscles,
    secondary_muscles: validated.secondary_muscles,
    equipment: validated.equipment,
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
