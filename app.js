// =======================================================
// CONFIGURATION: DATA SUPABASE ANDA
// =======================================================
const SUPABASE_URL = "https://bawlxbtnocmangcblngu.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ZZvJjet_A_XfGmqfNJhPOg_-P3z_snJ"; // <-- JANGAN LUPA PASTE ANON KEY ANDA DI SINI

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let currentWorker = localStorage.getItem('worker_name') || '';

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
    if (userDisplay) userDisplay.innerText = currentWorker;
    if (avatarLetter) avatarLetter.innerText = currentWorker.charAt(0).toUpperCase();
    fetchTasks();
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
// FETCH DATA & RENDER (GAYA KARTU MINIMALIS)
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
    // Box Kartu Putih Utama (cursor pointer dihilangkan di sini agar tombol di bawah tidak ikut memicu modal)
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

    // Data task diubah menjadi format string yang aman untuk dimasukkan ke fungsi onclick html
    const safeTaskJson = JSON.stringify(task).replace(/"/g, '&quot;');

    card.innerHTML = `
      <div class="cursor-pointer group flex flex-col gap-1 flex-1" onclick="openDetailModal(${safeTaskJson})">
        <p class="font-bold text-slate-800 text-[13px] leading-snug break-all group-hover:text-blue-600 transition-colors">${task.title}</p>
        ${task.notes ? `<p class="text-[11px] text-slate-400 leading-normal mt-0.5 line-clamp-2 border-l-2 border-slate-200 pl-1.5">${task.notes}</p>` : ''}
      </div>
      
      <div class="flex items-center justify-between border-t border-slate-50 pt-2.5 mt-1">
        <span class="text-[10px] text-slate-700 bg-slate-100 font-bold px-2 py-0.5 rounded-md">Oleh: ${creator}</span>
        <div class="w-5 h-5 bg-blue-600 text-white font-bold rounded-full flex items-center justify-center text-[9px] uppercase" title="Pembuat: ${creator}">
          ${initial}
        </div>
      </div>

      <div class="mt-1 relative z-10">${actionButton}</div>
    `;

    // Kelompokkan & Hitung Jumlah Tugas
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

  // Tampilkan Angka Total Tugas di Header Kolom
  document.getElementById('todo-count').innerText = todoCount;
  document.getElementById('inprogress-count').innerText = inprogressCount;
  document.getElementById('done-count').innerText = doneCount;
}

// =======================================================
// FUNGSI UPDATE STATUS TUGAS
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

// =======================================================
// FUNGSI KONTROL MODAL TAMBAH TASK
// =======================================================
function openModal() {
  const modal = document.getElementById('taskModal');
  if (modal) {
    modal.classList.remove('hidden');
    document.getElementById('modalTaskTitle').focus();

    // Event Klik di luar area pop-up untuk menutup modal tambah task
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
    modal.onclick = null; // Bersihkan event listener
    document.getElementById('modalTaskTitle').value = '';
    document.getElementById('modalTaskNotes').value = '';
  }
}

async function submitModalTask() {
  const titleInput = document.getElementById('modalTaskTitle');
  const notesInput = document.getElementById('modalTaskNotes');
  
  const title = titleInput ? titleInput.value.trim() : '';
  const notes = notesInput ? notesInput.value.trim() : '';

  if (!title) return alert('Judul project wajib diisi!');

  try {
    const { error } = await supabaseClient
      .from('tasks')
      .insert([{ 
        title: title, 
        notes: notes, 
        status: 'todo', 
        worker_name: currentWorker 
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

  if (!modal) return;

  if (titleEl) titleEl.innerText = task.title;
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

  // Tampilkan Modal Detail
  modal.classList.remove('hidden');

  // Event Klik di luar area pop-up untuk menutup modal detail task
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
    modal.onclick = null; // Bersihkan event listener
  }
}

// =======================================================
// REAL-TIME INSTANT CHANGE
// =======================================================
supabaseClient
  .channel('schema-db-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
    fetchTasks();
  })
  .subscribe();

checkSession();
