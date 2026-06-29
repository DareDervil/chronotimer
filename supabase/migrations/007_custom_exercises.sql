-- ============================================================
-- Chronicon — Custom warmup & mobility exercises
-- (not available in wger, seeded manually)
-- ============================================================

INSERT INTO exercises (name, category, primary_muscles, secondary_muscles, equipment, description, instructions, is_custom)
VALUES

-- ============================================================
-- WARMUP (20)
-- ============================================================
('Jog in Place', 'warmup', '{"Quadriceps femoris","Gastrocnemius"}', '{"Gluteus maximus","Biceps femoris"}', '{}', 'Light jogging on the spot to raise heart rate.', 'Lift knees alternately, land softly on the balls of your feet. Keep a relaxed pace.', false),
('Arm Circles', 'warmup', '{"Anterior deltoid"}', '{"Trapezius"}', '{}', 'Circular shoulder mobility movement.', 'Extend arms out to the sides. Make small circles forward for 15s, then reverse.', false),
('Leg Swings (Forward)', 'warmup', '{"Biceps femoris"}', '{"Gluteus maximus"}', '{}', 'Hip flexor and hamstring warm-up.', 'Hold a wall for balance. Swing one leg forward and back in a controlled arc. 10 reps each side.', false),
('Leg Swings (Lateral)', 'warmup', '{"Gluteus maximus"}', '{}', '{}', 'Hip abductor and adductor warm-up.', 'Hold a wall. Swing leg side to side across the body. 10 reps each side.', false),
('Neck Rolls', 'warmup', '{"Trapezius"}', '{"Anterior deltoid"}', '{}', 'Gentle cervical spine mobilisation.', 'Drop chin to chest, slowly roll ear to shoulder, head back, other shoulder. 5 circles each direction.', false),
('Hip Circles', 'warmup', '{"Obliquus externus abdominis"}', '{"Gluteus maximus"}', '{}', 'Rotational hip warm-up.', 'Hands on hips, feet shoulder-width. Draw large circles with your hips. 10 each direction.', false),
('Ankle Rolls', 'warmup', '{"Gastrocnemius","Soleus"}', '{}', '{}', 'Ankle joint mobilisation.', 'Lift one foot off the ground, rotate the ankle clockwise then counter-clockwise. 10 each side.', false),
('Shoulder Rolls', 'warmup', '{"Trapezius","Anterior deltoid"}', '{}', '{}', 'Shoulder girdle activation.', 'Roll shoulders forward 5 times, then backward 5 times in a controlled motion.', false),
('Torso Twists', 'warmup', '{"Obliquus externus abdominis"}', '{"Rectus abdominis"}', '{}', 'Spinal rotation warm-up.', 'Stand with feet shoulder-width, arms extended. Rotate torso left then right, keeping hips facing forward.', false),
('Cat-Cow Stretch', 'warmup', '{"Rectus abdominis"}', '{"Trapezius"}', '{}', 'Spinal flexion and extension mobilisation.', 'On all fours, arch back up (cat), then drop belly down and lift head (cow). Breathe through each movement.', false),
('World''s Greatest Stretch', 'warmup', '{"Biceps femoris","Pectoralis major"}', '{"Gluteus maximus","Anterior deltoid"}', '{}', 'Full-body mobility warm-up combining hip flexor, thoracic, and hamstring work.', 'Step forward into a lunge, place same-side hand inside foot, rotate upper body and reach skyward. Hold 2s. Alternate sides.', false),
('Inchworm', 'warmup', '{"Biceps femoris","Anterior deltoid"}', '{"Rectus abdominis","Pectoralis major"}', '{}', 'Hamstring, core, and upper body warm-up combined.', 'Stand, hinge at hips, walk hands out to plank, walk feet back to hands, stand. Repeat.', false),
('Butt Kicks', 'warmup', '{"Quadriceps femoris"}', '{"Gluteus maximus","Gastrocnemius"}', '{}', 'Quad and glute warm-up jog variant.', 'Jog in place kicking heels up toward your glutes. Keep torso upright.', false),
('High Knees', 'warmup', '{"Quadriceps femoris"}', '{"Rectus abdominis","Gastrocnemius"}', '{}', 'Hip flexor activation and cardio primer.', 'Drive alternating knees up to hip height. Pump arms in opposition. Maintain a quick pace.', false),
('Jumping Jacks', 'warmup', '{"Anterior deltoid","Gastrocnemius"}', '{"Gluteus maximus","Quadriceps femoris"}', '{}', 'Classic full-body warm-up exercise.', 'Start with feet together and arms at sides. Jump feet out while raising arms overhead. Jump back to start.', false),
('Wrist Circles', 'warmup', '{}', '{}', '{}', 'Wrist joint warm-up.', 'Extend arms forward, make slow circles with wrists. 10 each direction.', false),
('Hip Flexor March', 'warmup', '{"Rectus abdominis"}', '{"Quadriceps femoris"}', '{}', 'Standing hip flexor activation.', 'Lift one knee to 90° while standing tall. Hold 1 second. Alternate. Keep core engaged.', false),
('Side Shuffles', 'warmup', '{"Gluteus maximus","Quadriceps femoris"}', '{"Gastrocnemius"}', '{}', 'Lateral movement warm-up.', 'Lower into a quarter squat, shuffle 5 steps right, 5 steps left. Keep hips low throughout.', false),
('Thoracic Extension', 'warmup', '{"Trapezius"}', '{"Anterior deltoid"}', '{}', 'Upper back mobilisation.', 'Sit on heels or stand. Clasp hands behind head, elbows wide. Gently arch back to open chest. Hold 3s, repeat 5 times.', false),
('Dynamic Lunge with Twist', 'warmup', '{"Quadriceps femoris","Gluteus maximus"}', '{"Obliquus externus abdominis","Biceps femoris"}', '{}', 'Hip, ankle, and thoracic warm-up.', 'Step into a forward lunge. Rotate torso toward the front leg. Step back. Alternate sides.', false),

-- ============================================================
-- MOBILITY (20)
-- ============================================================
('Child''s Pose', 'mobility', '{"Latissimus dorsi"}', '{"Gluteus maximus","Anterior deltoid"}', '{}', 'Restorative hip and thoracic stretch.', 'Kneel and sit hips back toward heels, arms extended forward on the floor. Hold. Breathe into lower back.', false),
('Pigeon Pose', 'mobility', '{"Gluteus maximus"}', '{"Biceps femoris"}', '{}', 'Deep hip flexor and glute stretch.', 'From plank, bring one shin forward parallel to hips. Lower down. Keep hips square. Hold each side.', false),
('Downward Dog', 'mobility', '{"Biceps femoris","Gastrocnemius"}', '{"Anterior deltoid","Trapezius"}', '{}', 'Hamstring and calf stretch with shoulder opening.', 'Press hands into floor, hips high forming an inverted V. Alternate pressing heels toward floor. Hold and breathe.', false),
('Standing Quad Stretch', 'mobility', '{"Quadriceps femoris"}', '{}', '{}', 'Standing quad and hip flexor hold.', 'Stand on one leg, pull opposite foot toward glute. Hold ankle, keep knees together, stand tall. Alternate.', false),
('Seated Hamstring Stretch', 'mobility', '{"Biceps femoris"}', '{"Gastrocnemius"}', '{}', 'Long-sit hamstring hold.', 'Sit with legs straight in front. Reach toward feet, hinging at hips not rounding spine. Hold.', false),
('Seated Butterfly', 'mobility', '{"Gluteus maximus"}', '{}', '{}', 'Inner thigh and groin static stretch.', 'Sit with soles of feet together, knees dropped to sides. Gently press knees toward floor. Hold.', false),
('Spinal Twist (Seated)', 'mobility', '{"Obliquus externus abdominis"}', '{"Gluteus maximus"}', '{}', 'Thoracic and lumbar rotational stretch.', 'Sit with legs extended. Cross one foot over the other knee. Rotate torso toward bent knee, hand on floor behind. Hold.', false),
('Shoulder Cross Stretch', 'mobility', '{"Anterior deltoid"}', '{}', '{}', 'Rear deltoid and shoulder stretch.', 'Pull one arm horizontally across chest. Use opposite hand to increase stretch. Hold each side.', false),
('Chest Opener', 'mobility', '{"Pectoralis major","Anterior deltoid"}', '{"Biceps brachii"}', '{}', 'Anterior chest and shoulder stretch.', 'Clasp hands behind back, squeeze shoulder blades, lift arms slightly. Hold while breathing into chest.', false),
('Hip Flexor Kneeling Stretch', 'mobility', '{"Quadriceps femoris"}', '{"Gluteus maximus"}', '{}', 'Kneeling lunge hip flexor hold.', 'In a half-kneeling position (one knee on floor). Shift hips forward to feel stretch in rear hip flexor. Hold each side.', false),
('Calf Stretch (Wall)', 'mobility', '{"Gastrocnemius","Soleus"}', '{"Biceps femoris"}', '{}', 'Gastrocnemius and soleus wall stretch.', 'Press hands on wall. Step one foot back, heel pressed flat. Hold. Bend rear knee slightly to target soleus.', false),
('Doorway Chest Stretch', 'mobility', '{"Pectoralis major","Anterior deltoid"}', '{"Biceps brachii"}', '{}', 'Pectoral stretch using a wall or frame.', 'Place forearm on a wall, elbow at 90°. Rotate body away to feel stretch across chest. Hold each side.', false),
('Lat Stretch (Overhead Side Bend)', 'mobility', '{"Latissimus dorsi","Obliquus externus abdominis"}', '{}', '{}', 'Lateral lat and oblique stretch.', 'Stand, raise one arm overhead. Side bend away from that arm. Hold. Alternate sides.', false),
('Figure-4 Glute Stretch', 'mobility', '{"Gluteus maximus"}', '{}', '{}', 'Seated or lying piriformis and glute stretch.', 'Lie on back, cross one ankle over the opposite knee. Pull both legs toward chest. Hold each side.', false),
('Thread the Needle', 'mobility', '{"Trapezius","Anterior deltoid"}', '{"Obliquus externus abdominis"}', '{}', 'Thoracic rotation and shoulder stretch on all fours.', 'On hands and knees. Slide one arm under body (palm up) rotating thoracic spine. Lower shoulder to floor. Hold. Alternate.', false),
('90-90 Hip Stretch', 'mobility', '{"Gluteus maximus"}', '{}', '{}', 'Dual-position hip capsule stretch.', 'Sit with both legs in 90° angles (front shin and rear shin). Hold, then rotate to switch which leg is in front.', false),
('Neck Side Stretch', 'mobility', '{"Trapezius"}', '{"Anterior deltoid"}', '{}', 'Upper trap and cervical lateral stretch.', 'Tilt ear to shoulder. Optionally place hand on head for gentle added pressure. Hold each side.', false),
('IT Band Stretch (Standing)', 'mobility', '{"Gluteus maximus"}', '{}', '{}', 'Iliotibial band and outer hip stretch.', 'Cross one leg behind the other. Lean laterally away from crossed leg. Hold each side.', false),
('Forearm Stretch', 'mobility', '{"Brachialis"}', '{"Biceps brachii"}', '{}', 'Wrist flexor and forearm stretch.', 'Extend one arm forward, palm up. Use other hand to gently pull fingers back. Hold. Alternate.', false),
('Lower Back Cat-Cow (Deep Hold)', 'mobility', '{"Rectus abdominis"}', '{"Trapezius"}', '{}', 'Sustained lumbar flexion and extension.', 'On all fours. Arch back upward and hold 5s (cat). Then drop belly and lift head and hold 5s (cow). Repeat slowly.', false);
