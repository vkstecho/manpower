/* FEATURE MODULE: ui
 * Edit this file for related Mentor features. See AI_INDEX.md / HOW_AI_READS.md
 */
(function (MG) {
'use strict';
// ========== Free Flexible Packaging training modules ==========

MG.renderFreePackSection = function() {
  var host = document.getElementById('freePackModules');
  if (!host) return;
  host.innerHTML = MG.FREE_PACK_MODULES.map(function (m) {
    return '<a href="' + m.href + '" class="block p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-teal-500 hover:shadow transition">' +
      '<div class="flex items-start gap-3">' +
      '<div class="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0"><i class="fas ' + m.icon + '"></i></div>' +
      '<div class="min-w-0"><div class="font-semibold text-sm">' + m.title + ' <span class="text-[10px] font-bold text-emerald-600 uppercase">Free</span></div>' +
      '<div class="text-xs text-slate-500 mt-0.5">' + m.desc + '</div></div></div></a>';
  }).join('');
}


// ========== Theme ==========
MG.applyTheme = function(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  localStorage.setItem(MG.THEME_KEY, theme);
}

// ========== UI Helpers ==========
MG.showToast = function(msg, duration) {
  const el = MG.$('#toast');
  if (!el) return;
  el.textContent = msg;
  // Long errors need more time + ensure visible above bottom browser bars
  if (duration == null) duration = String(msg || '').length > 60 ? 5500 : 2800;
  el.classList.remove('translate-y-16', 'translate-y-24', 'opacity-0');
  el.classList.add('translate-y-0', 'opacity-100');
  clearTimeout(MG._toastTimer);
  MG._toastTimer = setTimeout(() => {
    el.classList.add('translate-y-24', 'opacity-0');
    el.classList.remove('translate-y-0', 'opacity-100');
  }, duration);
}

MG.formatDate = function(ts) {
  return new Date(ts).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

MG.youtubeId = function(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

// ========== Category navigation (Packaging vs Career & AI) ==========
MG.showCategory = function(cat) {
  var picker = document.getElementById('categoryPicker');
  var secP = document.getElementById('sectionPackaging');
  var secC = document.getElementById('sectionCareer');
  if (picker) picker.classList.toggle('hidden', !!cat);
  if (secP) secP.classList.toggle('hidden', cat !== 'packaging');
  if (secC) secC.classList.toggle('hidden', cat !== 'career');
  if (cat === 'packaging') {
    try { MG.renderFreePackSection(); } catch (e) {}
  }
  try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e2) {}
};

MG.initCategoryNav = function() {
  var bp = document.getElementById('catBtnPackaging');
  var bc = document.getElementById('catBtnCareer');
  if (bp) bp.addEventListener('click', function () { MG.showCategory('packaging'); });
  if (bc) bc.addEventListener('click', function () { MG.showCategory('career'); });
  document.querySelectorAll('.back-to-cats').forEach(function (btn) {
    btn.addEventListener('click', function () { MG.showCategory(null); });
  });
};

MG._topicHourlyRate = function(topic) {
  var trackId = (topic && topic.track) || 'career_ai';
  var tr = (MG.TRACKS && MG.TRACKS[trackId]) || (MG.TRACKS && MG.TRACKS.career_ai) || { hourlyRate: 699 };
  return Number(tr.hourlyRate) || 699;
};

MG._buildTopicCard = function(topic, activeData) {
  const unlocked = !!(activeData && activeData.unlocked && activeData.unlocked[topic.id]);
  const card = document.createElement('div');
  card.className = 'topic-card';
  card.dataset.id = topic.id;
  card.dataset.track = topic.track || 'career_ai';

  const rate = MG._topicHourlyRate(topic);
  const iconsHtml = (topic.icons || []).map(ic => {
    const title = (typeof ic === 'object' && ic.title) ? ic.title : '';
    if (typeof ic === 'object' && ic.img) {
      return `<span class="logo-badge logo-badge-img" title="${title}"><img src="${ic.img}" alt="${title}" width="28" height="28"/></span>`;
    }
    const isFa = typeof ic === 'object' && ic.icon && String(ic.icon).startsWith('fa-');
    const bg = (typeof ic === 'object' && ic.bg) ? ic.bg : '#ffffff';
    const content = (typeof ic === 'object')
      ? (isFa ? `<i class="${ic.icon}"></i>` : ic.icon)
      : ic;
    return `<span class="logo-badge" title="${title}" style="background:${bg};color:#fff;">${content}</span>`;
  }).join('');

  card.innerHTML = `
    <div class="card-banner" style="background:${topic.gradient}">
      ${iconsHtml}
      <span class="status-badge ${unlocked ? 'status-unlocked' : 'status-locked'}" data-catalog-rate="${topic.track || 'career_ai'}">
        ${unlocked ? '✓ Unlocked' : '₹' + rate.toLocaleString('en-IN') + '/Hr'}
      </span>
    </div>
    <div class="card-body">
      <h3 class="font-bold text-sm sm:text-[15px] leading-snug mb-1.5">${topic.title}</h3>
      <p class="text-xs text-slate-500 dark:text-slate-400 mb-2.5 line-clamp-2">${topic.hook}</p>
      <div class="flex flex-wrap gap-0.5 mb-3">
        ${(topic.tags || []).slice(0, 5).map(t => `<span class="tag">${t}</span>`).join('')}
        ${(topic.tags || []).length > 5 ? `<span class="tag">+${topic.tags.length - 5}</span>` : ''}
      </div>
      <div class="flex gap-2">
        ${unlocked
          ? `<button class="flex-1 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold enter-ws-btn">
               <i class="fas fa-door-open mr-1"></i> Enter Workspace
             </button>`
          : `<button class="flex-1 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold book-btn">
               <i class="fas fa-calendar-check mr-1"></i> Book One-to-One Session
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
      MG.openBooking(topic.id);
    });
  });
  const enterBtn = card.querySelector('.enter-ws-btn');
  if (enterBtn) {
    enterBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      MG.openWorkspace(topic.id);
    });
  }
  if (unlocked) {
    card.addEventListener('click', () => MG.openWorkspace(topic.id));
  }
  return card;
};

// ========== Render Catalog ==========
MG.renderCatalog = function() {
  const gridCareer = MG.$('#topicsGrid');
  const gridPack = document.getElementById('topicsGridPackaging');
  const activeData = MG.state.data || { unlocked: {} };

  if (gridCareer) gridCareer.innerHTML = '';
  if (gridPack) gridPack.innerHTML = '';

  (MG.TOPICS || []).forEach(topic => {
    const track = topic.track || 'career_ai';
    const card = MG._buildTopicCard(topic, activeData);
    if (track === 'packaging') {
      if (gridPack) gridPack.appendChild(card);
    } else {
      if (gridCareer) gridCareer.appendChild(card);
    }
  });
  try { MG.renderFreePackSection(); } catch (e) {}
  try { MG.initCategoryNav(); } catch (e2) {}
}



})(window.MG = window.MG || {});
