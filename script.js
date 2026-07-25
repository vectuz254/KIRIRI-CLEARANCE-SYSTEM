/* ==================================================
   ClearPath — KWUST Online Student Clearance System
   ================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- LOADER ---------- */
  const loader = document.getElementById('loader');
  window.addEventListener('load', () => {
    setTimeout(() => loader.classList.add('hide'), 400);
  });
  // fallback in case 'load' already fired
  setTimeout(() => loader.classList.add('hide'), 1800);

  /* ---------- NAVBAR ---------- */
  const navbar = document.getElementById('navbar');
  const navBurger = document.getElementById('navBurger');
  const navLinks = document.getElementById('navLinks');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  });

  navBurger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });

  /* ---------- SCROLL REVEAL ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => revealObserver.observe(el));

  /* ---------- STAT COUNTERS ---------- */
  const statNums = document.querySelectorAll('.stat-num');
  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      let current = 0;
      const step = Math.max(1, Math.ceil(target / 40));
      const tick = () => {
        current += step;
        if (current >= target) { el.textContent = target; return; }
        el.textContent = current;
        requestAnimationFrame(tick);
      };
      tick();
      statObserver.unobserve(el);
    });
  }, { threshold: 0.6 });
  statNums.forEach(el => statObserver.observe(el));

  /* ==================================================
     DEPARTMENTS + CLEARANCE PROGRESS
     ================================================== */
  const departments = [
    {
      id: 'finance', icon: '💳', name: 'Finance',
      desc: 'Confirms your fee balance is settled before anything else moves.',
      steps: [
        'Clear any outstanding fee balance on your student account',
        'Finance office verifies your payment against institution records',
        'Official receipt issued and finance clearance marked complete'
      ]
    },
    {
      id: 'library', icon: '📚', name: 'Library',
      desc: 'Checks that every borrowed book and fine is settled.',
      steps: [
        'Return all borrowed books and library materials',
        'Settle any outstanding library fines',
        'Librarian confirms no items are still pending'
      ]
    },
    {
      id: 'academic', icon: '🎓', name: 'Academic Dept.',
      desc: 'Confirms coursework is complete and there are no academic holds.',
      steps: [
        'Submit any pending coursework or assignments',
        'Head of Department confirms there are no academic holds',
        'Academic clearance approved and logged'
      ]
    },
    {
      id: 'hostel', icon: '🏠', name: 'Hostel',
      desc: 'Sign-off on your room, keys and any accommodation damages.',
      steps: [
        'Vacate your room and return hostel keys',
        'Warden inspects the room for damages',
        'Hostel clearance signed off in the system'
      ]
    },
    {
      id: 'games', icon: '🏅', name: 'Games & Sports',
      desc: 'Confirms all sports equipment issued to you has been returned.',
      steps: [
        'Return any sports equipment or uniforms issued to you',
        'Games officer confirms nothing is outstanding',
        'Games department clearance approved'
      ]
    },
    {
      id: 'registrar', icon: '🏛️', name: 'Registrar',
      desc: 'The final sign-off once every other department has cleared you.',
      steps: [
        'System checks that all five departments above are cleared',
        'Registrar reviews your complete clearance file',
        'Certificate generated with a unique QR verification code'
      ]
    }
  ];

  const STORAGE_KEY = 'clearpath_cleared_depts';
  const getCleared = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const setCleared = (arr) => localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));

  const deptGrid = document.getElementById('deptGrid');
  const deptLegend = document.getElementById('deptLegend');

  function renderDepartments() {
    const cleared = getCleared();
    deptGrid.innerHTML = '';
    deptLegend.innerHTML = '';

    departments.forEach(dept => {
      const isCleared = cleared.includes(dept.id);

      // card
      const card = document.createElement('div');
      card.className = 'dept-card';
      card.dataset.id = dept.id;
      card.innerHTML = `
        <div class="dept-top">
          <span class="dept-icon">${dept.icon}</span>
          <span class="dept-status ${isCleared ? 'cleared' : ''}">${isCleared ? 'Cleared' : 'Pending'}</span>
        </div>
        <h3>${dept.name}</h3>
        <p>${dept.desc}</p>
        <div class="dept-process">
          <ol>
            ${dept.steps.map((s, i) => `<li><span>${i + 1}</span>${s}</li>`).join('')}
          </ol>
          <button class="dept-clear-btn ${isCleared ? 'done' : ''}" data-id="${dept.id}">
            ${isCleared ? '✓ Marked cleared' : 'Mark this department cleared'}
          </button>
        </div>
      `;
      card.addEventListener('click', (e) => {
        if (e.target.closest('.dept-clear-btn')) return;
        card.classList.toggle('open');
      });
      deptGrid.appendChild(card);

      // legend pill
      const pill = document.createElement('span');
      pill.className = `legend-pill ${isCleared ? 'cleared' : ''}`;
      pill.textContent = `${dept.icon} ${dept.name}`;
      deptLegend.appendChild(pill);
    });

    // clear buttons
    deptGrid.querySelectorAll('.dept-clear-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const cur = getCleared();
        if (!cur.includes(id)) {
          cur.push(id);
          setCleared(cur);
          const dept = departments.find(d => d.id === id);
          showToast(`${dept.name} clearance approved ✅`);
          renderDepartments();
          updateProgress();
        }
      });
    });
  }

  /* ---------- PROGRESS RING ---------- */
  const miniFg = document.getElementById('miniRingFg');
  const miniPct = document.getElementById('miniRingPct');
  const bigFg = document.getElementById('bigRingFg');
  const bigPct = document.getElementById('bigRingPct');
  const bigLabel = document.getElementById('bigRingLabel');
  const certificate = document.getElementById('certificate');
  const certQr = document.getElementById('certQr');

  const MINI_CIRC = 326.7; // 2 * PI * 52
  const BIG_CIRC = 603;    // 2 * PI * 96

  function updateProgress() {
    const cleared = getCleared();
    const total = departments.length;
    const pct = Math.round((cleared.length / total) * 100);

    miniFg.style.strokeDashoffset = MINI_CIRC - (MINI_CIRC * pct / 100);
    miniPct.textContent = pct + '%';

    bigFg.style.strokeDashoffset = BIG_CIRC - (BIG_CIRC * pct / 100);
    bigPct.textContent = pct + '%';
    bigLabel.textContent = `${cleared.length} of ${total} cleared`;

    if (cleared.length === total) {
      certificate.classList.add('show');
      buildQr();
    } else {
      certificate.classList.remove('show');
    }
  }

  function buildQr() {
    certQr.innerHTML = '';
    for (let i = 0; i < 36; i++) {
      const cell = document.createElement('span');
      if (Math.random() > 0.42) cell.style.background = 'var(--green-900)';
      else cell.style.background = 'transparent';
      certQr.appendChild(cell);
    }
  }

  renderDepartments();
  updateProgress();

  /* ==================================================
     SUPABASE CONNECTION
     Paste your project's URL and anon key below — find them in
     Supabase → Project Settings → API. Until you do, the site
     runs in Demo mode (any details work, saved on this device only).
     ================================================== */
  const SUPABASE_URL = 'https://fzifpldwscfryyiylbok.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_BvO7BSGqjaAqugwIhCTp9A_p9_3Z7cu';

  const isSupabaseConfigured =
    typeof window.supabase !== 'undefined' &&
    !SUPABASE_URL.includes('YOUR_') &&
    !SUPABASE_ANON_KEY.includes('YOUR_');

  const sb = isSupabaseConfigured
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

  /* ==================================================
     LOGIN CARD — tabs, sign in, create profile
     ================================================== */
  const welcomeText = document.getElementById('welcomeText');
  const loginSub = document.getElementById('loginSub');
  const dashboard = document.getElementById('dashboard');
  const dashWelcomeName = document.getElementById('dashWelcomeName');
  const signInBtn = document.getElementById('signInBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const certName = document.getElementById('certName');
  const signinHint = document.getElementById('signinHint');
  const signupHint = document.getElementById('signupHint');

  if (!isSupabaseConfigured) {
    signinHint.textContent = 'Demo mode — Supabase isn\'t connected yet, any details work.';
    signupHint.textContent = 'Demo mode — this just saves on this device until Supabase is connected.';
  } else {
    signinHint.textContent = 'Connected to Supabase.';
    signupHint.textContent = 'Your profile is saved securely in Supabase.';
  }

  // tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab + 'Form').classList.add('active');
      loginSub.textContent = btn.dataset.tab === 'signin'
        ? 'Sign in to reach your clearance dashboard'
        : 'Create your student profile in seconds';
    });
  });

  const DEMO_AUTH_KEY = 'clearpath_demo_user';

  function unlockDashboard(name) {
    dashboard.classList.remove('locked');
    dashboard.classList.add('unlocked');
    signInBtn.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
    welcomeText.textContent = 'Welcome back';
    if (certName) certName.textContent = name;
    if (dashWelcomeName) dashWelcomeName.textContent = `Welcome, ${name}`;
  }

  function lockDashboard() {
    dashboard.classList.add('locked');
    dashboard.classList.remove('unlocked');
    signInBtn.classList.remove('hidden');
    logoutBtn.classList.add('hidden');
  }

  function goToDashboard() {
    setTimeout(() => dashboard.scrollIntoView({ behavior: 'smooth' }), 300);
  }

  const signinForm = document.getElementById('signinForm');
  const signupForm = document.getElementById('signupForm');

  if (isSupabaseConfigured) {
    /* -------- REAL SUPABASE AUTH -------- */

    async function loadProfileAndUnlock(user) {
      let name = user.email;
      const { data: profile } = await sb.from('profiles').select('full_name').eq('id', user.id).single();
      if (profile && profile.full_name) name = profile.full_name;
      unlockDashboard(name);
    }

    // restore session on reload
    sb.auth.getSession().then(({ data }) => {
      if (data.session) loadProfileAndUnlock(data.session.user);
    });

    signinForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('signinEmail').value.trim();
      const password = document.getElementById('signinPassword').value;
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) { showToast(error.message); return; }
      showToast('Signed in — welcome back!');
      await loadProfileAndUnlock(data.user);
      goToDashboard();
    });

    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('signupName').value.trim();
      const reg = document.getElementById('signupReg').value.trim();
      const dept = document.getElementById('signupDept').value.trim();
      const email = document.getElementById('signupEmail').value.trim();
      const password = document.getElementById('signupPassword').value;

      const { data, error } = await sb.auth.signUp({ email, password });
      if (error) { showToast(error.message); return; }

      if (data.user) {
        await sb.from('profiles').insert({
          id: data.user.id,
          full_name: name,
          reg_number: reg,
          department: dept
        });
      }
      showToast(`Profile created — welcome, ${name}!`);
      unlockDashboard(name);
      goToDashboard();
    });

    logoutBtn.addEventListener('click', async () => {
      await sb.auth.signOut();
      lockDashboard();
      showToast('Signed out');
      document.getElementById('home').scrollIntoView({ behavior: 'smooth' });
    });

  } else {
    /* -------- DEMO FALLBACK (no Supabase keys yet) -------- */

    const savedUser = localStorage.getItem(DEMO_AUTH_KEY);
    if (savedUser) unlockDashboard(savedUser);

    signinForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('signinEmail').value.trim();
      const name = email.split('@')[0] || 'Student';
      localStorage.setItem(DEMO_AUTH_KEY, name);
      showToast(`Signed in — welcome back, ${name}!`);
      unlockDashboard(name);
      goToDashboard();
    });

    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('signupName').value.trim() || 'Student';
      localStorage.setItem(DEMO_AUTH_KEY, name);
      showToast(`Profile created — welcome, ${name}!`);
      unlockDashboard(name);
      goToDashboard();
    });

    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem(DEMO_AUTH_KEY);
      lockDashboard();
      showToast('Signed out');
      document.getElementById('home').scrollIntoView({ behavior: 'smooth' });
    });
  }

  document.getElementById('dashNavLink').addEventListener('click', (e) => {
    if (dashboard.classList.contains('locked')) {
      e.preventDefault();
      showToast('Sign in first to open your dashboard');
      document.getElementById('login').scrollIntoView({ behavior: 'smooth' });
    }
  });

  /* ==================================================
     TOAST
     ================================================== */
  const toastEl = document.getElementById('toast');
  let toastTimer;
  function showToast(msg) {
    clearTimeout(toastTimer);
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600);
  }

  /* ==================================================
     SLIDERS (photo gallery + testimonials)
     ================================================== */
  function setupSlider({ trackId, dotsId, sliderName, autoplayMs }) {
    const track = document.getElementById(trackId);
    const dotsWrap = document.getElementById(dotsId);
    const slides = Array.from(track.children);
    let index = 0;

    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      if (i === 0) dot.classList.add('active');
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
    });
    const dots = Array.from(dotsWrap.children);

    function goTo(i) {
      index = (i + slides.length) % slides.length;
      track.style.transform = `translateX(-${index * 100}%)`;
      dots.forEach(d => d.classList.remove('active'));
      dots[index].classList.add('active');
    }

    document.querySelectorAll(`[data-slider="${sliderName}"]`).forEach(btn => {
      btn.addEventListener('click', () => {
        goTo(btn.classList.contains('next') ? index + 1 : index - 1);
        resetAutoplay();
      });
    });

    let timer;
    function resetAutoplay() {
      clearInterval(timer);
      timer = setInterval(() => goTo(index + 1), autoplayMs);
    }
    resetAutoplay();
  }

  setupSlider({ trackId: 'photoTrack', dotsId: 'photoDots', sliderName: 'photo', autoplayMs: 4500 });
  setupSlider({ trackId: 'testiTrack', dotsId: 'testiDots', sliderName: 'testi', autoplayMs: 6000 });

  /* ==================================================
     FLOATING SCROLL-TO-TOP BUTTON
     ================================================== */
  const floatTop = document.getElementById('floatTop');
  window.addEventListener('scroll', () => {
    floatTop.classList.toggle('show', window.scrollY > 600);
  });
  floatTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

});
