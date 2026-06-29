-- Add 'free' block type for flexible warm-up/cool-down blocks
ALTER TYPE block_type ADD VALUE IF NOT EXISTS 'free';
