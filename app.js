// =======================================================
// CONFIGURATION: DATA SUPABASE ANDA
// =======================================================
const SUPABASE_URL = "https://bawlxbtnocmangcblngu.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ZZvJjet_A_XfGmqfNJhPOg_-P3z_snJ"; // <-- JANGAN LUPA TEMPEL ANON KEY ANDA DI SINI

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let currentWorker = localStorage.getItem('worker_name') || '';

// =======================================================
// SYSTEM LOGIN & SESSION CACHE
// =======================================================
function checkSession() {
  const loginPanel = document.getElementById('login-panel');
  const mainTracker = document.getElementById('main-tracker');
  const userDisplay = document.getElementById('currentUserDisplay');

  if (currentWorker) {
    if (loginPanel) loginPanel.classList.add('hidden');
    if (mainTracker) mainTracker.classList.remove('hidden');
    if (userDisplay) userDisplay.innerText = currentWorker;
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
// FUNGSI AMBIL DATA & RENDER (MENAMPILKAN NAMA PEGAWAI)
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

// =======================================================
// 2. FUNGSI TAMPILKAN DATA KE HALAMAN WEB (HTML) - PROTECTED VERSION
// =======================================================
function renderTasks(tasks) {
  const todoList = document.getElementById('todo-list');
  const inprogressList = document.getElementById('inprogress-list');
  const doneList = document.getElementById('done-list');

  if (!todoList || !inprogressList || !doneList) return;

  todoList.innerHTML = '';
  inprogressList.innerHTML = '';
  doneList.innerHTML = '';

  tasks.forEach(task => {
    const card = document.createElement('div');
    card.className = "bg-gray-700/90 p-3.5 rounded-lg shadow border border-gray-600/70 flex flex-col gap-2 transition hover:border-gray-500";
    
    // Ambil nama pembuat jika ada di database, jika tidak tampilkan Anonim
    const creator = task.worker_name ? task.worker_name : 'Anonim';

    // ---------------------------------------------------
    // LOGIKA PROTEKSI: Cek apakah user yang login sama dengan pembuat tugas
    // ---------------------------------------------------
    const isOwner = currentWorker.toLowerCase() === creator.toLowerCase();

    let actionButton = '';
    
    if (isOwner) {
      // Jika yang login adalah pemilik tugas, berikan tombol aktif seperti biasa
      if (task.status === 'todo') {
        actionButton = `<button onclick="updateStatus(${task.id}, 'in_progress')" class="w-full bg-yellow-600 hover:bg-yellow-500 text-xs py-1.5 rounded text-white font-medium cursor-pointer">Mulai Kerja</button>`;
      } else if (task.status === 'in_progress') {
        actionButton = `<button onclick="updateStatus(${task.id}, 'done')" class="w-full bg-green-600 hover:bg-green-500 text-xs py-1.5 rounded text-white font-medium cursor-pointer">Selesai</button>`;
      } else if (task.status === 'done') {
        actionButton = `<button onclick="updateStatus(${task.id}, 'todo')" class="w-full bg-gray-500 hover:bg-gray-400 text-xs py-1.5 rounded text-white font-medium cursor-pointer">Reset</button>`;
      }
    } else {
      // Jika BUKAN pemilik tugas, tombol dikunci (disabled) dan warnanya dibuat pudar (gray-600)
      actionButton = `<button disabled class="w-full bg-gray-600 text-gray-400 text-xs py-1.5 rounded font-medium opacity-50 cursor-not-allowed text-center">Dikunci (Bukan Tugas Anda)</button>`;
    }

    card.innerHTML = `
      <div class="flex flex-col">
        <p class="font-semibold text-gray-100 text-sm break-all">${task.title}</p>
        <span class="text-[10px] text-gray-400 mt-1 bg-gray-800/50 px-2 py-0.5 rounded-md w-fit border border-gray-600/30">👤 Oleh: ${creator}</span>
      </div>
      <div class="mt-1">${actionButton}</div>
    `;

    if (task.status === 'todo') todoList.appendChild(card);
    if (task.status === 'in_progress') inprogressList.appendChild(card);
    if (task.status === 'done') doneList.appendChild(card);
  });
}

// =======================================================
// FUNGSI TAMBAH DATA (MENYIMPAN NAMA PEGAWAI)
// =======================================================
async function addTask() {
  const input = document.getElementById('taskInput');
  if (!input) return;
  
  const title = input.value.trim();
  if (!title) return;

  try {
    // Menyimpan judul DAN nama pegawai aktif ke database
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
// REAL-TIME SINKRONISASI
// =======================================================
supabaseClient
  .channel('schema-db-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
    fetchTasks();
  })
  .subscribe();

// Jalankan pengecekan login saat web dibuka
checkSession();
