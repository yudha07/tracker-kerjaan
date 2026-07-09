// =======================================================
// CONFIGURATION: DATA SUPABASE ANDA
// =======================================================
const SUPABASE_URL = "https://bawlxbtnocmangcblngu.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ZZvJjet_A_XfGmqfNJhPOg_-P3z_snJ"; // <-- JANGAN LUPA PASTE ANON KEY ANDA DI SINI

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let currentWorker = localStorage.getItem('worker_name') || '';

// SISTEM IDENTIFIKASI MASTER (Tentukan nama master di sini)
const MASTER_USERS = ["yudha", "Yudha", "Jufri", "jufri", "danra", "Danra", "nadya", "Nadya"]; 

// Cek apakah user aktif saat ini tergolong Master
function isMasterUser() {
  if (!currentWorker) return false;
  return MASTER_USERS.map(v => v.toLowerCase()).includes(currentWorker.toLowerCase());
}

// =======================================================
// SYSTEM LOGIN & SESSION CHECK
// =======================================================
function checkSession() {
  const loginPanel = document.getElementById('login-panel');
  const mainTracker = document.getElementById('main-tracker');
  const userDisplay = document.getElementById('currentUserDisplay');
  const avatarLetter = document.getElementById('avatarLetter');

  if (currentWorker) {
    if (loginPanel) loginPanel.classList.add('hidden');
    if (mainTracker) mainTracker.classList.remove('hidden');
    if (userDisplay) userDisplay.innerText = currentWorker + (isMasterUser() ? " (Master)" : "");
    if (avatarLetter) avatarLetter.innerText = currentWorker.charAt(0).toUpperCase();
    
    // Tarik data awal untuk boards dan projects
    fetchTasks();
    fetchProjects();
  } else {
    if (loginPanel) loginPanel.classList.remove('hidden');
    if (mainTracker) mainTracker.classList.add('hidden');
  }
}

function handleLogin() {
  const input = document.getElementById('usernameInput');
  const name = input ? input.value.trim() : '';
  if (!name) return alert('Nama tidak boleh kosong!');
  
  localStorage.setItem('worker_name', name);
  currentWorker = name;
  checkSession();
}

function handleLogout() {
  localStorage.removeItem('worker_name');
  currentWorker = '';
  checkSession();
}

// =======================================================
// NAVIGATION: SWITCH TAB (BOARDS VS PROJECTS)
// =======================================================
function switchTab(tabName) {
  const boardsView = document.getElementById('boards-view-container');
  const projectsPage = document.getElementById('projects-page');
  const menuBoards = document.getElementById('menu-boards');
  const menuProjects = document.getElementById('menu-projects');
  const customTitle = document.getElementById('customTitle');

  if (tabName === 'boards') {
    if (boardsView) boardsView.classList.remove('hidden');
    if (projectsPage) projectsPage.classList.add('hidden');
    if (customTitle) customTitle.innerText = "Design boards";
    
    // Aktifkan style menu
    menuBoards.className = "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-blue-600 bg-blue-50/60 rounded-xl transition-all cursor-pointer";
    menuProjects.className = "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-400 hover:text-slate-600 transition-all cursor-pointer";
    fetchTasks();
  } else if (tabName === 'projects') {
    if (boardsView) boardsView.classList.add('hidden');
    if (projectsPage) projectsPage.classList.remove('hidden');
    if (customTitle) customTitle.innerText = "All Projects vertical list";

    // Aktifkan style menu
    menuProjects.className = "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-blue-600 bg-blue-50/60 rounded-xl transition-all cursor-pointer";
    menuBoards.className = "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-400 hover:text-slate-600 transition-all cursor-pointer";
    fetchProjects();
  }
}

// =======================================================
// FETCH DATA & RENDER (TAB 1: GAYA KARTU KANBAN BOARDS)
// =======================================================
async function fetchTasks() {
  if (!currentWorker) return;
  try {
    const { data: tasks, error } = await supabaseClient
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) console.error('Eror ambil data:', error.message);
    else renderTasks(tasks);
  } catch (err) {
    console.error('System error:', err);
  }
}

function renderTasks(tasks) {
  const todoList = document.getElementById('todo-list');
  const inprogressList = document.getElementById('inprogress-list');
  const doneList = document.getElementById('done-list');

  if (!todoList || !inprogressList || !doneList) return;

  todoList.innerHTML = '';
  inprogressList.innerHTML = '';
  doneList.innerHTML = '';

  let todoCount = 0;
  let inprogressCount = 0;
  let doneCount = 0;

  tasks.forEach(task => {
    const card = document.createElement('div');
    card.className = "bg-white p-4 rounded-xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col gap-3 transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)]";
    
    const creator = task.worker_name ? task.worker_name : 'Anonim';
    const isOwner = currentWorker.toLowerCase() === creator.toLowerCase();

    let actionButton = '';
    
    if (isOwner) {
      if (task.status === 'todo') {
        actionButton = `<button onclick="updateStatus(${task.id}, 'in_progress')" class="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold py-2 rounded-lg transition-all cursor-pointer">Mulai Kerja →</button>`;
      } else if (task.status === 'in_progress') {
        actionButton = `<button onclick="updateStatus(${task.id}, 'done')" class="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-xs font-bold py-2 rounded-lg transition-all cursor-pointer">Selesai ✓</button>`;
      } else if (task.status === 'done') {
        actionButton = `<button onclick="updateStatus(${task.id}, 'todo')" class="w-full bg-slate-50 hover:bg-slate-100 text-slate-500 text-xs font-bold py-2 rounded-lg transition-all cursor-pointer">Reset Kembali</button>`;
      }
    } else {
      actionButton = `<button disabled class="w-full bg-slate-50 text-slate-400 text-[11px] py-2 rounded-lg font-medium cursor-not-allowed text-center">Terkunci (Bukan Tugas Anda)</button>`;
    }

    const initial = creator.charAt(0).toUpperCase();
    const safeTaskJson = JSON.stringify(task).replace(/"/g, '&quot;');

    card.innerHTML = `
      <div class="cursor-pointer group flex flex-col gap-1 flex-1" onclick="openDetailModal(${safeTaskJson})">
        <p class="font-bold text-slate-800 text-[13px] leading-snug break-all group-hover:text-blue-600 transition-colors">${task.title}</p>
        ${task.notes ? `<p class="text-[11px] text-slate-400 leading-normal mt-0.5 line-clamp-2 border-l-2 border-slate-200 pl-1.5">${task.notes}</p>` : ''}
        ${task.master_notes ? `<p class="text-[10px] text-amber-600 font-medium bg-amber-50 px-1.5 py-0.5 rounded mt-1 w-max">📋 Ada Arahan Master</p>` : ''}
      </div>
      
      <div class="flex items-center justify-between border-t border-slate-50 pt-2.5 mt-1">
        <span class="text-[10px] text-slate-700 bg-slate-100 font-bold px-2 py-0.5 rounded-md">Oleh: ${creator}</span>
        <div class="w-5 h-5 bg-blue-600 text-white font-bold rounded-full flex items-center justify-center text-[9px] uppercase" title="Pembuat: ${creator}">
          ${initial}
        </div>
      </div>

      <div class="mt-1 relative z-10">${actionButton}</div>
    `;

    if (task.status === 'todo') {
      todoList.appendChild(card);
      todoCount++;
    } else if (task.status === 'in_progress') {
      inprogressList.appendChild(card);
      inprogressCount++;
    } else if (task.status === 'done') {
      doneList.appendChild(card);
      doneCount++;
    }
  });

  document.getElementById('todo-count').innerText = todoCount;
  document.getElementById('inprogress-count').innerText = inprogressCount;
  document.getElementById('done-count').innerText = doneCount;
}

// =======================================================
// FETCH DATA & RENDER (TAB 2: ALL PROJECTS VERTICAL LIST)
// =======================================================
async function fetchProjects() {
  try {
    const { data: tasks, error } = await supabaseClient
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error)
