/* =========================================================
   ONLINE STUDENT CLEARANCE SYSTEM — front-end prototype
   Kiriri Women's University · Dept. of Information Technology
   Simulates the PHP/MySQL backend described in the project
   report (auth, departmental approval, payments, QR receipts,
   reminders) entirely client-side for demonstration.
   ========================================================= */

const STUDENT = {
  name: "Ancyliz Phine Karembo",
  shortName: "Karembo",
  reg: "DIT/225/25",
  dept: "B.Sc Information Technology · Year 3"
};

const ICONS = {
  finance: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h4"/></svg>',
  library: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 5c3-1.4 6-1.4 8 0v14c-2-1.4-5-1.4-8 0V5zM20 5c-3-1.4-6-1.4-8 0v14c2-1.4 5-1.4 8 0V5z"/></svg>',
  academic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M2 9l10-5 10 5-10 5-10-5z"/><path d="M6 11.5V17c0 1.5 3 3 6 3s6-1.5 6-3v-5.5"/></svg>',
  hostel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 11l9-7 9 7"/><path d="M5 10v9h14v-9"/><path d="M10 19v-5h4v5"/></svg>',
  games: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="2" y="8" width="20" height="9" rx="4"/><path d="M7 12.5h3M8.5 11v3M15 12h.01M17.5 13.5h.01"/></svg>',
  registrar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6 3h9l5 5v13H6z"/><path d="M15 3v5h5M9 13h6M9 17h6"/></svg>'
};

const DEPARTMENTS = [
  { id: "finance",   name: "Finance",       needsPayment: true,  remarks: "Requires fee balance to be settled first.",
    office: "Admin Block, Room 12", contact: "finance@kiriri.ac.ke",
    requirements: ["No outstanding fee balance", "Latest fee statement acknowledged", "Any deposit refunds processed"] },
  { id: "library",   name: "Library",       needsPayment: false, remarks: "Confirms all borrowed materials returned.",
    office: "Main Library, Ground Floor", contact: "library@kiriri.ac.ke",
    requirements: ["All borrowed books returned", "No pending library fines", "Library card surrendered"] },
  { id: "academic",  name: "Academic Dept", needsPayment: false, remarks: "Confirms coursework & unit completion.",
    office: "IT Dept, Room 4", contact: "it-dept@kiriri.ac.ke",
    requirements: ["All units examined & graded", "Project / attachment report submitted", "No incomplete grades"] },
  { id: "hostel",    name: "Hostel",        needsPayment: false, remarks: "Confirms room handover & no damages.",
    office: "Hostel Warden's Office", contact: "hostel@kiriri.ac.ke",
    requirements: ["Room keys returned", "No damages to furniture/fittings", "Hostel fee balance cleared"] },
  { id: "games",     name: "Games",         needsPayment: false, remarks: "Confirms sports equipment returned.",
    office: "Sports Complex Office", contact: "games@kiriri.ac.ke",
    requirements: ["Sports kit / equipment returned", "No pending team commitments"] },
  { id: "registrar", name: "Registrar",     needsPayment: false, remarks: "Final sign-off after all departments clear.",
    office: "Registrar's Office, Admin Block", contact: "registrar@kiriri.ac.ke",
    requirements: ["All five departments cleared", "Original admission documents verified"] }
];

const PROCESS_STEPS = ["Request submitted", "Officer review", "Decision recorded", "Passport stamped"];

// state: pending -> review -> approved/rejected
const state = {
  paid: false,
  depts: {},          // id -> {status, remarks, submittedAt}
  notifications: [],
};

DEPARTMENTS.forEach(d => {
  state.depts[d.id] = { status: "pending", remarks: "", submittedAt: null };
});

/* ---------- helpers ---------- */
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const nowStr = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function toast(message, tone = "mint") {
  const host = $("#toast-host");
  const el = document.createElement("div");
  el.className = `toast ${tone}`;
  el.innerHTML = `<span>${message}</span>`;
  host.appendChild(el);
  setTimeout(() => {
    el.classList.add("leaving");
    setTimeout(() => el.remove(), 260);
  }, 3600);
}

function pushNotification(text, tone = "amber") {
  state.notifications.unshift({ text, tone, time: nowStr() });
  renderNotifications();
  const bell = $("#bell-btn");
  bell.classList.remove("ring");
  void bell.offsetWidth; // restart animation
  bell.classList.add("ring");
}

function renderNotifications() {
  const list = $("#notif-list");
  const badge = $("#bell-badge");
  if (!state.notifications.length) {
    list.innerHTML = `<p class="notif-empty">No notifications yet.</p>`;
  } else {
    list.innerHTML = state.notifications.map(n => `
      <div class="notif-item">
        <span class="notif-dot ${n.tone}"></span>
        <span>${n.text}<time>${n.time}</time></span>
      </div>`).join("");
  }
  badge.textContent = state.notifications.length;
  badge.dataset.zero = state.notifications.length === 0 ? "true" : "false";
}

/* =========================================================
   HERO: stat counters + scroll reveal (cover page)
   ========================================================= */
function animateCounters() {
  $$(".stat-num").forEach(el => {
    const target = Number(el.dataset.count);
    const duration = 1200;
    const start = performance.now();
    function tick(t) {
      const progress = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased).toLocaleString();
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}
animateCounters();

function setupScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  $$(".reveal").forEach(el => observer.observe(el));
}

/* =========================================================
   LOGIN FLOW
   ========================================================= */
$("#login-form").addEventListener("submit", e => {
  e.preventDefault();
  const btn = $("#login-btn");
  btn.querySelector(".btn-label").textContent = "Verifying…";
  btn.disabled = true;

  setTimeout(() => {
    $("#cover").classList.add("hide");
    const flash = $("#welcome-flash");
    flash.classList.add("show");

    setTimeout(() => {
      flash.classList.remove("show");
      $("#cover").hidden = true;
      $("#dashboard").hidden = false;
      initDashboard();
      toast(`Welcome back, ${STUDENT.shortName}! Your passport is ready.`, "green");
    }, 950);
  }, 500);
});

$("#logout-btn").addEventListener("click", () => {
  location.reload();
});

/* =========================================================
   DASHBOARD INIT
   ========================================================= */
function initDashboard() {
  $("#student-name").textContent = STUDENT.name;
  $("#cert-name").textContent = STUDENT.name;
  $("#cert-reg").textContent = STUDENT.reg;
  renderDeptGrid();
  renderOfficerView();
  updateProgress();
  renderNotifications();
  pushNotification("Passport unlocked. Six departments await your clearance request.", "amber");
  setupScrollReveal();
}

/* ---------- notification tray toggle ---------- */
$("#bell-btn").addEventListener("click", () => $("#notif-tray").classList.toggle("open"));
document.addEventListener("click", e => {
  const tray = $("#notif-tray");
  if (!tray.contains(e.target) && !$("#bell-btn").contains(e.target)) tray.classList.remove("open");
});
$("#clear-notifs").addEventListener("click", () => { state.notifications = []; renderNotifications(); });

/* ---------- view switch ---------- */
$("#admin-toggle").addEventListener("click", () => {
  const student = $("#student-view"), officer = $("#officer-view");
  const toStudent = officer.hidden === false;
  const incoming = toStudent ? officer : student;
  const outgoing = toStudent ? student : officer;

  outgoing.style.opacity = "0";
  outgoing.style.transform = "translateY(8px)";
  setTimeout(() => {
    student.hidden = !toStudent ? true : false;
    officer.hidden = toStudent;
    $("#admin-toggle span").textContent = toStudent ? "Officer view" : "Student view";
    if (!toStudent) renderOfficerView();
    incoming.style.opacity = "0";
    incoming.style.transform = "translateY(8px)";
    requestAnimationFrame(() => {
      incoming.style.opacity = "1";
      incoming.style.transform = "translateY(0)";
    });
  }, 180);
});

/* ---------- floating help button ---------- */
$("#fab-help").addEventListener("click", () => {
  toast("Need a hand? Email it-dept@kiriri.ac.ke or visit the ICT help desk, Room 4.", "mint");
});

/* =========================================================
   DEPARTMENT GRID (student side)
   ========================================================= */
function renderDeptGrid() {
  const grid = $("#dept-grid");
  grid.innerHTML = DEPARTMENTS.map(d => {
    const s = state.depts[d.id];
    const locked = d.needsPayment && !state.paid && s.status === "pending";
    return `
    <div class="dept-card ${s.status}" data-dept="${d.id}">
      <div class="dept-stamp">${stampIcon(s.status)}</div>
      <div class="dept-icon">${ICONS[d.id]}</div>
      <h4>${d.name}</h4>
      <span class="status-pill ${locked ? "locked" : s.status}">${locked ? "Locked" : labelFor(s.status)}</span>
      <p class="dept-remarks">${s.remarks || d.remarks}</p>
      ${actionButton(d, s, locked)}
      <p class="tap-hint">Tap card for process &amp; requirements →</p>
    </div>`;
  }).join("");

  $$(".dept-action[data-action]").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      handleDeptAction(btn.dataset.dept, btn.dataset.action);
    });
  });

  $$(".dept-card").forEach(card => {
    card.addEventListener("click", () => openDeptModal(card.dataset.dept));
  });
}

function stampIcon(status) {
  if (status === "approved") {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l5 5L20 6"/></svg>`;
  }
  if (status === "rejected") {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`;
  }
  return "";
}

function labelFor(status) {
  return { pending: "Pending", review: "Under review", approved: "Approved", rejected: "Rejected" }[status];
}

function actionButton(d, s, locked) {
  if (s.status === "approved") return `<button class="dept-action" disabled>Stamped ✓</button>`;
  if (s.status === "rejected") return `<button class="dept-action" data-action="resubmit" data-dept="${d.id}">Resubmit request</button>`;
  if (s.status === "review") return `<button class="dept-action" disabled>Awaiting officer…</button>`;
  if (locked) return `<button class="dept-action" disabled>Pay finance balance first</button>`;
  return `<button class="dept-action" data-action="submit" data-dept="${d.id}">Submit clearance request</button>`;
}

function handleDeptAction(deptId, action) {
  const s = state.depts[deptId];
  const dept = DEPARTMENTS.find(d => d.id === deptId);
  s.status = "review";
  s.submittedAt = nowStr();
  s.remarks = "Awaiting departmental officer review.";
  renderDeptGrid();
  renderOfficerView();
  if ($("#dept-modal").classList.contains("open")) renderModalFor(deptId);
  toast(`Request sent to ${dept.name}.`, "gold");
  pushNotification(`${dept.name} clearance request submitted — awaiting officer review.`, "amber");

  // simulate officer processing time
  const delay = 1600 + Math.random() * 1400;
  setTimeout(() => {
    const approve = Math.random() > 0.15; // demo bias toward approval
    s.status = approve ? "approved" : "rejected";
    s.remarks = approve
      ? "Cleared — no outstanding obligations."
      : "Returned — please see office for outstanding item.";
    renderDeptGrid();
    renderOfficerView();
    updateProgress();
    if ($("#dept-modal").classList.contains("open")) renderModalFor(deptId);
    toast(`${dept.name}: ${approve ? "Approved ✓" : "Returned — action needed"}`, approve ? "green" : "red");
    pushNotification(`${dept.name} clearance ${approve ? "approved" : "rejected"}.`, approve ? "green" : "red");
  }, delay);
}

/* =========================================================
   DEPARTMENT PROCESS MODAL
   ========================================================= */
let currentModalDept = null;

function openDeptModal(deptId) {
  currentModalDept = deptId;
  renderModalFor(deptId);
  $("#dept-modal").classList.add("open");
}

function closeDeptModal() {
  $("#dept-modal").classList.remove("open");
  currentModalDept = null;
}
$("#modal-close").addEventListener("click", closeDeptModal);
$("#dept-modal").addEventListener("click", e => { if (e.target.id === "dept-modal") closeDeptModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeDeptModal(); });

function stepIndexFor(status) {
  // 0 not started, 1 submitted, 2 review, 3 decided+stamped(if approved)
  if (status === "pending") return 0;
  if (status === "review") return 2;
  if (status === "approved") return 4;
  if (status === "rejected") return 3;
  return 0;
}

function renderModalFor(deptId) {
  const d = DEPARTMENTS.find(x => x.id === deptId);
  const s = state.depts[deptId];
  const locked = d.needsPayment && !state.paid && s.status === "pending";

  $("#modal-icon").innerHTML = ICONS[d.id];
  $("#modal-title").textContent = d.name;
  const statusEl = $("#modal-status");
  statusEl.className = `status-pill ${locked ? "locked" : s.status}`;
  statusEl.textContent = locked ? "Locked" : labelFor(s.status);

  const currentStep = stepIndexFor(s.status);
  const rejected = s.status === "rejected";
  $("#modal-timeline").innerHTML = PROCESS_STEPS.map((label, i) => {
    const stepNum = i + 1;
    let cls = "";
    if (rejected && stepNum === 3) cls = "rejected";
    else if (stepNum < currentStep || (stepNum === currentStep && s.status === "approved")) cls = "done";
    else if (stepNum === currentStep) cls = "active";
    const timeNote = stepNum === 1 && s.submittedAt ? s.submittedAt : (stepNum === 3 && (s.status==="approved"||s.status==="rejected") ? "Decision logged" : "");
    return `
      <div class="tl-step ${cls}">
        <div class="tl-dot">${cls === "done" ? "✓" : cls === "rejected" ? "✕" : stepNum}</div>
        <div class="tl-label"><strong>${label}</strong><span>${timeNote}</span></div>
      </div>`;
  }).join("");

  $("#modal-reqs").innerHTML = d.requirements.map(r => `<li>${r}</li>`).join("");
  $("#modal-office").textContent = d.office;
  $("#modal-contact").textContent = d.contact;
  $("#modal-remark").textContent = s.remarks ? `Officer note: ${s.remarks}` : "No remarks recorded yet.";

  const actionBtn = $("#modal-action");
  if (s.status === "approved") {
    actionBtn.textContent = "Stamped ✓ — nothing more to do";
    actionBtn.disabled = true;
  } else if (s.status === "review") {
    actionBtn.textContent = "Awaiting officer…";
    actionBtn.disabled = true;
  } else if (locked) {
    actionBtn.textContent = "Pay finance balance first";
    actionBtn.disabled = true;
  } else {
    actionBtn.textContent = s.status === "rejected" ? "Resubmit request" : "Submit clearance request";
    actionBtn.disabled = false;
  }
  actionBtn.onclick = () => handleDeptAction(deptId, s.status === "rejected" ? "resubmit" : "submit");
}

/* =========================================================
   PROGRESS RING
   ========================================================= */
function updateProgress() {
  const total = DEPARTMENTS.length;
  const cleared = Object.values(state.depts).filter(s => s.status === "approved").length;
  const pct = Math.round((cleared / total) * 100);
  const circumference = 2 * Math.PI * 68;
  const offset = circumference - (pct / 100) * circumference;

  $("#ring-fill").style.strokeDasharray = circumference;
  $("#ring-fill").style.strokeDashoffset = offset;
  $("#ring-pct").textContent = `${pct}%`;
  $("#cleared-count").textContent = cleared;

  const statusText = $("#progress-status");
  if (cleared === total) {
    statusText.textContent = "All departments cleared — certificate unlocked!";
    unlockCertificate();
  } else if (cleared === 0) {
    statusText.textContent = "Clearance requests not yet started.";
  } else {
    statusText.textContent = `${total - cleared} department(s) remaining.`;
  }
}

/* =========================================================
   PAYMENT (M-Pesa STK push simulation)
   ========================================================= */
$("#payment-form").addEventListener("submit", e => {
  e.preventDefault();
  const phone = $("#mpesa-phone").value.trim();
  const amount = $("#mpesa-amount").value.trim();
  if (!phone || !amount) return;

  const box = $("#payment-status");
  const btn = $("#pay-btn");
  btn.disabled = true;
  box.innerHTML = `<div class="stk-step"><span class="spinner"></span> Sending STK push to ${phone}…</div>`;

  setTimeout(() => {
    box.innerHTML += `<div class="stk-step"><span class="spinner"></span> Awaiting PIN confirmation on handset…</div>`;
  }, 1100);

  setTimeout(() => {
    const receipt = "QCX" + Math.random().toString(36).slice(2, 9).toUpperCase();
    box.innerHTML = `
      <div class="stk-step done">✓ STK push sent to ${phone}</div>
      <div class="stk-step done">✓ Payment of KES ${Number(amount).toLocaleString()} confirmed</div>
      <div class="stk-step done">✓ Receipt No. ${receipt} generated</div>`;
    state.paid = true;
    btn.disabled = false;
    btn.textContent = "Payment complete";
    renderDeptGrid();
    if (currentModalDept === "finance") renderModalFor("finance");
    toast("M-Pesa payment confirmed. Finance department is now unlocked.", "green");
    pushNotification(`Payment received via Daraja API — receipt ${receipt}.`, "green");
  }, 2600);
});

/* =========================================================
   CERTIFICATE + QR CODE
   ========================================================= */
let certRendered = false;
function unlockCertificate() {
  if (certRendered) return;
  certRendered = true;
  $("#cert-locked").hidden = true;
  $("#cert-unlocked").hidden = false;
  $("#cert-issued").textContent = `Issued ${new Date().toLocaleDateString()} · Verification ID CLR-${STUDENT.reg.replace(/\//g, "-")}`;

  const qrData = `KIRIRI-CLEARANCE|${STUDENT.reg}|${STUDENT.name}|CLEARED|${new Date().toISOString().slice(0,10)}`;
  const qrHost = $("#cert-qr");
  qrHost.innerHTML = "";
  if (window.QRCode) {
    new QRCode(qrHost, { text: qrData, width: 128, height: 128, colorDark: "#0F3D2E", colorLight: "#E4FBEE" });
  } else {
    qrHost.innerHTML = `<p class="muted">QR unavailable offline — verification ID above still applies.</p>`;
  }
  fireConfetti();
  toast("🎓 Certificate of Clearance unlocked!", "green");
  pushNotification("All departments cleared — download your certificate.", "green");
}

$("#download-cert").addEventListener("click", () => window.print());

/* =========================================================
   OFFICER / ADMIN CONSOLE
   ========================================================= */
function renderOfficerView() {
  const stats = $("#officer-stats");
  const counts = { pending: 0, review: 0, approved: 0, rejected: 0 };
  Object.values(state.depts).forEach(s => counts[s.status]++);
  stats.innerHTML = `
    <div class="stat-card"><div class="num">${counts.review}</div><div class="lbl">Awaiting review</div></div>
    <div class="stat-card"><div class="num">${counts.approved}</div><div class="lbl">Approved</div></div>
    <div class="stat-card"><div class="num">${counts.rejected}</div><div class="lbl">Rejected</div></div>
    <div class="stat-card"><div class="num">${counts.pending}</div><div class="lbl">Not yet submitted</div></div>
  `;

  const tbody = $("#officer-tbody");
  tbody.innerHTML = DEPARTMENTS.map(d => {
    const s = state.depts[d.id];
    const canAct = s.status === "review";
    return `
      <tr>
        <td>${d.name}</td>
        <td><span class="status-pill ${s.status}">${labelFor(s.status)}</span></td>
        <td class="mono-tag">${s.submittedAt || "—"}</td>
        <td>${s.remarks || "—"}</td>
        <td>
          <div class="row-actions">
            <button class="approve-btn" data-off="approve" data-dept="${d.id}" ${canAct ? "" : "disabled"}>Approve</button>
            <button class="reject-btn" data-off="reject" data-dept="${d.id}" ${canAct ? "" : "disabled"}>Reject</button>
          </div>
        </td>
      </tr>`;
  }).join("");

  $$("[data-off]").forEach(btn => {
    btn.addEventListener("click", () => officerAction(btn.dataset.dept, btn.dataset.off));
  });
}

function officerAction(deptId, action) {
  const s = state.depts[deptId];
  const dept = DEPARTMENTS.find(d => d.id === deptId);
  s.status = action === "approve" ? "approved" : "rejected";
  s.remarks = action === "approve" ? "Cleared by officer — manual override." : "Rejected by officer — see remarks.";
  renderOfficerView();
  renderDeptGrid();
  updateProgress();
  if (currentModalDept === deptId) renderModalFor(deptId);
  toast(`${dept.name} manually ${action === "approve" ? "approved" : "rejected"} by officer.`, action === "approve" ? "green" : "red");
  pushNotification(`Officer ${action === "approve" ? "approved" : "rejected"} ${dept.name} clearance.`, action === "approve" ? "green" : "red");
}

/* automated reminder sweep */
$("#run-reminder").addEventListener("click", () => {
  const out = $("#reminder-output");
  const pendingDepts = DEPARTMENTS.filter(d => state.depts[d.id].status === "pending" || state.depts[d.id].status === "review");
  if (!pendingDepts.length) {
    out.innerHTML = `<div class="reminder-line">All departments are resolved — no reminders needed.</div>`;
    return;
  }
  out.innerHTML = pendingDepts.map(d =>
    `<div class="reminder-line">Reminder sent to <strong>${d.name}</strong> — clearance request ${state.depts[d.id].status === "review" ? "still under review" : "not yet submitted"}.</div>`
  ).join("");
  toast(`Reminder sweep complete — ${pendingDepts.length} department(s) notified.`, "gold");
  pushNotification(`Automated reminder sweep run: ${pendingDepts.length} flagged.`, "amber");
});

/* =========================================================
   CONFETTI (lightweight canvas burst on full clearance)
   ========================================================= */
function fireConfetti() {
  const canvas = $("#confetti-canvas");
  canvas.style.display = "block";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext("2d");
  const colors = ["#8FE6B4", "#1B7A4D", "#0F3D2E", "#C9A227", "#E4FBEE"];
  const pieces = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * canvas.height * 0.4,
    r: 4 + Math.random() * 5,
    c: colors[Math.floor(Math.random() * colors.length)],
    vy: 2 + Math.random() * 3,
    vx: -1.5 + Math.random() * 3,
    rot: Math.random() * 360,
    vr: -6 + Math.random() * 12
  }));
  let frame = 0;
  function draw() {
    frame++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6);
      ctx.restore();
    });
    if (frame < 160) requestAnimationFrame(draw);
    else canvas.style.display = "none";
  }
  draw();
}

window.addEventListener("resize", () => {
  const canvas = $("#confetti-canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});