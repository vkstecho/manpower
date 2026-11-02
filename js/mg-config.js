/* FEATURE MODULE: config
 * Edit this file for related Mentor features. See AI_INDEX.md / HOW_AI_READS.md
 */
(function (MG) {
'use strict';
MG.MENTOR_MOBILE = '8929397949';          // Admin / Mentor number
MG.RAZORPAY_LINK = 'https://rzp.io/rzp/RWnisIr';
MG.WHATSAPP_NUMBER = '918929394920';  // User-facing WhatsApp (NOT admin OTP)
MG.STORAGE_PREFIX = 'vks_guidance_';
MG.THEME_KEY = 'vks_guidance_theme';
MG.RATE_PER_HOUR = 699; // legacy fallback
/** Preferred session windows shown in booking (student picks one). */
MG.PREFERRED_SLOT_OPTIONS = [
  'Weekday morning (9–12 IST)',
  'Weekday afternoon (12–5 IST)',
  'Weekday evening (6–9 IST)',
  'Saturday morning',
  'Saturday afternoon / evening',
  'Sunday (flexible)',
  'Flexible — mentor to propose'
];

MG.DEFAULT_TRACKS = {
  career_ai: {
    id: 'career_ai',
    name: 'Career & AI Track',
    hourlyRate: 699,
    paymentLink: 'https://rzp.io/rzp/RWnisIr',
    packageDisc: { '1': 0, '3': 5, '5': 10 },
    topics: [
      'Gemini / Claude / Grok / ChatGPT mastery',
      'Excel + AI workflows',
      'Digital marketing (Google, Meta, YouTube)',
      'Build your own website (no-code to custom)',
      'Make your first app A to Z',
      'Freelancing & client acquisition',
      'Career growth, resume & LinkedIn',
      'ITR / personal finance basics'
    ]
  },
  packaging: {
    id: 'packaging',
    name: 'Flexible Packaging Expert Track',
    hourlyRate: 799,
    paymentLink: 'https://rzp.io/rzp/RWnisIr',
    packageDisc: { '1': 0, '3': 5, '5': 10 },
    topics: [
      'Plant capacity & bottleneck calculation',
      'Yield improvement & waste reduction',
      'Boat life optimisation (metalliser)',
      '5S and shop-floor systems',
      'Manpower planning & shift design',
      'Process troubleshooting (print/laminate/slit)',
      'Cost per sqm & machine utilisation',
      'Converting plant capacity planning'
    ]
  }
};
MG.TRACKS = JSON.parse(JSON.stringify(MG.DEFAULT_TRACKS));
MG.selectedTrackId = 'career_ai';
MG.selectedPackageDisc = 0;
MG.OTP_STORAGE_KEY = 'vks_mentor_otp';
MG.OTP_EXPIRY_MS = 5 * 60 * 1000;       // 5 minutes
/** Device remembers mentor-mode unlock after one successful OTP (no Firebase rules change). */
MG.MENTOR_MODE_DEVICE_KEY = 'vks_mentor_mode_device_';
MG.MENTOR_MODE_DEVICE_TTL_MS = 180 * 24 * 60 * 60 * 1000; // 180 days


MG.FREE_PACK_MODULES = [
  { id: 'met_train', title: 'Met Train Pro', desc: 'Metalliser process training', href: 'Met_Train_Pro/met_train_pro.html', icon: 'fa-industry' },
  { id: 'mr_skill', title: 'MR Skill', desc: 'Machine / process skill drills', href: 'MR_Skill/mr_skill.html', icon: 'fa-gears' },
  { id: 'supskill', title: 'SupSkill', desc: 'Supervisor soft skills', href: 'modules/supskill.html', icon: 'fa-user-tie' },
  { id: 'timestudy', title: 'Time Study', desc: 'Cycle time & standard time', href: 'modules/timestudy.html', icon: 'fa-stopwatch' },
  { id: 'excel_expert', title: 'Excel Expert', desc: 'Plant Excel & logs', href: 'modules/excel_expert.html', icon: 'fa-file-excel' },
  { id: 'kpi', title: 'KPI Dashboard', desc: 'Yield, OEE-style KPIs', href: 'modules/kpi_dashboard.html', icon: 'fa-chart-line' },
  { id: 'met_cost', title: 'Met Cost Pro', desc: 'Metallising cost drivers', href: 'modules/met_cost_pro.html', icon: 'fa-coins' }
];

// ========== Topics Catalog ==========
// track: 'career_ai' | 'packaging' — used for rate badge + default booking track
// icons: array of {icon: 'fa class or text', bg: 'brand color', title: 'tooltip'} or {img, title}
MG.TOPICS = [
  // ---- Packaging paid sessions ----
  {
    id: 'pack_capacity',
    track: 'packaging',
    title: 'Plant Capacity & Bottleneck Calculation',
    hook: 'Calculate true line capacity, find bottlenecks, and plan realistic output for print / laminate / slit / metalliser.',
    tags: ['Capacity', 'Bottleneck', 'OEE', 'Line Balance'],
    gradient: 'linear-gradient(135deg, #ea580c 0%, #f97316 50%, #fb923c 100%)',
    icons: [
      { icon: 'fa-solid fa-industry', bg: '#EA580C', title: 'Plant' },
      { icon: 'fa-solid fa-gauge-high', bg: '#F97316', title: 'Capacity' },
      { icon: 'fa-solid fa-chart-line', bg: '#FB923C', title: 'Output' }
    ]
  },
  {
    id: 'pack_yield',
    track: 'packaging',
    title: 'Yield Improvement & Waste Reduction',
    hook: 'Practical methods to cut waste, improve yield %, and control process variation on converting lines.',
    tags: ['Yield', 'Waste', 'Process Control', 'Quality'],
    gradient: 'linear-gradient(135deg, #b45309 0%, #d97706 50%, #f59e0b 100%)',
    icons: [
      { icon: 'fa-solid fa-recycle', bg: '#B45309', title: 'Waste' },
      { icon: 'fa-solid fa-percent', bg: '#D97706', title: 'Yield' },
      { icon: 'fa-solid fa-flask', bg: '#F59E0B', title: 'Process' }
    ]
  },
  {
    id: 'pack_metalliser',
    track: 'packaging',
    title: 'Metalliser Boat Life & Process Optimisation',
    hook: 'Improve boat life, deposition control, and metalliser uptime — real shop-floor fixes from experience.',
    tags: ['Metalliser', 'Boat Life', 'Vacuum', 'Aluminium'],
    gradient: 'linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #14b8a6 100%)',
    icons: [
      { icon: 'fa-solid fa-atom', bg: '#0F766E', title: 'Metalliser' },
      { icon: 'fa-solid fa-bolt', bg: '#0D9488', title: 'Process' },
      { icon: 'fa-solid fa-clock', bg: '#14B8A6', title: 'Boat Life' }
    ]
  },
  {
    id: 'pack_5s_manpower',
    track: 'packaging',
    title: '5S, Manpower Planning & Shift Design',
    hook: 'Shop-floor systems, roster design, and manpower planning that actually work in Indian packaging plants.',
    tags: ['5S', 'Manpower', 'Shifts', 'SOP'],
    gradient: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)',
    icons: [
      { icon: 'fa-solid fa-people-group', bg: '#1D4ED8', title: 'Manpower' },
      { icon: 'fa-solid fa-clipboard-list', bg: '#2563EB', title: '5S' },
      { icon: 'fa-solid fa-calendar-days', bg: '#3B82F6', title: 'Shifts' }
    ]
  },
  {
    id: 'pack_cost_troubleshoot',
    track: 'packaging',
    title: 'Cost/sqm, Utilisation & Process Troubleshooting',
    hook: 'Cost per square metre, machine utilisation, and troubleshooting print / laminate / slit issues.',
    tags: ['Cost/sqm', 'Utilisation', 'Print', 'Laminate', 'Slit'],
    gradient: 'linear-gradient(135deg, #9f1239 0%, #e11d48 50%, #f43f5e 100%)',
    icons: [
      { icon: 'fa-solid fa-indian-rupee-sign', bg: '#9F1239', title: 'Cost' },
      { icon: 'fa-solid fa-screwdriver-wrench', bg: '#E11D48', title: 'Fix' },
      { icon: 'fa-solid fa-print', bg: '#F43F5E', title: 'Process' }
    ]
  },
  // ---- Career & AI sessions ----
  {
    id: 'ai_models',
    track: 'career_ai',
    title: 'Learn Gemini, Claude, Grok, DeepSeek & ChatGPT',
    hook: 'Master the World\'s Most Powerful AI Models One-to-One — From Prompt Engineering to Claude (Anthropic).',
    tags: ['Gemini', 'Claude', 'Grok', 'DeepSeek', 'ChatGPT', 'Prompt Eng'],
    gradient: 'linear-gradient(135deg, #4285F4 0%, #34A853 40%, #FBBC05 70%, #EA4335 100%)',
    icons: [
      { img: 'icons/gemini.png', title: 'Gemini' },
      { img: 'icons/claude.png', title: 'Claude' },
      { img: 'icons/grok.png', title: 'Grok' },
      { img: 'icons/deepseek.png', title: 'DeepSeek' },
      { img: 'icons/chatgpt.png', title: 'ChatGPT' }
    ]
  },
  {
    id: 'career_ai',
    track: 'career_ai',
    title: 'Career Growth with Daily AI Workflows',
    hook: 'Use AI every day at work: reports, emails, SOPs, decisions and LinkedIn — not just chatbots.',
    tags: ['Email Writing', 'Excel', 'Soft Skills', 'English Fluency', 'Career Guidance', 'SOPs', 'Data Analytics', 'Tools'],
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
    icons: [
      { icon: 'fa-solid fa-briefcase', bg: '#4F46E5', title: 'Career' },
      { icon: 'fa-solid fa-chart-line', bg: '#7C3AED', title: 'Growth' },
      { icon: 'fa-solid fa-brain', bg: '#9333EA', title: 'AI Skills' }
    ]
  },
  {
    id: 'excel_ai',
    track: 'career_ai',
    title: 'Learn Excel with Help of AI',
    hook: 'Turn Hours of Spreadsheets, Formulas, Dashboards & Macros into Seconds Using AI.',
    tags: ['Formulas', 'Pivot', 'Dashboards', 'Macros', 'Power Query', 'VBA'],
    gradient: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)',
    icons: [
      { img: 'icons/excel.png', title: 'Excel' },
      { icon: 'fa-solid fa-square-root-variable', bg: '#0D9488', title: 'Formulas' },
      { icon: 'fa-solid fa-robot', bg: '#059669', title: 'AI' }
    ]
  },
  {
    id: 'digital_marketing',
    track: 'career_ai',
    title: 'Learn Digital Marketing',
    hook: 'Plan and run practical digital marketing: Google, Meta, YouTube, content, SEO basics and measuring what actually brings leads.',
    tags: ['Digital Marketing', 'Google Ads', 'Meta Ads', 'SEO', 'Content', 'Leads'],
    gradient: 'linear-gradient(135deg, #c026d3 0%, #a21caf 50%, #7c3aed 100%)',
    icons: [
      { icon: 'fa-solid fa-bullhorn', bg: '#C026D3', title: 'Marketing' },
      { icon: 'fa-brands fa-google', bg: '#A21CAF', title: 'Google' },
      { icon: 'fa-brands fa-meta', bg: '#7C3AED', title: 'Meta' }
    ]
  },
  {
    id: 'video_ai',
    track: 'career_ai',
    title: 'Learn Making Video with AI',
    hook: 'Create Viral 3D Animations, Lip-Synced Storytelling & Professional AI Videos Step-by-Step.',
    tags: ['3D Animation', 'Lip Sync', 'Storytelling', 'Runway', 'Pika', 'CapCut'],
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #a21caf 50%, #c026d3 100%)',
    icons: [
      { icon: 'fa-solid fa-film', bg: '#7C3AED', title: 'Video' },
      { icon: 'fa-solid fa-video', bg: '#A21CAF', title: 'Camera' },
      { icon: 'fa-solid fa-wand-magic-sparkles', bg: '#C026D3', title: 'AI Effects' }
    ]
  },
  {
    id: 'adsense_ai',
    track: 'career_ai',
    title: 'YouTube / Blogging Revenue (AdSense Focus)',
    hook: 'Monetise content with AdSense, YouTube revenue basics, and AI tools to grow traffic — complements full Digital Marketing.',
    tags: ['Google Ads', 'YouTube Ads', 'AdSense', 'ROI', 'Campaigns'],
    gradient: 'linear-gradient(135deg, #ea580c 0%, #f97316 50%, #fb923c 100%)',
    icons: [
      { img: 'icons/google.png', title: 'Google Ads' },
      { img: 'icons/youtube.png', title: 'YouTube' },
      { icon: 'fa-solid fa-indian-rupee-sign', bg: '#F97316', title: 'Revenue' }
    ]
  },
  {
    id: 'own_website',
    track: 'career_ai',
    title: 'Setting Up Your Own Website',
    hook: 'From domain and hosting to a live site — no-code builders, basic custom pages, forms, WhatsApp lead capture and go-live checklist.',
    tags: ['Website', 'Domain', 'Hosting', 'No-Code', 'Landing Page', 'Go-Live'],
    gradient: 'linear-gradient(135deg, #0369a1 0%, #0284c7 50%, #0ea5e9 100%)',
    icons: [
      { icon: 'fa-solid fa-globe', bg: '#0369A1', title: 'Website' },
      { icon: 'fa-solid fa-server', bg: '#0284C7', title: 'Hosting' },
      { icon: 'fa-solid fa-rocket', bg: '#0EA5E9', title: 'Launch' }
    ]
  },
  {
    id: 'first_app',
    track: 'career_ai',
    title: 'Making Your First App A to Z',
    hook: 'Idea → design → build → test → publish. Practical path to ship your first web or mobile app without getting stuck in theory.',
    tags: ['App', 'No-Code', 'MVP', 'Publish', 'UI', 'End-to-End'],
    gradient: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #818cf8 100%)',
    icons: [
      { icon: 'fa-solid fa-mobile-screen', bg: '#4F46E5', title: 'App' },
      { icon: 'fa-solid fa-code', bg: '#6366F1', title: 'Build' },
      { icon: 'fa-solid fa-flag-checkered', bg: '#818CF8', title: 'Ship' }
    ]
  },
  {
    id: 'itr_tax',
    track: 'career_ai',
    title: 'How to File Income Tax / ITR Easily',
    hook: 'Step-by-step guidance to file ITR correctly, claim deductions, avoid notices and maximize refunds.',
    tags: ['ITR Filing', 'Tax Saving', 'Deductions', 'Form 16', 'Refund', 'AIS'],
    gradient: 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%)',
    icons: [
      { icon: 'fa-solid fa-file-invoice-dollar', bg: '#1E40AF', title: 'ITR' },
      { icon: 'fa-solid fa-landmark', bg: '#2563EB', title: 'Income Tax' },
      { icon: 'fa-solid fa-indian-rupee-sign', bg: '#3B82F6', title: 'Refund' }
    ]
  },
  {
    id: 'freelancing',
    track: 'career_ai',
    title: 'How to Start Freelancing & Get Clients',
    hook: 'Build your freelance profile, get high-paying clients on Upwork, Fiverr, LinkedIn and grow sustainable income.',
    tags: ['Upwork', 'Fiverr', 'LinkedIn', 'Client Hunting', 'Pricing', 'Portfolio'],
    gradient: 'linear-gradient(135deg, #047857 0%, #059669 50%, #10b981 100%)',
    icons: [
      { icon: 'fa-solid fa-laptop-code', bg: '#047857', title: 'Freelance' },
      { img: 'icons/linkedin.png', title: 'LinkedIn' },
      { icon: 'fa-solid fa-handshake', bg: '#10B981', title: 'Clients' }
    ]
  },
  {
    id: 'local_customers',
    track: 'career_ai',
    title: 'Get More Local Customers (Google + WhatsApp)',
    hook: 'Setup Google Business Profile, WhatsApp Business & simple strategies to get more local customers every month.',
    tags: ['Google Business', 'WhatsApp Business', 'Local SEO', 'Reviews', 'Offers', 'Leads'],
    gradient: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 50%, #ef4444 100%)',
    icons: [
      { img: 'icons/google.png', title: 'Google Business' },
      { img: 'icons/whatsapp.png', title: 'WhatsApp' },
      { icon: 'fa-solid fa-location-dot', bg: '#DC2626', title: 'Local' }
    ]
  },
  {
    id: 'computer_fix',
    track: 'career_ai',
    title: 'Basic Computer & Laptop Troubleshooting',
    hook: 'Solve common computer & laptop problems yourself — slow system, WiFi, virus, software errors, hardware issues.',
    tags: ['Slow PC', 'WiFi Issues', 'Virus', 'Windows', 'Hardware', 'Backup'],
    gradient: 'linear-gradient(135deg, #4338ca 0%, #4f46e5 50%, #6366f1 100%)',
    icons: [
      { icon: 'fa-solid fa-computer', bg: '#4338CA', title: 'Computer' },
      { icon: 'fa-solid fa-screwdriver-wrench', bg: '#4F46E5', title: 'Repair' },
      { icon: 'fa-brands fa-windows', bg: '#0078D4', title: 'Windows' }
    ]
  },
  {
    id: 'resume_interview',
    track: 'career_ai',
    title: 'Professional Resume + Interview Preparation',
    hook: 'Build a strong ATS-friendly resume and learn proven techniques to crack interviews with confidence.',
    tags: ['Resume Building', 'ATS', 'Interview Tips', 'HR Questions', 'Salary Negotiation'],
    gradient: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 50%, #8b5cf6 100%)',
    icons: [
      { icon: 'fa-solid fa-file-lines', bg: '#6D28D9', title: 'Resume' },
      { icon: 'fa-solid fa-user-tie', bg: '#7C3AED', title: 'Interview' },
      { icon: 'fa-solid fa-comments', bg: '#8B5CF6', title: 'HR Round' }
    ]
  },
  {
    id: 'govt_schemes',
    track: 'career_ai',
    title: 'Government Schemes, Subsidies & Loans',
    hook: 'Find and correctly apply for relevant government schemes, subsidies, mudra loans and benefits you are eligible for.',
    tags: ['Mudra Loan', 'Subsidies', 'PM Schemes', 'Eligibility', 'Documents', 'Application'],
    gradient: 'linear-gradient(135deg, #0e7490 0%, #0891b2 50%, #06b6d4 100%)',
    icons: [
      { icon: 'fa-solid fa-landmark', bg: '#0E7490', title: 'Government' },
      { icon: 'fa-solid fa-hand-holding-dollar', bg: '#0891B2', title: 'Subsidy' },
      { icon: 'fa-solid fa-file-circle-check', bg: '#06B6D4', title: 'Apply' }
    ]
  },
  {
    id: 'personal_finance',
    track: 'career_ai',
    title: 'Personal Finance Basics (SIP, MF & Budgeting)',
    hook: 'Learn practical money management, budgeting, SIP, mutual funds and how to start investing safely.',
    tags: ['SIP', 'Mutual Funds', 'Budgeting', 'Emergency Fund', 'Goal Planning', 'Risk'],
    gradient: 'linear-gradient(135deg, #15803d 0%, #16a34a 50%, #22c55e 100%)',
    icons: [
      { icon: 'fa-solid fa-chart-pie', bg: '#15803D', title: 'Mutual Fund' },
      { icon: 'fa-solid fa-piggy-bank', bg: '#16A34A', title: 'Savings' },
      { icon: 'fa-solid fa-coins', bg: '#22C55E', title: 'SIP' }
    ]
  }
];


})(window.MG = window.MG || {});
