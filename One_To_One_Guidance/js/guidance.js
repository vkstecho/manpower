/**
 * One-to-One Guidance Module
 * Strict per-mobile isolation • Mentor mode • Razorpay booking • Chat + Recordings
 */
(() => {
  'use strict';

  const MENTOR_MOBILE = '8929394920';
  const MENTOR_PIN = 'vksmentor';
  const RAZORPAY_LINK = 'https://rzp.io/rzp/RWnisIr';
  const WHATSAPP_NUMBER = '918929394920';
  const STORAGE_PREFIX = 'vks_guidance_';
  const THEME_KEY = 'vks_guidance_theme';
  const RATE_PER_HOUR = 699;

  // ========== Topics Catalog (15 Tracks) ==========
  const TOPICS = [
    // ===== Original 7 =====
    {
      id: 'ai_models',
      title: 'Learn Gemini, Cloud, Grok, DeepSeek & ChatGPT',
      hook: 'Master the World\'s Most Powerful AI Models 1-on-1 — From Prompt Engineering to Cloud Deployment.',
      tags: ['Gemini', 'Google Cloud', 'Grok', 'DeepSeek', 'ChatGPT', 'Prompt Eng'],
      gradient: 'linear-gradient(135deg, #4285F4 0%, #34A853 40%, #FBBC05 70%, #EA4335 100%)',
      icons: ['G', '☁', 'X', 'DS', 'GPT']
    },
    {
      id: 'career_ai',
      title: 'Learn to Excel in Career by Using AI Apps',
      hook: '10x Your Industrial & Corporate Career Growth with Practical Daily AI Workflows.',
      tags: ['Email Writing', 'Excel', 'Soft Skills', 'English Fluency', 'Career Guidance', 'SOPs', 'Data Analytics', 'Tools'],
      gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
      icons: ['💼', '📈', '🧠']
    },
    {
      id: 'excel_ai',
      title: 'Learn Excel with Help of AI',
      hook: 'Turn Hours of Spreadsheets, Formulas, Dashboards & Macros into Seconds Using AI.',
      tags: ['Formulas', 'Pivot', 'Dashboards', 'Macros', 'Power Query', 'VBA'],
      gradient: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)',
      icons: ['📊', 'Σ', 'AI']
    },
    {
      id: 'songs_ai',
      title: 'Learn Making Songs with AI',
      hook: 'Compose Studio-Quality Songs, Lyrics, Vocals & Regional Music Tracks with Generative AI.',
      tags: ['Lyrics', 'Vocals', 'Melody', 'Regional', 'Suno', 'Udio'],
      gradient: 'linear-gradient(135deg, #db2777 0%, #e11d48 50%, #f43f5e 100%)',
      icons: ['🎵', '🎤', '🎧']
    },
    {
      id: 'video_ai',
      title: 'Learn Making Video with AI',
      hook: 'Create Viral 3D Animations, Lip-Synced Storytelling & Professional AI Videos Step-by-Step.',
      tags: ['3D Animation', 'Lip Sync', 'Storytelling', 'Runway', 'Pika', 'CapCut'],
      gradient: 'linear-gradient(135deg, #7c3aed 0%, #a21caf 50%, #c026d3 100%)',
      icons: ['🎬', '📹', '✨']
    },
    {
      id: 'adsense_ai',
      title: 'Learn AdSense with AI (Google & YouTube Ads)',
      hook: 'Launch High-ROI Google & YouTube Ad Campaigns and Maximize AdSense Revenue with AI.',
      tags: ['Google Ads', 'YouTube Ads', 'AdSense', 'ROI', 'Campaigns'],
      gradient: 'linear-gradient(135deg, #ea580c 0%, #f97316 50%, #fb923c 100%)',
      icons: ['📢', '▶', '₹']
    },
    {
      id: 'cctv_home',
      title: 'CCTV & Home Automation Setup',
      hook: 'Learn How to Setup CCTV Surveillance, Light Automation, Cameras, Smart Switches & Energy-Saving Systems at Home.',
      tags: ['CCTV', 'Cameras', 'Smart Switches', 'Fans', 'Energy Saving', 'Home Automation'],
      gradient: 'linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #14b8a6 100%)',
      icons: ['📷', '🏠', '⚡']
    },

    // ===== New 8 Tracks (User requested + 7 high-demand) =====
    {
      id: 'buy_smart',
      title: 'Guide to Buy Correctly & Economically',
      hook: 'Learn How to Buy Any Product Smartly, Avoid Traps, Compare Prices & Get Maximum Value for Money.',
      tags: ['Smart Buying', 'Price Comparison', 'Avoid Scams', 'Warranty', 'Online vs Offline', 'Value for Money'],
      gradient: 'linear-gradient(135deg, #b45309 0%, #d97706 50%, #f59e0b 100%)',
      icons: ['🛒', '💰', '✓']
    },
    {
      id: 'itr_tax',
      title: 'How to File Income Tax / ITR Easily',
      hook: 'Step-by-step guidance to file ITR correctly, claim deductions, avoid notices and maximize refunds.',
      tags: ['ITR Filing', 'Tax Saving', 'Deductions', 'Form 16', 'Refund', 'AIS'],
      gradient: 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%)',
      icons: ['📄', '₹', '🏛️']
    },
    {
      id: 'freelancing',
      title: 'How to Start Freelancing & Get Clients',
      hook: 'Build your freelance profile, get high-paying clients on Upwork, Fiverr, LinkedIn and grow sustainable income.',
      tags: ['Upwork', 'Fiverr', 'LinkedIn', 'Client Hunting', 'Pricing', 'Portfolio'],
      gradient: 'linear-gradient(135deg, #047857 0%, #059669 50%, #10b981 100%)',
      icons: ['💻', '🌐', '💵']
    },
    {
      id: 'local_customers',
      title: 'Get More Local Customers (Google + WhatsApp)',
      hook: 'Setup Google Business Profile, WhatsApp Business & simple strategies to get more local customers every month.',
      tags: ['Google Business', 'WhatsApp Business', 'Local SEO', 'Reviews', 'Offers', 'Leads'],
      gradient: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 50%, #ef4444 100%)',
      icons: ['📍', '📱', '👥']
    },
    {
      id: 'computer_fix',
      title: 'Basic Computer & Laptop Troubleshooting',
      hook: 'Solve common computer & laptop problems yourself — slow system, WiFi, virus, software errors, hardware issues.',
      tags: ['Slow PC', 'WiFi Issues', 'Virus', 'Windows', 'Hardware', 'Backup'],
      gradient: 'linear-gradient(135deg, #4338ca 0%, #4f46e5 50%, #6366f1 100%)',
      icons: ['🖥️', '🔧', '⚡']
    },
    {
      id: 'resume_interview',
      title: 'Professional Resume + Interview Preparation',
      hook: 'Build a strong ATS-friendly resume and learn proven techniques to crack interviews with confidence.',
      tags: ['Resume Building', 'ATS', 'Interview Tips', 'HR Questions', 'Salary Negotiation'],
      gradient: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 50%, #8b5cf6 100%)',
      icons: ['📝', '🎯', '🤝']
    },
    {
      id: 'govt_schemes',
      title: 'Government Schemes, Subsidies & Loans',
      hook: 'Find and correctly apply for relevant government schemes, subsidies, mudra loans and benefits you are eligible for.',
      tags: ['Mudra Loan', 'Subsidies', 'PM Schemes', 'Eligibility', 'Documents', 'Application'],
      gradient: 'linear-gradient(135deg, #0e7490 0%, #0891b2 50%, #06b6d4 100%)',
      icons: ['🏛️', '📋', '🎁']
    },
    {
      id: 'personal_finance',
      title: 'Personal Finance Basics (SIP, MF & Budgeting)',
      hook: 'Learn practical money management, budgeting, SIP, mutual funds and how to start investing safely.',
      tags: ['SIP', 'Mutual Funds', 'Budgeting', 'Emergency Fund', 'Goal Planning', 'Risk'],
      gradient: 'linear-gradient(135deg, #15803d 0%, #16a34a 50%, #22c55e 100%)',
      icons: ['📈', '🏦', '🪙']
    }
  ];

  // ========== State ==========
  let mobile = null;
  let isMentor = false;
  let viewingAs = null;          // when mentor views a student
  let currentTopicId = null;
  let selectedHours = 1;
  let data = null;               // current user's (or viewed student's) data

  // ========== DOM helpers ==========
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  // ========== Mobile Detection ==========
  function extractMobileFromString(str) {
    if (!str || typeof str !== 'string') return null;
    const m = str.replace(/\D/g, '');
    // 10-digit Indian mobile starting 6-9
    if (/^[6-9]\d{9}$/.test(m)) return m;
    // with country code
    if (/^91[6-9]\d{9}$/.test(m)) return m.slice(2);
    return null;
  }

  function scanStorageForMobile() {
    const keys = [
      'mp_user_phone', 'userPhone', 'loggedInMobile', 'currentUser',
      'mp_session', 'user_mobile', 'mobile', 'phone', 'user',
      'vks_user', 'authUser', 'sessionUser'
    ];
    const stores = [localStorage, sessionStorage];
    for (const store of stores) {
      for (const key of keys) {
        try {
          const raw = store.getItem(key);
          if (!raw) continue;
          // direct value
          let found = extractMobileFromString(raw);
          if (found) return found;
          // JSON
          try {
            const obj = JSON.parse(raw);
            const candidates = [
              obj.mobile, obj.phone, obj.userPhone, obj.loggedInMobile,
              obj.number, obj.msisdn, obj.user?.mobile, obj.user?.phone,
              obj.data?.mobile, obj.data?.phone
            ];
            for (const c of candidates) {
              found = extractMobileFromString(String(c || ''));
              if (found) return found;
            }
          } catch {}
        } catch {}
      }
      // brute scan all keys for any 10-digit mobile
      try {
        for (let i = 0; i < store.length; i++) {
          const k = store.key(i);
          const v = store.getItem(k);
          const found = extractMobileFromString(v);
          if (found) return found;
        }
      } catch {}
    }
    return null;
  }

  function detectMobile() {
    // 1. URL params
    const params = new URLSearchParams(window.location.search);
    for (const key of ['mobile', 'phone', 'user', 'm', 'msisdn']) {
      const found = extractMobileFromString(params.get(key) || '');
      if (found) return found;
    }
    // 2. Storage
    const fromStore = scanStorageForMobile();
    if (fromStore) return fromStore;
    // 3. postMessage (listen once for quick reply)
    return null;
  }

  function requestMobileFromParent() {
    return new Promise((resolve) => {
      if (window.parent === window) {
        resolve(null);
        return;
      }
      const handler = (e) => {
        const m = extractMobileFromString(String(e.data?.mobile || e.data?.phone || e.data || ''));
        if (m) {
          window.removeEventListener('message', handler);
          resolve(m);
        }
      };
      window.addEventListener('message', handler);
      try {
        window.parent.postMessage({ type: 'REQUEST_MOBILE', source: 'one_to_one_guidance' }, '*');
      } catch {}
      setTimeout(() => {
        window.removeEventListener('message', handler);
        resolve(null);
      }, 800);
    });
  }

  // ========== Data Layer (LocalStorage + Firebase-ready) ==========
  function storageKey(mob) {
    return STORAGE_PREFIX + mob;
  }

  function loadUserData(mob) {
    const key = storageKey(mob);
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch {}
    // default structure
    return {
      mobile: mob,
      unlocked: {},          // topicId -> true
      payments: [],          // {id, topicId, topicTitle, hours, amount, utr, status, ts}
      recordings: {},        // topicId -> [{id, title, url, notes, ts}]
      chats: {},             // topicId -> [{id, text, from, ts}]
      updatedAt: Date.now()
    };
  }

  function saveUserData(mob, userData) {
    userData.updatedAt = Date.now();
    localStorage.setItem(storageKey(mob), JSON.stringify(userData));
    // Firebase hook (if available)
    try {
      if (window.firebaseDb && window.firebaseDb.ref) {
        window.firebaseDb.ref('guidance/' + mob).set(userData).catch(() => {});
      }
    } catch {}
  }

  function getAllStudentMobiles() {
    const list = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(STORAGE_PREFIX)) {
        const m = k.replace(STORAGE_PREFIX, '');
        if (/^[6-9]\d{9}$/.test(m) && m !== MENTOR_MOBILE) list.push(m);
      }
    }
    return list.sort();
  }

  // ========== Theme ==========
  function applyTheme(theme) {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(THEME_KEY, theme);
  }

  // ========== UI Helpers ==========
  function showToast(msg, duration = 2500) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.remove('translate-y-16', 'opacity-0');
    t.classList.add('translate-y-0', 'opacity-100');
    setTimeout(() => {
      t.classList.add('translate-y-16', 'opacity-0');
      t.classList.remove('translate-y-0', 'opacity-100');
    }, duration);
  }

  function formatDate(ts) {
    return new Date(ts).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  function youtubeId(url) {
    if (!url) return null;
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  }

  // ========== Render Catalog ==========
  function renderCatalog() {
    const grid = $('#topicsGrid');
    grid.innerHTML = '';
    const activeData = data;

    TOPICS.forEach(topic => {
      const unlocked = !!(activeData.unlocked[topic.id]);
      const card = document.createElement('div');
      card.className = 'topic-card';
      card.dataset.id = topic.id;

      const iconsHtml = (topic.icons || []).map(ic =>
        `<span class="logo-badge">${ic}</span>`
      ).join('');

      card.innerHTML = `
        <div class="card-banner" style="background:${topic.gradient}">
          ${iconsHtml}
          <span class="status-badge ${unlocked ? 'status-unlocked' : 'status-locked'}">
            ${unlocked ? '✓ Unlocked' : '₹699/Hr'}
          </span>
        </div>
        <div class="card-body">
          <h3 class="font-bold text-sm sm:text-[15px] leading-snug mb-1.5">${topic.title}</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mb-2.5 line-clamp-2">${topic.hook}</p>
          <div class="flex flex-wrap gap-0.5 mb-3">
            ${topic.tags.slice(0, 5).map(t => `<span class="tag">${t}</span>`).join('')}
            ${topic.tags.length > 5 ? `<span class="tag">+${topic.tags.length - 5}</span>` : ''}
          </div>
          <div class="flex gap-2">
            ${unlocked
              ? `<button class="flex-1 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold enter-ws-btn">
                   <i class="fas fa-door-open mr-1"></i> Enter Workspace
                 </button>`
              : `<button class="flex-1 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold book-btn">
                   <i class="fas fa-calendar-check mr-1"></i> Book 1-on-1 Session
                 </button>`
            }
            <button class="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-xs font-medium book-btn hover:bg-slate-50 dark:hover:bg-slate-700" title="Book more hours">
              <i class="fas fa-plus"></i>
            </button>
          </div>
        </div>
      `;

      card.querySelectorAll('.book-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          openBooking(topic.id);
        });
      });
      const enterBtn = card.querySelector('.enter-ws-btn');
      if (enterBtn) {
        enterBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openWorkspace(topic.id);
        });
      }
      // whole card click for unlocked
      if (unlocked) {
        card.addEventListener('click', () => openWorkspace(topic.id));
      }

      grid.appendChild(card);
    });
  }

  // ========== Booking Modal ==========
  function openBooking(topicId) {
    currentTopicId = topicId;
    const topic = TOPICS.find(t => t.id === topicId);
    selectedHours = 1;
    $('#bookingTopicName').textContent = topic.title;
    $('#bookingMobile').textContent = '+91 ' + (viewingAs || mobile);
    updateBookingTotal();
    $$('.hrs-btn').forEach(b => {
      b.classList.toggle('active-hrs', parseInt(b.dataset.hrs) === 1);
    });
    $('#utrInput').value = '';
    $('#bookingModal').classList.remove('hidden');
    $('#bookingModal').classList.add('flex');
  }

  function updateBookingTotal() {
    $('#bookingTotal').textContent = '₹' + (selectedHours * RATE_PER_HOUR).toLocaleString('en-IN');
  }

  function confirmPayment() {
    const topic = TOPICS.find(t => t.id === currentTopicId);
    const utr = ($('#utrInput').value || '').trim();
    const targetMobile = viewingAs || mobile;
    const userData = loadUserData(targetMobile);

    const payment = {
      id: 'pay_' + Date.now(),
      topicId: currentTopicId,
      topicTitle: topic.title,
      hours: selectedHours,
      amount: selectedHours * RATE_PER_HOUR,
      utr: utr || 'SELF_CONFIRM_' + Date.now(),
      status: 'confirmed',
      ts: Date.now()
    };
    userData.payments.unshift(payment);
    userData.unlocked[currentTopicId] = true;
    saveUserData(targetMobile, userData);

    // refresh current data if same user
    if (targetMobile === (viewingAs || mobile)) {
      data = userData;
    }

    // WhatsApp notify mentor
    const msg = encodeURIComponent(
      `✅ New 1-on-1 Booking\nMobile: +91${targetMobile}\nTopic: ${topic.title}\nHours: ${selectedHours}\nAmount: ₹${payment.amount}\nUTR: ${payment.utr}`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');

    closeBooking();
    renderCatalog();
    showToast('Session unlocked! Mentor notified.');
  }

  function closeBooking() {
    $('#bookingModal').classList.add('hidden');
    $('#bookingModal').classList.remove('flex');
  }

  // ========== Workspace ==========
  function openWorkspace(topicId) {
    currentTopicId = topicId;
    const topic = TOPICS.find(t => t.id === topicId);
    $('#wsTopicTitle').textContent = topic.title;
    $('#catalogView').classList.add('hidden');
    $('#workspaceView').classList.remove('hidden');

    // show add-recording form for mentor or if unlocked
    const canAdd = isMentor || data.unlocked[topicId];
    $('#addRecordingForm').classList.toggle('hidden', !canAdd);

    renderRecordings();
    renderChat();
  }

  function backToCatalog() {
    currentTopicId = null;
    $('#workspaceView').classList.add('hidden');
    $('#catalogView').classList.remove('hidden');
    renderCatalog();
  }

  function renderRecordings() {
    const list = data.recordings[currentTopicId] || [];
    $('#recordingCount').textContent = list.length + ' recording' + (list.length !== 1 ? 's' : '');
    const container = $('#recordingsList');
    container.innerHTML = '';

    if (!list.length) {
      container.innerHTML = `<p class="text-sm text-slate-400 text-center py-4">No session recordings yet. Mentor will add them after your 1-on-1.</p>`;
      return;
    }

    list.forEach((rec, idx) => {
      const el = document.createElement('div');
      el.className = 'rec-item';
      el.innerHTML = `
        <div class="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-600 flex items-center justify-center shrink-0">
          <i class="fab fa-youtube"></i>
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium truncate">${esc(rec.title)}</p>
          <p class="text-[10px] text-slate-400">${formatDate(rec.ts)}</p>
        </div>
      `;
      el.addEventListener('click', () => playRecording(rec, el));
      container.appendChild(el);
      if (idx === 0) playRecording(rec, el);
    });
  }

  function playRecording(rec, el) {
    $$('.rec-item').forEach(r => r.classList.remove('active'));
    if (el) el.classList.add('active');
    const vid = youtubeId(rec.url);
    const wrap = $('#videoPlayerWrap');
    if (vid) {
      wrap.innerHTML = `<iframe class="w-full h-full" src="https://www.youtube.com/embed/${vid}?rel=0" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    } else {
      wrap.innerHTML = `<div class="text-center text-slate-400 p-6"><p class="text-sm">Invalid or unsupported video URL</p><a href="${esc(rec.url)}" target="_blank" class="text-brand-500 text-xs underline mt-1 inline-block">Open link</a></div>`;
    }
  }

  function addRecording() {
    const title = ($('#recTitle').value || '').trim();
    const url = ($('#recUrl').value || '').trim();
    const notes = ($('#recNotes').value || '').trim();
    if (!title || !url) {
      showToast('Title and YouTube URL required');
      return;
    }
    const targetMobile = viewingAs || mobile;
    const userData = loadUserData(targetMobile);
    if (!userData.recordings[currentTopicId]) userData.recordings[currentTopicId] = [];
    userData.recordings[currentTopicId].unshift({
      id: 'rec_' + Date.now(),
      title, url, notes, ts: Date.now()
    });
    saveUserData(targetMobile, userData);
    if (targetMobile === (viewingAs || mobile)) data = userData;
    $('#recTitle').value = '';
    $('#recUrl').value = '';
    $('#recNotes').value = '';
    renderRecordings();
    showToast('Recording added');
  }

  // ========== Chat ==========
  function renderChat() {
    const msgs = data.chats[currentTopicId] || [];
    const box = $('#chatMessages');
    box.innerHTML = '';
    if (!msgs.length) {
      box.innerHTML = `<p class="text-sm text-slate-400 text-center py-8">No messages yet. Log your practice or ask a doubt!</p>`;
      return;
    }
    msgs.forEach(m => {
      const div = document.createElement('div');
      const isMe = m.from === 'student' || m.from === mobile;
      div.className = `chat-bubble ${isMe ? 'me' : 'them'}`;
      div.innerHTML = `${esc(m.text)}<div class="chat-meta">${formatDate(m.ts)}${m.from === 'mentor' ? ' • Mentor' : ''}</div>`;
      box.appendChild(div);
    });
    box.scrollTop = box.scrollHeight;
  }

  function sendChat() {
    const text = ($('#chatInput').value || '').trim();
    if (!text) return;
    const targetMobile = viewingAs || mobile;
    const userData = loadUserData(targetMobile);
    if (!userData.chats[currentTopicId]) userData.chats[currentTopicId] = [];
    const from = isMentor && viewingAs ? 'mentor' : 'student';
    userData.chats[currentTopicId].push({
      id: 'msg_' + Date.now(),
      text,
      from,
      ts: Date.now()
    });
    saveUserData(targetMobile, userData);
    if (targetMobile === (viewingAs || mobile)) data = userData;
    $('#chatInput').value = '';
    renderChat();

    // optional WhatsApp sync
    if ($('#syncWhatsApp').checked && from === 'student') {
      const topic = TOPICS.find(t => t.id === currentTopicId);
      const msg = encodeURIComponent(
        `💬 Doubt/Progress from +91${targetMobile}\nTopic: ${topic?.title || currentTopicId}\n\n${text}`
      );
      // open in background-ish (user can send)
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
    }
  }

  // ========== Payment History ==========
  function openHistory() {
    const payments = data.payments || [];
    const container = $('#historyContent');
    if (!payments.length) {
      container.innerHTML = `<p class="text-center text-slate-400 py-10">No payments yet for this mobile number.</p>`;
    } else {
      container.innerHTML = payments.map(p => `
        <div class="hist-card">
          <div class="flex items-start justify-between gap-2">
            <div>
              <p class="font-semibold text-sm">${esc(p.topicTitle)}</p>
              <p class="text-xs text-slate-500 mt-0.5">${formatDate(p.ts)} • ${p.hours} Hr${p.hours > 1 ? 's' : ''}</p>
            </div>
            <div class="text-right shrink-0">
              <p class="font-bold text-brand-600">₹${p.amount.toLocaleString('en-IN')}</p>
              <span class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium">${p.status}</span>
            </div>
          </div>
          <p class="text-[11px] text-slate-400 mt-1.5 font-mono truncate">UTR: ${esc(p.utr)}</p>
        </div>
      `).join('');
    }
    $('#historyModal').classList.remove('hidden');
    $('#historyModal').classList.add('flex');
  }

  function exportCsv() {
    const payments = data.payments || [];
    if (!payments.length) {
      showToast('No data to export');
      return;
    }
    const header = 'Date,Topic,Hours,Amount,UTR,Status\n';
    const rows = payments.map(p =>
      `"${formatDate(p.ts)}","${p.topicTitle}",${p.hours},${p.amount},"${p.utr}","${p.status}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `guidance_payments_${mobile}.csv`;
    a.click();
    showToast('CSV downloaded');
  }

  // ========== Mentor Mode ==========
  function enableMentorMode() {
    isMentor = true;
    $('#mentorBadge').classList.remove('hidden');
    $('#mentorStudentBar').classList.remove('hidden');
    refreshStudentList();
    showToast('Mentor mode enabled');
  }

  function refreshStudentList() {
    const sel = $('#studentSelect');
    const mobiles = getAllStudentMobiles();
    sel.innerHTML = '<option value="">— My own view (Mentor) —</option>' +
      mobiles.map(m => `<option value="${m}">+91 ${m}</option>`).join('');
    if (viewingAs) sel.value = viewingAs;
  }

  function switchStudent(mob) {
    viewingAs = mob || null;
    const target = viewingAs || mobile;
    data = loadUserData(target);
    $('#mobileDisplay').textContent = '+91 ' + target + (viewingAs ? ' (viewing)' : '');
    if (currentTopicId) {
      openWorkspace(currentTopicId);
    } else {
      renderCatalog();
    }
  }

  // ========== Init Flow ==========
  async function init() {
    // Theme
    applyTheme(localStorage.getItem(THEME_KEY) || 'light');

    // Detect mobile
    let detected = detectMobile();
    if (!detected) {
      detected = await requestMobileFromParent();
    }

    if (detected) {
      startApp(detected);
    } else {
      // show prompt
      $('#mobilePrompt').classList.remove('hidden');
      $('#mobilePrompt').classList.add('flex');
      $('#mobileInput').focus();
    }

    bindEvents();
  }

  function startApp(mob) {
    mobile = mob;
    isMentor = (mobile === MENTOR_MOBILE);
    data = loadUserData(mobile);
    $('#mobileDisplay').textContent = '+91 ' + mobile;
    $('#mobilePrompt').classList.add('hidden');
    $('#mobilePrompt').classList.remove('flex');
    $('#app').classList.remove('hidden');
    if (isMentor) enableMentorMode();
    renderCatalog();
  }

  function esc(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // ========== Events ==========
  function bindEvents() {
    // Mobile prompt
    $('#mobileSubmit').addEventListener('click', () => {
      const val = ($('#mobileInput').value || '').trim();
      const m = extractMobileFromString(val);
      if (!m) {
        $('#mobileError').classList.remove('hidden');
        return;
      }
      $('#mobileError').classList.add('hidden');
      // also store for parent consistency
      try { localStorage.setItem('mp_user_phone', m); } catch {}
      startApp(m);
    });
    $('#mobileInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') $('#mobileSubmit').click();
    });

    // Header
    $('#backBtn').addEventListener('click', () => {
      if (window.history.length > 1) window.history.back();
      else window.close();
    });
    $('#themeToggle').addEventListener('click', () => {
      const isDark = document.documentElement.classList.contains('dark');
      applyTheme(isDark ? 'light' : 'dark');
    });
    $('#paymentHistoryBtn').addEventListener('click', openHistory);
    $('#closeHistory').addEventListener('click', () => {
      $('#historyModal').classList.add('hidden');
      $('#historyModal').classList.remove('flex');
    });
    $('#exportCsvBtn').addEventListener('click', exportCsv);

    // Mentor PIN
    $('#mentorPinBtn').addEventListener('click', () => {
      if (isMentor) {
        showToast('Already in Mentor mode');
        return;
      }
      $('#pinModal').classList.remove('hidden');
      $('#pinModal').classList.add('flex');
      $('#mentorPinInput').value = '';
      $('#mentorPinInput').focus();
    });
    $('#pinSubmit').addEventListener('click', () => {
      if (($('#mentorPinInput').value || '') === MENTOR_PIN) {
        $('#pinModal').classList.add('hidden');
        $('#pinModal').classList.remove('flex');
        enableMentorMode();
      } else {
        showToast('Incorrect PIN');
      }
    });
    $('#pinCancel').addEventListener('click', () => {
      $('#pinModal').classList.add('hidden');
      $('#pinModal').classList.remove('flex');
    });

    // Student selector
    $('#studentSelect').addEventListener('change', (e) => {
      switchStudent(e.target.value || null);
    });
    $('#refreshStudentsBtn').addEventListener('click', refreshStudentList);

    // Booking
    $('#closeBooking').addEventListener('click', closeBooking);
    $$('.hrs-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedHours = parseInt(btn.dataset.hrs, 10);
        $$('.hrs-btn').forEach(b => b.classList.remove('active-hrs'));
        btn.classList.add('active-hrs');
        updateBookingTotal();
      });
    });
    $('#confirmPaidBtn').addEventListener('click', confirmPayment);

    // Workspace
    $('#backToCatalog').addEventListener('click', backToCatalog);
    $('#bookMoreBtn').addEventListener('click', () => {
      if (currentTopicId) openBooking(currentTopicId);
    });
    $('#addRecBtn').addEventListener('click', addRecording);
    $('#sendChatBtn').addEventListener('click', sendChat);
    $('#chatInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendChat();
    });
  }

  // Boot
  document.addEventListener('DOMContentLoaded', init);
})();
