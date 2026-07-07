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
    // Desain Box Kartu Putih Minimalis dengan bayangan lembut (Persis Referensi Gambar)
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

    // Mengambil inisial huruf nama pembuat untuk dijadikan avatar kecil di pojok kanan kartu
    const initial = creator.charAt(0).toUpperCase();

    card.innerHTML = `
      <div class="flex flex-col gap-1">
        <p class="font-bold text-slate-800 text-[13px] leading-snug break-all">${task.title}</p>
      </div>
      
      <div class="flex items-center justify-between border-t border-slate-50 pt-2.5 mt-1">
        <span class="text-[10px] text-slate-700 bg-slate-100 font-bold px-2 py-0.5 rounded-md">Oleh: ${creator}</span>
        
        <div class="w-5 h-5 bg-blue-600 text-white font-bold rounded-full flex items-center justify-center text-[9px] uppercase" title="Pembuat: ${creator}">
          ${initial}
        </div>
      </div>

      <div class="mt-1">${actionButton}</div>
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
// TAMBAH DATA & UPDATE DATA
// =======================================================
async function addTask() {
  const input = document.getElementById('taskInput');
  if (!input) return;
  
  const title = input.value.trim();
  if (!title) return;

  try {
    const { error } = await supabaseClient
      .from('tasks')
      .insert([{ title: title, status: 'todo', worker_name: currentWorker }]);
      
    if (error) alert('Gagal menambah tugas: ' + error.message);
    else input.value = '';
  } catch (err) {
    console.error('System error:', err);
  }
}

async function updateStatus(id, newStatus) {
  try {
    const { error } = await supabaseClient.from('tasks').update({ status: newStatus }).eq('id', id);
    if (error) console.error('Gagal update status:', error.message);
  } catch (err) {
    console.error('System error:', err);
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