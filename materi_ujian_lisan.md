# Panduan Belajar & Materi Ujian Lisan Struktur Data
**Aplikasi Navigasi Rute Tercepat Kurir (Dijkstra + Min-Heap berbasis Tree Pointer)**

Dokumen ini disusun untuk membantu Anda menghadapi **Ujian Lisan (17 - 18 Juni)** di hadapan dosen pengampu. Harap baca, pahami, dan hafalkan poin-poin penjelasan berikut agar Anda mendapat nilai maksimal (80 - 100).

---

## 💡 Konsep Utama Struktur Data (Murni Tanpa Array/Library)

Dosen sangat menekankan **larangan penggunaan Array, Single Linked List bawaan, atau library bawaan**. Berikut penjelasan bagaimana kode Anda mematuhinya:

### 1. Jaringan Peta (Graph Adjacency List Pointer)
Graph pada proyek ini tidak disimpan dalam matriks 2D (array), melainkan menggunakan **kaitan objek dinamis (pointer)**:
- **`Vertex` (Simpul/Lokasi)**:
  - Mewakili lokasi fisik (seperti Gudang atau Drop Point).
  - Memiliki pointer `next_vertex` untuk menyambung ke lokasi berikutnya di memori.
  - Memiliki pointer `edge_head` yang menunjuk ke jalan keluar pertama dari lokasi ini.
- **`Edge` (Sisi/Rute Jalan)**:
  - Mewakili jalan penghubung dengan bobot jarak (KM).
  - Memiliki pointer `dest_vertex` yang menunjuk langsung ke objek `Vertex` tujuan di RAM.
  - Memiliki pointer `next_edge` untuk menyambung ke jalan keluar berikutnya yang bersumber dari lokasi asal yang sama.

### 2. Antrean Prioritas (Min-Heap Tree Pointer)
Umumnya, heap diimplementasikan menggunakan Array Flat (di mana anak kiri indeks `2i+1`). Namun, karena larangan array, Anda mengimplementasikannya sebagai **Pohon Biner Dinamis (Binary Tree)** dengan 3 pointer pada setiap nodenya (`MinHeapNode`):
- `left`: Menunjuk ke anak kiri.
- `right`: Menunjuk ke anak kanan.
- `parent`: Menunjuk kembali ke induk node (penting untuk merambat ke atas saat `Up-Heapify`).

#### Teknik Khusus: Navigasi Jalur Biner (Binary Path Navigation)
*Bagaimana cara mencari posisi node terakhir di tree heap jika tidak memakai array indeks?*
- Kita mengonversi nomor indeks node ke representasi biner.
- **Contoh**: Kita ingin menempelkan node baru pada posisi ke-5 (dalam biner: `101`).
- Kita abaikan bit MSB pertama (`1`, posisi root), menyisakan bit `01`.
- Kita baca bit dari kiri ke kanan:
  - `0` = Bergerak ke arah anak **Kiri** (`left`).
  - `1` = Bergerak ke arah anak **Kanan** (`right`).
- Dengan menelusuri pointer `root -> left -> right`, kita langsung menemukan node parent yang tepat untuk menempelkan node baru dalam waktu $O(\log N)$!

---

## 🧑‍🏫 Kisi-Kisi Pertanyaan Dosen & Cara Menjawabnya

Berikut adalah prediksi pertanyaan yang sering diajukan dosen beserta jawaban singkat, tepat, dan ilmiah berdasarkan kode Anda:

### Q1: "Mengapa Anda menggunakan Adjacency List berbasis Pointer, bukan Adjacency Matrix?"
* **Jawaban:** 
  > *"Adjacency List berbasis pointer jauh lebih hemat memori untuk peta kota nyata yang renggang (sparse graph), karena memori hanya dialokasikan untuk rute jalan yang benar-benar ada ($O(V + E)$). Sebaliknya, Adjacency Matrix selalu memakan ruang $O(V^2)$ bahkan jika tidak ada jalan yang menghubungkan kota-kota tersebut, yang membuang-buang memori di RAM."*

### Q2: "Mengapa Algoritma Dijkstra membutuhkan struktur data Min-Heap?"
* **Jawaban:** 
  > *"Algoritma Dijkstra bekerja secara serakah (greedy) dengan selalu mengeksplorasi lokasi dengan jarak sementara terkecil terlebih dahulu. Jika mencari jarak terkecil menggunakan perulangan biasa (linear search), kompleksitasnya adalah $O(V)$, sehingga total waktu berjalan Dijkstra menjadi lambat ($O(V^2)$). Dengan Min-Heap, lokasi dengan jarak terkecil selalu berada di root, sehingga kita bisa mengambilnya dalam waktu $O(1)$ (Extract-Min) dan menata ulang heap (Down-Heapify) dalam waktu $O(\log V)$. Ini memangkas waktu eksekusi total menjadi jauh lebih cepat, yaitu $O((V+E) \log V)$."*

### Q3: "Bagaimana cara kerja operasi Up-Heapify dan Down-Heapify pada Heap berbasis Tree Pointer Anda?"
* **Jawaban:** 
  > * **Up-Heapify (saat insert):** *"Node baru ditempelkan di bagian bawah pohon biner. Kita bandingkan jaraknya dengan induknya menggunakan pointer `parent`. Jika jarak node baru lebih kecil, kita **tukar isi datanya** (pointer Vertex dan nilai Jarak), lalu naik ke parent di atasnya. Proses ini berulang hingga data node baru berada di posisi yang benar."*
  > * **Down-Heapify (saat extract-min):** *"Setelah data root diambil, data root digantikan dengan data node terakhir di pohon biner. Kemudian, kita bandingkan data root baru tersebut dengan kedua anaknya (via pointer `left` dan `right`). Jika ada anak yang memiliki jarak lebih kecil, kita tukar datanya dengan anak terkecil tersebut, dan proses ini dilanjutkan ke bawah pohon secara iteratif hingga properti min-heap terpenuhi."*
  > * **Poin Penting:** *"Yang kita tukar di memori hanyalah **muatan datanya** (nilai jarak dan objek Vertex), sedangkan struktur pointer fisik (`left`, `right`, `parent`) dari pohon biner tetap diam tidak berubah. Ini membuat operasi penukaran sangat cepat dan aman."*

### Q4: "Bagaimana cara Anda menghapus node terakhir dari heap saat Extract-Min dilakukan?"
* **Jawaban:**
  > *"Kami mencari lokasi node terakhir (indeks ke-N) menggunakan **Navigasi Jalur Biner**. Setelah menukar datanya dengan root, kami memutuskan hubungan node terakhir tersebut dari induknya dengan mengatur pointer `parent.left = None` atau `parent.right = None` (tergantung posisi node tersebut di kiri atau kanan parent), lalu menghapus pointer `last_node.parent = None` agar Garbage Collector Python membersihkannya dari RAM."*

### Q5: "Di dalam kode Python Anda, apakah ada library bawaan yang di-import untuk struktur data Graph atau Min-Heap?"
* **Jawaban:**
  > *"Sama sekali tidak ada, Pak/Bu. Jika Bapak/Ibu memeriksa berkas `dijkstra.py`, tidak ada import library seperti `heapq`, `queue`, atau struktur array eksternal. Semua kelas `Vertex`, `Edge`, `MinHeapNode`, dan `MinHeap` dibuat murni dari awal menggunakan konsep pointer objek dinamis."*
