// TODO: Ganti dengan kredensial Supabase Anda sendiri
const SUPABASE_URL = "https://bawlxbtnocmangcblngu.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ZZvJjet_A_XfGmqfNJhPOg_-P3z_snJ";

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 1. Fungsi mengambil data dari database saat pertama kali dibuka
async function fetchTasks() {
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) console.error('Gagal mengambil data:', error);
  else renderTasks(tasks);
}

// 2. Fungsi merender list tugas ke dalam kolom HTML masing-masing
function renderTasks(tasks) {
  const todoList = document.getElementById('todo-list');
  const inprogressList = document.getElementById('inprogress-list');
  const doneList = document.getElementById('done-list');

  // Kosongkan kolom terlebih dahulu sebelum diisi ulang
  todoList.innerHTML = '';
  inprogressList.innerHTML = '';
  doneList.innerHTML = '';

  tasks.forEach(task => {
    const card = document.createElement('div');
    card.className = "bg-gray-700 p-4 rounded-lg shadow border border-gray-600 flex justify-between items-center transition hover:border-gray-500";
    
    // Tentukan tombol aksi berdasarkan status tugas saat ini
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

    // Masukkan ke kolom yang sesuai
    if (task.status === 'todo') todoList.appendChild(card);
    if (task.status === 'in_progress') inprogressList.appendChild(card);
    if (task.status === 'done') doneList.appendChild(card);
  });
}

// 3. Fungsi Menambah Tugas Baru
async function addTask() {
  const input = document.getElementById('taskInput');
  const title = input.value.trim();
  if (!title) return;

  const { error } = await supabase.from('tasks').insert([{ title, status: 'todo' }]);
  if (error) alert('Gagal menambah tugas');
  else input.value = '';
}

// 4. Fungsi Mengubah Status Tugas (To Do -> In Progress -> Done)
async function updateStatus(id, newStatus) {
  const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', id);
  if (error) console.error('Gagal update status:', error);
}

// 5. KUNCI REAL-TIME: Mendengarkan perubahan database secara langsung
supabase
  .channel('schema-db-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
    // Begitu ada data ditambah/diubah oleh perangkat manapun, ambil data terbaru otomatis
    fetchTasks();
  })
  .subscribe();

// Jalankan fungsi ambil data saat aplikasi pertama kali dimuat
fetchTasks();