/* ==========================================================================
   Shining Stars Pre School & Academy — SSP SPEECH & HOPE Data & Renderer
   Loads live categories from Supabase (public.ssp_categories) with automatic
   fallback to the 8 core categories when offline or before SQL setup.
   ========================================================================== */

(function initSspModule() {
  const DEFAULT_CATEGORIES = [
    {
      id: 1,
      slug: 'adhd-support',
      title: 'ADHD Support',
      badge: 'Focus & Regulation',
      accent_color: 'gold',
      icon: '⚡',
      summary: 'Structured focus coaching, sensory movement breaks, and executive-function routines that help energetic learners thrive.',
      hero_subtitle: 'Empowering children with attention differences to channel curiosity into calm confidence and classroom success.',
      overview: 'At SSP Speech & Hope, our ADHD Support program celebrates each child\'s vibrant energy while teaching practical self-regulation, task initiation, and attention-building habits. Rather than asking children to sit still for long stretches, we weave movement, visual timers, and bite-sized milestones into joyful learning blocks.',
      who_its_for: 'Ideal for children ages 3–12 experiencing distractibility, impulsivity, restlessness, or difficulty organizing multi-step school tasks.',
      support_strategies: [
        'Visual schedules and clear chunked instructions for smooth transitions',
        'Sensory-friendly seating and structured movement breaks between lessons',
        'Executive-function coaching for planning, organizing, and task completion',
        'Strength-based positive reinforcement to build self-esteem'
      ].join('\n'),
      parent_tips: 'Keep evening routines predictable using picture checklists, offer one clear instruction at a time, and celebrate small focus wins daily.',
      session_format: '1-on-1 Coaching & Classroom Integration • Ages 3–12',
      sort_order: 1,
      is_published: true
    },
    {
      id: 2,
      slug: 'autism-support',
      title: 'Autism Support',
      badge: 'Sensory & Social Care',
      accent_color: 'sky',
      icon: '🧩',
      summary: 'Warm, sensory-respectful support honoring neurodiversity while nurturing communication, play, and comfortable daily routines.',
      hero_subtitle: 'Individualized, gentle guidance built around sensory comfort, predictable routines, and meaningful connection.',
      overview: 'Our Autism Support wing provides a calm, welcoming space where children on the autism spectrum feel understood and respected. Our team partners closely with families to support communication—verbal or AAC—alongside flexible play skills and sensory comfort.',
      who_its_for: 'Designed for toddlers and primary students (ages 2–12) on the autism spectrum or showing differences in social communication and sensory processing.',
      support_strategies: [
        'Predictable visual timetables and calm transition cues',
        'Sensory-safe learning corners with tactile and soothing tools',
        'Respectful support for speech, gestures, and AAC communication boards',
        'Gentle peer-play scaffolding at each child\'s comfort pace'
      ].join('\n'),
      parent_tips: 'Honor sensory preferences at home, preview upcoming changes with simple photos, and follow your child\'s special interests to spark shared play.',
      session_format: 'Individualized Support Plan • Ages 2–12',
      sort_order: 2,
      is_published: true
    },
    {
      id: 3,
      slug: 'speech-therapy',
      title: 'Speech Therapy',
      badge: 'Clarity & Voice',
      accent_color: 'coral',
      icon: '🗣',
      summary: 'Play-based articulation, phonological awareness, and fluency sessions helping children speak clearly and confidently.',
      hero_subtitle: 'Helping young voices grow clear, expressive, and confident through joyful, play-centered speech sessions.',
      overview: 'Clear speech opens doors to friendships and classroom participation. Our Speech Therapy specialists use engaging games, mirror play, storytelling, and oral-motor exercises tailored to each child\'s sound profile and rhythm.',
      who_its_for: 'Helpful for children ages 2–12 with unclear speech sounds, sound substitutions, apraxia signs, or stuttering and fluency concerns.',
      support_strategies: [
        'Targeted articulation and sound-production play using multi-sensory cues',
        'Early phonological awareness to connect speech sounds with reading readiness',
        'Gentle fluency and pacing techniques in low-pressure conversations',
        'Fun home practice word-packs shared weekly with parents'
      ].join('\n'),
      parent_tips: 'Model slow, natural speech during storytime, repeat words clearly without pressure, and play 5-minute sound-treasure hunts together.',
      session_format: '1-on-1 Therapy Sessions (30–45 min) • Ages 2–12',
      sort_order: 3,
      is_published: true
    },
    {
      id: 4,
      slug: 'language-development',
      title: 'Language Development',
      badge: 'Comprehension & Expression',
      accent_color: 'mint',
      icon: '💬',
      summary: 'Building expressive vocabulary, listening comprehension, storytelling, and social conversation skills step by step.',
      hero_subtitle: 'Growing rich vocabulary, joyful storytelling, and meaningful two-way communication from first words to primary fluency.',
      overview: 'Language Development supports both receptive understanding (following directions, grasping stories) and expressive communication (forming sentences, asking questions, sharing ideas). Sessions blend picture books, role-play, and interactive games.',
      who_its_for: 'Great for late talkers, bilingual learners needing extra scaffolding, or primary students strengthening comprehension and social conversation.',
      support_strategies: [
        'Vocabulary expansion through thematic play, songs, and picture-book dialogues',
        'Sentence-building and narrative sequencing with visual story cards',
        'Pragmatic social-language practice: turn-taking, asking for help, and topic sharing',
        'Close alignment with classroom phonics and reading goals'
      ].join('\n'),
      parent_tips: 'Narrate everyday routines aloud, pause to give extra thinking time for answers, and ask open-ended questions about favorite picture books.',
      session_format: 'Individual & Small-Group Language Labs • Ages 2–12',
      sort_order: 4,
      is_published: true
    },
    {
      id: 5,
      slug: 'special-education',
      title: 'Special Education',
      badge: 'Individualized Learning',
      accent_color: 'sky',
      icon: '📘',
      summary: 'Personalized Individualized Education Plans (IEPs), differentiated pacing, and multi-sensory literacy and math instruction.',
      hero_subtitle: 'Meeting every learner right where they are with compassionate, tailored academic pathways and multi-sensory tools.',
      overview: 'Every mind learns differently. Our Special Education specialists craft Individualized Education Plans (IEPs) in partnership with classroom teachers and parents—breaking reading, writing, and math into accessible, confidence-building steps.',
      who_its_for: 'Supports students ages 3–12 with learning differences, dyslexia or dyscalculia indicators, developmental delays, or individualized pacing needs.',
      support_strategies: [
        'Custom Individualized Education Plans (IEPs) with clear termly milestones',
        'Multi-sensory phonics and tactile math blocks for concrete understanding',
        'Modified classroom seating, extended time, and scaffolded worksheets',
        'Regular progress reviews shared openly with families'
      ].join('\n'),
      parent_tips: 'Focus on effort over speed, use hands-on objects for counting or spelling, and stay in close touch with your child\'s learning support coordinator.',
      session_format: 'Co-Taught & Resource Room Support • Ages 3–12',
      sort_order: 5,
      is_published: true
    },
    {
      id: 6,
      slug: 'behavioural-therapy',
      title: 'Behavioural Therapy',
      badge: 'Emotional Self-Regulation',
      accent_color: 'gold',
      icon: '💛',
      summary: 'Positive behaviour support, emotional literacy, coping toolkits, and gentle conflict-resolution coaching.',
      hero_subtitle: 'Understanding behavior as communication and guiding children toward calm emotional regulation and positive choices.',
      overview: 'Big feelings are a natural part of growing up. Our Behavioural Therapy approach looks beneath challenging behaviors to uncover unmet sensory, communication, or emotional needs—equipping children with safe ways to express frustration and self-soothe.',
      who_its_for: 'Beneficial for children ages 2–12 experiencing frequent meltdowns, frustration, anxiety around routines, or social boundary challenges.',
      support_strategies: [
        'ABC behavioral observation to understand triggers and support needs',
        'Feelings thermometers, calm-down corners, and breathing strategies',
        'Positive reinforcement systems focused on teaching replacement skills',
        'Collaborative home-and-school consistency plans for parents'
      ].join('\n'),
      parent_tips: 'Validate feelings first before redirecting behavior, practice calming breaths during quiet moments, and keep consistent, calm boundaries.',
      session_format: '1-on-1 & Classroom Co-Regulation • Ages 2–12',
      sort_order: 6,
      is_published: true
    },
    {
      id: 7,
      slug: 'child-development',
      title: 'Child Development',
      badge: 'Milestones & Motor Skills',
      accent_color: 'mint',
      icon: '🌱',
      summary: 'Holistic milestone screening and play-based strengthening across fine motor, gross motor, cognitive, and social readiness.',
      hero_subtitle: 'Nurturing healthy physical, cognitive, and social-emotional milestones through purposeful early-childhood play.',
      overview: 'Our Child Development service offers gentle developmental check-ins and targeted skill-building across key early milestones—from pencil grip and scissor control to balance, problem-solving puzzles, and cooperative peer play.',
      who_its_for: 'Ideal for families of children ages 2–10 seeking developmental milestone guidance, school-readiness enrichment, or motor coordination support.',
      support_strategies: [
        'Play-based fine-motor strengthening (playdough, tweezers, pre-writing strokes)',
        'Gross-motor coordination, balance paths, and core stability games',
        'Cognitive sequencing, memory games, and early problem-solving tasks',
        'Termly developmental snapshots shared with parents'
      ].join('\n'),
      parent_tips: 'Encourage daily outdoor climbing and running, offer crayons and building blocks over screens, and involve kids in simple kitchen pouring or sorting.',
      session_format: 'Developmental Screening & Play Labs • Ages 2–10',
      sort_order: 7,
      is_published: true
    },
    {
      id: 8,
      slug: 'parent-guidance-support',
      title: 'Parent Guidance & Support',
      badge: 'Family Partnership',
      accent_color: 'coral',
      icon: '🤝',
      summary: 'Dedicated 1-on-1 family consultations, practical home toolkits, and supportive parent workshops so no family walks alone.',
      hero_subtitle: 'Walking beside parents with empathy, clarity, and practical everyday tools you can use right at home.',
      overview: 'Raising or supporting a child with extra learning, speech, or developmental needs brings countless questions. SSP Speech & Hope creates a judgment-free space where parents receive clear explanations, home activity plans, and community encouragement.',
      who_its_for: 'Open to all Shining Stars and community parents seeking guidance on milestones, home routines, school transitions, or therapy coordination.',
      support_strategies: [
        'Confidential 1-on-1 parent consultations with our specialist team',
        'Monthly practical workshops on speech, positive discipline, and sensory play',
        'Personalized visual schedules and calm-routine printables for home',
        'Coordinated care planning connecting teachers, therapists, and families'
      ].join('\n'),
      parent_tips: 'Remember that progress happens in small, loving steps—reach out early whenever you have a question, and celebrate your own patience too.',
      session_format: 'Parent Consultations & Monthly Workshops',
      sort_order: 8,
      is_published: true
    }
  ];

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function slugify(value) {
    return String(value || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
  }

  function getServiceUrl(slug) {
    return `ssp-service.html?slug=${encodeURIComponent(slug)}`;
  }

  async function fetchSspCategories(options = {}) {
    const includeUnpublished = Boolean(options.includeUnpublished);
    const sb = window.shiningStarsSupabase;

    if (sb) {
      try {
        let query = sb
          .from('ssp_categories')
          .select('*')
          .order('sort_order', { ascending: true })
          .order('id', { ascending: true });

        if (!includeUnpublished) {
          query = query.eq('is_published', true);
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data) && (data.length > 0 || includeUnpublished)) {
          return { categories: data, source: 'supabase' };
        }
      } catch (_) {
        // Fall through to defaults gracefully
      }
    }

    return {
      categories: DEFAULT_CATEGORIES.filter((c) => includeUnpublished || c.is_published),
      source: 'default'
    };
  }

  async function fetchSspCategoryBySlug(slug) {
    const cleanSlug = slugify(slug);
    if (!cleanSlug) return null;

    const sb = window.shiningStarsSupabase;
    if (sb) {
      try {
        const { data, error } = await sb
          .from('ssp_categories')
          .select('*')
          .eq('slug', cleanSlug)
          .maybeSingle();

        if (!error && data) {
          return data;
        }
      } catch (_) {
        // Fallback below
      }
    }

    return DEFAULT_CATEGORIES.find((c) => c.slug === cleanSlug) || null;
  }

  function renderSspCards(container, categories, options = {}) {
    if (!container) return;
    const excludeSlug = options.excludeSlug || '';
    const list = (categories || []).filter((c) => c.slug !== excludeSlug);

    if (!list.length) {
      container.innerHTML = '<p style="color: var(--muted);">No support categories are currently published.</p>';
      return;
    }

    container.innerHTML = list.map((cat) => {
      const accent = ['mint', 'sky', 'gold', 'coral'].includes(cat.accent_color)
        ? cat.accent_color
        : 'sky';
      return `
        <a class="ssp-card ${accent}" href="${getServiceUrl(cat.slug)}">
          <div class="ssp-card-top">
            <span class="ssp-icon ${accent}" aria-hidden="true">${escapeHtml(cat.icon || '★')}</span>
            <span class="ssp-badge ${accent}">${escapeHtml(cat.badge || 'SSP Support')}</span>
          </div>
          <h3>${escapeHtml(cat.title)}</h3>
          <p>${escapeHtml(cat.summary)}</p>
          <div class="ssp-card-foot">
            <span class="ssp-format">${escapeHtml(cat.session_format || 'Ages 2–12')}</span>
            <span class="card-link">View Program &rarr;</span>
          </div>
        </a>
      `;
    }).join('');
  }

  window.SSP_DEFAULT_CATEGORIES = DEFAULT_CATEGORIES;
  window.sspUtils = {
    escapeHtml,
    slugify,
    getServiceUrl,
    fetchSspCategories,
    fetchSspCategoryBySlug,
    renderSspCards
  };
})();
