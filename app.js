// =======================================================
// CONFIGURATION: DATA SUPABASE ANDA
// =======================================================
const SUPABASE_URL = "https://bawlxbtnocmangcblngu.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ZZvJjet_A_XfGmqfNJhPOg_-P3z_snJ"; 

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let currentWorker = localStorage.getItem('worker_name') || '';

// SISTEM IDENTIFIKASI MASTER
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
    
    // Default masuk ke halaman boards awal
    switchTab('boards');
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
    
    if (menuBoards) menuBoards.className = "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-blue-600 bg-blue-50/60 rounded-xl transition-all cursor-pointer";
    if (menuProjects) menuProjects.className = "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-400 hover:text-slate-600 transition-all cursor-pointer";
    fetchTasks();
  } else if (tabName === 'projects') {
    if (boardsView) boardsView.classList.add('hidden');
    if (projectsPage) projectsPage.classList.remove('hidden');
    if (customTitle) customTitle.innerText = "All Projects vertical list";

    if (menuProjects) menuProjects.className = "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-blue-600 bg-blue-50/60 rounded-xl transition-all cursor-pointer";
    if (menuBoards) menuBoards.className = "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-400 hover:text-slate-600 transition-all cursor-pointer";
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

    let deadlineHTML = '';
    if (task.deadline) {
      try {
        const dateObj = new Date(task.deadline);
        if (!isNaN(dateObj)) {
          const options = { day: '2-digit', month: 'short', year: 'numeric' };
          const formattedDate = dateObj.toLocaleDateString('id-ID', options);
          deadlineHTML = `<p class="text-[11px] font-semibold text-rose-600 bg-rose-50 border border-rose-100/60 px-2 py-0.5 rounded-md w-max mt-1 flex items-center gap-1">🗓️ DL: ${formattedDate}</p>`;
        }
      } catch (e) {
        console.error("Format tanggal error", e);
      }
    }

    card.innerHTML = `
      <div class="cursor-pointer group flex flex-col gap-1 flex-1" onclick="openDetailModal(${safeTaskJson})">
        <p class="font-bold text-slate-800 text-[13px] leading-snug break-all group-hover:text-blue-600 transition-colors">${task.title || 'Tanpa Judul'}</p>
        ${task.notes ? `<p class="text-[11px] text-slate-400 leading-normal mt-0.5 line-clamp-2 border-l-2 border-slate-200 pl-1.5">${task.notes}</p>` : ''}
        ${deadlineHTML}
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

  if (document.getElementById('todo-count')) document.getElementById('todo-count').innerText = todoCount;
  if (document.getElementById('inprogress-count')) document.getElementById('inprogress-count').innerText = inprogressCount;
  if (document.getElementById('done-count')) document.getElementById('done-count').innerText = doneCount;
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

    if (error) {
      console.error('Error ambil data project:', error.message);
      return;
    }

    const verticalContainer = document.getElementById('projects-vertical-list');
    const totalCountBadge = document.getElementById('project-total-count');
    
    if (!verticalContainer) return;
    verticalContainer.innerHTML = '';
    if (totalCountBadge) totalCountBadge.innerText = `${tasks.length} Projects`;

    if (tasks.length === 0) {
      verticalContainer.innerHTML = `<p class="text-sm text-slate-400 italic text-center py-6">Belum ada project terdaftar.</p>`;
      return;
    }

    tasks.forEach(task => {
      const creator = task.worker_name || 'Anonim';
      
      let deadlineText = '';
      if (task.deadline) {
        const d = new Date(task.deadline);
        if (!isNaN(d)) {
          deadlineText = `<span class="text-[11px] font-semibold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-lg flex items-center gap-1">🗓️ Deadline: ${d.toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'})}</span>`;
        }
      }

      const notesHTML = task.master_notes 
        ? `<div class="bg-amber-50 border border-amber-100 rounded-xl p-3.5 text-xs text-amber-900 leading-relaxed mt-2">
            <strong>📋 Arahan Master:</strong> "${task.master_notes}"
           </div>` 
        : `<div class="text-[11px] text-slate-400 italic mt-2 pl-1">Belum ada arahan dari master.</div>`;

      let masterActionHTML = "";
      if (isMasterUser()) {
        masterActionHTML = `
          <div class="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
            <input type="text" id="master-input-${task.id}" placeholder="Berikan arahan atau catatan khusus untuk project ini..." class="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all">
            <button onclick="submitMasterNote(${task.id})" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-md transition-all cursor-pointer shrink-0">Kirim</button>
          </div>
        `;
      }

      const itemCard = document.createElement('div');
      itemCard.className = "p-5 bg-white border border-slate-100 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col gap-1.5";
      itemCard.innerHTML = `
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h4 class="text-sm font-bold text-slate-800 leading-snug">${task.title || 'Tanpa Judul'}</h4>
              ${deadlineText}
            </div>
            <p class="text-xs text-slate-400 mt-1">${task.notes || 'Tidak ada deskripsi'}</p>
          </div>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0 uppercase tracking-wider">Oleh: ${creator}</span>
        </div>
        ${notesHTML}
        ${masterActionHTML}
      `;
      verticalContainer.appendChild(itemCard);
    });

  } catch (err) {
    console.error('System error vertical lists:', err);
  }
}

// =======================================================
// FUNGSI UPDATE STATUS TUGAS & SIMPAN ARAHAN MASTER
// =======================================================
async function updateStatus(taskId, newStatus) {
  try {
    const { error } = await supabaseClient
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId);

    if (error) alert('Gagal memperbarui status: ' + error.message);
  } catch (err) {
    console.error('System error:', err);
  }
}

async function submitMasterNote(taskId) {
  const inputEl = document.getElementById(`master-input-${taskId}`);
  const noteValue = inputEl ? inputEl.value.trim() : "";

  if (!noteValue) return alert("Catatan arahan tidak boleh kosong!");

  try {
    const { error } = await supabaseClient
      .from('tasks')
      .update({ master_notes: noteValue })
      .eq('id', taskId);

    if (error) {
      alert("Gagal mengirim arahan: " + error.message);
    } else {
      alert("Arahan berhasil disimpan!");
      fetchProjects();
    }
  } catch (err) {
    console.error("Gagal save note:", err);
  }
}

// =======================================================
// FUNGSI KONTROL MODAL TAMBAH TASK
// =======================================================
function openModal() {
  const modal = document.getElementById('taskModal');
  if (modal) {
    modal.classList.remove('hidden');
    const modalTitle = document.getElementById('modalTaskTitle');
    if (modalTitle) modalTitle.focus();

    modal.onclick = function(event) {
      if (event.target === modal) {
        closeModal();
      }
    };
  }
}

function closeModal() {
  const modal = document.getElementById('taskModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.onclick = null;
    
    if (document.getElementById('modalTaskTitle')) document.getElementById('modalTaskTitle').value = '';
    if (document.getElementById('modalTaskNotes')) document.getElementById('modalTaskNotes').value = '';
    
    const deadlineInput = document.getElementById('modalTaskDeadline');
    if (deadlineInput) deadlineInput.value = '';
  }
}

async function submitModalTask() {
  const titleInput = document.getElementById('modalTaskTitle');
  const notesInput = document.getElementById('modalTaskNotes');
  const deadlineInput = document.getElementById('modalTaskDeadline');
  
  const title = titleInput ? titleInput.value.trim() : '';
  const notes = notesInput ? notesInput.value.trim() : '';
  const deadline = deadlineInput ? deadlineInput.value : null;

  if (!title) return alert('Judul project wajib diisi!');

  try {
    const { error } = await supabaseClient
      .from('tasks')
      .insert([{ 
        title: title, 
        notes: notes, 
        status: 'todo', 
        worker_name: currentWorker,
        deadline: deadline || null 
      }]);
      
    if (error) {
      alert('Gagal menambah tugas: ' + error.message);
    } else {
      closeModal();
    }
  } catch (err) {
    console.error('System error:', err);
  }
}

// =======================================================
// FUNGSI KONTROL MODAL DETAIL PREVIEW TASK
// =======================================================
function openDetailModal(task) {
  if (!task) return;

  const modal = document.getElementById('detailModal');
  const titleEl = document.getElementById('detailTitle');
  const notesEl = document.getElementById('detailNotes');
  const workerEl = document.getElementById('detailWorker');
  const badgeEl = document.getElementById('detailStatusBadge');
  const masterNotesEl = document.getElementById('detailMasterNotes');

  if (!modal) return;

  if (titleEl) titleEl.innerText = task.title || 'Tanpa Judul';
  if (workerEl) workerEl.innerText = task.worker_name || 'Anonim';

  if (notesEl) {
    if (task.notes && task.notes.trim() !== '') {
      notesEl.innerText = task.notes;
      notesEl.classList.remove('italic', 'text-slate-400');
    } else {
      notesEl.innerText = "Tidak ada catatan atau deskripsi tambahan untuk tugas ini.";
      notesEl.classList.add('italic', 'text-slate-400');
    }
  }

  if (masterNotesEl) {
    if (task.master_notes && task.master_notes.trim() !== '') {
      masterNotesEl.innerText = task.master_notes;
      masterNotesEl.classList.remove('italic', 'text-slate-400');
    } else {
      masterNotesEl.innerText = "Belum ada arahan dari master.";
      masterNotesEl.classList.add('italic', 'text-slate-400');
    }
  }

  if (badgeEl) {
    if (task.status === 'todo') {
      badgeEl.innerText = "To Do";
      badgeEl.className = "text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-600 border border-amber-100";
    } else if (task.status === 'in_progress') {
      badgeEl.innerText = "In Progress";
      badgeEl.className = "text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100";
    } else if (task.status === 'done') {
      badgeEl.innerText = "Done";
      badgeEl.className = "text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-pink-50 text-pink-600 border border-pink-100";
    }
  }

  modal.classList.remove('hidden');

  modal.onclick = function(event) {
    if (event.target === modal) {
      closeDetailModal();
    }
  };
}

function closeDetailModal() {
  const modal = document.getElementById('detailModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.onclick = null;
  }
}

// =======================================================
// REAL-TIME INSTANT CHANGE
// =======================================================
supabaseClient
  .channel('schema-db-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
    fetchTasks();
    fetchProjects(); 
  })
  .subscribe(); 

// MENJALANKAN PENGECEKAN SESI SETELAH DOM SIAP ALAMI
document.addEventListener('DOMContentLoaded', () => {
  checkSession();
});
