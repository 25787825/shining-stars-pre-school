-- ==========================================================================
-- SSP SPEECH & HOPE — Categories & Content Table + RLS + Default Seed
-- Run this in Supabase Dashboard -> SQL Editor.
-- Safe to re-run (idempotent).
-- ==========================================================================

create table if not exists public.ssp_categories (
  id bigint generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$' and char_length(slug) between 2 and 80),
  title text not null check (char_length(trim(title)) between 2 and 120),
  badge text not null default 'SSP Support',
  accent_color text not null default 'sky' check (accent_color in ('mint', 'sky', 'gold', 'coral')),
  icon text not null default '★',
  summary text not null check (char_length(trim(summary)) >= 10),
  hero_subtitle text not null default '',
  overview text not null default '',
  who_its_for text not null default '',
  support_strategies text not null default '',
  parent_tips text not null default '',
  session_format text not null default '1-on-1 & Small Group • Ages 2–12',
  sort_order integer not null default 10,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ssp_categories_sort on public.ssp_categories (sort_order asc, id asc);

alter table public.ssp_categories enable row level security;

revoke all on public.ssp_categories from anon, authenticated;
grant select on table public.ssp_categories to anon, authenticated;
grant insert, update, delete on table public.ssp_categories to authenticated;

drop policy if exists "Public can view published SSP categories" on public.ssp_categories;
create policy "Public can view published SSP categories"
  on public.ssp_categories
  for select
  to anon, authenticated
  using (is_published = true);

drop policy if exists "Staff admins can view all SSP categories" on public.ssp_categories;
create policy "Staff admins can view all SSP categories"
  on public.ssp_categories
  for select
  to authenticated
  using (exists (select 1 from public.staff_admins sa where sa.user_id = (select auth.uid())));

drop policy if exists "Staff admins can insert SSP categories" on public.ssp_categories;
create policy "Staff admins can insert SSP categories"
  on public.ssp_categories
  for insert
  to authenticated
  with check (exists (select 1 from public.staff_admins sa where sa.user_id = (select auth.uid())));

drop policy if exists "Staff admins can update SSP categories" on public.ssp_categories;
create policy "Staff admins can update SSP categories"
  on public.ssp_categories
  for update
  to authenticated
  using (exists (select 1 from public.staff_admins sa where sa.user_id = (select auth.uid())))
  with check (exists (select 1 from public.staff_admins sa where sa.user_id = (select auth.uid())));

drop policy if exists "Staff admins can delete SSP categories" on public.ssp_categories;
create policy "Staff admins can delete SSP categories"
  on public.ssp_categories
  for delete
  to authenticated
  using (exists (select 1 from public.staff_admins sa where sa.user_id = (select auth.uid())));

-- Seed the 8 core SSP SPEECH & HOPE service categories
insert into public.ssp_categories (
  slug, title, badge, accent_color, icon, summary, hero_subtitle,
  overview, who_its_for, support_strategies, parent_tips, session_format, sort_order, is_published
) values
(
  'adhd-support',
  'ADHD Support',
  'Focus & Regulation',
  'gold',
  '⚡',
  'Structured focus coaching, sensory movement breaks, and executive-function routines that help energetic learners thrive.',
  'Empowering children with attention differences to channel curiosity into calm confidence and classroom success.',
  'At SSP Speech & Hope, our ADHD Support program celebrates each child''s vibrant energy while teaching practical self-regulation, task initiation, and attention-building habits. Rather than asking children to sit still for long stretches, we weave movement, visual timers, and bite-sized milestones into joyful learning blocks.',
  'Ideal for children ages 3–12 experiencing distractibility, impulsivity, restlessness, or difficulty organizing multi-step school tasks.',
  E'Visual schedules and clear chunked instructions for smooth transitions\nSensory-friendly seating and structured movement breaks between lessons\nExecutive-function coaching for planning, organizing, and task completion\nStrength-based positive reinforcement to build self-esteem',
  'Keep evening routines predictable using picture checklists, offer one clear instruction at a time, and celebrate small focus wins daily.',
  '1-on-1 Coaching & Classroom Integration • Ages 3–12',
  1,
  true
),
(
  'autism-support',
  'Autism Support',
  'Sensory & Social Care',
  'sky',
  '🧩',
  'Warm, sensory-respectful support honoring neurodiversity while nurturing communication, play, and comfortable daily routines.',
  'Individualized, gentle guidance built around sensory comfort, predictable routines, and meaningful connection.',
  'Our Autism Support wing provides a calm, welcoming space where children on the autism spectrum feel understood and respected. Our team partners closely with families to support communication—verbal or AAC—alongside flexible play skills and sensory comfort.',
  'Designed for toddlers and primary students (ages 2–12) on the autism spectrum or showing differences in social communication and sensory processing.',
  E'Predictable visual timetables and calm transition cues\nSensory-safe learning corners with tactile and soothing tools\nRespectful support for speech, gestures, and AAC communication boards\nGentle peer-play scaffolding at each child''s comfort pace',
  'Honor sensory preferences at home, preview upcoming changes with simple photos, and follow your child''s special interests to spark shared play.',
  'Individualized Support Plan • Ages 2–12',
  2,
  true
),
(
  'speech-therapy',
  'Speech Therapy',
  'Clarity & Voice',
  'coral',
  '🗣',
  'Play-based articulation, phonological awareness, and fluency sessions helping children speak clearly and confidently.',
  'Helping young voices grow clear, expressive, and confident through joyful, play-centered speech sessions.',
  'Clear speech opens doors to friendships and classroom participation. Our Speech Therapy specialists use engaging games, mirror play, storytelling, and oral-motor exercises tailored to each child''s sound profile and rhythm.',
  'Helpful for children ages 2–12 with unclear speech sounds, sound substitutions, apraxia signs, or stuttering/fluency concerns.',
  E'Targeted articulation and sound-production play using multi-sensory cues\nEarly phonological awareness to connect speech sounds with reading readiness\nGentle fluency and pacing techniques in low-pressure conversations\nFun home practice word-packs shared weekly with parents',
  'Model slow, natural speech during storytime, repeat words clearly without pressure, and play 5-minute sound-treasure hunts together.',
  '1-on-1 Therapy Sessions (30–45 min) • Ages 2–12',
  3,
  true
),
(
  'language-development',
  'Language Development',
  'Comprehension & Expression',
  'mint',
  '💬',
  'Building expressive vocabulary, listening comprehension, storytelling, and social conversation skills step by step.',
  'Growing rich vocabulary, joyful storytelling, and meaningful two-way communication from first words to primary fluency.',
  'Language Development supports both receptive understanding (following directions, grasping stories) and expressive communication (forming sentences, asking questions, sharing ideas). Sessions blend picture books, role-play, and interactive games.',
  'Great for late talkers, bilingual learners needing extra scaffolding, or primary students strengthening comprehension and social conversation.',
  E'Vocabulary expansion through thematic play, songs, and picture-book dialogues\nSentence-building and narrative sequencing with visual story cards\nPragmatic social-language practice: turn-taking, asking for help, and topic sharing\nClose alignment with classroom phonics and reading goals',
  'Narrate everyday routines aloud, pause to give extra thinking time for answers, and ask open-ended questions about favorite picture books.',
  'Individual & Small-Group Language Labs • Ages 2–12',
  4,
  true
),
(
  'special-education',
  'Special Education',
  'Individualized Learning',
  'sky',
  '📘',
  'Personalized Individualized Education Plans (IEPs), differentiated pacing, and multi-sensory literacy and math instruction.',
  'Meeting every learner right where they are with compassionate, tailored academic pathways and multi-sensory tools.',
  'Every mind learns differently. Our Special Education specialists craft Individualized Education Plans (IEPs) in partnership with classroom teachers and parents—breaking reading, writing, and math into accessible, confidence-building steps.',
  'Supports students ages 3–12 with learning differences, dyslexia/dyscalculia indicators, developmental delays, or individualized pacing needs.',
  E'Custom Individualized Education Plans (IEPs) with clear termly milestones\nOrton-Gillingham-inspired multi-sensory phonics and tactile math blocks\nModified classroom seating, extended time, and scaffolded worksheets\nRegular progress reviews shared openly with families',
  'Focus on effort over speed, use hands-on objects for counting or spelling, and stay in close touch with your child''s learning support coordinator.',
  'Co-Taught & Resource Room Support • Ages 3–12',
  5,
  true
),
(
  'behavioural-therapy',
  'Behavioural Therapy',
  'Emotional Self-Regulation',
  'gold',
  '💛',
  'Positive behaviour support, emotional literacy, coping toolkits, and gentle conflict-resolution coaching.',
  'Understanding behavior as communication and guiding children toward calm emotional regulation and positive choices.',
  'Big feelings are a natural part of growing up. Our Behavioural Therapy approach looks beneath challenging behaviors to uncover unmet sensory, communication, or emotional needs—equipping children with safe ways to express frustration and self-soothe.',
  'Beneficial for children ages 2–12 experiencing frequent meltdowns, frustration, anxiety around routines, or social boundary challenges.',
  E'ABC behavioral observation to understand triggers and support needs\nFeelings thermometers, calm-down corners, and breathing strategies\nPositive reinforcement systems focused on teaching replacement skills\nCollaborative home-and-school consistency plans for parents',
  'Validate feelings first before redirecting behavior, practice calming breaths during quiet moments, and keep consistent, calm boundaries.',
  '1-on-1 & Classroom Co-Regulation • Ages 2–12',
  6,
  true
),
(
  'child-development',
  'Child Development',
  'Milestones & Motor Skills',
  'mint',
  '🌱',
  'Holistic milestone screening and play-based strengthening across fine motor, gross motor, cognitive, and social readiness.',
  'Nurturing healthy physical, cognitive, and social-emotional milestones through purposeful early-childhood play.',
  'Our Child Development service offers gentle developmental check-ins and targeted skill-building across key early milestones—from pencil grip and scissor control to balance, problem-solving puzzles, and cooperative peer play.',
  'Ideal for families of children ages 2–10 seeking developmental milestone guidance, school-readiness enrichment, or motor coordination support.',
  E'Play-based fine-motor strengthening (playdough, tweezers, pre-writing strokes)\nGross-motor coordination, balance paths, and core stability games\nCognitive sequencing, memory games, and early problem-solving tasks\nTermly developmental snapshots shared with parents',
  'Encourage daily outdoor climbing and running, offer crayons and building blocks over screens, and involve kids in simple kitchen pouring or sorting.',
  'Developmental Screening & Play Labs • Ages 2–10',
  7,
  true
),
(
  'parent-guidance-support',
  'Parent Guidance & Support',
  'Family Partnership',
  'coral',
  '🤝',
  'Dedicated 1-on-1 family consultations, practical home toolkits, and supportive parent workshops so no family walks alone.',
  'Walking beside parents with empathy, clarity, and practical everyday tools you can use right at home.',
  'Raising or supporting a child with extra learning, speech, or developmental needs brings countless questions. SSP Speech & Hope creates a judgment-free space where parents receive clear explanations, home activity plans, and community encouragement.',
  'Open to all Shining Stars and community parents seeking guidance on milestones, home routines, school transitions, or therapy coordination.',
  E'Confidential 1-on-1 parent consultations with our specialist team\nMonthly practical workshops on speech, positive discipline, and sensory play\nPersonalized visual schedules and calm-routine printables for home\nCoordinated care planning connecting teachers, therapists, and families',
  'Remember that progress happens in small, loving steps—reach out early whenever you have a question, and celebrate your own patience too.',
  'Parent Consultations & Monthly Workshops',
  8,
  true
)
on conflict (slug) do nothing;
