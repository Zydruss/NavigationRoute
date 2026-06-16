// Variabel state global untuk menyimpan data graph, langkah simulasi, dan kontrol pemutaran
let graphData = [];             // Menyimpan data lokasi (Vertices) dan rute jalan (Edges) dari server
let simulationSteps = [];       // Menyimpan rekaman snapshot langkah demi langkah dari algoritma Dijkstra
let currentStepIndex = -1;      // Menyimpan indeks langkah simulasi yang sedang aktif (-1 jika idle/belum mulai)
let isPlaying = false;          // Status putar otomatis simulasi (True jika sedang play, False jika pause)
let playInterval = null;        // Wadah untuk menyimpan objek timer setInterval untuk putar otomatis
let simulationSpeed = 1000;     // Kecepatan putar animasi (dalam milidetik per langkah)
let currentTab = 'tab-simulation'; // Menyimpan id tab halaman yang sedang aktif

let startNodeName = '';         // Nama lokasi awal kurir yang dipilih
let destNodeName = '';          // Nama lokasi tujuan pengiriman paket yang dipilih

// Elemen Canvas HTML5 beserta konteks gambar 2D
let graphCanvas, graphCtx;
let heapCanvas, heapCtx;

// Variabel state untuk menangani aksi geser lokasi (Drag and Drop Vertex) pada Canvas
let draggedNode = null;         // Menyimpan objek Vertex yang sedang digeser oleh kursor mouse
let isDragging = false;         // Menandai apakah pengguna sedang menahan dan menggeser lokasi

// Ketika seluruh struktur HTML selesai dimuat di browser, panggil fungsi inisialisasi ini
document.addEventListener('DOMContentLoaded', () => {
    // Mulai dari baris ini sampai inisialisasi selesai, kita mempersiapkan tampilan web
    
    // Panggil pustaka Lucide Icons untuk menggambar ikon premium di UI
    lucide.createIcons();
    
    // Hubungkan variabel dengan elemen canvas pada HTML
    graphCanvas = document.getElementById('graph-canvas');
    graphCtx = graphCanvas.getContext('2d');
    heapCanvas = document.getElementById('heap-canvas');
    heapCtx = heapCanvas.getContext('2d');
    
    // Atur ukuran canvas agar responsif mengikuti besar pembungkusnya (container)
    resizeCanvases();
    // Jika ukuran layar browser berubah, sesuaikan kembali resolusi canvas
    window.addEventListener('resize', resizeCanvases);
    
    // Ambil data graph (peta logistik awal) dari server Flask
    fetchGraph();
    
    // Aktifkan event listener untuk klik, geser, dan double click di canvas peta
    setupGraphCanvasEvents();
});

// Fungsi ini berfungsi untuk menyesuaikan ukuran Canvas (Width & Height) agar memenuhi panel visualisasi
function resizeCanvases() {
    // Langkah-langkah menyesuaikan ukuran:
    if (graphCanvas && graphCanvas.parentElement) {
        // Lebar canvas tetap responsif mengikuti layar
        graphCanvas.width = graphCanvas.parentElement.clientWidth;
        // Tinggi canvas diatur tetap ke 550px agar lokasi di koordinat bawah (seperti DP Ajung) tidak terpotong
        graphCanvas.height = 550;
    }
    if (heapCanvas && heapCanvas.parentElement) {
        heapCanvas.width = heapCanvas.parentElement.clientWidth;
        heapCanvas.height = Math.max(200, heapCanvas.parentElement.clientHeight);
    }
    // Gambar ulang kondisi peta saat ini setelah canvas berubah ukuran
    renderCurrentState();
}

// Fungsi ini digunakan untuk berpindah antar Tab menu (Simulasi Rute vs Editor Peta)
function switchTab(tabId) {
    // 1. Sembunyikan semua konten tab terlebih dahulu
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    // 2. Matikan status aktif pada tombol navigasi sidebar
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 3. Tampilkan tab yang dipilih berdasarkan id-nya
    document.getElementById(tabId).classList.add('active');
    
    // Ambil elemen judul dan deskripsi di bagian atas dashboard
    const titleEl = document.getElementById('current-tab-title');
    const descEl = document.getElementById('current-tab-desc');
    
    // 4. Perbarui judul halaman sesuai tab yang dibuka
    if (tabId === 'tab-simulation') {
        titleEl.textContent = "Visualisasi Navigasi Kurir";
        descEl.textContent = "Penentuan Rute Tercepat Menggunakan Dijkstra & Min-Heap Berbasis Pointer Dinamis";
        document.getElementById('btn-tab-sim').classList.add('active');
    } else if (tabId === 'tab-editor') {
        titleEl.textContent = "Editor Jaringan Logistik";
        descEl.textContent = "Tambahkan lokasi dan jalur jalan secara kustom untuk mensimulasikan peta kota Anda";
        document.getElementById('btn-tab-edit').classList.add('active');
    }
    
    currentTab = tabId;
    
    // Berikan jeda waktu sebentar lalu atur ulang ukuran canvas agar pas di layar baru
    setTimeout(resizeCanvases, 50);
}

// Fungsi pembantu untuk memunculkan pesan pemberitahuan (Toast Notification) di pojok kanan bawah
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Pilih ikon Lucide yang sesuai dengan kategori pesan
    let icon = 'info';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'alert-triangle';
    
    // Bentuk konten toast
    toast.innerHTML = `<i data-lucide="${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);
    
    // Render ikon Lucide yang baru ditambahkan ke HTML
    lucide.createIcons({ attrs: { class: 'toast-icon' } });
    
    // Hilangkan toast secara otomatis setelah 3 detik berjalan dengan efek memudar
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ====================================
// FUNGSI UNTUK KOMUNIKASI DENGAN BACKEND (REST API)
// ====================================

// Fungsi ini memanggil endpoint GET /api/graph untuk mengambil daftar lokasi dan jalan dari server
async function fetchGraph() {
    try {
        const response = await fetch('/api/graph');
        const data = await response.json();
        graphData = data; // Simpan data ke variabel lokal
        
        // Perbarui daftar pilihan di dropdown select lokasi awal/tujuan
        populateDropdowns();
        
        // Perbarui isi tabel daftar lokasi dan rute di menu Editor Peta
        populateEditorTables();
        
        // Gambar peta logistik terbaru ke canvas
        renderCurrentState();
    } catch (err) {
        showToast("Gagal memuat data peta dari server.", "error");
        console.error(err);
    }
}

// Fungsi ini mengirim request POST /api/reset untuk mengembalikan peta ke data default Jember
async function resetGraphToDefault() {
    try {
        const response = await fetch('/api/reset', { method: 'POST' });
        const data = await response.json();
        if (data.success) {
            graphData = data.graph;
            stopSimulation(); // Hentikan simulasi yang sedang berjalan
            populateDropdowns();
            populateEditorTables();
            renderCurrentState();
            showToast("Peta berhasil direset ke default kota Jember.", "success");
        }
    } catch (err) {
        showToast("Gagal mereset peta.", "error");
    }
}

// Fungsi ini mengisi data dropdown opsi lokasi awal dan tujuan di panel simulasi & editor
function populateDropdowns() {
    const startSelect = document.getElementById('select-start');
    const destSelect = document.getElementById('select-dest');
    const edgeSrcSelect = document.getElementById('edge-src');
    const edgeDestSelect = document.getElementById('edge-dest');
    
    // Simpan nilai pilihan sebelumnya agar tidak reset jika graph diperbarui
    const prevStartVal = startSelect.value;
    const prevDestVal = destSelect.value;
    
    // Bersihkan isi opsi sebelumnya
    startSelect.innerHTML = '';
    destSelect.innerHTML = '';
    edgeSrcSelect.innerHTML = '';
    edgeDestSelect.innerHTML = '';
    
    // Urutkan nama lokasi berdasarkan alfabet agar rapi
    const sortedNodes = [...graphData].sort((a, b) => a.name.localeCompare(b.name));
    
    // Masukkan setiap lokasi sebagai opsi pilihan (<option>)
    sortedNodes.forEach(node => {
        const opt1 = document.createElement('option');
        opt1.value = node.name;
        opt1.textContent = node.name;
        startSelect.appendChild(opt1);
        
        const opt2 = document.createElement('option');
        opt2.value = node.name;
        opt2.textContent = node.name;
        destSelect.appendChild(opt2);
        
        const opt3 = document.createElement('option');
        opt3.value = node.name;
        opt3.textContent = node.name;
        edgeSrcSelect.appendChild(opt3);
        
        const opt4 = document.createElement('option');
        opt4.value = node.name;
        opt4.textContent = node.name;
        edgeDestSelect.appendChild(opt4);
    });
    
    // Kembalikan pilihan sebelumnya jika lokasi tersebut masih ada di peta
    if (prevStartVal && [...startSelect.options].some(o => o.value === prevStartVal)) {
        startSelect.value = prevStartVal;
    } else if (startSelect.options.length > 0) {
        startSelect.value = startSelect.options[0].value;
    }
    
    if (prevDestVal && [...destSelect.options].some(o => o.value === prevDestVal)) {
        destSelect.value = prevDestVal;
    } else if (destSelect.options.length > 1) {
        destSelect.value = destSelect.options[1].value;
    }
}

// Fungsi ini memperbarui isi tabel editor lokasi (Vertex) dan tabel rute jalan (Edge)
function populateEditorTables() {
    const vTableBody = document.querySelector('#table-vertices tbody');
    const eTableBody = document.querySelector('#table-edges tbody');
    
    vTableBody.innerHTML = '';
    eTableBody.innerHTML = '';
    
    // 1. Isi tabel daftar lokasi (Vertex)
    graphData.forEach(v => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${v.name}</strong></td>
            <td>X: ${v.x}, Y: ${v.y}</td>
            <td>
                <button class="btn-table-action" onclick="deleteVertex('${v.name}')" title="Hapus Lokasi">
                    <i data-lucide="trash-2"></i>
                </button>
            </td>
        `;
        vTableBody.appendChild(tr);
    });
    
    // 2. Isi tabel daftar jalur jalan (Edge), hilangkan duplikasi rute bolak-balik agar hanya tampil sekali
    const addedPairs = new Set();
    graphData.forEach(v => {
        if (!v.edges) return;
        v.edges.forEach(edge => {
            const pairKey = [v.name, edge.dest].sort().join('::');
            if (!addedPairs.has(pairKey)) {
                addedPairs.add(pairKey);
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${v.name}</td>
                    <td>${edge.dest}</td>
                    <td>${edge.weight} KM</td>
                    <td>
                        <button class="btn-table-action" onclick="deleteEdge('${v.name}', '${edge.dest}')" title="Hapus Rute">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </td>
                `;
                eTableBody.appendChild(tr);
            }
        });
    });
    
    // Muat ulang ikon Lucide agar ikon tempat sampah (trash) muncul di tabel
    lucide.createIcons();
}

// Fungsi ini menangani form ketika admin menambah/menyimpan lokasi baru
async function handleFormAddVertex(e) {
    e.preventDefault(); // Cegah reload halaman
    const name = document.getElementById('vertex-name').value.trim();
    const x = parseInt(document.getElementById('vertex-x').value);
    const y = parseInt(document.getElementById('vertex-y').value);
    
    if (!name) return;
    
    try {
        const response = await fetch('/api/vertex', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, x, y })
        });
        const data = await response.json();
        if (data.success) {
            graphData = data.graph;
            populateDropdowns();
            populateEditorTables();
            renderCurrentState();
            showToast(`Lokasi '${name}' berhasil disimpan.`, "success");
            document.getElementById('form-add-vertex').reset();
        } else {
            showToast(data.error, "error");
        }
    } catch (err) {
        showToast("Gagal menyimpan lokasi baru.", "error");
    }
}

// Fungsi ini memanggil API DELETE /api/vertex untuk menghapus lokasi berdasarkan namanya
async function deleteVertex(name) {
    if (!confirm(`Hapus lokasi '${name}' beserta semua rute terhubung?`)) return;
    try {
        const response = await fetch('/api/vertex', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        const data = await response.json();
        if (data.success) {
            graphData = data.graph;
            stopSimulation(); // Hentikan simulasi jika ada rute yang sedang dihitung
            populateDropdowns();
            populateEditorTables();
            renderCurrentState();
            showToast(`Lokasi '${name}' berhasil dihapus.`, "success");
        } else {
            showToast(data.error, "error");
        }
    } catch (err) {
        showToast("Gagal menghapus lokasi.", "error");
    }
}

// Fungsi ini mengirim rute baru (Edge) antara dua lokasi ke server backend
async function handleFormAddEdge(e) {
    e.preventDefault();
    const src = document.getElementById('edge-src').value;
    const dest = document.getElementById('edge-dest').value;
    const weight = parseFloat(document.getElementById('edge-weight').value);
    
    if (src === dest) {
        showToast("Lokasi asal dan tujuan tidak boleh sama.", "error");
        return;
    }
    
    try {
        const response = await fetch('/api/edge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ src, dest, weight })
        });
        const data = await response.json();
        if (data.success) {
            graphData = data.graph;
            populateEditorTables();
            renderCurrentState();
            showToast(`Rute '${src} <-> ${dest}' (${weight} KM) disimpan.`, "success");
        } else {
            showToast(data.error, "error");
        }
    } catch (err) {
        showToast("Gagal menyimpan rute.", "error");
    }
}

// Fungsi ini memotong jalur jalan (Edge) antara dua lokasi
async function deleteEdge(src, dest) {
    if (!confirm(`Hapus rute penghubung '${src} <-> ${dest}'?`)) return;
    try {
        const response = await fetch('/api/edge', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ src, dest })
        });
        const data = await response.json();
        if (data.success) {
            graphData = data.graph;
            stopSimulation();
            populateEditorTables();
            renderCurrentState();
            showToast(`Rute '${src} <-> ${dest}' berhasil dihapus.`, "success");
        } else {
            showToast(data.error, "error");
        }
    } catch (err) {
        showToast("Gagal menghapus rute.", "error");
    }
}

// ====================================
// FUNGSI SIMULASI DAN KONTROL PEMUTARAN DIJKSTRA
// ====================================

// Fungsi ini memicu backend untuk menghitung Dijkstra rute tercepat dan merekam langkah visualisasinya
async function startDijkstraSolver() {
    startNodeName = document.getElementById('select-start').value;
    destNodeName = document.getElementById('select-dest').value;
    
    if (startNodeName === destNodeName) {
        showToast("Lokasi awal dan tujuan tidak boleh sama!", "error");
        return;
    }
    
    try {
        const response = await fetch('/api/solve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ start: startNodeName, dest: destNodeName })
        });
        const data = await response.json();
        
        // Simpan langkah-langkah visualisasi rute
        simulationSteps = data.steps;
        currentStepIndex = 0;
        
        // Aktifkan panel kontrol simulasi (hapus class disabled)
        const ctrlPanel = document.getElementById('visualizer-controls');
        ctrlPanel.classList.remove('disabled');
        
        // Atur tombol-tombol navigasi langkah
        document.getElementById('btn-prev-step').disabled = true;
        document.getElementById('btn-play-pause').disabled = false;
        document.getElementById('btn-next-step').disabled = false;
        document.getElementById('btn-stop').disabled = false;
        
        // Langsung tampilkan langkah pertama (indeks 0)
        renderStep(0);
        showToast("Simulasi siap dijalankan. Tekan tombol Play untuk memutar otomatis.", "info");
        
    } catch (err) {
        showToast("Gagal mencari rute tercepat.", "error");
        console.error(err);
    }
}

// Fungsi ini menggambar status graph dan heap biner pada langkah ke-index simulasi
function renderStep(index) {
    if (index < 0 || index >= simulationSteps.length) return;
    
    const step = simulationSteps[index];
    currentStepIndex = index;
    
    // 1. Tampilkan deskripsi langkah di log terminal dashboard
    const logBox = document.getElementById('simulation-logs');
    logBox.innerHTML = '';
    
    // Kita tampilkan maksimal 5 log terakhir agar tidak terlalu penuh
    const startIdx = Math.max(0, index - 5);
    for (let i = startIdx; i <= index; i++) {
        const s = simulationSteps[i];
        let tc = 'process-entry';
        if (s.description.includes('Inisialisasi')) tc = 'system-entry';
        if (s.description.includes('ditemukan') || s.description.includes('tercapai')) tc = 'success-entry';
        
        const entry = document.createElement('div');
        entry.className = `log-entry ${tc}`;
        entry.innerHTML = `<strong>Langkah ${i + 1}:</strong> ${s.description}`;
        logBox.appendChild(entry);
    }
    // Secara otomatis gulir log terminal ke paling bawah
    logBox.scrollTop = logBox.scrollHeight;
    
    // 2. Perbarui teks indikator langkah (misal: "3 / 15")
    document.getElementById('step-counter-text').textContent = `${index + 1} / ${simulationSteps.length}`;
    const progressPct = ((index + 1) / simulationSteps.length) * 100;
    document.getElementById('step-progress-fill').style.width = `${progressPct}%`;
    
    // 3. Matikan/aktifkan tombol Prev dan Next berdasarkan posisi indeks
    document.getElementById('btn-prev-step').disabled = (index === 0);
    document.getElementById('btn-next-step').disabled = (index === simulationSteps.length - 1);
    
    // 4. Gambar ulang canvas peta (Graph) dan canvas Heap sesuai data snapshot langkah ini
    renderGraphState(step.graph, step.highlight_vertex, step.highlight_edge, step.shortest_path);
    renderHeapState(step.heap);
}

// Pindah ke langkah berikutnya
function nextStep() {
    if (currentStepIndex < simulationSteps.length - 1) {
        renderStep(currentStepIndex + 1);
    } else {
        pause(); // Stop pemutaran otomatis jika sudah di langkah terakhir
    }
}

// Kembali ke langkah sebelumnya
function prevStep() {
    if (currentStepIndex > 0) {
        renderStep(currentStepIndex - 1);
    }
}

// Jalankan/hentikan putar otomatis simulasi
function togglePlay() {
    if (isPlaying) {
        pause();
    } else {
        play();
    }
}

// Memulai timer putar otomatis
function play() {
    if (currentStepIndex >= simulationSteps.length - 1) {
        currentStepIndex = 0; // Mulai ulang dari awal jika sudah mentok
    }
    
    isPlaying = true;
    const btn = document.getElementById('btn-play-pause');
    btn.innerHTML = '<i data-lucide="pause"></i>'; // Ubah ikon tombol jadi PAUSE
    btn.classList.add('active');
    lucide.createIcons();
    
    // Lakukan pemutaran setiap beberapa milidetik sesuai variabel speed
    playInterval = setInterval(() => {
        if (currentStepIndex < simulationSteps.length - 1) {
            nextStep();
        } else {
            pause();
            showToast("Simulasi selesai.", "success");
        }
    }, simulationSpeed);
}

// Menjeda putar otomatis
function pause() {
    isPlaying = false;
    const btn = document.getElementById('btn-play-pause');
    btn.innerHTML = '<i data-lucide="play"></i>'; // Ubah ikon tombol jadi PLAY
    btn.classList.remove('active');
    lucide.createIcons();
    
    if (playInterval) {
        clearInterval(playInterval);
        playInterval = null;
    }
}

// Fungsi untuk menghentikan simulasi total dan membersihkan dashboard visualizer
function stopSimulation() {
    pause();
    currentStepIndex = -1;
    simulationSteps = [];
    
    // Matikan panel simulasi
    const ctrlPanel = document.getElementById('visualizer-controls');
    ctrlPanel.classList.add('disabled');
    
    document.getElementById('btn-prev-step').disabled = true;
    document.getElementById('btn-play-pause').disabled = true;
    document.getElementById('btn-next-step').disabled = true;
    document.getElementById('btn-stop').disabled = true;
    
    document.getElementById('step-counter-text').textContent = '0 / 0';
    document.getElementById('step-progress-fill').style.width = '0%';
    
    const logBox = document.getElementById('simulation-logs');
    logBox.innerHTML = '<div class="log-entry system-entry">Silakan pilih lokasi awal dan tujuan, kemudian klik "Cari Rute Tercepat" untuk memulai simulasi.</div>';
    
    // Muat ulang graph awal tanpa highlight rute pencarian
    fetchGraph();
}

// Memperbarui interval kecepatan animasi dari input slider range
function updateSpeed(val) {
    simulationSpeed = parseInt(val);
    
    // Jika animasi sedang berjalan, restart timer dengan kecepatan baru
    if (isPlaying) {
        pause();
        play();
    }
}

// ====================================
// PROSES RENDERING PETA LOKASI (GRAPH VISUALIZER CANVAS)
// ====================================

// Fungsi pembantu untuk merender peta saat simulasi belum berjalan
function renderCurrentState() {
    if (currentStepIndex === -1) {
        renderGraphState(graphData);
        renderHeapState(null); // Kosongkan heap tree
    }
}

// Fungsi utama menggambar jaringan logistik rute kurir pada canvas
function renderGraphState(nodes, highlightV = null, highlightE = null, shortestPath = null) {
    if (!graphCanvas || !graphCtx) return;
    
    const ctx = graphCtx;
    const width = graphCanvas.width;
    const height = graphCanvas.height;
    
    // Bersihkan coretan canvas lama
    ctx.clearRect(0, 0, width, height);
    
    if (nodes.length === 0) {
        ctx.fillStyle = '#64748b';
        ctx.font = '14px Inter';
        ctx.textAlign = 'center';
        ctx.fillText("Peta kosong. Silakan tambahkan lokasi di editor.", width / 2, height / 2);
        return;
    }
    
    // 1. Gambar jalan penghubung (Edges) terlebih dahulu agar letaknya di bawah node lokasi
    const drawnPairs = new Set();
    nodes.forEach(v => {
        if (!v.edges) return;
        v.edges.forEach(edge => {
            const destNode = nodes.find(n => n.name === edge.dest);
            if (!destNode) return;
            
            // Cek apakah jalur jalan ini merupakan bagian dari rute terpendek yang ditemukan
            let isPath = false;
            if (shortestPath && shortestPath.length > 0) {
                const srcIdx = shortestPath.indexOf(v.name);
                const destIdx = shortestPath.indexOf(edge.dest);
                if (srcIdx !== -1 && destIdx !== -1 && Math.abs(srcIdx - destIdx) === 1) {
                    isPath = true;
                }
            }
            
            // Cek apakah jalur ini sedang diperiksa (relaksasi) pada langkah aktif saat ini
            let isHighlighted = false;
            if (highlightE) {
                if ((highlightE[0] === v.name && highlightE[1] === edge.dest) || 
                    (highlightE[1] === v.name && highlightE[0] === edge.dest)) {
                    isHighlighted = true;
                }
            }
            
            // Gambar garis rute
            ctx.beginPath();
            ctx.moveTo(v.x, v.y);
            ctx.lineTo(destNode.x, destNode.y);
            
            if (isPath) {
                ctx.strokeStyle = '#f97316'; // Garis jingga tebal untuk jalur terpendek kurir
                ctx.lineWidth = 4.5;
            } else if (isHighlighted) {
                ctx.strokeStyle = '#f59e0b'; // Garis kuning tebal untuk rute yang sedang dihitung
                ctx.lineWidth = 3;
            } else {
                ctx.strokeStyle = 'rgba(51, 65, 85, 0.45)'; // Garis abu-abu transparan default
                ctx.lineWidth = 2;
            }
            ctx.stroke();
            
            // Gambar badge/lingkaran kecil berisi jarak (KM) di tengah garis rute
            const pairKey = [v.name, edge.dest].sort().join('::');
            if (!drawnPairs.has(pairKey)) {
                drawnPairs.add(pairKey);
                
                const midX = (v.x + destNode.x) / 2;
                const midY = (v.y + destNode.y) / 2;
                
                // Gambar background lingkaran badge
                ctx.fillStyle = '#0b0f19';
                ctx.beginPath();
                ctx.arc(midX, midY, 13, 0, 2 * Math.PI);
                ctx.fill();
                
                ctx.strokeStyle = isPath ? '#f97316' : (isHighlighted ? '#f59e0b' : '#334155');
                ctx.lineWidth = 1;
                ctx.stroke();
                
                // Gambar teks bobot jarak
                ctx.fillStyle = isPath ? '#fb923c' : (isHighlighted ? '#fef08a' : '#94a3b8');
                ctx.font = 'bold 9px JetBrains Mono';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`${edge.weight}`, midX, midY);
            }
        });
    });
    
    // 2. Gambar lingkaran lokasi (Vertices)
    nodes.forEach(v => {
        const isStart = (v.name === startNodeName);
        const isDest = (v.name === destNodeName);
        const isPath = shortestPath && shortestPath.includes(v.name);
        const isActive = (v.name === highlightV);
        
        ctx.beginPath();
        ctx.arc(v.x, v.y, 22, 0, 2 * Math.PI);
        
        // Tentukan warna isi lokasi berdasarkan status pencarian
        if (isActive) {
            ctx.fillStyle = '#f59e0b';      // Kuning cerah jika lokasi ini sedang dieksplorasi (Active Node)
            ctx.strokeStyle = '#fef08a';
        } else if (isPath) {
            ctx.fillStyle = '#f97316';      // Jingga jika lokasi ini terpilih di jalur rute final
            ctx.strokeStyle = '#fb923c';
        } else if (v.visited) {
            ctx.fillStyle = '#10b981';      // Hijau jika lokasi sudah selesai dieksplorasi (Visited = True)
            ctx.strokeStyle = '#34d399';
        } else {
            ctx.fillStyle = '#1e293b';      // Abu-abu biru jika lokasi belum dikunjungi sama sekali
            ctx.strokeStyle = '#475569';
        }
        ctx.lineWidth = 3;
        ctx.fill();
        ctx.stroke();
        
        // Tambahkan efek bayangan menyala (glow) jika lokasi berstatus aktif/start/tujuan
        if (isActive) {
            ctx.beginPath();
            ctx.arc(v.x, v.y, 28, 0, 2 * Math.PI);
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
        
        // Tulis teks singkatan lokasi di tengah lingkaran (misal: Gudang Utama jadi STR / DP Mangli jadi DP)
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 10px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        let label = v.name.substring(0, 3).toUpperCase();
        if (isStart) label = "STR"; // Start
        if (isDest) label = "DST";  // Destination
        ctx.fillText(label, v.x, v.y - 4);
        
        // Tulis akumulasi nilai jarak sementara (Dijkstra dist) di bawah singkatan nama
        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px JetBrains Mono';
        const distStr = v.dist === "INF" ? "∞" : `${v.dist}k`;
        ctx.fillText(distStr, v.x, v.y + 7);
        
        // Tulis nama lengkap lokasi di atas lingkaran node lokasi
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 12px Outfit';
        ctx.fillText(v.name, v.x, v.y - 32);
    });
}

// ====================================
// PROSES RENDERING POHON BINER HEAP (HEAP VISUALIZER CANVAS)
// ====================================

// Fungsi ini merender visualisasi struktur data pohon biner Min-Heap ke canvas kedua
function renderHeapState(heapRoot) {
    if (!heapCanvas || !heapCtx) return;
    
    const ctx = heapCtx;
    const width = heapCanvas.width;
    const height = heapCanvas.height;
    
    ctx.clearRect(0, 0, width, height); // Bersihkan canvas
    
    if (!heapRoot) {
        ctx.fillStyle = '#64748b';
        ctx.font = '13px Inter';
        ctx.textAlign = 'center';
        ctx.fillText("Min-Heap kosong. Prioritas akan terisi saat rute dihitung.", width / 2, height / 2);
        return;
    }
    
    // Atur parameter posisi awal root tree heap
    const initialX = width / 2; // Letakkan root di tengah horizontal canvas
    const initialY = 40;        // Beri margin atas 40px
    const initialDx = width / 4; // Rentang jarak awal antara induk dengan anak kiri/kanan
    
    // Gambar pohon heap secara rekursif
    drawHeapNode(ctx, heapRoot, initialX, initialY, initialDx);
}

// Fungsi rekursif untuk menggambar cabang (garis) dan simpul (lingkaran) pohon biner heap
function drawHeapNode(ctx, node, x, y, dx) {
    if (!node) return;
    
    // Atur gaya garis cabang
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.6)';
    ctx.lineWidth = 2;
    
    // 1. Gambar garis cabang ke anak kiri (jika ada) dan lanjutkan rekursi ke kiri
    if (node.left) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - dx, y + 45); // Anak diletakkan 45px lebih rendah
        ctx.stroke();
        drawHeapNode(ctx, node.left, x - dx, y + 45, dx / 2); // Rentang dx dibagi 2 agar anak tidak saling tabrakan
    }
    
    // 2. Gambar garis cabang ke anak kanan (jika ada) dan lanjutkan rekursi ke kanan
    if (node.right) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + dx, y + 45);
        ctx.stroke();
        drawHeapNode(ctx, node.right, x + dx, y + 45, dx / 2);
    }
    
    // 3. Gambar lingkaran node heap
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, 2 * Math.PI);
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#f97316'; // Warna jingga khas kurir untuk border heap node
    ctx.lineWidth = 2.5;
    ctx.fill();
    ctx.stroke();
    
    // 4. Tulis nilai prioritas jarak (dist) di dalam lingkaran heap node
    ctx.fillStyle = '#eab308'; // Angka prioritas berwarna kuning
    ctx.font = 'bold 9px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.dist === "INF" ? "∞" : node.dist, x, y);
    
    // 5. Tulis nama lokasi di atas lingkaran heap node
    ctx.fillStyle = '#f8fafc';
    ctx.font = '500 11px Outfit';
    ctx.fillText(node.name, x, y - 22);
}

// ====================================
// PENGATURAN INTERAKSI CANVAS (DRAG NODE & DBLCLICK UNTUK TAMBAH LOKASI)
// ====================================

// Mengaktifkan interaksi mouse pada Canvas Peta Graph
function setupGraphCanvasEvents() {
    if (!graphCanvas) return;
    
    // Aksi Klik Mouse: Memilih node lokasi untuk mulai digeser
    graphCanvas.addEventListener('mousedown', e => {
        if (currentStepIndex !== -1) return; // Kunci interaksi editor jika simulasi rute sedang berjalan
        
        const rect = graphCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Deteksi apakah koordinat klik mouse berada di dalam radius node lokasi mana pun
        draggedNode = graphData.find(node => {
            const dist = Math.hypot(node.x - mouseX, node.y - mouseY);
            return dist <= 22; // Radius node 22px
        });
        
        if (draggedNode) {
            isDragging = true;
        }
    });
    
    // Aksi Geser Mouse: Memindahkan koordinat node lokasi di layar secara langsung
    graphCanvas.addEventListener('mousemove', e => {
        if (!isDragging || !draggedNode) return;
        
        const rect = graphCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Batasi geseran agar node tidak keluar dari tepi batas canvas
        draggedNode.x = Math.max(30, Math.min(graphCanvas.width - 30, mouseX));
        draggedNode.y = Math.max(30, Math.min(graphCanvas.height - 30, mouseY));
        
        // Gambar ulang graph secara instan saat digeser agar terlihat mulus
        renderCurrentState();
    });
    
    // Aksi Lepas Klik Mouse: Selesai menggeser lokasi, kirim posisi koordinat X,Y baru ke database backend
    const endDrag = async () => {
        if (isDragging && draggedNode) {
            isDragging = false;
            
            // Simpan koordinat baru ke server agar posisi tidak ter-reset
            try {
                await fetch('/api/vertex', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: draggedNode.name,
                        x: Math.round(draggedNode.x),
                        y: Math.round(draggedNode.y)
                    })
                });
                populateEditorTables(); // Perbarui tabel koordinat
                showToast(`Posisi lokasi '${draggedNode.name}' berhasil diperbarui.`, "info");
            } catch (err) {
                console.error("Gagal menyimpan posisi node", err);
            }
            draggedNode = null;
        }
    };
    
    graphCanvas.addEventListener('mouseup', endDrag);
    graphCanvas.addEventListener('mouseleave', endDrag); // Jika mouse keluar area canvas, anggap selesai menggeser
    
    // Aksi Double Click Mouse: Menambahkan lokasi (Vertex) baru secara cepat di koordinat klik
    graphCanvas.addEventListener('dblclick', e => {
        if (currentStepIndex !== -1) return; // Kunci jika simulasi jalan
        
        const rect = graphCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Pastikan tidak mendobel klik tepat di atas node lokasi yang sudah ada
        const clickedNode = graphData.find(node => {
            return Math.hypot(node.x - mouseX, node.y - mouseY) <= 22;
        });
        
        if (!clickedNode) {
            const name = prompt("Masukkan nama lokasi baru:");
            if (name && name.trim()) {
                // Set nilai input di form kiri secara otomatis
                document.getElementById('vertex-name').value = name.trim();
                document.getElementById('vertex-x').value = Math.round(mouseX);
                document.getElementById('vertex-y').value = Math.round(mouseY);
                
                // Picu fungsi penambahan lokasi secara otomatis
                handleFormAddVertex({ preventDefault: () => {} });
            }
        }
    });
}
