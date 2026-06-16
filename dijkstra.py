# -*- coding: utf-8 -*-
"""
Modul Dijkstra & Struktur Data Murni
Mengimplementasikan Graph dan Min-Heap menggunakan pointer secara murni dari scratch.
Sama sekali tidak menggunakan library bawaan untuk struktur data (tanpa array atau single linked list bawaan).
Semua kaitan antar data menggunakan pointer objek (next_vertex, edge_head, next_edge, left, right, parent).
"""

# Kelas Vertex merepresentasikan setiap lokasi fisik (seperti Gudang atau Drop Point)
# Ini bertindak sebagai simpul (node) pada struktur data Graph
class Vertex:
    def __init__(self, name, x=0, y=0):
        # Mulai dari baris ini sampai inisialisasi selesai, kita mendefinisikan atribut dasar vertex
        self.name = name          # Nama lokasi unik (Identifier)
        self.x = x                # Koordinat X layar (untuk keperluan visualisasi peta)
        self.y = y                # Koordinat Y layar (untuk keperluan visualisasi peta)
        
        # Pointer utama untuk representasi Graph Adjacency List
        self.next_vertex = None   # Pointer ke objek Vertex berikutnya (menghubungkan semua vertex dalam graph)
        self.edge_head = None     # Pointer ke objek Edge pertama yang keluar dari vertex ini (Adjacency List)
        
        # Atribut pembantu yang digunakan khusus untuk algoritma Dijkstra
        self.dist = float('inf')  # Menyimpan jarak terpendek sementara dari titik start (diinisialisasi tak hingga/INF)
        self.visited = False      # Boolean untuk menandai apakah lokasi ini sudah dikunjungi secara permanen
        self.parent_route = None  # Pointer ke objek Vertex sebelumnya untuk merunut balik (backtracking) jalur terpendek


# Kelas Edge merepresentasikan jalan penghubung antar lokasi
# Ini bertindak sebagai sisi (edge) dengan bobot pada Graph
class Edge:
    def __init__(self, dest_vertex, weight):
        # Di sini kita mendefinisikan isi dari rute jalan penghubung
        self.dest_vertex = dest_vertex  # Pointer langsung ke objek Vertex tujuan (bukan sekadar teks namanya)
        self.weight = weight            # Bobot dari rute ini (jarak dalam KM)
        self.next_edge = None           # Pointer ke objek Edge berikutnya yang terhubung dari Vertex asal yang sama


# Kelas Graph mengelola seluruh kumpulan lokasi dan jalan penghubung
class Graph:
    def __init__(self):
        # Inisialisasi graph kosong dengan vertex pertama bernilai None
        self.vertex_head = None  # Pointer ke Vertex pertama dalam rantai linked list vertex graph
    
    def add_vertex(self, name, x=0, y=0):
        # Fungsi ini bertujuan untuk menambah lokasi baru ke dalam graph
        # Pertama, kita periksa apakah lokasi dengan nama yang sama sudah terdaftar
        existing = self.find_vertex(name)
        if existing:
            # Jika sudah ada, kita cukup update koordinat X dan Y-nya saja
            existing.x = x
            existing.y = y
            return existing
        
        # Jika belum ada, kita buat objek Vertex baru
        new_v = Vertex(name, x, y)
        # Kita masukkan vertex baru ini ke barisan paling depan (prepend) list vertex graph
        new_v.next_vertex = self.vertex_head
        self.vertex_head = new_v
        return new_v
        
    def find_vertex(self, name):
        # Fungsi ini digunakan untuk mencari objek Vertex berdasarkan namanya
        # Kita mulai menyusuri dari vertex pertama (head)
        curr = self.vertex_head
        # Melakukan perulangan selama pointer curr tidak bernilai None
        while curr:
            if curr.name == name:
                return curr  # Jika nama cocok, kembalikan objek Vertex tersebut
            curr = curr.next_vertex  # Pindah ke vertex berikutnya menggunakan pointer next_vertex
        return None  # Jika sampai akhir tidak ditemukan, kembalikan None
        
    def add_edge(self, src_name, dest_name, weight):
        # Fungsi ini menambahkan jalur (edge) satu arah dari lokasi src ke dest
        # Cari objek Vertex asal dan tujuan terlebih dahulu
        src = self.find_vertex(src_name)
        dest = self.find_vertex(dest_name)
        
        # Jika salah satu lokasi asal/tujuan tidak ada di graph, maka rute tidak bisa dibuat
        if not src or not dest:
            return False
            
        # Cek apakah rute ini sudah pernah dibuat sebelumnya untuk menghindari duplikasi
        # Kita susur list edge yang keluar dari vertex asal
        curr_edge = src.edge_head
        while curr_edge:
            if curr_edge.dest_vertex.name == dest_name:
                # Jika sudah ada rute ke tujuan yang sama, kita hanya memperbarui bobot jaraknya
                curr_edge.weight = weight
                return True
            curr_edge = curr_edge.next_edge
            
        # Jika benar-benar rute baru, buat objek Edge baru
        new_edge = Edge(dest, weight)
        # Prepend (masukkan ke paling depan) dari adjacency list milik vertex asal
        new_edge.next_edge = src.edge_head
        src.edge_head = new_edge
        return True

    def remove_edge(self, src_name, dest_name):
        # Fungsi ini untuk menghapus rute jalan dari src ke dest
        src = self.find_vertex(src_name)
        if not src:
            return False
        
        # Lakukan pencarian edge yang ingin dihapus pada adjacency list milik src
        prev = None
        curr = src.edge_head
        while curr:
            if curr.dest_vertex.name == dest_name:
                # Jika ketemu, kita potong jalurnya dengan mengubah pointer next_edge
                if prev:
                    prev.next_edge = curr.next_edge  # Lewati node curr
                else:
                    src.edge_head = curr.next_edge   # Jika curr adalah head, geser head ke sebelahnya
                return True
            prev = curr
            curr = curr.next_edge
        return False

    def remove_vertex(self, name):
        # Fungsi ini untuk menghapus lokasi dari graph beserta seluruh jalur yang terhubung ke lokasi tersebut
        # Langkah 1: Susur seluruh vertex lain untuk menghapus edge yang mengarah ke vertex yang ingin dihapus
        v_curr = self.vertex_head
        while v_curr:
            self.remove_edge(v_curr.name, name)
            v_curr = v_curr.next_vertex
            
        # Langkah 2: Hapus vertex itu sendiri dari linked list vertices pada graph
        prev = None
        curr = self.vertex_head
        while curr:
            if curr.name == name:
                if prev:
                    prev.next_vertex = curr.next_vertex  # Lewati vertex curr
                else:
                    self.vertex_head = curr.next_vertex  # Jika curr adalah head, geser head graph
                return True
            prev = curr
            curr = curr.next_vertex
        return False


# Kelas MinHeapNode merepresentasikan satu wadah node di dalam struktur pohon biner Min-Heap
class MinHeapNode:
    def __init__(self, vertex, dist):
        # Inisialisasi isi node heap biner
        self.vertex = vertex  # Pointer ke objek Vertex graph yang disimpan
        self.dist = dist      # Nilai kunci prioritas (jarak rute dalam algoritma Dijkstra)
        self.left = None      # Pointer ke anak kiri (left child)
        self.right = None     # Pointer ke anak kanan (right child)
        self.parent = None    # Pointer ke induk (parent node), sangat penting untuk Up-Heapify


# Kelas MinHeap mengelola antrean prioritas (Priority Queue) berbasis pohon biner murni menggunakan pointer
class MinHeap:
    def __init__(self):
        # Heap dimulai dalam keadaan kosong
        self.root = None  # Pointer ke node teratas (root) dari heap
        self.size = 0     # Menyimpan jumlah node saat ini di dalam heap
        
    def _find_node(self, k):
        # Fungsi ini krusial untuk menemukan node pada indeks ke-'k' (1-based index) di dalam pohon biner
        # Kita menggunakan Navigasi Jalur Biner (Binary Path Navigation) agar proses pencarian bernilai O(log N)
        if k <= 0 or not self.root:
            return None
        if k == 1:
            return self.root
            
        # Kita konversikan indeks k ke representasi biner. Contoh: k = 5 -> biner '101'
        # Kita buang MSB terdepan '1' (karena itu merepresentasikan root), sisa jalurnya adalah '01'
        # Di mana '0' berarti belok Kiri dan '1' berarti belok Kanan
        binary_path = bin(k)[3:] 
        
        curr = self.root
        # Telusuri bit per bit dari jalur biner tersebut
        for bit in binary_path:
            if not curr:
                return None
            if bit == '0':
                curr = curr.left   # Belok kiri
            else:
                curr = curr.right  # Belok kanan
        return curr
        
    def insert(self, vertex, dist):
        # Fungsi ini memasukkan lokasi baru ke dalam heap prioritas
        new_node = MinHeapNode(vertex, dist)
        self.size += 1
        
        # Kasus khusus: jika heap masih kosong, jadikan node baru ini sebagai root
        if self.size == 1:
            self.root = new_node
            return new_node
            
        # Temukan calon parent untuk meletakkan node baru ini
        # Posisi parent secara level-order berada pada indeks floor(size / 2)
        parent_index = self.size // 2
        parent_node = self._find_node(parent_index)
        
        new_node.parent = parent_node
        
        # Hubungkan node baru ke parent di posisi yang kosong (kiri atau kanan)
        if self.size % 2 == 0:
            parent_node.left = new_node  # Jika indeks genap, tempel di kiri parent
        else:
            parent_node.right = new_node # Jika indeks ganjil, tempel di kanan parent
            
        # Panggil Up-Heapify untuk menaikkan node baru ke atas jika prioritasnya lebih kecil
        self._up_heapify(new_node)
        return new_node
        
    def _up_heapify(self, node):
        # Fungsi ini membandingkan nilai jarak node saat ini dengan induknya (parent)
        # Jika nilai node lebih kecil, tukar isi datanya dan ulangi ke atas
        while node.parent and node.dist < node.parent.dist:
            # Tukar muatan data di dalam objek node (tidak merusak struktur pointer pohon)
            node.vertex, node.parent.vertex = node.parent.vertex, node.vertex
            node.dist, node.parent.dist = node.parent.dist, node.dist
            node = node.parent  # Naik ke parent untuk perbandingan berikutnya
            
    def extract_min(self):
        # Fungsi ini mengambil dan menghapus lokasi dengan jarak terkecil (berada di root heap)
        if self.size == 0 or not self.root:
            return None
            
        # Simpan vertex terkecil yang ada di root untuk dikembalikan nanti
        min_vertex = self.root.vertex
        
        # Jika hanya ada 1 elemen tersisa di heap
        if self.size == 1:
            self.root = None
            self.size = 0
            return min_vertex
            
        # Cari node terakhir di heap tree (node pada indeks ke-size)
        last_node = self._find_node(self.size)
        
        # Tukar data root dengan data node terakhir
        self.root.vertex, last_node.vertex = last_node.vertex, self.root.vertex
        self.root.dist, last_node.dist = last_node.dist, self.root.dist
        
        # Putuskan sambungan node terakhir dari parent-nya agar node terakhir terhapus
        parent_node = last_node.parent
        if parent_node.left == last_node:
            parent_node.left = None
        else:
            parent_node.right = None
            
        last_node.parent = None
        self.size -= 1  # Kurangi ukuran heap
        
        # Panggil Down-Heapify dari root untuk menyeimbangkan kembali heap ke bawah
        self._down_heapify(self.root)
        return min_vertex
        
    def _down_heapify(self, node):
        # Fungsi ini menata ulang heap ke bawah agar properti min-heap terpenuhi di seluruh pohon
        if not node:
            return
            
        while True:
            smallest = node
            
            # Bandingkan dengan anak kiri
            if node.left and node.left.dist < smallest.dist:
                smallest = node.left
                
            # Bandingkan dengan anak kanan
            if node.right and node.right.dist < smallest.dist:
                smallest = node.right
                
            # Jika ada anak yang lebih kecil dari node saat ini, kita lakukan penukaran data
            if smallest != node:
                node.vertex, smallest.vertex = smallest.vertex, node.vertex
                node.dist, smallest.dist = smallest.dist, node.dist
                node = smallest  # Lanjutkan pengecekan ke bawah dari posisi anak tersebut
            else:
                break  # Berhenti jika node saat ini sudah lebih kecil dari kedua anaknya


def serialize_heap(node):
    # Fungsi pembantu untuk mengubah struktur heap tree pointer ke bentuk dictionary JSON rekursif
    # Ini digunakan agar Javascript di browser bisa menggambar struktur pohon heap dengan mudah
    if not node:
        return None
    return {
        "name": node.vertex.name,
        "dist": node.dist if node.dist != float('inf') else "INF",
        "left": serialize_heap(node.left),
        "right": serialize_heap(node.right)
    }

def serialize_graph(graph):
    # Fungsi pembantu untuk menyalin data Graph pointer ke bentuk list data JSON untuk visualisasi peta
    vertices = []
    curr_v = graph.vertex_head
    while curr_v:
        # Cari semua edge keluar dari vertex saat ini
        edges = []
        curr_e = curr_v.edge_head
        while curr_e:
            edges.append({
                "dest": curr_e.dest_vertex.name,
                "weight": curr_e.weight
            })
            curr_e = curr_e.next_edge
            
        vertices.append({
            "name": curr_v.name,
            "x": curr_v.x,
            "y": curr_v.y,
            "edges": edges,
            "dist": curr_v.dist if curr_v.dist != float('inf') else "INF",
            "visited": curr_v.visited,
            "parent_route": curr_v.parent_route.name if curr_v.parent_route else None
        })
        curr_v = curr_v.next_vertex
    return vertices

def dijkstra_visualized(graph, start_name, dest_name):
    # Fungsi utama untuk menjalankan algoritma Dijkstra dan merekam setiap langkah simulasi untuk visualisasi
    
    # Langkah 1: Reset semua parameter pencarian vertex di graph
    curr_v = graph.vertex_head
    while curr_v:
        curr_v.dist = float('inf')
        curr_v.visited = False
        curr_v.parent_route = None
        curr_v = curr_v.next_vertex
        
    start_vertex = graph.find_vertex(start_name)
    dest_vertex = graph.find_vertex(dest_name)
    
    # Validasi awal
    if not start_vertex or not dest_vertex:
        return {
            "success": False,
            "error": "Lokasi awal atau tujuan tidak ditemukan di dalam peta.",
            "steps": []
        }
        
    steps = []
    step_counter = [0]
    
    # Buat heap prioritas kosong
    heap = MinHeap()
    
    # Fungsi internal untuk mengambil gambar (snapshot) kondisi graph & heap saat ini
    def add_step(desc, highlight_v=None, highlight_e=None, path=None):
        steps.append({
            "step_index": step_counter[0],
            "description": desc,
            "heap": serialize_heap(heap.root),
            "graph": serialize_graph(graph),
            "highlight_vertex": highlight_v,
            "highlight_edge": highlight_e,
            "shortest_path": path
        })
        step_counter[0] += 1

    # Langkah 2: Inisialisasi Lokasi Awal (jarak diatur ke 0, lainnya INF)
    start_vertex.dist = 0
    # Masukkan lokasi awal ke heap prioritas
    heap.insert(start_vertex, 0)
    add_step(
        f"Inisialisasi: Jarak '{start_name}' diatur ke 0 dan lokasi lainnya diatur ke tak hingga (INF). Masukkan '{start_name}' ke Min-Heap sebagai root.",
        highlight_v=start_name
    )
    
    found_dest = False
    
    # Langkah 3: Looping Algoritma Dijkstra (selama heap prioritas tidak kosong)
    while heap.size > 0:
        # Lakukan Extract-Min untuk mengambil lokasi dengan jarak sementara terkecil
        u_vertex = heap.extract_min()
        add_step(
            f"Extract-Min: Mengambil lokasi dengan jarak terkecil dari Root Min-Heap, yaitu '{u_vertex.name}' dengan jarak {u_vertex.dist} KM.",
            highlight_v=u_vertex.name
        )
        
        # Pengecekan status visited
        if u_vertex.visited:
            add_step(
                f"Pengecekan: Lokasi '{u_vertex.name}' sudah pernah dikunjungi. Lewati langkah ini untuk menghindari redundansi.",
                highlight_v=u_vertex.name
            )
            continue
            
        # Tandai lokasi saat ini sebagai dikunjungi secara permanen (visited = True)
        u_vertex.visited = True
        add_step(
            f"Kunjungi: Menandai lokasi '{u_vertex.name}' sebagai sudah dikunjungi (visited=True). Lokasi ini sekarang bersifat permanen.",
            highlight_v=u_vertex.name
        )
        
        # Jika lokasi tujuan sudah dicapai
        if u_vertex.name == dest_name:
            found_dest = True
            add_step(
                f"Tujuan Tercapai: Lokasi tujuan '{dest_name}' sudah ditemukan! Hentikan pencarian rute.",
                highlight_v=u_vertex.name
            )
            break
            
        # Langkah 4: Relaksasi jarak untuk semua rute tetangga dari lokasi u_vertex
        curr_e = u_vertex.edge_head
        if not curr_e:
            add_step(
                f"Relaksasi: Lokasi '{u_vertex.name}' tidak memiliki rute jalan (edge) tetangga yang terhubung.",
                highlight_v=u_vertex.name
            )
            
        while curr_e:
            v_vertex = curr_e.dest_vertex
            weight = curr_e.weight
            
            # Hitung jarak alternatif melalui u_vertex
            alt = u_vertex.dist + weight
            desc = f"Memeriksa tetangga '{v_vertex.name}' dari '{u_vertex.name}' (jarak saat ini: {v_vertex.dist if v_vertex.dist != float('inf') else 'INF'}, rute alternatif: {u_vertex.dist} + {weight} = {alt} KM)."
            
            # Jika ditemukan jalur alternatif yang lebih pendek ke v_vertex
            if alt < v_vertex.dist:
                v_vertex.dist = alt
                v_vertex.parent_route = u_vertex  # Set parent rute untuk penelusuran balik nanti
                
                # Masukkan ke Min-Heap prioritas untuk diperiksa nanti
                heap.insert(v_vertex, alt)
                desc_success = desc + f" -> Jarak lebih pendek ditemukan! Perbarui jarak '{v_vertex.name}' ke {alt} KM, atur parent ke '{u_vertex.name}', dan masukkan ke Min-Heap."
                add_step(
                    desc_success, 
                    highlight_v=v_vertex.name, 
                    highlight_edge=[u_vertex.name, v_vertex.name]
                )
            else:
                desc_fail = desc + f" -> Jarak alternatif tidak lebih kecil dari jarak saat ini ({v_vertex.dist} KM). Lewati."
                add_step(
                    desc_fail, 
                    highlight_v=v_vertex.name, 
                    highlight_edge=[u_vertex.name, v_vertex.name]
                )
                
            curr_e = curr_e.next_edge  # Pindah ke edge berikutnya menggunakan pointer next_edge
            
    # Langkah 5: Rekonstruksi rute terpendek dengan menelusuri balik pointer parent_route
    path = []
    if found_dest:
        curr = dest_vertex
        while curr:
            path.insert(0, curr.name)
            curr = curr.parent_route
        total_dist = dest_vertex.dist
        
        add_step(
            f"Rekonstruksi Jalur: Menyusuri parent_route dari '{dest_name}' kembali ke '{start_name}'. Jalur rute terpendek ditemukan: {' -> '.join(path)} dengan total jarak {total_dist} KM.",
            path=path
        )
        return {
            "success": True,
            "steps": steps,
            "path": path,
            "distance": total_dist
        }
    else:
        add_step(
            f"Rekonstruksi Jalur Gagal: Tidak ada jalur jalan yang menghubungkan lokasi awal '{start_name}' ke lokasi tujuan '{dest_name}'.",
            path=[]
        )
        return {
            "success": False,
            "error": f"Tidak ada rute dari '{start_name}' ke '{dest_name}'",
            "steps": steps,
            "path": [],
            "distance": None
        }

