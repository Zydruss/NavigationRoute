# -*- coding: utf-8 -*-
"""
Server Backend Flask untuk Aplikasi Navigasi Kurir.
Mengelola komunikasi HTTP REST API antara antarmuka web (frontend) dengan modul struktur data dijkstra.py.
"""

import os
from flask import Flask, render_template, jsonify, request
from dijkstra import Graph, dijkstra_visualized, serialize_graph

# Inisialisasi Flask web application
app = Flask(__name__)

# Membuat variabel global graph untuk menampung data jaringan jalan aktif di memori RAM server
current_graph = Graph()

def init_default_graph():
    """
    Fungsi ini dipanggil di awal untuk menyusun peta rute pengiriman default (Kota Jember).
    Kita membuat 8 Vertex (lokasi) beserta Edge (rute jalan bolak-balik) dengan bobot jarak (KM).
    """
    global current_graph
    current_graph = Graph() # Instansiasi objek Graph baru secara bersih
    
    # Menambahkan simpul lokasi (Vertex) beserta koordinat pixel X dan Y untuk rendering peta canvas
    current_graph.add_vertex("Gudang Utama", 400, 70)
    current_graph.add_vertex("Hub Patrang", 400, 200)
    current_graph.add_vertex("Hub Kaliwates", 200, 250)
    current_graph.add_vertex("Hub Sumbersari", 600, 250)
    current_graph.add_vertex("DP Mangli", 100, 380)
    current_graph.add_vertex("DP Ajung", 250, 480)
    current_graph.add_vertex("DP Arjasa", 400, 380)
    current_graph.add_vertex("DP Pakusari", 700, 380)
    
    # Menambahkan rute jalan penghubung (Edge dua arah / Undirected)
    # Setiap baris berisi: (Lokasi Asal, Lokasi Tujuan, Bobot Jarak KM)
    edges = [
        ("Gudang Utama", "Hub Patrang", 4),
        ("Hub Patrang", "Hub Kaliwates", 5),
        ("Hub Patrang", "Hub Sumbersari", 3),
        ("Hub Patrang", "DP Arjasa", 7),
        ("Hub Kaliwates", "DP Mangli", 3),
        ("Hub Kaliwates", "DP Ajung", 6),
        ("Hub Kaliwates", "DP Arjasa", 5),
        ("Hub Sumbersari", "DP Pakusari", 6),
        ("Hub Sumbersari", "DP Arjasa", 4),
        ("DP Mangli", "DP Ajung", 4),
        ("DP Arjasa", "DP Ajung", 6),
        ("DP Arjasa", "DP Pakusari", 8)
    ]
    
    # Melakukan loop untuk mendaftarkan edge bolak-balik (karena jalan raya bersifat undirected)
    for src, dest, weight in edges:
        current_graph.add_edge(src, dest, weight)
        current_graph.add_edge(dest, src, weight)

# Jalankan inisialisasi peta default Jember saat server mulai dinyalakan
init_default_graph()

@app.route('/')
def index():
    """Rute utama untuk menampilkan halaman web dashboard logistik (index.html)"""
    return render_template('index.html')

@app.route('/api/graph', methods=['GET'])
def get_graph():
    """Endpoint API untuk mengambil seluruh data lokasi dan jalan rute yang aktif saat ini"""
    # Mengembalikan data graph dalam format JSON list yang dapat dibaca JavaScript
    return jsonify(serialize_graph(current_graph))

@app.route('/api/vertex', methods=['POST'])
def add_vertex():
    """
    Endpoint API untuk menambah lokasi (Vertex) baru atau menggeser koordinat lokasi yang sudah ada.
    Menerima kiriman JSON berisi: {name, x, y}
    """
    data = request.json
    if not data or 'name' not in data:
        return jsonify({"success": False, "error": "Nama lokasi tidak boleh kosong"}), 400
    
    name = data['name'].strip()
    if not name:
        return jsonify({"success": False, "error": "Nama lokasi tidak boleh kosong"}), 400
        
    x = int(data.get('x', 200))
    y = int(data.get('y', 200))
    
    # Tambah ke graph. Jika nama lokasi sudah ada, fungsi add_vertex akan memperbarui koordinat X,Y-nya saja.
    current_graph.add_vertex(name, x, y)
    return jsonify({"success": True, "graph": serialize_graph(current_graph)})

@app.route('/api/vertex', methods=['DELETE'])
def remove_vertex():
    """
    Endpoint API untuk menghapus suatu lokasi dari peta logistik.
    Menerima kiriman JSON berisi: {name}
    """
    data = request.json
    if not data or 'name' not in data:
        return jsonify({"success": False, "error": "Nama lokasi tidak boleh kosong"}), 400
        
    name = data['name']
    # Memanggil metode penghapus vertex di graph (memutus edge penunjuk secara otomatis)
    success = current_graph.remove_vertex(name)
    if success:
        return jsonify({"success": True, "graph": serialize_graph(current_graph)})
    else:
        return jsonify({"success": False, "error": f"Lokasi '{name}' tidak ditemukan"}), 404

@app.route('/api/edge', methods=['POST'])
def add_edge():
    """
    Endpoint API untuk menghubungkan rute jalan (Edge dua arah) baru antara dua lokasi.
    Menerima kiriman JSON berisi: {src, dest, weight}
    """
    data = request.json
    if not data or 'src' not in data or 'dest' not in data or 'weight' not in data:
        return jsonify({"success": False, "error": "Data rute tidak lengkap"}), 400
        
    src = data['src']
    dest = data['dest']
    try:
        weight = float(data['weight'])
    except ValueError:
        return jsonify({"success": False, "error": "Jarak harus berupa angka"}), 400
        
    if weight <= 0:
        return jsonify({"success": False, "error": "Jarak harus lebih besar dari 0"}), 400
        
    if src == dest:
        return jsonify({"success": False, "error": "Lokasi asal dan tujuan tidak boleh sama"}), 400
        
    # Daftarkan rute dua arah (src -> dest dan dest -> src) menggunakan pointer
    success1 = current_graph.add_edge(src, dest, weight)
    success2 = current_graph.add_edge(dest, src, weight)
    
    if success1 and success2:
        return jsonify({"success": True, "graph": serialize_graph(current_graph)})
    else:
        return jsonify({"success": False, "error": "Gagal menambahkan rute. Pastikan kedua lokasi terdaftar."}), 400

@app.route('/api/edge', methods=['DELETE'])
def remove_edge():
    """
    Endpoint API untuk menghapus rute jalan penghubung antara dua lokasi.
    Menerima kiriman JSON berisi: {src, dest}
    """
    data = request.json
    if not data or 'src' not in data or 'dest' not in data:
        return jsonify({"success": False, "error": "Data rute tidak lengkap"}), 400
        
    src = data['src']
    dest = data['dest']
    
    # Hapus rute bolak-balik (src -> dest dan dest -> src)
    success1 = current_graph.remove_edge(src, dest)
    success2 = current_graph.remove_edge(dest, src)
    
    if success1 or success2:
        return jsonify({"success": True, "graph": serialize_graph(current_graph)})
    else:
        return jsonify({"success": False, "error": "Rute tidak ditemukan"}), 404

@app.route('/api/solve', methods=['POST'])
def solve():
    """
    Endpoint utama untuk menjalankan simulasi visual rute kurir logistik.
    Menghitung rute tercepat dan mengembalikan rekaman setiap langkah algoritma.
    Menerima kiriman JSON berisi: {start, dest}
    """
    data = request.json
    if not data or 'start' not in data or 'dest' not in data:
        return jsonify({"success": False, "error": "Lokasi awal dan tujuan tidak boleh kosong"}), 400
        
    start = data['start']
    dest = data['dest']
    
    # Panggil fungsi solver Dijkstra yang mengembalikan seluruh snapshot visualisasi
    result = dijkstra_visualized(current_graph, start, dest)
    return jsonify(result)

@app.route('/api/reset', methods=['POST'])
def reset_graph():
    """Endpoint API untuk memaksa pembersihan map dan menggantinya dengan peta Jember bawaan"""
    init_default_graph()
    return jsonify({"success": True, "graph": serialize_graph(current_graph)})

# Blok eksekusi utama saat menjalankan file app.py
if __name__ == '__main__':
    # Buat direktori template dan static jika belum tersedia
    os.makedirs(os.path.join(os.path.dirname(__file__), 'templates'), exist_ok=True)
    os.makedirs(os.path.join(os.path.dirname(__file__), 'static', 'css'), exist_ok=True)
    os.makedirs(os.path.join(os.path.dirname(__file__), 'static', 'js'), exist_ok=True)
    
    # Jalankan server lokal pada IP localhost port 5000 dengan status debug aktif
    app.run(debug=True, host='127.0.0.1', port=5000)
