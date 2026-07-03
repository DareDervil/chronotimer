import { z } from 'zod'

const exerciseCategory = z.enum(['warmup', 'cardio', 'strength', 'mobility'])
const muscleOrEquipmentName = z.string().trim().min(1)

export const createExerciseSchema = z.object({
  name: z.string().trim().min(1, 'Exercise name is required').max(200, 'Exercise name is too long'),
  category: exerciseCategory,
  instructions: z.string().trim().max(5000, 'Instructions are too long'),
  primary_muscles: z.array(muscleOrEquipmentName).max(20, 'Too many primary muscles'),
  secondary_muscles: z.array(muscleOrEquipmentName).max(20, 'Too many secondary muscles'),
  equipment: z.array(muscleOrEquipmentName).max(20, 'Too many equipment items'),
})
