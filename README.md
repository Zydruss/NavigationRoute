# Navigasi Rute Tercepat Kurir Paket (Optimasi Navigasi Kurir Menggunakan Algoritma Dijkstra dan Min-Heap)

Proyek ini adalah implementasi sistem informasi logistik berbasis web yang dikembangkan oleh **Kelompok 8 Kelas C, Informatika, Universitas Jember (2025/2026)**. Aplikasi ini dirancang untuk mensimulasikan pencarian rute pengiriman terpendek bagi kurir menggunakan **Algoritma Dijkstra** dan **Min-Heap berbasis Tree Pointer**.

## Anggota Kelompok
1. **Felix Jericho Moniaga**
2. **Robby Ibrahimovic Wibowo**
3. **Dinar Atha Dwi Novelian**
4. **Galih Andra Dwinata**
5. **Asep Fauzi**

---

## 🚀 Cara Menjalankan Aplikasi

Aplikasi ini menggunakan **Python 3** dengan framework **Flask** di backend, dan **HTML5 Canvas, CSS Vanilla, & Javascript** di frontend.

### 1. Instalasi Dependensi
Pastikan Python sudah terinstal di sistem Anda. Instal Flask menggunakan pip:
```bash
pip install flask
```

### 2. Menjalankan Server Flask
Jalankan file `app.py` di terminal/command prompt:
```bash
python app.py
```

### 3. Membuka Aplikasi di Browser
Buka browser Anda dan akses alamat berikut:
```
http://127.0.0.1:5000
```

---

## 🛠️ Desain Struktur Data (Murni dari Nol)

Aplikasi ini mematuhi **ketentuan ketat proyek** di mana struktur data utama **tidak diperbolehkan menggunakan Array atau Single Linked List** sebagai penyimpan utama, serta **dilarang menggunakan library bawaan**. 

Semua diimplementasikan secara dinamis menggunakan kaitan objek (**pointer**).

### 1. Struktur Data Graph
Graph menggunakan representasi **Adjacency List** dinamis berbasis pointer:
- **Vertex (Node)**: Merepresentasikan lokasi fisik (gudang/drop point). Setiap Vertex memiliki pointer `next_vertex` ke vertex berikutnya di graph (membentuk linked list of vertices), dan pointer `edge_head` ke edge pertama yang keluar dari vertex ini.
- **Edge (Sisi/Rute)**: Merepresentasikan jalur jalan dengan bobot (KM). Setiap Edge memiliki pointer `dest_vertex` ke Vertex tujuan, dan pointer `next_edge` ke edge tetangga berikutnya dari vertex asal yang sama.

```
[Graph]
   │
   ▼
[Vertex: Gudang Utama] ──next_vertex──► [Vertex: Patrang] ──next_vertex──► ...
   │                                       │
   ▼ edge_head                             ▼ edge_head
[Edge: to Patrang, 4KM]                 [Edge: to Kaliwates, 5KM]
   │                                       │
   ▼ next_edge                             ▼ next_edge
[Edge: to Sumbersari, 3KM]              [Edge: to Arjasa, 7KM]
```

### 2. Struktur Data Min-Heap (Binary Tree Pointer)
Sebagian besar Min-Heap menggunakan representasi array linear (`2i+1`). Untuk memenuhi larangan array, Min-Heap di proyek ini dibangun sebagai **Pohon Biner Dinamis** di mana setiap node (`MinHeapNode`) memiliki tiga pointer utama:
- `left`: Pointer ke anak kiri.
- `right`: Pointer ke anak kanan.
- `parent`: Pointer ke induk node (digunakan untuk operasi `Up-Heapify`).

```
         [MinHeapNode: Root]
            /           \
         left           right
         /                 \
[MinHeapNode]           [MinHeapNode]
```

#### Navigasi Jalur Biner (Binary Path Navigation)
Untuk menemukan node terakhir (saat melakukan `insert` atau menghapus root pada `extract_min`) dalam waktu $O(\log N)$, kami mengonversi posisi index node ke representasi biner.
- **Contoh**: Kita ingin mencari posisi penyisipan untuk node ke-6 (biner: `110`).
- Kita abaikan bit MSB pertama (`1`), menyisakan `10`.
- Bit berikutnya `1` berarti belok **Kanan**.
- Bit berikutnya `0` berarti belok **Kiri**.
- Melalui penelusuran pointer `root -> right -> left`, kita langsung menemukan node parent yang tepat untuk menyematkan node baru tersebut tanpa melakukan pencarian linear!


