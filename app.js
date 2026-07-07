// =======================================================
// CONFIGURATION: ISI DENGAN DATA SUPABASE ANDA
// =======================================================
const SUPABASE_URL = "https://bawlxbtnocmangcblngu.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ZZvJjet_A_XfGmqfNJhPOg_-P3z_snJ"; // <-- Tempel Anon Key Anda di dalam tanda petik ini

// Menggunakan nama variabel 'supabaseClient' agar tidak tabrakan dengan CDN bawaan HTML
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =======================================================
// 1. FUNGSI AMBIL DATA DARI DATABASE
// =======================================================
async function fetchTasks() {
  try {
    const { data: tasks, error } = await supabaseClient
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Eror ambil data:', error.message);
    } else {
      renderTasks(tasks);
    }
  } catch (err) {
    console.error('Sistem macet saat fetch:', err);
  }
}

// =======================================================
// 2. FUNGSI TAMPILKAN DATA KE HALAMAN WEB (HTML)
// =======================================================
function renderTasks(tasks) {
  const todoList = document.getElementById('todo-list');
  const inprogressList = document.getElementById('inprogress-list');
  const doneList = document.getElementById('done-list');

  // Validasi jika elemen HTML belum siap
  if (!todoList || !inprogressList || !doneList) return;

  // Bersihkan sisa daftar lama sebelum render ulang
  todoList.innerHTML = '';
  inprogressList.innerHTML = '';
  doneList.innerHTML = '';

  tasks.forEach(task => {
    const card = document.createElement('div');
    card.className = "bg-gray-700 p-4 rounded-lg shadow border border-gray-600 flex justify-between items-center transition hover:border-gray-500";
    
    let actionButton = '';
    if (task.status === 'todo') {
      actionButton = `<button onclick="updateStatus(${task.id}, 'in_progress')" class="bg-yellow-600 hover:bg-yellow-500 text-xs px-3 py-1.5 rounded text-white font-medium">Mulai Kerja</button>`;
    } else if (task.status === 'in_progress') {
      actionButton = `<button onclick="updateStatus(${task.id}, 'done')" class="bg-green-600 hover:bg-green-500 text-xs px-3 py-1.5 rounded text-white font-medium">Selesai</button>`;
    } else if (task.status === 'done') {
      actionButton = `<button onclick="updateStatus(${task.id}, 'todo')" class="bg-gray-500 hover:bg-gray-400 text-xs px-3 py-1.5 rounded text-white font-medium">Reset</button>`;
    }

    card.innerHTML = `
      <div class="pr-2">
        <p class="font-semibold text-gray-100 break-all">${task.title}</p>
      </div>
      <div>${actionButton}</div>
    `;

    // Kelompokkan kartu berdasarkan status database
    if (task.status === 'todo') todoList.appendChild(card);
    if (task.status === 'in_progress') inprogressList.appendChild(card);
    if (task.status === 'done') doneList.appendChild(card);
  });
}

// =======================================================
// 3. FUNGSI TAMBAH TUGAS BARU
// =======================================================
async function addTask() {
  const input = document.getElementById('taskInput');
  if (!input) return;
  
  const title = input.value.trim();
  if (!title) return; // Jangan kirim jika inputan kosong

  try {
    const { error } = await supabaseClient.from('tasks').insert([{ title: title, status: 'todo' }]);
    if (error) {
      alert('Gagal menambah tugas: ' + error.message);
    } else {
      input.value = ''; // Kosongkan kolom input jika sukses
    }
  } catch (err) {
    console.error('Sistem macet saat tambah data:', err);
  }
}

// =======================================================
// 4. FUNGSI UPDATE STATUS TUGAS
// =======================================================
async function updateStatus(id, newStatus) {
  try {
    const { error } = await supabaseClient.from('tasks').update({ status: newStatus }).eq('id', id);
    if (error) console.error('Gagal update status:', error.message);
  } catch (err) {
    console.error('Sistem macet saat update:', err);
  }
}

// =======================================================
// 5. FITUR REAL-TIME (SINKRONISASI OTOMATIS HP & PC)
// =======================================================
supabaseClient
  .channel('schema-db-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
    fetchTasks();
  })
  .subscribe();

// Jalankan fungsi ambil data pertama kali saat web dibuka
fetchTasks();