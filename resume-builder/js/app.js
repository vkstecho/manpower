/**
 * Top-Class Resume Builder
 * Modular, production-ready single-page application
 */
(() => {
  'use strict';

  // ========== State ==========
  const STORAGE_KEY = 'resumeBuilderData_v1';
  const THEME_KEY = 'resumeBuilderTheme';

  const defaultData = {
    fullName: '',
    jobTitle: '',
    email: '',
    phone: '',
    location: '',
    passport: '',
    linkedin: '',
    portfolio: '',
    includePhoto: false,
    photoData: null,
    summary: '',
    experiences: [],
    education: [],
    certifications: [],
    techSkills: '',
    softSkills: '',
    languages: '',
    projects: [],
    template: 'executive',
    compact: false
  };

  let data = loadData();
  let currentStep = 1;
  const totalSteps = 6;

  // ========== DOM Refs ==========
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // ========== Init ==========
  function init() {
    applyTheme(localStorage.getItem(THEME_KEY) || 'light');
    bindEvents();
    renderExperienceList();
    renderEducationList();
    renderCertificationList();
    renderProjectList();
    populateForm();
    updateProgress();
    renderResume();
    showStep(1);
  }

  // ========== Theme ==========
  function applyTheme(theme) {
    const html = document.documentElement;
    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    localStorage.setItem(THEME_KEY, theme);
  }

  function toggleTheme() {
    const isDark = document.documentElement.classList.contains('dark');
    applyTheme(isDark ? 'light' : 'dark');
  }

  // ========== Persistence ==========
  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(defaultData);
      return { ...structuredClone(defaultData), ...JSON.parse(raw) };
    } catch {
      return structuredClone(defaultData);
    }
  }

  function saveData() {
    collectFormData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    showToast('Progress saved');
  }

  function collectFormData() {
    data.fullName = $('#fullName')?.value || '';
    data.jobTitle = $('#jobTitle')?.value || '';
    data.email = $('#email')?.value || '';
    data.phone = $('#phone')?.value || '';
    data.location = $('#location')?.value || '';
    data.passport = $('#passport')?.value || '';
    data.linkedin = $('#linkedin')?.value || '';
    data.portfolio = $('#portfolio')?.value || '';
    data.includePhoto = $('#includePhoto')?.checked || false;
    data.summary = $('#summary')?.value || '';
    data.techSkills = $('#techSkills')?.value || '';
    data.softSkills = $('#softSkills')?.value || '';
    data.languages = $('#languages')?.value || '';
    data.compact = $('#compactSpacing')?.checked || false;
  }

  function populateForm() {
    $('#fullName').value = data.fullName;
    $('#jobTitle').value = data.jobTitle;
    $('#email').value = data.email;
    $('#phone').value = data.phone;
    $('#location').value = data.location;
    $('#passport').value = data.passport;
    $('#linkedin').value = data.linkedin;
    $('#portfolio').value = data.portfolio;
    $('#includePhoto').checked = data.includePhoto;
    $('#summary').value = data.summary;
    $('#techSkills').value = data.techSkills;
    $('#softSkills').value = data.softSkills;
    $('#languages').value = data.languages;
    $('#compactSpacing').checked = data.compact;

    if (data.includePhoto) {
      $('#photoUploadArea').classList.remove('hidden');
      if (data.photoData) {
        $('#photoImg').src = data.photoData;
        $('#photoPreview').classList.remove('hidden');
        $('#photoPreview').classList.add('flex');
      }
    }

    // Template buttons
    $$('.template-btn').forEach(btn => {
      btn.classList.toggle('active-template', btn.dataset.template === data.template);
    });

    updateSummaryCount();
  }

  // ========== Wizard Navigation ==========
  function showStep(step) {
    currentStep = step;
    $$('.wizard-step').forEach(el => el.classList.add('hidden'));
    const el = $(`#step-${step}`);
    if (el) el.classList.remove('hidden');

    $('#prevBtn').disabled = step === 1;
    const nextBtn = $('#nextBtn');
    if (step === totalSteps) {
      nextBtn.innerHTML = '<i class="fas fa-check mr-1.5"></i> Finish & Preview';
    } else {
      nextBtn.innerHTML = 'Next <i class="fas fa-arrow-right ml-1.5"></i>';
    }

    updateProgress();
    saveData();
    renderResume();
  }

  function updateProgress() {
    const pct = (currentStep / totalSteps) * 100;
    $('#progressBar').style.width = `${pct}%`;
    $('#currentStepNum').textContent = currentStep;

    const titles = [
      'Personal & Contact',
      'Professional Summary',
      'Work Experience',
      'Education & Certifications',
      'Skills & Languages',
      'Projects & Custom'
    ];
    $('#stepTitle').textContent = titles[currentStep - 1];

    $$('.step-dot').forEach(dot => {
      const s = parseInt(dot.dataset.step, 10);
      dot.classList.remove('active', 'completed');
      if (s === currentStep) dot.classList.add('active');
      else if (s < currentStep) dot.classList.add('completed');
    });
  }

  function validateStep(step) {
    if (step === 1) {
      const name = $('#fullName').value.trim();
      const email = $('#email').value.trim();
      if (!name) {
        showToast('Please enter your full name', true);
        $('#fullName').focus();
        return false;
      }
      if (!email) {
        showToast('Please enter your email', true);
        $('#email').focus();
        return false;
      }
    }
    return true;
  }

  // ========== Dynamic Lists ==========
  function renderExperienceList() {
    const list = $('#experienceList');
    list.innerHTML = '';
    if (!data.experiences.length) {
      data.experiences.push(emptyExperience());
    }
    data.experiences.forEach((exp, idx) => {
      const card = document.createElement('div');
      card.className = 'item-card';
      card.innerHTML = `
        <button type="button" class="remove-btn" data-idx="${idx}" title="Remove"><i class="fas fa-times"></i></button>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
          <div>
            <label class="block text-xs font-medium mb-1 text-slate-500">Job Title</label>
            <input type="text" class="form-input exp-title" data-idx="${idx}" value="${esc(exp.title)}" placeholder="Senior Developer" />
          </div>
          <div>
            <label class="block text-xs font-medium mb-1 text-slate-500">Company</label>
            <input type="text" class="form-input exp-company" data-idx="${idx}" value="${esc(exp.company)}" placeholder="Acme Corp" />
          </div>
          <div>
            <label class="block text-xs font-medium mb-1 text-slate-500">Location</label>
            <input type="text" class="form-input exp-location" data-idx="${idx}" value="${esc(exp.location)}" placeholder="Remote / City" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs font-medium mb-1 text-slate-500">Start</label>
              <input type="text" class="form-input exp-start" data-idx="${idx}" value="${esc(exp.start)}" placeholder="Jan 2020" />
            </div>
            <div>
              <label class="block text-xs font-medium mb-1 text-slate-500">End</label>
              <input type="text" class="form-input exp-end" data-idx="${idx}" value="${esc(exp.end)}" placeholder="Present" />
            </div>
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium mb-1 text-slate-500">Achievements (one per line)</label>
          <textarea class="form-input exp-bullets resize-none" data-idx="${idx}" rows="3" placeholder="• Led team of 5 engineers&#10;• Increased performance by 40%">${esc(exp.bullets)}</textarea>
        </div>
      `;
      list.appendChild(card);
    });

    // Bind remove & inputs
    list.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx, 10);
        data.experiences.splice(idx, 1);
        if (!data.experiences.length) data.experiences.push(emptyExperience());
        renderExperienceList();
        saveData();
        renderResume();
      });
    });

    list.querySelectorAll('input, textarea').forEach(el => {
      el.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        const field = e.target.className.match(/exp-(\w+)/)?.[1];
        if (field && data.experiences[idx]) {
          data.experiences[idx][field] = e.target.value;
          saveData();
          renderResume();
        }
      });
    });
  }

  function emptyExperience() {
    return { title: '', company: '', location: '', start: '', end: '', bullets: '' };
  }

  function renderEducationList() {
    const list = $('#educationList');
    list.innerHTML = '';
    if (!data.education.length) data.education.push(emptyEducation());
    data.education.forEach((edu, idx) => {
      const card = document.createElement('div');
      card.className = 'item-card';
      card.innerHTML = `
        <button type="button" class="remove-btn" data-idx="${idx}" title="Remove"><i class="fas fa-times"></i></button>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
          <div>
            <label class="block text-xs font-medium mb-1 text-slate-500">Degree / Program</label>
            <input type="text" class="form-input edu-degree" data-idx="${idx}" value="${esc(edu.degree)}" placeholder="B.S. Computer Science" />
          </div>
          <div>
            <label class="block text-xs font-medium mb-1 text-slate-500">Institution</label>
            <input type="text" class="form-input edu-school" data-idx="${idx}" value="${esc(edu.school)}" placeholder="Stanford University" />
          </div>
          <div>
            <label class="block text-xs font-medium mb-1 text-slate-500">Location</label>
            <input type="text" class="form-input edu-location" data-idx="${idx}" value="${esc(edu.location)}" placeholder="CA, USA" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs font-medium mb-1 text-slate-500">Start</label>
              <input type="text" class="form-input edu-start" data-idx="${idx}" value="${esc(edu.start)}" placeholder="2016" />
            </div>
            <div>
              <label class="block text-xs font-medium mb-1 text-slate-500">End</label>
              <input type="text" class="form-input edu-end" data-idx="${idx}" value="${esc(edu.end)}" placeholder="2020" />
            </div>
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium mb-1 text-slate-500">Details (GPA, honors, etc.)</label>
          <input type="text" class="form-input edu-details" data-idx="${idx}" value="${esc(edu.details)}" placeholder="GPA 3.8, Dean's List" />
        </div>
      `;
      list.appendChild(card);
    });

    list.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx, 10);
        data.education.splice(idx, 1);
        if (!data.education.length) data.education.push(emptyEducation());
        renderEducationList();
        saveData();
        renderResume();
      });
    });

    list.querySelectorAll('input').forEach(el => {
      el.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        const field = e.target.className.match(/edu-(\w+)/)?.[1];
        if (field && data.education[idx]) {
          data.education[idx][field] = e.target.value;
          saveData();
          renderResume();
        }
      });
    });
  }

  function emptyEducation() {
    return { degree: '', school: '', location: '', start: '', end: '', details: '' };
  }

  function renderCertificationList() {
    const list = $('#certificationList');
    list.innerHTML = '';
    data.certifications.forEach((cert, idx) => {
      const card = document.createElement('div');
      card.className = 'item-card';
      card.innerHTML = `
        <button type="button" class="remove-btn" data-idx="${idx}" title="Remove"><i class="fas fa-times"></i></button>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
          <div>
            <label class="block text-xs font-medium mb-1 text-slate-500">Certification Name</label>
            <input type="text" class="form-input cert-name" data-idx="${idx}" value="${esc(cert.name)}" placeholder="AWS Solutions Architect" />
          </div>
          <div>
            <label class="block text-xs font-medium mb-1 text-slate-500">Issuer / Year</label>
            <input type="text" class="form-input cert-issuer" data-idx="${idx}" value="${esc(cert.issuer)}" placeholder="Amazon – 2023" />
          </div>
        </div>
      `;
      list.appendChild(card);
    });

    list.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx, 10);
        data.certifications.splice(idx, 1);
        renderCertificationList();
        saveData();
        renderResume();
      });
    });

    list.querySelectorAll('input').forEach(el => {
      el.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        const field = e.target.className.match(/cert-(\w+)/)?.[1];
        if (field && data.certifications[idx]) {
          data.certifications[idx][field] = e.target.value;
          saveData();
          renderResume();
        }
      });
    });
  }

  function renderProjectList() {
    const list = $('#projectList');
    list.innerHTML = '';
    if (!data.projects.length) data.projects.push(emptyProject());
    data.projects.forEach((proj, idx) => {
      const card = document.createElement('div');
      card.className = 'item-card';
      card.innerHTML = `
        <button type="button" class="remove-btn" data-idx="${idx}" title="Remove"><i class="fas fa-times"></i></button>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
          <div>
            <label class="block text-xs font-medium mb-1 text-slate-500">Title</label>
            <input type="text" class="form-input proj-title" data-idx="${idx}" value="${esc(proj.title)}" placeholder="Project / Publication Name" />
          </div>
          <div>
            <label class="block text-xs font-medium mb-1 text-slate-500">Link / Year</label>
            <input type="text" class="form-input proj-meta" data-idx="${idx}" value="${esc(proj.meta)}" placeholder="github.com/... or 2024" />
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium mb-1 text-slate-500">Description</label>
          <textarea class="form-input proj-desc resize-none" data-idx="${idx}" rows="2" placeholder="Brief description of impact and tech used">${esc(proj.desc)}</textarea>
        </div>
      `;
      list.appendChild(card);
    });

    list.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx, 10);
        data.projects.splice(idx, 1);
        if (!data.projects.length) data.projects.push(emptyProject());
        renderProjectList();
        saveData();
        renderResume();
      });
    });

    list.querySelectorAll('input, textarea').forEach(el => {
      el.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        const field = e.target.className.match(/proj-(\w+)/)?.[1];
        if (field && data.projects[idx]) {
          data.projects[idx][field] = e.target.value;
          saveData();
          renderResume();
        }
      });
    });
  }

  function emptyProject() {
    return { title: '', meta: '', desc: '' };
  }

  // ========== Resume Rendering ==========
  function renderResume() {
    collectFormData();
    const paper = $('#resumePaper');
    const tpl = data.template || 'executive';

    // Reset classes
    paper.className = `resume-paper template-${tpl}`;
    if (data.includePhoto && data.photoData) paper.classList.add('with-photo');
    if (data.compact) paper.classList.add('compact');

    if (tpl === 'twocolumn') {
      paper.innerHTML = renderTwoColumn();
    } else if (tpl === 'creative') {
      paper.innerHTML = renderCreative();
    } else {
      paper.innerHTML = renderSingleColumn(tpl);
    }
  }

  function contactItems() {
    const items = [];
    if (data.email) items.push(`<span><i class="fas fa-envelope"></i> ${esc(data.email)}</span>`);
    if (data.phone) items.push(`<span><i class="fas fa-phone"></i> ${esc(data.phone)}</span>`);
    if (data.location) items.push(`<span><i class="fas fa-map-marker-alt"></i> ${esc(data.location)}</span>`);
    if (data.linkedin) items.push(`<span><i class="fab fa-linkedin"></i> ${esc(data.linkedin.replace(/^https?:\/\//, ''))}</span>`);
    if (data.portfolio) items.push(`<span><i class="fas fa-globe"></i> ${esc(data.portfolio.replace(/^https?:\/\//, ''))}</span>`);
    if (data.passport) items.push(`<span><i class="fas fa-passport"></i> ${esc(data.passport)}</span>`);
    return items.join('');
  }

  function photoHTML() {
    if (data.includePhoto && data.photoData) {
      return `<div class="photo-wrap"><img src="${data.photoData}" alt="Photo" /></div>`;
    }
    return '<div class="photo-wrap"></div>';
  }

  function summarySection() {
    if (!data.summary.trim()) return '';
    return `
      <div class="section">
        <div class="section-title">Professional Summary</div>
        <div class="item-desc">${esc(data.summary).replace(/\n/g, '<br>')}</div>
      </div>`;
  }

  function experienceSection() {
    const items = data.experiences.filter(e => e.title || e.company);
    if (!items.length) return '';
    return `
      <div class="section">
        <div class="section-title">Work Experience</div>
        ${items.map(e => `
          <div class="item">
            <div class="item-header">
              <div>
                <div class="item-title">${esc(e.title)}${e.company ? ' · ' + esc(e.company) : ''}</div>
                ${e.location ? `<div class="item-subtitle">${esc(e.location)}</div>` : ''}
              </div>
              <div class="item-date">${esc(e.start)}${e.start || e.end ? ' – ' : ''}${esc(e.end || 'Present')}</div>
            </div>
            ${e.bullets ? `<div class="item-desc"><ul>${e.bullets.split('\n').filter(Boolean).map(b => `<li>${esc(b.replace(/^[•\-\*]\s*/, ''))}</li>`).join('')}</ul></div>` : ''}
          </div>
        `).join('')}
      </div>`;
  }

  function educationSection() {
    const items = data.education.filter(e => e.degree || e.school);
    if (!items.length) return '';
    return `
      <div class="section">
        <div class="section-title">Education</div>
        ${items.map(e => `
          <div class="item">
            <div class="item-header">
              <div>
                <div class="item-title">${esc(e.degree)}</div>
                <div class="item-subtitle">${esc(e.school)}${e.location ? ' · ' + esc(e.location) : ''}</div>
              </div>
              <div class="item-date">${esc(e.start)}${e.start || e.end ? ' – ' : ''}${esc(e.end)}</div>
            </div>
            ${e.details ? `<div class="item-desc">${esc(e.details)}</div>` : ''}
          </div>
        `).join('')}
      </div>`;
  }

  function certSection() {
    const items = data.certifications.filter(c => c.name);
    if (!items.length) return '';
    return `
      <div class="section">
        <div class="section-title">Certifications</div>
        ${items.map(c => `
          <div class="item">
            <div class="item-header">
              <div class="item-title">${esc(c.name)}</div>
              <div class="item-date">${esc(c.issuer)}</div>
            </div>
          </div>
        `).join('')}
      </div>`;
  }

  function skillsSection(forSidebar = false) {
    const tech = data.techSkills.split(',').map(s => s.trim()).filter(Boolean);
    const soft = data.softSkills.split(',').map(s => s.trim()).filter(Boolean);
    const langs = data.languages.split(',').map(s => s.trim()).filter(Boolean);
    if (!tech.length && !soft.length && !langs.length) return '';

    if (forSidebar) {
      let html = '';
      if (tech.length) {
        html += `<div class="sidebar-section"><div class="sidebar-title">Technical Skills</div>${tech.map(s => `<div class="skill-tag">${esc(s)}</div>`).join('')}</div>`;
      }
      if (soft.length) {
        html += `<div class="sidebar-section"><div class="sidebar-title">Soft Skills</div>${soft.map(s => `<div class="skill-tag">${esc(s)}</div>`).join('')}</div>`;
      }
      if (langs.length) {
        html += `<div class="sidebar-section"><div class="sidebar-title">Languages</div>${langs.map(s => `<div class="skill-tag">${esc(s)}</div>`).join('')}</div>`;
      }
      return html;
    }

    let html = '<div class="section"><div class="section-title">Skills</div><div class="skills-list">';
    [...tech, ...soft].forEach(s => { html += `<span class="skill-tag">${esc(s)}</span>`; });
    html += '</div></div>';
    if (langs.length) {
      html += `<div class="section"><div class="section-title">Languages</div><div class="item-desc">${langs.map(esc).join(' · ')}</div></div>`;
    }
    return html;
  }

  function projectsSection() {
    const items = data.projects.filter(p => p.title);
    if (!items.length) return '';
    return `
      <div class="section">
        <div class="section-title">Projects & Publications</div>
        ${items.map(p => `
          <div class="item">
            <div class="item-header">
              <div class="item-title">${esc(p.title)}</div>
              <div class="item-date">${esc(p.meta)}</div>
            </div>
            ${p.desc ? `<div class="item-desc">${esc(p.desc)}</div>` : ''}
          </div>
        `).join('')}
      </div>`;
  }

  function renderSingleColumn(tpl) {
    return `
      <div class="header">
        ${photoHTML()}
        <div class="header-text">
          <h1 class="header-name">${esc(data.fullName) || 'Your Name'}</h1>
          ${data.jobTitle ? `<div class="header-title">${esc(data.jobTitle)}</div>` : ''}
          <div class="header-contact">${contactItems()}</div>
        </div>
      </div>
      ${summarySection()}
      ${experienceSection()}
      ${educationSection()}
      ${certSection()}
      ${skillsSection(false)}
      ${projectsSection()}
    `;
  }

  function renderCreative() {
    return `
      <div class="header">
        ${photoHTML()}
        <div class="header-text">
          <h1 class="header-name">${esc(data.fullName) || 'Your Name'}</h1>
          ${data.jobTitle ? `<div class="header-title">${esc(data.jobTitle)}</div>` : ''}
          <div class="header-contact">${contactItems()}</div>
        </div>
      </div>
      <div class="body">
        ${summarySection()}
        ${experienceSection()}
        ${educationSection()}
        ${certSection()}
        ${skillsSection(false)}
        ${projectsSection()}
      </div>
    `;
  }

  function renderTwoColumn() {
    const contactHTML = [];
    if (data.email) contactHTML.push(`<div><i class="fas fa-envelope fa-fw"></i> ${esc(data.email)}</div>`);
    if (data.phone) contactHTML.push(`<div><i class="fas fa-phone fa-fw"></i> ${esc(data.phone)}</div>`);
    if (data.location) contactHTML.push(`<div><i class="fas fa-map-marker-alt fa-fw"></i> ${esc(data.location)}</div>`);
    if (data.linkedin) contactHTML.push(`<div><i class="fab fa-linkedin fa-fw"></i> ${esc(data.linkedin.replace(/^https?:\/\//, ''))}</div>`);
    if (data.portfolio) contactHTML.push(`<div><i class="fas fa-globe fa-fw"></i> ${esc(data.portfolio.replace(/^https?:\/\//, ''))}</div>`);
    if (data.passport) contactHTML.push(`<div><i class="fas fa-passport fa-fw"></i> ${esc(data.passport)}</div>`);

    return `
      <div class="sidebar">
        ${photoHTML()}
        <h1 class="header-name">${esc(data.fullName) || 'Your Name'}</h1>
        ${data.jobTitle ? `<div class="header-title">${esc(data.jobTitle)}</div>` : ''}
        <div class="sidebar-section">
          <div class="sidebar-title">Contact</div>
          <div class="sidebar-contact">${contactHTML.join('')}</div>
        </div>
        ${skillsSection(true)}
      </div>
      <div class="main">
        ${summarySection()}
        ${experienceSection()}
        ${educationSection()}
        ${certSection()}
        ${projectsSection()}
      </div>
    `;
  }

  // ========== Helpers ==========
  function esc(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function showToast(msg, isError = false) {
    const t = $('#toast');
    t.textContent = msg;
    t.style.background = isError ? '#dc2626' : '';
    t.classList.remove('translate-y-20', 'opacity-0');
    t.classList.add('translate-y-0', 'opacity-100');
    setTimeout(() => {
      t.classList.add('translate-y-20', 'opacity-0');
      t.classList.remove('translate-y-0', 'opacity-100');
    }, 2200);
  }

  function updateSummaryCount() {
    const el = $('#summaryCount');
    if (el) el.textContent = ($('#summary')?.value || '').length;
  }

  // ========== Events ==========
  function bindEvents() {
    $('#themeToggle').addEventListener('click', toggleTheme);
    $('#printBtn').addEventListener('click', () => window.print());
    $('#mobilePrintBtn').addEventListener('click', () => window.print());

    $('#prevBtn').addEventListener('click', () => {
      if (currentStep > 1) showStep(currentStep - 1);
    });

    $('#nextBtn').addEventListener('click', () => {
      if (!validateStep(currentStep)) return;
      if (currentStep < totalSteps) {
        showStep(currentStep + 1);
      } else {
        saveData();
        showToast('Resume ready! Use Print / PDF to export.');
        // Scroll preview into view on mobile
        $('#resumePaper')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    // Live form inputs
    ['fullName', 'jobTitle', 'email', 'phone', 'location', 'passport', 'linkedin', 'portfolio', 'summary', 'techSkills', 'softSkills', 'languages'].forEach(id => {
      const el = $(`#${id}`);
      if (el) {
        el.addEventListener('input', () => {
          if (id === 'summary') updateSummaryCount();
          saveData();
          renderResume();
        });
      }
    });

    $('#includePhoto').addEventListener('change', (e) => {
      data.includePhoto = e.target.checked;
      $('#photoUploadArea').classList.toggle('hidden', !e.target.checked);
      if (!e.target.checked) {
        data.photoData = null;
        $('#photoPreview').classList.add('hidden');
        $('#photoPreview').classList.remove('flex');
        $('#photoInput').value = '';
      }
      saveData();
      renderResume();
    });

    $('#photoInput').addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        showToast('Photo must be under 2MB', true);
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        data.photoData = ev.target.result;
        $('#photoImg').src = data.photoData;
        $('#photoPreview').classList.remove('hidden');
        $('#photoPreview').classList.add('flex');
        saveData();
        renderResume();
      };
      reader.readAsDataURL(file);
    });

    $('#removePhoto').addEventListener('click', () => {
      data.photoData = null;
      $('#photoImg').src = '';
      $('#photoPreview').classList.add('hidden');
      $('#photoPreview').classList.remove('flex');
      $('#photoInput').value = '';
      saveData();
      renderResume();
    });

    // Template switch
    $$('.template-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        data.template = btn.dataset.template;
        $$('.template-btn').forEach(b => b.classList.remove('active-template'));
        btn.classList.add('active-template');
        saveData();
        renderResume();
      });
    });

    $('#compactSpacing').addEventListener('change', (e) => {
      data.compact = e.target.checked;
      saveData();
      renderResume();
    });

    // Add buttons
    $('#addExperience').addEventListener('click', () => {
      data.experiences.push(emptyExperience());
      renderExperienceList();
      saveData();
    });

    $('#addEducation').addEventListener('click', () => {
      data.education.push(emptyEducation());
      renderEducationList();
      saveData();
    });

    $('#addCertification').addEventListener('click', () => {
      data.certifications.push({ name: '', issuer: '' });
      renderCertificationList();
      saveData();
    });

    $('#addProject').addEventListener('click', () => {
      data.projects.push(emptyProject());
      renderProjectList();
      saveData();
    });

    // Auto-save on step dots click (optional jump)
    $$('.step-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        const s = parseInt(dot.dataset.step, 10);
        if (s <= currentStep || validateStep(currentStep)) {
          showStep(s);
        }
      });
    });
  }



  // ========== v3.2.6: Export / Import JSON + keyboard ==========
  function exportResumeJSON() {
    collectFormData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (data.fullName || 'resume').replace(/\s+/g, '_') + '_resume.json';
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('Resume data exported');
  }

  function importResumeJSON(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        data = { ...structuredClone(defaultData), ...parsed };
        saveData();
        populateForm();
        renderExperienceList();
        renderEducationList();
        renderCertificationList();
        renderProjectList();
        renderResume();
        showToast('Resume data imported');
      } catch (e) {
        showToast('Invalid JSON file', true);
      }
    };
    reader.readAsText(file);
  }

  function clearAllData() {
    if (!confirm('Clear all resume data? This cannot be undone.')) return;
    data = structuredClone(defaultData);
    localStorage.removeItem(STORAGE_KEY);
    populateForm();
    renderExperienceList();
    renderEducationList();
    renderCertificationList();
    renderProjectList();
    renderResume();
    showStep(1);
    showToast('All data cleared');
  }

  // Wire export/import if toolbar buttons exist
  document.addEventListener('DOMContentLoaded', function () {
    const expBtn = document.getElementById('exportJsonBtn');
    if (expBtn) expBtn.addEventListener('click', exportResumeJSON);
    const impInput = document.getElementById('importJsonInput');
    if (impInput) {
      impInput.addEventListener('change', function (e) {
        if (e.target.files && e.target.files[0]) importResumeJSON(e.target.files[0]);
        e.target.value = '';
      });
    }
    const clearBtn = document.getElementById('clearAllBtn');
    if (clearBtn) clearBtn.addEventListener('click', clearAllData);

    // Keyboard: Ctrl/Cmd+S save, Ctrl/Cmd+P print
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveData();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        // allow native print — collect first
        collectFormData();
        renderResume();
      }
    });
  });

  // Boot
  

  // ========== Firebase mobile login + cloud resume (Man Power project) ==========
  let rbMobileLoggedIn = null;

  function rbSetLoggedIn(mobile10) {
    rbMobileLoggedIn = mobile10;
    try {
      localStorage.setItem('rb_cloud_mobile', mobile10);
      localStorage.setItem('vks_site_phone', mobile10);
      localStorage.setItem('vks_site_verified', '1');
      localStorage.setItem('vks_mentor_verified_' + mobile10, '1');
      localStorage.setItem('mp_user_phone', mobile10);
    } catch (e) {}
    const st = document.getElementById('rbLoginStatus');
    if (st) st.textContent = 'Logged in +91 ' + mobile10 + ' — cloud save enabled';
    ['rbCloudSave', 'rbCloudLoad'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('hidden');
    });
    const formBits = ['rbMobile', 'rbSendOtp', 'rbOtp', 'rbVerifyOtp'];
    formBits.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });
    const lo = document.getElementById('rbLogoutBtn');
    if (lo) lo.classList.remove('hidden');
  }

  function rbLogout() {
    try {
      const mob = localStorage.getItem('vks_site_phone') || rbMobileLoggedIn || '';
      localStorage.removeItem('vks_site_phone');
      localStorage.removeItem('vks_site_verified');
      localStorage.removeItem('rb_cloud_mobile');
      if (mob) localStorage.removeItem('vks_mentor_verified_' + mob);
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.indexOf('vks_mentor_verified_') === 0) keys.push(k);
      }
      keys.forEach((k) => localStorage.removeItem(k));
    } catch (e) {}
    rbMobileLoggedIn = null;
    showToast('Logged out');
    setTimeout(() => location.reload(), 400);
  }

  function rbParentManPowerMobile() {
    try {
      if (!window.parent || window.parent === window) return null;
      if (!(window.parent.MP_CFG || window.parent.SESSION || window.parent._fbAccess)) return null;
      let ph = window.parent.localStorage && (
        window.parent.localStorage.getItem('mp_user_phone') ||
        window.parent.localStorage.getItem('mp_device_phone')
      );
      if (ph) {
        const d = String(ph).replace(/\D/g, '').slice(-10);
        if (/^[6-9]\d{9}$/.test(d)) return d;
      }
    } catch (e) {}
    return null;
  }

  function rbGetSharedMobile() {
    // 1) Inside Man Power — use parent session (no OTP)
    const pm = rbParentManPowerMobile();
    if (pm) return pm;
    // 2) Website shared OTP (Mentor or Resume)
    try {
      if (localStorage.getItem('vks_site_verified') === '1') {
        const m = (localStorage.getItem('vks_site_phone') || '').replace(/\D/g, '').slice(-10);
        if (/^[6-9]\d{9}$/.test(m)) return m;
      }
      const saved = (localStorage.getItem('rb_cloud_mobile') || '').replace(/\D/g, '').slice(-10);
      if (/^[6-9]\d{9}$/.test(saved) && localStorage.getItem('vks_mentor_verified_' + saved) === '1') return saved;
    } catch (e) {}
    return null;
  }

  async function rbSendOtp() {
    const m = (document.getElementById('rbMobile')?.value || '').replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(m)) {
      showToast('Enter valid 10-digit mobile', true);
      return;
    }
    if (!window.ResumeFB || !window.ResumeFB.sendOtp) {
      showToast('Firebase not ready — try again', true);
      return;
    }
    try {
      showToast('Sending OTP…');
      await window.ResumeFB.sendOtp(m);
      document.getElementById('rbOtp')?.classList.remove('hidden');
      document.getElementById('rbVerifyOtp')?.classList.remove('hidden');
      showToast('OTP sent');
    } catch (e) {
      showToast((e && e.message) || 'OTP failed', true);
    }
  }

  async function rbVerifyOtp() {
    const m = (document.getElementById('rbMobile')?.value || '').replace(/\D/g, '').slice(-10);
    const code = (document.getElementById('rbOtp')?.value || '').trim();
    if (!code) return showToast('Enter OTP', true);
    try {
      await window.ResumeFB.verifyOtp(code);
      rbSetLoggedIn(m);
      // Try load existing cloud resume
      try {
        const remote = await window.ResumeFB.loadResume(m);
        if (remote && remote.fullName !== undefined) {
          if (confirm('Cloud resume found. Load it?')) {
            data = { ...structuredClone(defaultData), ...remote };
            delete data.mobile;
            delete data.updatedAt;
            populateForm();
            renderExperienceList();
            renderEducationList();
            renderCertificationList();
            renderProjectList();
            renderResume();
            saveData();
            showToast('Loaded from cloud');
          }
        }
      } catch (e) {}
      showToast('Logged in');
    } catch (e) {
      showToast((e && e.message) || 'Verify failed', true);
    }
  }

  async function rbCloudSave() {
    if (!rbMobileLoggedIn) return showToast('Login with mobile first', true);
    collectFormData();
    try {
      await window.ResumeFB.saveResume(rbMobileLoggedIn, data);
      showToast('Saved to cloud');
    } catch (e) {
      showToast((e && e.message) || 'Cloud save failed', true);
    }
  }

  async function rbCloudLoad() {
    if (!rbMobileLoggedIn) return showToast('Login with mobile first', true);
    try {
      const remote = await window.ResumeFB.loadResume(rbMobileLoggedIn);
      if (!remote) return showToast('No cloud resume found', true);
      data = { ...structuredClone(defaultData), ...remote };
      delete data.mobile;
      delete data.updatedAt;
      populateForm();
      renderExperienceList();
      renderEducationList();
      renderCertificationList();
      renderProjectList();
      renderResume();
      saveData();
      showToast('Loaded from cloud');
    } catch (e) {
      showToast((e && e.message) || 'Load failed', true);
    }
  }

  function bindCloudAuth() {
    document.getElementById('rbSendOtp')?.addEventListener('click', rbSendOtp);
    document.getElementById('rbVerifyOtp')?.addEventListener('click', rbVerifyOtp);
    document.getElementById('rbCloudSave')?.addEventListener('click', rbCloudSave);
    document.getElementById('rbCloudLoad')?.addEventListener('click', rbCloudLoad);
    document.getElementById('rbLogoutBtn')?.addEventListener('click', rbLogout);

    // Shared / Man Power session → no OTP
    const shared = rbGetSharedMobile();
    if (shared) {
      rbSetLoggedIn(shared);
      const st = document.getElementById('rbLoginStatus');
      if (st && rbParentManPowerMobile()) {
        st.textContent = 'Man Power session +91 ' + shared + ' — cloud save ready';
      }
      // Hide OTP form when already verified
      ['rbMobile', 'rbSendOtp', 'rbOtp', 'rbVerifyOtp'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
      });
      return;
    }
    try {
      const saved = localStorage.getItem('rb_cloud_mobile');
      if (saved && /^[6-9]\d{9}$/.test(saved)) {
        const st = document.getElementById('rbLoginStatus');
        if (st) st.textContent = 'Previously +91 ' + saved + ' — send OTP to unlock cloud';
        const mob = document.getElementById('rbMobile');
        if (mob) mob.value = saved;
      }
    } catch (e) {}
  }

  document.addEventListener('DOMContentLoaded', () => { init(); bindCloudAuth(); });
})();


function rbForceLoginGate(){
  try{
    var verified = localStorage.getItem('vks_site_verified') === '1';
    var phone = (localStorage.getItem('vks_site_phone') || '').replace(/\D/g,'').slice(-10);
    if(verified && /^[6-9]\d{9}$/.test(phone)){
      if(typeof rbMobileLoggedIn !== 'undefined') rbMobileLoggedIn = phone;
      return true;
    }
    // Highlight login strip; scroll into view
    var strip = document.getElementById('rbAuthBar') || document.getElementById('rbMobile')?.closest('div');
    if(strip){
      strip.style.outline = '2px solid #f97316';
      strip.style.outlineOffset = '4px';
      try{ strip.scrollIntoView({behavior:'smooth', block:'center'}); }catch(e){}
    }
    var tip = document.getElementById('rbLoginTip');
    if(!tip){
      tip = document.createElement('div');
      tip.id = 'rbLoginTip';
      tip.style.cssText = 'margin:8px 0;padding:10px 12px;border-radius:12px;background:#fff7ed;color:#9a3412;font-size:13px;font-weight:600;border:1px solid #fdba74';
      tip.textContent = 'Login with mobile OTP to save & sync your resume on Firebase (same account as Man Power / Mentor).';
      var host = document.getElementById('rbMobile') && document.getElementById('rbMobile').parentElement;
      if(host) host.parentElement.insertBefore(tip, host);
    }
    return false;
  }catch(e){ return true; }
}


(function(){
  function wrap(){
    ['mobilePrintBtn','btnDownloadPdf','downloadPdfBtn','btnSaveCloud'].forEach(function(id){
      var el = document.getElementById(id);
      if(!el || el._rbGate) return;
      el._rbGate = true;
      el.addEventListener('click', function(ev){
        if(typeof rbForceLoginGate === 'function' && !rbForceLoginGate()){
          ev.preventDefault();
          ev.stopPropagation();
          alert('Please login with mobile OTP first to save / download with cloud sync.');
        }
      }, true);
    });
  }
  document.addEventListener('DOMContentLoaded', wrap);
  setTimeout(wrap, 800);
})();
