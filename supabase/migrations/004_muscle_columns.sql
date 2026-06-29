-- ============================================================
-- Chronicon — Specific muscle columns
-- ============================================================

create type muscle_name as enum (
  'chest', 'shoulders', 'biceps', 'triceps', 'forearms',
  'upper_back', 'lats', 'traps',
  'abs', 'obliques', 'lower_back',
  'glutes', 'quads', 'hamstrings', 'calves', 'hip_flexors', 'adductors'
);

alter table exercises
  add column primary_muscles   muscle_name[] not null default '{}',
  add column secondary_muscles muscle_name[] not null default '{}';

-- ============================================================
-- WARMUP
-- ============================================================
update exercises set primary_muscles='{quads,calves,hip_flexors}'::muscle_name[], secondary_muscles='{glutes,hamstrings}'::muscle_name[] where name='Jog in Place';
update exercises set primary_muscles='{shoulders}'::muscle_name[], secondary_muscles='{traps}'::muscle_name[] where name='Arm Circles';
update exercises set primary_muscles='{hip_flexors,hamstrings}'::muscle_name[], secondary_muscles='{glutes,lower_back}'::muscle_name[] where name='Leg Swings (Forward)';
update exercises set primary_muscles='{adductors,hip_flexors}'::muscle_name[], secondary_muscles='{glutes}'::muscle_name[] where name='Leg Swings (Lateral)';
update exercises set primary_muscles='{traps}'::muscle_name[], secondary_muscles='{shoulders}'::muscle_name[] where name='Neck Rolls';
update exercises set primary_muscles='{hip_flexors,obliques}'::muscle_name[], secondary_muscles='{glutes,lower_back}'::muscle_name[] where name='Hip Circles';
update exercises set primary_muscles='{calves}'::muscle_name[], secondary_muscles='{}'::muscle_name[] where name='Ankle Rolls';
update exercises set primary_muscles='{shoulders,traps}'::muscle_name[], secondary_muscles='{upper_back}'::muscle_name[] where name='Shoulder Rolls';
update exercises set primary_muscles='{obliques}'::muscle_name[], secondary_muscles='{lower_back,abs}'::muscle_name[] where name='Torso Twists';
update exercises set primary_muscles='{lower_back,abs}'::muscle_name[], secondary_muscles='{upper_back}'::muscle_name[] where name='Cat-Cow Stretch';
update exercises set primary_muscles='{hip_flexors,hamstrings}'::muscle_name[], secondary_muscles='{chest,shoulders,lower_back}'::muscle_name[] where name='World''s Greatest Stretch';
update exercises set primary_muscles='{hamstrings,shoulders}'::muscle_name[], secondary_muscles='{abs,hip_flexors,chest}'::muscle_name[] where name='Inchworm';
update exercises set primary_muscles='{quads,hamstrings}'::muscle_name[], secondary_muscles='{glutes,calves}'::muscle_name[] where name='Butt Kicks';
update exercises set primary_muscles='{hip_flexors,quads}'::muscle_name[], secondary_muscles='{abs,calves}'::muscle_name[] where name='High Knees';
update exercises set primary_muscles='{shoulders,calves}'::muscle_name[], secondary_muscles='{glutes,quads}'::muscle_name[] where name='Jumping Jacks';
update exercises set primary_muscles='{forearms}'::muscle_name[], secondary_muscles='{}'::muscle_name[] where name='Wrist Circles';
update exercises set primary_muscles='{hip_flexors}'::muscle_name[], secondary_muscles='{abs,quads}'::muscle_name[] where name='Hip Flexor March';
update exercises set primary_muscles='{glutes,quads}'::muscle_name[], secondary_muscles='{adductors,calves}'::muscle_name[] where name='Side Shuffles';
update exercises set primary_muscles='{upper_back}'::muscle_name[], secondary_muscles='{traps,shoulders}'::muscle_name[] where name='Thoracic Extension';
update exercises set primary_muscles='{hip_flexors,quads}'::muscle_name[], secondary_muscles='{obliques,glutes,hamstrings}'::muscle_name[] where name='Dynamic Lunge with Twist';

-- ============================================================
-- CARDIO
-- ============================================================
update exercises set primary_muscles='{chest,shoulders,triceps,quads,glutes}'::muscle_name[], secondary_muscles='{abs,calves}'::muscle_name[] where name='Burpees';
update exercises set primary_muscles='{abs,hip_flexors,shoulders}'::muscle_name[], secondary_muscles='{chest,quads,triceps}'::muscle_name[] where name='Mountain Climbers';
update exercises set primary_muscles='{calves,shoulders}'::muscle_name[], secondary_muscles='{quads,forearms}'::muscle_name[] where name='Jump Rope (Invisible)';
update exercises set primary_muscles='{quads,glutes}'::muscle_name[], secondary_muscles='{hamstrings,calves}'::muscle_name[] where name='Box Step-Ups';
update exercises set primary_muscles='{quads,hip_flexors,calves}'::muscle_name[], secondary_muscles='{glutes,hamstrings,abs}'::muscle_name[] where name='Sprint in Place';
update exercises set primary_muscles='{quads,glutes}'::muscle_name[], secondary_muscles='{hamstrings,calves}'::muscle_name[] where name='Broad Jumps';
update exercises set primary_muscles='{glutes,adductors,quads}'::muscle_name[], secondary_muscles='{calves,hamstrings}'::muscle_name[] where name='Lateral Bounds';
update exercises set primary_muscles='{glutes,quads,adductors}'::muscle_name[], secondary_muscles='{calves,hamstrings}'::muscle_name[] where name='Speed Skaters';
update exercises set primary_muscles='{quads,glutes,hip_flexors}'::muscle_name[], secondary_muscles='{calves,abs}'::muscle_name[] where name='Tuck Jumps';
update exercises set primary_muscles='{quads,shoulders,calves}'::muscle_name[], secondary_muscles='{glutes}'::muscle_name[] where name='Star Jumps';
update exercises set primary_muscles='{quads,glutes}'::muscle_name[], secondary_muscles='{hamstrings,calves}'::muscle_name[] where name='Squat Jumps';
update exercises set primary_muscles='{shoulders,triceps,abs}'::muscle_name[], secondary_muscles='{chest,hip_flexors,quads}'::muscle_name[] where name='Bear Crawl';
update exercises set primary_muscles='{triceps,shoulders,glutes}'::muscle_name[], secondary_muscles='{abs,upper_back}'::muscle_name[] where name='Crab Walk';
update exercises set primary_muscles='{quads,glutes}'::muscle_name[], secondary_muscles='{hamstrings,calves}'::muscle_name[] where name='Box Jumps';
update exercises set primary_muscles='{calves,quads}'::muscle_name[], secondary_muscles='{glutes,hip_flexors}'::muscle_name[] where name='Skipping';
update exercises set primary_muscles='{quads,glutes,calves}'::muscle_name[], secondary_muscles='{hamstrings}'::muscle_name[] where name='Stair Climbs';
update exercises set primary_muscles='{quads,glutes,hip_flexors}'::muscle_name[], secondary_muscles='{hamstrings,calves}'::muscle_name[] where name='Jump Lunges';
update exercises set primary_muscles='{abs,obliques,hip_flexors}'::muscle_name[], secondary_muscles='{quads}'::muscle_name[] where name='Bicycle Sprint';
update exercises set primary_muscles='{shoulders,abs}'::muscle_name[], secondary_muscles='{chest,hamstrings,triceps}'::muscle_name[] where name='Plank to Down Dog';
update exercises set primary_muscles='{obliques,abs,hip_flexors}'::muscle_name[], secondary_muscles='{shoulders,chest}'::muscle_name[] where name='Diagonal Mountain Climbers';
update exercises set primary_muscles='{quads,glutes,calves}'::muscle_name[], secondary_muscles='{hamstrings,hip_flexors}'::muscle_name[] where name='Shuttle Run';
update exercises set primary_muscles='{quads,glutes,obliques}'::muscle_name[], secondary_muscles='{hamstrings,hip_flexors,abs}'::muscle_name[] where name='Jumping Lunges with Twist';
update exercises set primary_muscles='{chest,shoulders,triceps}'::muscle_name[], secondary_muscles='{abs,forearms}'::muscle_name[] where name='Explosive Push-Up';
update exercises set primary_muscles='{quads,glutes,shoulders}'::muscle_name[], secondary_muscles='{abs,hamstrings}'::muscle_name[] where name='Wall Balls';
update exercises set primary_muscles='{calves,shoulders}'::muscle_name[], secondary_muscles='{quads,forearms}'::muscle_name[] where name='Double Unders (Single Jump Variation)';

-- ============================================================
-- STRENGTH
-- ============================================================
update exercises set primary_muscles='{chest,shoulders,triceps}'::muscle_name[], secondary_muscles='{abs,forearms}'::muscle_name[] where name='Push-Ups';
update exercises set primary_muscles='{quads,glutes}'::muscle_name[], secondary_muscles='{hamstrings,lower_back,calves}'::muscle_name[] where name='Squats';
update exercises set primary_muscles='{quads,glutes}'::muscle_name[], secondary_muscles='{hamstrings,calves,hip_flexors}'::muscle_name[] where name='Lunges';
update exercises set primary_muscles='{glutes,hamstrings}'::muscle_name[], secondary_muscles='{abs,lower_back}'::muscle_name[] where name='Glute Bridges';
update exercises set primary_muscles='{abs,obliques}'::muscle_name[], secondary_muscles='{shoulders,lower_back,glutes}'::muscle_name[] where name='Plank';
update exercises set primary_muscles='{obliques,abs}'::muscle_name[], secondary_muscles='{shoulders,glutes,adductors}'::muscle_name[] where name='Side Plank';
update exercises set primary_muscles='{triceps,chest}'::muscle_name[], secondary_muscles='{shoulders,abs}'::muscle_name[] where name='Diamond Push-Ups';
update exercises set primary_muscles='{chest,shoulders}'::muscle_name[], secondary_muscles='{triceps,abs}'::muscle_name[] where name='Wide Push-Ups';
update exercises set primary_muscles='{shoulders,triceps}'::muscle_name[], secondary_muscles='{upper_back,abs}'::muscle_name[] where name='Pike Push-Ups';
update exercises set primary_muscles='{triceps,chest}'::muscle_name[], secondary_muscles='{shoulders}'::muscle_name[] where name='Tricep Dips';
update exercises set primary_muscles='{abs,hip_flexors}'::muscle_name[], secondary_muscles='{obliques}'::muscle_name[] where name='Sit-Ups';
update exercises set primary_muscles='{abs}'::muscle_name[], secondary_muscles='{obliques,hip_flexors}'::muscle_name[] where name='Crunches';
update exercises set primary_muscles='{abs,hip_flexors}'::muscle_name[], secondary_muscles='{lower_back}'::muscle_name[] where name='Leg Raises';
update exercises set primary_muscles='{obliques,abs}'::muscle_name[], secondary_muscles='{hip_flexors}'::muscle_name[] where name='Russian Twists';
update exercises set primary_muscles='{lower_back,glutes}'::muscle_name[], secondary_muscles='{hamstrings,upper_back,traps}'::muscle_name[] where name='Superman';
update exercises set primary_muscles='{abs,lower_back}'::muscle_name[], secondary_muscles='{hip_flexors,shoulders}'::muscle_name[] where name='Dead Bug';
update exercises set primary_muscles='{lower_back,glutes,abs}'::muscle_name[], secondary_muscles='{hamstrings,shoulders}'::muscle_name[] where name='Bird Dog';
update exercises set primary_muscles='{quads,glutes}'::muscle_name[], secondary_muscles='{calves,hamstrings}'::muscle_name[] where name='Wall Sit';
update exercises set primary_muscles='{glutes,hamstrings}'::muscle_name[], secondary_muscles='{abs,lower_back}'::muscle_name[] where name='Single-Leg Glute Bridge';
update exercises set primary_muscles='{quads,glutes}'::muscle_name[], secondary_muscles='{hamstrings,calves}'::muscle_name[] where name='Step-Ups';
update exercises set primary_muscles='{quads,glutes}'::muscle_name[], secondary_muscles='{hamstrings,calves,hip_flexors}'::muscle_name[] where name='Reverse Lunges';
update exercises set primary_muscles='{quads,glutes,adductors}'::muscle_name[], secondary_muscles='{hamstrings,calves}'::muscle_name[] where name='Sumo Squats';
update exercises set primary_muscles='{calves}'::muscle_name[], secondary_muscles='{}'::muscle_name[] where name='Calf Raises';
update exercises set primary_muscles='{abs,hip_flexors}'::muscle_name[], secondary_muscles='{lower_back,obliques}'::muscle_name[] where name='Hollow Body Hold';
update exercises set primary_muscles='{abs,hip_flexors}'::muscle_name[], secondary_muscles='{lower_back}'::muscle_name[] where name='V-Ups';
update exercises set primary_muscles='{abs,shoulders,triceps}'::muscle_name[], secondary_muscles='{chest,obliques}'::muscle_name[] where name='Plank Up-Downs';
update exercises set primary_muscles='{glutes,hamstrings}'::muscle_name[], secondary_muscles='{abs,lower_back}'::muscle_name[] where name='Hip Thrusts';
update exercises set primary_muscles='{hamstrings}'::muscle_name[], secondary_muscles='{glutes,lower_back,calves}'::muscle_name[] where name='Nordic Curls';
update exercises set primary_muscles='{shoulders,triceps}'::muscle_name[], secondary_muscles='{abs,upper_back,traps}'::muscle_name[] where name='Handstand Hold (Wall)';
update exercises set primary_muscles='{abs,hip_flexors,triceps}'::muscle_name[], secondary_muscles='{shoulders,quads}'::muscle_name[] where name='L-Sit Hold';
update exercises set primary_muscles='{upper_back,lats,biceps}'::muscle_name[], secondary_muscles='{shoulders,forearms}'::muscle_name[] where name='Inverted Row (Table)';
update exercises set primary_muscles='{shoulders,abs}'::muscle_name[], secondary_muscles='{upper_back,triceps}'::muscle_name[] where name='Pike Hold';
update exercises set primary_muscles='{glutes,quads,adductors}'::muscle_name[], secondary_muscles='{hamstrings,calves}'::muscle_name[] where name='Curtsy Lunge';
update exercises set primary_muscles='{quads,glutes,adductors}'::muscle_name[], secondary_muscles='{hamstrings,calves}'::muscle_name[] where name='Lateral Lunges';
update exercises set primary_muscles='{chest,shoulders,triceps}'::muscle_name[], secondary_muscles='{abs,forearms}'::muscle_name[] where name='Isometric Push-Up Hold';

-- ============================================================
-- MOBILITY
-- ============================================================
update exercises set primary_muscles='{lower_back,hip_flexors}'::muscle_name[], secondary_muscles='{glutes,upper_back,shoulders}'::muscle_name[] where name='Child''s Pose';
update exercises set primary_muscles='{glutes,hip_flexors}'::muscle_name[], secondary_muscles='{adductors,lower_back}'::muscle_name[] where name='Pigeon Pose';
update exercises set primary_muscles='{hamstrings,calves,shoulders}'::muscle_name[], secondary_muscles='{upper_back,lower_back}'::muscle_name[] where name='Downward Dog';
update exercises set primary_muscles='{quads,hip_flexors}'::muscle_name[], secondary_muscles='{}'::muscle_name[] where name='Standing Quad Stretch';
update exercises set primary_muscles='{hamstrings}'::muscle_name[], secondary_muscles='{calves,lower_back}'::muscle_name[] where name='Seated Hamstring Stretch';
update exercises set primary_muscles='{adductors,hip_flexors}'::muscle_name[], secondary_muscles='{glutes}'::muscle_name[] where name='Seated Butterfly';
update exercises set primary_muscles='{obliques,lower_back}'::muscle_name[], secondary_muscles='{glutes,upper_back}'::muscle_name[] where name='Spinal Twist (Seated)';
update exercises set primary_muscles='{shoulders}'::muscle_name[], secondary_muscles='{upper_back}'::muscle_name[] where name='Shoulder Cross Stretch';
update exercises set primary_muscles='{chest,shoulders}'::muscle_name[], secondary_muscles='{biceps,upper_back}'::muscle_name[] where name='Chest Opener';
update exercises set primary_muscles='{hip_flexors,quads}'::muscle_name[], secondary_muscles='{glutes}'::muscle_name[] where name='Hip Flexor Kneeling Stretch';
update exercises set primary_muscles='{calves}'::muscle_name[], secondary_muscles='{hamstrings}'::muscle_name[] where name='Calf Stretch (Wall)';
update exercises set primary_muscles='{chest,shoulders}'::muscle_name[], secondary_muscles='{biceps}'::muscle_name[] where name='Doorway Chest Stretch';
update exercises set primary_muscles='{lats,obliques}'::muscle_name[], secondary_muscles='{lower_back,shoulders}'::muscle_name[] where name='Lat Stretch (Overhead Side Bend)';
update exercises set primary_muscles='{glutes,adductors}'::muscle_name[], secondary_muscles='{lower_back,hip_flexors}'::muscle_name[] where name='Figure-4 Glute Stretch';
update exercises set primary_muscles='{upper_back,shoulders}'::muscle_name[], secondary_muscles='{obliques}'::muscle_name[] where name='Thread the Needle';
update exercises set primary_muscles='{hip_flexors,glutes,adductors}'::muscle_name[], secondary_muscles='{lower_back}'::muscle_name[] where name='90-90 Hip Stretch';
update exercises set primary_muscles='{traps}'::muscle_name[], secondary_muscles='{shoulders,upper_back}'::muscle_name[] where name='Neck Side Stretch';
update exercises set primary_muscles='{adductors,glutes}'::muscle_name[], secondary_muscles='{lower_back}'::muscle_name[] where name='IT Band Stretch (Standing)';
update exercises set primary_muscles='{forearms,biceps}'::muscle_name[], secondary_muscles='{}'::muscle_name[] where name='Forearm Stretch';
update exercises set primary_muscles='{lower_back,abs}'::muscle_name[], secondary_muscles='{upper_back}'::muscle_name[] where name='Lower Back Cat-Cow (Deep Hold)';
