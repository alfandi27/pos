const COLORS = {
    primary: getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim(),
    secondary: getComputedStyle(document.documentElement).getPropertyValue('--color-secondary').trim(),
    light: getComputedStyle(document.documentElement).getPropertyValue('--color-light').trim(),
    danger: getComputedStyle(document.documentElement).getPropertyValue('--color-danger').trim()
};
    class POSApp {
        constructor() {
            this.activeTab = null;
            this.daftarTransaksi = [];
            this.codeReader = new ZXing.BrowserMultiFormatReader();
            this.isScanning = false;
            this.selectedTransaksi = null;
            this.activeFilter = 'hari';
            this.activeRiwayatFilter = 'semua'; 
            this.els = {
                tabs: document.querySelectorAll('.nav-tab'),
                tabContents: document.querySelectorAll('.tab-content'),
                scanner: document.getElementById('scanner'),
                scannerBtn: document.getElementById('btn-mulai-scan'),
                konfirmasiBtn: document.getElementById('btn-konfirmasi'),
                metodePembayaran: document.getElementById('metode-pembayaran'),
                totalPembayaran: document.getElementById('total-pembayaran'),
                searchProduk: document.getElementById('search-produk'),
                searchTransaksi: document.getElementById('search-produk-transaksi'),
                searchResults: document.getElementById('search-results'),
                productModal: document.getElementById('product-modal'),
                scannerStatus: document.getElementById('scanner-status'),
                produkScanMobile: document.getElementById('produk-scan-mobile'),
                detailTransaksiModal: document.getElementById('detail-transaksi-modal'),
                daftarTransaksiEl: document.getElementById('daftar-transaksi'),
                filterTanggalMulai: document.getElementById('filter-tanggal-mulai'),
                filterTanggalAkhir: document.getElementById('filter-tanggal-akhir'),
                dashboardFilterTanggalMulai: document.getElementById('dashboard-tanggal-mulai'),
        dashboardFilterTanggalAkhir: document.getElementById('dashboard-tanggal-akhir'),
        dashboardFilterButtons: {
            hari: document.getElementById('filter-hari'),
            minggu: document.getElementById('filter-minggu'),
            bulan: document.getElementById('filter-bulan'),
            semua: document.getElementById('filter-semua')
        },
        riwayatFilterButtons: {
            hari: document.getElementById('riwayat-filter-hari'),
            semua: document.getElementById('riwayat-filter-semua')
        }
    };
           
            if (window.exportFunctions) {
        this.exportFunctions = window.exportFunctions;
    } else {
        console.error('Export functions belum dimuat!');
    }

            this.init();
            this.initDateFilter();
            this.initDashboardDateFilter();
        }
        
        init() {
            this.setupEventListeners();
            this.showTab('dashboard');
            this.updateDashboard();
            this.tampilkanProduk();
            this.tampilkanRiwayatTransaksi();
            // Terapkan filter default
    this.filterDashboard('hari');
        }
      
        initDateFilter() {
    // Set tanggal awal ke awal bulan ini
    const tanggalAwal = new Date();
    tanggalAwal.setDate(1);
    this.els.filterTanggalMulai.valueAsDate = tanggalAwal;
    
    // Set tanggal akhir ke hari ini
    const tanggalAkhir = new Date();
    this.els.filterTanggalAkhir.valueAsDate = tanggalAkhir;
}

initDashboardDateFilter() {
    if (this.els.dashboardFilterTanggalMulai && this.els.dashboardFilterTanggalAkhir) {
        // Set tanggal mulai ke awal bulan
        const tanggalAwal = new Date();
        tanggalAwal.setDate(1);
        this.els.dashboardFilterTanggalMulai.valueAsDate = tanggalAwal;
        
        // Set tanggal akhir ke hari ini
        const tanggalAkhir = new Date();
        this.els.dashboardFilterTanggalAkhir.valueAsDate = tanggalAkhir;
    }
}

        setupEventListeners() {
            this.els.searchProduk.addEventListener('input', (e) => {
                const keyword = e.target.value.toLowerCase().trim();
                this.searchProducts(keyword);
            });
          
            this.els.searchTransaksi.addEventListener('input', (e) => {
                clearTimeout(this._searchTimeout);
                
                this._searchTimeout = setTimeout(() => {
                    const keyword = e.target.value.toLowerCase().trim();
                    
                    if (keyword.length < 2) {
                        this.els.searchResults.classList.add('hidden');
                        return;
                    }
                    
                    this.showProductSearchResults(keyword);
                }, 300);
            });
         
            this.els.konfirmasiBtn.addEventListener('click', () => {
                if (this.daftarTransaksi.length === 0) return;
                
                this.confirmPayment();
            });
           
            document.addEventListener('click', (e) => {
                if (!this.els.searchTransaksi.contains(e.target) && 
                    !this.els.searchResults.contains(e.target)) {
                    this.els.searchResults.classList.add('hidden');
                }
            });
           
            document.querySelectorAll('input[name="payment"]').forEach(radio => {
                radio.addEventListener('change', (e) => {
                    document.querySelectorAll('.payment-label').forEach(label => {
                        label.classList.remove('selected');
                    });
                    
                    const selectedLabel = document.querySelector(`label[for="${e.target.id}"]`);
                    if (selectedLabel) {
                        selectedLabel.classList.add('selected');
                    }
                });
            });
          
            const checkedRadio = document.querySelector('input[name="payment"]:checked');
            if (checkedRadio) {
                const event = new Event('change');
                checkedRadio.dispatchEvent(event);
            }
        }
       
        setupSearchKeyboardNavigation() {
            let selectedIndex = -1;
            
            this.els.searchTransaksi.addEventListener('keydown', (e) => {
                const results = this.els.searchResults.querySelectorAll('.search-result-item');
                if (results.length === 0) return;
                
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
                    this.updateSearchSelection(results, selectedIndex);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    selectedIndex = Math.max(selectedIndex - 1, 0);
                    this.updateSearchSelection(results, selectedIndex);
                } else if (e.key === 'Enter' && selectedIndex >= 0) {
                    e.preventDefault();
                    results[selectedIndex].click();
                    selectedIndex = -1;
                } else if (e.key === 'Escape') {
                    this.els.searchResults.classList.add('hidden');
                    selectedIndex = -1;
                }
            });
        }
       
        updateSearchSelection(results, selectedIndex) {
            Array.from(results).forEach((result, index) => {
                if (index === selectedIndex) {
                    result.classList.add('bg-light');
                } else {
                    result.classList.remove('bg-light');
                }
            });
        }
      
        showTab(tabId) {
            this.activeTab = tabId;
            this.els.tabs.forEach(tab => {
                const id = tab.id.replace('tab-', '');
                if (id === tabId) {
                    tab.classList.add('active');
                } else {
                    tab.classList.remove('active');
                }
            });

            this.els.tabContents.forEach(content => {
                if (content.id === tabId) {
                    content.classList.remove('hidden');
                    content.classList.add('fade-in');
                } else {
                    content.classList.add('hidden');
                    content.classList.remove('fade-in');
                }
            });

            // Refresh data jika tab riwayat ditampilkan
    if (tabId === 'riwayat') {
        this.tampilkanRiwayatTransaksi();
    }
        }
   
        showAddProductModal() {
            const modal = this.els.productModal;
            document.getElementById('modal-title').textContent = 'Tambah Produk Baru';
            document.getElementById('barcode-produk').value = '';
            document.getElementById('nama-produk').value = '';
            document.getElementById('harga-produk').value = '';
            document.getElementById('stok-produk').value = '';
            
            delete modal.dataset.editBarcode;
            modal.classList.remove('hidden');
        }
        
        closeProductModal() {
            this.els.productModal.classList.add('hidden');
        }
   
        // Simpan produk (tambah/edit)
        saveProduct() {
    const barcode = document.getElementById('barcode-produk').value.trim();
    const nama = document.getElementById('nama-produk').value.trim();
    const harga = document.getElementById('harga-produk').value.replace(/\D/g, '');
    const hargaModal = document.getElementById('modal-produk').value.replace(/\D/g, '');
    const stok = document.getElementById('stok-produk').value;
    
    // Validasi form
    if (!barcode || !nama || !harga || !hargaModal || !stok) {
        Swal.fire({
            title: 'Peringatan',
            text: 'Semua kolom harus diisi!',
            icon: 'warning',
            confirmButtonColor: '#7c3aed'
        });
        return;
    }
    
    // Get daftar produk
    let produkList = JSON.parse(localStorage.getItem('produk')) || [];
    const productModal = this.els.productModal;
    const editBarcode = productModal.dataset.editBarcode;
    
    // Hitung keuntungan per produk
    const keuntungan = parseInt(harga) - parseInt(hargaModal);
    
    if (editBarcode) {
        // Mode edit
        const index = produkList.findIndex(p => p.barcode === editBarcode);
        
        if (index !== -1) {
            const produkLama = produkList[index]; // Simpan data produk lama
            const namaLama = produkLama.nama; // Simpan nama lama untuk referensi di total_penjualan
            
            produkList[index] = {
                barcode,
                nama,
                harga: `Rp ${new Intl.NumberFormat('id-ID').format(harga)}`,
                hargaNominal: parseInt(harga),
                modal: `Rp ${new Intl.NumberFormat('id-ID').format(hargaModal)}`,
                modalNominal: parseInt(hargaModal),
                keuntungan,
                stok,
                createdAt: produkList[index].createdAt
            };
            
            // Jika produk sudah ada di data penjualan, perbarui juga data keuntungan
            this.updateProfitForProduct(namaLama, nama, parseInt(harga), parseInt(hargaModal));
        }
    } else {
        // Mode tambah
        if (produkList.some(p => p.barcode === barcode)) {
            Swal.fire({
                title: 'Error',
                text: 'Produk dengan barcode ini sudah ada!',
                icon: 'error',
                confirmButtonColor: '#7c3aed'
            });
            return;
        }
        
        produkList.push({
            barcode,
            nama,
            harga: `Rp ${new Intl.NumberFormat('id-ID').format(harga)}`,
            hargaNominal: parseInt(harga),
            modal: `Rp ${new Intl.NumberFormat('id-ID').format(hargaModal)}`,
            modalNominal: parseInt(hargaModal),
            keuntungan,
            stok,
            createdAt: new Date().toISOString()
        });
    }
    
    // Simpan ke localStorage
    localStorage.setItem('produk', JSON.stringify(produkList));
    
    // Update tampilan
    this.tampilkanProduk();
    this.updateDashboard();
    this.closeProductModal();
    
    // Tampilkan pesan sukses
    Swal.fire({
        title: 'Berhasil',
        text: editBarcode ? 'Produk berhasil diperbarui!' : 'Produk berhasil ditambahkan!',
        icon: 'success',
        confirmButtonColor: '#7c3aed'
    });
}

        // Edit produk
editProduk(barcode) {
    const produkList = JSON.parse(localStorage.getItem('produk')) || [];
    const produk = produkList.find(p => p.barcode === barcode);
    
    if (!produk) return;
    
    // Isi form
    document.getElementById('modal-title').textContent = 'Edit Produk';
    document.getElementById('barcode-produk').value = produk.barcode;
    document.getElementById('nama-produk').value = produk.nama;
    document.getElementById('harga-produk').value = produk.harga;
    document.getElementById('modal-produk').value = produk.modal || '';
    document.getElementById('stok-produk').value = produk.stok;
    
    // Set data edit
    const productModal = this.els.productModal; // Ubah nama variabel dari modal ke productModal
    productModal.dataset.editBarcode = barcode;
    
    // Tampilkan modal
    productModal.classList.remove('hidden');
}

        hapusProduk(barcode) {
            Swal.fire({
                title: 'Konfirmasi Hapus',
                text: 'Anda yakin ingin menghapus produk ini?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#6b7280',
                confirmButtonText: 'Ya, Hapus!',
                cancelButtonText: 'Batal'
            }).then((result) => {
                if (result.isConfirmed) {
                    let produkList = JSON.parse(localStorage.getItem('produk')) || [];
                    let totalPenjualan = JSON.parse(localStorage.getItem('total_penjualan')) || { 
                        total: 0, 
                        produkTerjual: {} 
                    };
                    const produkIndex = produkList.findIndex(p => p.barcode === barcode);
                    if (produkIndex === -1) {
                        Swal.fire({
                            title: 'Error',
                            text: 'Produk tidak ditemukan',
                            icon: 'error',
                            confirmButtonColor: '#7c3aed'
                        });
                        return;
                    }
                    const produkDihapus = produkList[produkIndex].nama;
                    produkList.splice(produkIndex, 1);
                    localStorage.setItem('produk', JSON.stringify(produkList));
                    
                    // Hapus data penjualan
                    if (totalPenjualan.produkTerjual[produkDihapus]) {
                        delete totalPenjualan.produkTerjual[produkDihapus];
                        localStorage.setItem('total_penjualan', JSON.stringify(totalPenjualan));
                    }
                
                    this.tampilkanProduk();
                    this.updateDashboard();
                    if (this.daftarTransaksi.some(item => item.barcode === barcode)) {
                        this.daftarTransaksi = this.daftarTransaksi.filter(item => item.barcode !== barcode);
                        this.updateTabelTransaksi();
                    }
                    
                    Swal.fire({
                        title: 'Berhasil!',
                        text: 'Produk telah dihapus',
                        icon: 'success',
                        confirmButtonColor: '#7c3aed'
                    });
                }
            });
        }
    
        searchProducts(keyword) {
            const produkList = JSON.parse(localStorage.getItem('produk')) || [];
            
            if (!keyword) {
                this.renderProductList(produkList);
                return;
            }
            
            const filteredProducts = produkList.filter(p => 
                p.nama.toLowerCase().includes(keyword) ||
                p.barcode.includes(keyword)
            );
            
            this.renderProductList(filteredProducts);
        }
      
        tampilkanProduk() {
            const produkList = JSON.parse(localStorage.getItem('produk')) || [];
            const sortedProducts = produkList.sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
            );
            
            this.renderProductList(sortedProducts);
        }
        
        renderProductList(products) {
            const produkListElement = document.getElementById('produk-list');
            let listHTML = '';
            
            if (products.length === 0) {
                listHTML = `
                    <div class="text-center py-8 text-secondary">
                        Belum ada produk yang sesuai dengan pencarian.
                    </div>
                `;
            } else {
                products.forEach((p) => {
                    listHTML += `
                        <div class="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all">
                            <div class="flex items-center gap-3 mb-3">
                                <div class="bg-light text-primary p-3 rounded-lg">
                                    <i class="fas fa-box"></i>
                                </div>
                                <div class="flex-1">
                                    <h3 class="font-medium text-lg">${p.nama}</h3>
                                    <p class="text-sm text-secondary">Barcode: ${p.barcode}</p>
                                </div>
                            </div>
                            <div class="flex items-center justify-between mt-4 pt-4 border-t">
                                <div>
                                    <p class="font-medium text-lg">${p.harga}</p>
                                    <p class="text-sm text-secondary">Stok: ${p.stok}</p>
                                </div>
                                <div class="flex gap-2">
                                    <button onclick="posApp.editProduk('${p.barcode}')" 
                                        class="p-2 text-secondary hover:bg-light hover:text-primary rounded-full transition-all">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button onclick="posApp.hapusProduk('${p.barcode}')" 
                                        class="p-2 text-danger hover:bg-red-100 rounded-full transition-all">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                });
            }
            
            produkListElement.innerHTML = listHTML;
        }
        
        showProductSearchResults(keyword) {
            const produkList = JSON.parse(localStorage.getItem('produk')) || [];
            const searchResults = this.els.searchResults;
            
            const filteredProducts = produkList.filter(p => 
                p.nama.toLowerCase().includes(keyword) ||
                p.barcode.includes(keyword)
            );
           
            searchResults.innerHTML = '';
            
            if (filteredProducts.length === 0) {
                searchResults.innerHTML = `
                    <div class="px-4 py-3 text-sm text-secondary">
                        Tidak ada produk yang ditemukan
                    </div>
                `;
            } else {
                filteredProducts.forEach(product => {
                    const div = document.createElement('div');
                    div.className = 'px-4 py-3 hover:bg-light cursor-pointer border-b last:border-b-0 search-result-item';
                    div.innerHTML = `
                        <div class="flex justify-between items-start">
                            <div>
                                <div class="font-medium">${product.nama}</div>
                                <div class="text-sm text-secondary">Barcode: ${product.barcode}</div>
                            </div>
                            <div class="text-right">
                                <div class="font-medium">${product.harga}</div>
                                <div class="text-sm text-secondary">Stok: ${product.stok}</div>
                            </div>
                        </div>
                    `;
                    
                    div.addEventListener('click', () => {
                        this.cariProduk(product.barcode);
                        searchResults.classList.add('hidden');
                        this.els.searchTransaksi.value = '';
                    });
                    
                    searchResults.appendChild(div);
                });
            }
            
            searchResults.classList.remove('hidden');
        }
    
        cariProduk(barcode) {
            const produkList = JSON.parse(localStorage.getItem('produk')) || [];
            const produk = produkList.find(p => p.barcode === barcode);
            
            if (produk) {
                const stokTersedia = parseInt(produk.stok);
                
                if (stokTersedia <= 0) {
                    Swal.fire({
                        title: 'Stok Habis',
                        text: 'Stok produk ini telah habis!',
                        icon: 'warning',
                        confirmButtonColor: '#7c3aed'
                    });
                    return;
                }
                const existingIndex = this.daftarTransaksi.findIndex(p => p.barcode === barcode);
                
                if (existingIndex !== -1) {
                    if (this.daftarTransaksi[existingIndex].jumlah < stokTersedia) {
                        this.daftarTransaksi[existingIndex].jumlah++;
                    } else {
                        Swal.fire({
                            title: 'Stok Tidak Cukup',
                            text: 'Jumlah melebihi stok yang tersedia!',
                            icon: 'warning',
                            confirmButtonColor: '#7c3aed'
                        });
                        return;
                    }
                } else {
                    this.daftarTransaksi.push({
                        barcode: produk.barcode,
                        nama: produk.nama,
                        harga: parseInt(produk.harga.replace(/\D/g, '')),
                        jumlah: 1,
                        maxStok: stokTersedia
                    });
                }
                
                this.updateTabelTransaksi();
                const Toast = Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true
                });
                
                Toast.fire({
                    icon: 'success',
                    title: `${produk.nama} ditambahkan`
                });
                
            } else {
                Swal.fire({
                    title: 'Produk Tidak Ditemukan',
                    text: 'Barcode tidak terdaftar dalam sistem.',
                    icon: 'error',
                    confirmButtonColor: '#7c3aed'
                });
            }
        }
      
        updateTabelTransaksi() {
            const mobileContainer = this.els.produkScanMobile;
            mobileContainer.innerHTML = '';
            
            if (this.daftarTransaksi.length === 0) {
                mobileContainer.innerHTML = `
                    <div class="text-center py-8 text-secondary">
                        Belum ada produk yang dipilih
                    </div>
                `;
                this.els.totalPembayaran.textContent = 'Rp 0';
                this.els.konfirmasiBtn.classList.add('hidden');
                this.els.metodePembayaran.classList.add('hidden');
                return;
            }
            
            let totalPembayaran = 0;
            this.daftarTransaksi.forEach((item, index) => {
                const totalHarga = item.harga * item.jumlah;
                totalPembayaran += totalHarga;
           
                const mobileCard = document.createElement('div');
                mobileCard.className = 'bg-white border rounded-lg p-4 space-y-3';
                mobileCard.innerHTML = `
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="font-medium">${item.nama}</h3>
                            <p class="text-sm text-secondary">Barcode: ${item.barcode}</p>
                        </div>
                        <button onclick="posApp.hapusProdukTabel(${index})" 
                                class="text-danger hover:bg-red-100 p-2 rounded-full transition-all">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="flex items-center justify-between pt-2 border-t">
                        <div class="text-sm">
                            <p>Harga: Rp ${new Intl.NumberFormat('id-ID').format(item.harga)}</p>
                            <p class="font-medium">Total: Rp ${new Intl.NumberFormat('id-ID').format(totalHarga)}</p>
                        </div>
                        <div class="flex items-center gap-2">
                            <button onclick="posApp.ubahJumlah(${index}, -1)" 
                                    class="w-8 h-8 rounded-full bg-light hover:bg-gray-200 flex items-center justify-center transition-all">
                                <i class="fas fa-minus text-sm"></i>
                            </button>
                            <span class="w-8 text-center">${item.jumlah}</span>
                            <button onclick="posApp.ubahJumlah(${index}, 1)" 
                                    class="w-8 h-8 rounded-full bg-light hover:bg-gray-200 flex items-center justify-center transition-all"
                                    ${item.jumlah >= item.maxStok ? 'disabled' : ''}>
                                <i class="fas fa-plus text-sm"></i>
                            </button>
                        </div>
                    </div>
                `;
                mobileContainer.appendChild(mobileCard);
            });
           
            this.els.totalPembayaran.textContent = 
                `Rp ${new Intl.NumberFormat('id-ID').format(totalPembayaran)}`;
            this.els.konfirmasiBtn.classList.remove('hidden');
            this.els.metodePembayaran.classList.remove('hidden');
        }
     
        ubahJumlah(index, perubahan) {
            const item = this.daftarTransaksi[index];
            const newJumlah = item.jumlah + perubahan;
            
            if (newJumlah <= 0) {
                this.hapusProdukTabel(index);
                return;
            }
            
            if (newJumlah > item.maxStok) {
                Swal.fire({
                    title: 'Stok Tidak Cukup',
                    text: 'Jumlah melebihi stok yang tersedia!',
                    icon: 'warning',
                    confirmButtonColor: '#7c3aed'
                });
                return;
            }
            
            item.jumlah = newJumlah;
            this.updateTabelTransaksi();
        }
     
        hapusProdukTabel(index) {
            this.daftarTransaksi.splice(index, 1);
            this.updateTabelTransaksi();
        }
        confirmPayment() {
            Swal.fire({
                title: 'Konfirmasi Pembayaran',
                text: `Total: ${this.els.totalPembayaran.textContent}`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: COLORS.primary,
                cancelButtonColor: '#6b7280',
                confirmButtonText: 'Ya, Proses!',
                cancelButtonText: 'Batal'
            }).then((result) => {
                if (result.isConfirmed) {
                    this.prosesTransaksi();
                }
            });
        }
   
        // Proses transaksi
prosesTransaksi() {
    // Ambil data
    alert("prosesTransaksi() dipanggil");
    let produkList = JSON.parse(localStorage.getItem('produk')) || [];
    let totalPenjualan = JSON.parse(localStorage.getItem('total_penjualan')) || { 
        total: 0, 
        totalModal: 0,
        keuntungan: 0,
        produkTerjual: {} 
    };
    
    // Tanggal transaksi
    const tanggalTransaksi = new Date().toISOString();
    const nomorTransaksi = `TRX-${Date.now()}`;
    
    // Data untuk penyimpanan transaksi
    let dataTransaksi = JSON.parse(localStorage.getItem('data_transaksi')) || [];
    
    // Data transaksi baru
    let transaksiData = {
        nomor: nomorTransaksi,
        tanggal: tanggalTransaksi,
        items: [],
        total: 0,
        totalModal: 0,
        keuntungan: 0
    };
    
    // Update stok dan total penjualan
    this.daftarTransaksi.forEach(item => {
        const produkIndex = produkList.findIndex(p => p.barcode === item.barcode);
        
        if (produkIndex !== -1) {
            const produk = produkList[produkIndex];
            
            // Hitung nilai untuk transaksi ini
            const hargaTotal = item.harga * item.jumlah;
            const modalProduk = produk.modalNominal || 0;
            const modalTotal = modalProduk * item.jumlah;
            const keuntunganItem = hargaTotal - modalTotal;
            
            // Update stok
            produkList[produkIndex].stok = (parseInt(produkList[produkIndex].stok) - item.jumlah).toString();
            
            // Update total penjualan
            totalPenjualan.total += hargaTotal;
            totalPenjualan.totalModal = (totalPenjualan.totalModal || 0) + modalTotal;
            totalPenjualan.keuntungan = (totalPenjualan.keuntungan || 0) + keuntunganItem;
            
            // Update produk terjual
            if (totalPenjualan.produkTerjual[item.nama]) {
                totalPenjualan.produkTerjual[item.nama].jumlah += item.jumlah;
                totalPenjualan.produkTerjual[item.nama].keuntungan = 
                    (totalPenjualan.produkTerjual[item.nama].keuntungan || 0) + keuntunganItem;
            } else {
                totalPenjualan.produkTerjual[item.nama] = {
                    jumlah: item.jumlah,
                    keuntungan: keuntunganItem
                };
            }
            
            // Tambahkan ke data transaksi
            transaksiData.items.push({
                barcode: item.barcode,
                nama: item.nama,
                harga: item.harga,
                modal: modalProduk,
                jumlah: item.jumlah,
                subtotal: hargaTotal,
                subtotalModal: modalTotal,
                keuntungan: keuntunganItem
            });
            
            // Update total transaksi
            transaksiData.total += hargaTotal;
            transaksiData.totalModal += modalTotal;
            transaksiData.keuntungan += keuntunganItem;
        }
    });
    
    // Ambil metode pembayaran
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
    transaksiData.metodePembayaran = paymentMethod;
    
    // Simpan transaksi
    dataTransaksi.push(transaksiData);
    localStorage.setItem('data_transaksi', JSON.stringify(dataTransaksi));
    
    // Update transaksi hari ini
    let transaksiHariIni = parseInt(localStorage.getItem('transaksi_hari_ini') || '0') + 1;
    localStorage.setItem('transaksi_hari_ini', transaksiHariIni.toString());
    
    // Simpan perubahan
    localStorage.setItem('produk', JSON.stringify(produkList));
    localStorage.setItem('total_penjualan', JSON.stringify(totalPenjualan));
    
    // Reset transaksi
    this.daftarTransaksi = [];
    this.updateTabelTransaksi();
    this.updateDashboard();
    
    // Tampilkan pesan sukses
    Swal.fire({
        title: 'Transaksi Berhasil!',
        text: `Pembayaran dengan ${paymentMethod === 'tunai' ? 'Tunai' : 'QRIS'} telah diproses`,
        icon: 'success',
        confirmButtonColor: '#7c3aed'
    });
}

exportToExcel() {
    if (this.exportFunctions) {
        this.exportFunctions.showExportOptions();
    } else {
        Swal.fire({
            title: 'Error',
            text: 'Fungsi ekspor tidak tersedia. Pastikan file export-functions.js sudah dimuat.',
            icon: 'error',
            confirmButtonColor: '#7c3aed'
        });
    }
}

updateProfitForProduct(namaLama, namaBaru, hargaBaru, modalBaru) {
    // Ambil data penjualan
    let totalPenjualan = JSON.parse(localStorage.getItem('total_penjualan')) || { 
        total: 0, 
        totalModal: 0,
        keuntungan: 0,
        produkTerjual: {} 
    };
    
    // Ambil data transaksi
    let dataTransaksi = JSON.parse(localStorage.getItem('data_transaksi')) || [];
    
    // Cek apakah produk ada di data penjualan
    if (totalPenjualan.produkTerjual[namaLama]) {
        const produkData = totalPenjualan.produkTerjual[namaLama];
        
        // 1. Hitung ulang total penjualan dan keuntungan
        let selisihHarga = 0;
        let selisihModal = 0;
        let selisihKeuntungan = 0;
        
        // Jika nama produk berubah
        if (namaLama !== namaBaru) {
            // Membuat entri baru dengan nama baru
            totalPenjualan.produkTerjual[namaBaru] = { ...produkData };
            
            // Hapus entri lama
            delete totalPenjualan.produkTerjual[namaLama];
        }
        
        // Perbarui data transaksi yang berkaitan dengan produk ini
        dataTransaksi.forEach(transaksi => {
            transaksi.items.forEach(item => {
                if (item.nama === namaLama) {
                    // Perbarui nama jika berubah
                    if (namaLama !== namaBaru) {
                        item.nama = namaBaru;
                    }
                    
                    // Hitung selisih harga dan modal untuk setiap item
                    const hargaLama = item.harga;
                    const modalLama = item.modal;
                    
                    // Hitung keuntungan baru dan selisih
                    const keuntunganLama = item.keuntungan;
                    const keuntunganBaru = (hargaBaru - modalBaru) * item.jumlah;
                    const selisihItemKeuntungan = keuntunganBaru - keuntunganLama;
                    
                    // Perbarui data item
                    item.harga = hargaBaru;
                    item.modal = modalBaru;
                    item.subtotal = hargaBaru * item.jumlah;
                    item.subtotalModal = modalBaru * item.jumlah;
                    item.keuntungan = keuntunganBaru;
                    
                    // Akumulasi selisih
                    selisihHarga += (hargaBaru - hargaLama) * item.jumlah;
                    selisihModal += (modalBaru - modalLama) * item.jumlah;
                    selisihKeuntungan += selisihItemKeuntungan;
                    
                    // Perbarui total transaksi
                    transaksi.total += (hargaBaru - hargaLama) * item.jumlah;
                    transaksi.totalModal += (modalBaru - modalLama) * item.jumlah;
                    transaksi.keuntungan += selisihItemKeuntungan;
                }
            });
        });
        
        // Perbarui total di data penjualan
        totalPenjualan.total += selisihHarga;
        totalPenjualan.totalModal += selisihModal;
        totalPenjualan.keuntungan += selisihKeuntungan;
        
        // Perbarui keuntungan produk
        const produkRef = namaLama !== namaBaru ? namaBaru : namaLama;
        if (totalPenjualan.produkTerjual[produkRef]) {
            totalPenjualan.produkTerjual[produkRef].keuntungan += selisihKeuntungan;
        }
        
        // Simpan perubahan
        localStorage.setItem('total_penjualan', JSON.stringify(totalPenjualan));
        localStorage.setItem('data_transaksi', JSON.stringify(dataTransaksi));
    }
}

// 3. Ubah fungsi updateDashboard untuk menampilkan transaksi hari ini dengan benar
updateDashboard() {
    const totalPenjualan = JSON.parse(localStorage.getItem('total_penjualan')) || { 
        total: 0, 
        totalModal: 0,
        keuntungan: 0,
        produkTerjual: {} 
    };
    const produkList = JSON.parse(localStorage.getItem('produk')) || [];

    const filter = this.activeFilter || 'hari';
    this.filterDashboard(filter);
    
    // Update total penjualan
    document.getElementById('total-penjualan').textContent = 
        `Rp ${new Intl.NumberFormat('id-ID').format(totalPenjualan.total)}`;
    
    // Update total modal
    document.getElementById('total-modal').textContent = 
        `Rp ${new Intl.NumberFormat('id-ID').format(totalPenjualan.totalModal || 0)}`;
    
    // Update total keuntungan
    document.getElementById('total-keuntungan').textContent = 
        `Rp ${new Intl.NumberFormat('id-ID').format(totalPenjualan.keuntungan || 0)}`;
    
    // Update total produk
    document.getElementById('total-produk').textContent = produkList.length.toString();
    
    // Hitung transaksi hari ini berdasarkan tanggal
    const dataTransaksi = JSON.parse(localStorage.getItem('data_transaksi')) || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set ke awal hari
    
    // Filter transaksi yang terjadi hari ini
    const transaksiHariIni = dataTransaksi.filter(trx => {
        const trxDate = new Date(trx.tanggal);
        trxDate.setHours(0, 0, 0, 0); // Set ke awal hari
        return trxDate.getTime() === today.getTime();
    }).length;
    
    document.getElementById('transaksi-hari-ini').textContent = transaksiHariIni.toString();
    
    // Simpan juga ke localStorage untuk referensi
    localStorage.setItem('transaksi_hari_ini', transaksiHariIni.toString());
    
    // Update produk terlaris - tambahkan info keuntungan
    const produkTerjualList = document.getElementById('produk-terjual-list');
    produkTerjualList.innerHTML = '';
    
    // Sort produk terjual (terbanyak dulu)
    const sortedProduk = Object.entries(totalPenjualan.produkTerjual || {})
        .sort(([, a], [, b]) => b.jumlah - a.jumlah)
        .slice(0, 5); // Ambil 5 produk teratas
    
    if (sortedProduk.length > 0) {
        sortedProduk.forEach(([nama, data]) => {
            const produk = produkList.find(p => p.nama === nama);
            
            if (produk) {
                const div = document.createElement('div');
                div.className = 'flex items-center justify-between p-3 bg-light rounded-lg';
                div.innerHTML = `
                    <div class="flex items-center gap-3">
                        <div class="bg-white text-primary p-2 rounded-lg">
                            <i class="fas fa-box"></i>
                        </div>
                        <div>
                            <h3 class="font-medium">${nama}</h3>
                            <p class="text-sm text-secondary">${produk.harga}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="font-medium">${data.jumlah} terjual</div>
                        <div class="text-sm text-secondary">Keuntungan: Rp ${new Intl.NumberFormat('id-ID').format(data.keuntungan || 0)}</div>
                        <div class="text-sm text-secondary">Sisa: ${produk.stok}</div>
                    </div>
                `;
                produkTerjualList.appendChild(div);
            }
        });
    } else {
        produkTerjualList.innerHTML = `
            <div class="text-center py-8 text-secondary">
                Belum ada data penjualan
            </div>
        `;
    }
}

filterDashboard(periode) {
    // Set filter aktif
    this.activeFilter = periode;
    
    // Update tampilan tombol filter
    this.updateFilterButtonStyles();
    
    // Persiapkan filter tanggal
    let startDate = new Date();
    let endDate = new Date();
    
    // Set jam ke 00:00:00 untuk startDate dan 23:59:59 untuk endDate
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    
    switch (periode) {
        case 'hari': // Hari ini
            // startDate sudah diatur ke hari ini, 00:00:00
            break;
            
        case 'minggu': // Minggu ini
            // Mendapatkan hari pertama dalam minggu (Senin)
            const day = startDate.getDay();
            const diff = startDate.getDate() - day + (day === 0 ? -6 : 1); // Jika Minggu, mundur 6 hari
            startDate = new Date(startDate.setDate(diff));
            startDate.setHours(0, 0, 0, 0);
            break;
            
        case 'bulan': // Bulan ini
            startDate.setDate(1);
            break;
            
        case 'semua': // Semua waktu
            // Set tanggal jauh ke belakang untuk mencakup semua data
            startDate = new Date(2000, 0, 1);
            break;
    }
    
    // Update dashboard dengan filter
    this.updateDashboardWithFilter(startDate, endDate);
}

updateFilterButtonStyles() {
    // Reset semua tombol
    Object.keys(this.els.dashboardFilterButtons).forEach(key => {
        const button = this.els.dashboardFilterButtons[key];
        if (button) {
            button.className = 'px-4 py-2 rounded-lg transition-all';
            
            if (key === this.activeFilter) {
                button.classList.add('bg-primary', 'text-white');
            } else {
                button.classList.add('bg-light', 'text-secondary', 'hover:bg-gray-200');
            }
        }
    });
}

filterDashboardByTanggal() {
    const startDateStr = this.els.dashboardFilterTanggalMulai.value;
    const endDateStr = this.els.dashboardFilterTanggalAkhir.value;
    
    if (!startDateStr || !endDateStr) {
        Swal.fire({
            title: 'Peringatan',
            text: 'Harap isi kedua tanggal untuk memfilter',
            icon: 'warning',
            confirmButtonColor: '#7c3aed'
        });
        return;
    }
    
    // Reset tombol filter
    this.activeFilter = 'custom';
    this.updateFilterButtonStyles();
    
    // Konversi string tanggal ke objek Date
    const startDate = new Date(startDateStr);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(endDateStr);
    endDate.setHours(23, 59, 59, 999);
    
    // Update dashboard dengan filter tanggal
    this.updateDashboardWithFilter(startDate, endDate);
}

// Update dashboard dengan filter tanggal
updateDashboardWithFilter(startDate, endDate) {
    // Ambil data transaksi
    const dataTransaksi = JSON.parse(localStorage.getItem('data_transaksi')) || [];
    
    // Filter transaksi berdasarkan rentang tanggal
    const filteredTransaksi = dataTransaksi.filter(trx => {
        const trxDate = new Date(trx.tanggal);
        return trxDate >= startDate && trxDate <= endDate;
    });
    
    // Hitung total untuk periode yang dipilih
    let totalPenjualan = 0;
    let totalModal = 0;
    let totalKeuntungan = 0;
    let produkTerjual = {};
    
    // Proses setiap transaksi
    filteredTransaksi.forEach(trx => {
        totalPenjualan += trx.total || 0;
        totalModal += trx.totalModal || 0;
        totalKeuntungan += trx.keuntungan || 0;
        
        // Proses item dalam transaksi
        trx.items.forEach(item => {
            if (produkTerjual[item.nama]) {
                produkTerjual[item.nama].jumlah += item.jumlah;
                produkTerjual[item.nama].keuntungan += item.keuntungan;
            } else {
                produkTerjual[item.nama] = {
                    jumlah: item.jumlah,
                    keuntungan: item.keuntungan
                };
            }
        });
    });
    
    // Update tampilan
    document.getElementById('total-penjualan').textContent = 
        `Rp ${new Intl.NumberFormat('id-ID').format(totalPenjualan)}`;
    
    document.getElementById('total-modal').textContent = 
        `Rp ${new Intl.NumberFormat('id-ID').format(totalModal)}`;
    
    document.getElementById('total-keuntungan').textContent = 
        `Rp ${new Intl.NumberFormat('id-ID').format(totalKeuntungan)}`;
    
    document.getElementById('transaksi-hari-ini').textContent = filteredTransaksi.length.toString();
    
    // Update label sesuai filter yang aktif
    const transactionCountLabel = document.querySelector('#transaksi-hari-ini').previousElementSibling;
    if (transactionCountLabel) {
        let periodLabel = "Jumlah Transaksi";
        switch (this.activeFilter) {
            case 'hari': periodLabel = "Transaksi Hari Ini"; break;
            case 'minggu': periodLabel = "Transaksi Minggu Ini"; break;
            case 'bulan': periodLabel = "Transaksi Bulan Ini"; break;
            case 'semua': periodLabel = "Total Transaksi"; break;
            case 'custom': periodLabel = "Jumlah Transaksi (Filter)"; break;
        }
        transactionCountLabel.textContent = periodLabel;
    }
    
    // Update produk terlaris
    this.updateProdukTerlarisList(produkTerjual);
}

updateProdukTerlarisList(produkTerjual) {
    const produkList = JSON.parse(localStorage.getItem('produk')) || [];
    const produkTerjualList = document.getElementById('produk-terjual-list');
    produkTerjualList.innerHTML = '';
    
    // Sort produk terjual (terbanyak dulu)
    const sortedProduk = Object.entries(produkTerjual || {})
        .sort(([, a], [, b]) => b.jumlah - a.jumlah)
        .slice(0, 5); // Ambil 5 produk teratas
    
    if (sortedProduk.length > 0) {
        sortedProduk.forEach(([nama, data]) => {
            const produk = produkList.find(p => p.nama === nama);
            
            if (produk) {
                const div = document.createElement('div');
                div.className = 'flex items-center justify-between p-3 bg-light rounded-lg';
                div.innerHTML = `
                    <div class="flex items-center gap-3">
                        <div class="bg-white text-primary p-2 rounded-lg">
                            <i class="fas fa-box"></i>
                        </div>
                        <div>
                            <h3 class="font-medium">${nama}</h3>
                            <p class="text-sm text-secondary">${produk.harga}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="font-medium">${data.jumlah} terjual</div>
                        <div class="text-sm text-secondary">Keuntungan: Rp ${new Intl.NumberFormat('id-ID').format(data.keuntungan || 0)}</div>
                        <div class="text-sm text-secondary">Sisa: ${produk.stok}</div>
                    </div>
                `;
                produkTerjualList.appendChild(div);
            }
        });
    } else {
        produkTerjualList.innerHTML = `
            <div class="text-center py-8 text-secondary">
                Belum ada data penjualan
            </div>
        `;
    }
}

        tampilkanRiwayatTransaksi(filter = null) {
    const dataTransaksi = JSON.parse(localStorage.getItem('data_transaksi')) || [];
    const daftarTransaksiEl = this.els.daftarTransaksiEl;
    // Update tampilan tombol saat membuka tab
    this.updateRiwayatFilterButtonStyles();
    
    // Filter transaksi jika ada
    let transaksiFiltered = dataTransaksi;
    
    if (filter) {
        if (filter.type === 'today') {
            // Filter transaksi hari ini
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            transaksiFiltered = dataTransaksi.filter(trx => {
                const trxDate = new Date(trx.tanggal);
                trxDate.setHours(0, 0, 0, 0);
                return trxDate.getTime() === today.getTime();
            });
        } else if (filter.type === 'date_range') {
            // Filter berdasarkan rentang tanggal
            const startDate = new Date(filter.startDate);
            startDate.setHours(0, 0, 0, 0);
            
            const endDate = new Date(filter.endDate);
            endDate.setHours(23, 59, 59, 999);
            
            transaksiFiltered = dataTransaksi.filter(trx => {
                const trxDate = new Date(trx.tanggal);
                return trxDate >= startDate && trxDate <= endDate;
            });
        }
    }
    
    // Urutkan dari terbaru
    transaksiFiltered.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    
    // Render daftar transaksi
    if (transaksiFiltered.length === 0) {
        daftarTransaksiEl.innerHTML = `
            <div class="text-center py-8 text-secondary">
                Belum ada data transaksi
            </div>
        `;
        return;
    }
    
    daftarTransaksiEl.innerHTML = '';
    
    transaksiFiltered.forEach(transaksi => {
        const tanggal = new Date(transaksi.tanggal).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const cardDiv = document.createElement('div');
        cardDiv.className = 'bg-white border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer';
        cardDiv.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="font-medium">${transaksi.nomor}</h3>
                    <p class="text-sm text-secondary">${tanggal}</p>
                </div>
                <span class="px-3 py-1 rounded-full text-xs font-medium ${
                    transaksi.metodePembayaran === 'tunai' ? 
                    'bg-blue-100 text-blue-700' : 
                    'bg-green-100 text-green-700'
                }">
                    ${transaksi.metodePembayaran === 'tunai' ? 'Tunai' : 'QRIS'}
                </span>
            </div>
            <div class="mt-3 pt-3 border-t flex justify-between items-center">
                <div>
                    <p class="text-sm text-secondary">${transaksi.items.length} item</p>
                </div>
                <div>
                    <p class="font-bold text-primary">Rp ${new Intl.NumberFormat('id-ID').format(transaksi.total)}</p>
                    <p class="text-xs text-secondary text-right">Keuntungan: Rp ${new Intl.NumberFormat('id-ID').format(transaksi.keuntungan)}</p>
                </div>
            </div>
        `;
        
        // Event listener untuk menampilkan detail
        cardDiv.addEventListener('click', () => {
            this.showDetailTransaksi(transaksi);
        });
        
        daftarTransaksiEl.appendChild(cardDiv);
    });
}

filterTransaksiHariIni() {
    // Set filter aktif
    this.activeRiwayatFilter = 'hari';
    
    // Update tampilan tombol
    this.updateRiwayatFilterButtonStyles();
    this.tampilkanRiwayatTransaksi({ type: 'today' });
}

// 5. Tampilkan semua transaksi
filterTransaksiSemua() {
    // Set filter aktif
    this.activeRiwayatFilter = 'semua';
    
    // Update tampilan tombol
    this.updateRiwayatFilterButtonStyles();
    this.tampilkanRiwayatTransaksi();
}

// 6. Filter berdasarkan rentang tanggal
filterTransaksiByTanggal() {
    const startDate = this.els.filterTanggalMulai.value;
    const endDate = this.els.filterTanggalAkhir.value;
    
    if (!startDate || !endDate) {
        Swal.fire({
            title: 'Peringatan',
            text: 'Harap isi kedua tanggal untuk memfilter',
            icon: 'warning',
            confirmButtonColor: '#7c3aed'
        });
        return;
    }

    // Set filter aktif ke custom
    this.activeRiwayatFilter = 'custom';
    // Update tampilan tombol
    this.updateRiwayatFilterButtonStyles();
    
    this.tampilkanRiwayatTransaksi({
        type: 'date_range',
        startDate,
        endDate
    });
}

updateRiwayatFilterButtonStyles() {
    // Pastikan elemen tombol tersedia
    if (!this.els.riwayatFilterButtons) return;
    
    // Reset semua tombol filter riwayat
    Object.keys(this.els.riwayatFilterButtons).forEach(key => {
        const button = this.els.riwayatFilterButtons[key];
        if (button) {
            // Reset style
            button.className = 'px-3 py-2 rounded-lg hover:opacity-90 transition-all text-sm';
            
            // Set style berdasarkan status aktif
            if (key === this.activeRiwayatFilter) {
                button.classList.add('bg-primary', 'text-white');
            } else {
                button.classList.add('bg-light', 'text-secondary', 'hover:bg-gray-200');
            }
        }
    });
    
    // Kasus khusus untuk filter tanggal kustom
    if (this.activeRiwayatFilter === 'custom') {
        // Reset kedua tombol ke tidak aktif
        if (this.els.riwayatFilterButtons.hari) {
            this.els.riwayatFilterButtons.hari.className = 
                'px-3 py-2 rounded-lg bg-light text-secondary hover:bg-gray-200 transition-all text-sm';
        }
        if (this.els.riwayatFilterButtons.semua) {
            this.els.riwayatFilterButtons.semua.className = 
                'px-3 py-2 rounded-lg bg-light text-secondary hover:bg-gray-200 transition-all text-sm';
        }
    }
}


// 7. Menampilkan detail transaksi
showDetailTransaksi(transaksi) {
    this.selectedTransaksi = transaksi;
    
    // Format tanggal
    const tanggal = new Date(transaksi.tanggal).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Isi data detail
    document.getElementById('detail-nomor-transaksi').textContent = transaksi.nomor;
    document.getElementById('detail-tanggal-transaksi').textContent = tanggal;
    document.getElementById('detail-metode-pembayaran').textContent = 
        transaksi.metodePembayaran === 'tunai' ? 'Tunai' : 'QRIS';
    
    // Isi item transaksi
    const itemContainer = document.getElementById('detail-item-transaksi');
    itemContainer.innerHTML = '';
    
    transaksi.items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'py-2 border-b last:border-b-0';
        itemDiv.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <p class="font-medium">${item.nama}</p>
                    <p class="text-xs text-secondary">Rp ${new Intl.NumberFormat('id-ID').format(item.harga)} x ${item.jumlah}</p>
                </div>
                <p class="font-medium">Rp ${new Intl.NumberFormat('id-ID').format(item.subtotal)}</p>
            </div>
        `;
        itemContainer.appendChild(itemDiv);
    });
    
    // Set total
    document.getElementById('detail-total-transaksi').textContent = 
        `Rp ${new Intl.NumberFormat('id-ID').format(transaksi.total)}`;
    
    // Tampilkan modal
    this.els.detailTransaksiModal.classList.remove('hidden');
}

// 8. Tutup modal detail transaksi
closeDetailTransaksiModal() {
    this.els.detailTransaksiModal.classList.add('hidden');
    this.selectedTransaksi = null;
}

// 9. Hapus transaksi yang dipilih
hapusTransaksi() {
    if (!this.selectedTransaksi) return;
    
    Swal.fire({
        title: 'Konfirmasi Hapus',
        text: 'Anda yakin ingin menghapus transaksi ini?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Ya, Hapus!',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            // Hapus transaksi dari data
            const dataTransaksi = JSON.parse(localStorage.getItem('data_transaksi')) || [];
            const index = dataTransaksi.findIndex(t => t.nomor === this.selectedTransaksi.nomor);
            
            if (index !== -1) {
                // Simpan transaksi yang akan dihapus untuk memperbarui data penjualan
                const transaksiDihapus = dataTransaksi[index];
                
                // Hapus transaksi
                dataTransaksi.splice(index, 1);
                localStorage.setItem('data_transaksi', JSON.stringify(dataTransaksi));
                
                // Perbarui data penjualan
                this.updateDataPenjualanSetelahHapus(transaksiDihapus);
                
                // Tutup modal
                this.closeDetailTransaksiModal();
                
                // Refresh tampilan
                this.tampilkanRiwayatTransaksi();
                this.updateDashboard();
                
                Swal.fire({
                    title: 'Berhasil!',
                    text: 'Transaksi telah dihapus',
                    icon: 'success',
                    confirmButtonColor: '#7c3aed'
                });
            }
        }
    });
}

// 10. Hapus semua riwayat transaksi
hapusSemuaRiwayat() {
    Swal.fire({
        title: 'Konfirmasi Hapus Semua',
        text: 'Semua data transaksi akan dihapus. Tindakan ini tidak dapat dibatalkan!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Ya, Hapus Semua!',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            // Hapus semua data transaksi
            localStorage.removeItem('data_transaksi');
            
            // Reset data penjualan
            localStorage.setItem('total_penjualan', JSON.stringify({
                total: 0,
                totalModal: 0,
                keuntungan: 0,
                produkTerjual: {}
            }));
            
            // Reset transaksi hari ini
            localStorage.setItem('transaksi_hari_ini', '0');
            
            // Refresh tampilan
            this.tampilkanRiwayatTransaksi();
            this.updateDashboard();
            
            Swal.fire({
                title: 'Berhasil!',
                text: 'Semua riwayat transaksi telah dihapus',
                icon: 'success',
                confirmButtonColor: '#7c3aed'
            });
        }
    });
}

// 11. Update data penjualan setelah hapus transaksi
updateDataPenjualanSetelahHapus(transaksi) {
    // Ambil data penjualan saat ini
    let totalPenjualan = JSON.parse(localStorage.getItem('total_penjualan')) || {
        total: 0,
        totalModal: 0,
        keuntungan: 0,
        produkTerjual: {}
    };
    
    // Kurangi total dari transaksi yang dihapus
    totalPenjualan.total -= transaksi.total;
    totalPenjualan.totalModal -= transaksi.totalModal;
    totalPenjualan.keuntungan -= transaksi.keuntungan;
    
    // Perbarui data produk terjual
    transaksi.items.forEach(item => {
        if (totalPenjualan.produkTerjual[item.nama]) {
            totalPenjualan.produkTerjual[item.nama].jumlah -= item.jumlah;
            totalPenjualan.produkTerjual[item.nama].keuntungan -= item.keuntungan;
            
            // Hapus produk dari daftar jika jumlah menjadi 0 atau negatif
            if (totalPenjualan.produkTerjual[item.nama].jumlah <= 0) {
                delete totalPenjualan.produkTerjual[item.nama];
            }
        }
    });
    
    // Pastikan nilai tidak negatif
    totalPenjualan.total = Math.max(0, totalPenjualan.total);
    totalPenjualan.totalModal = Math.max(0, totalPenjualan.totalModal);
    totalPenjualan.keuntungan = Math.max(0, totalPenjualan.keuntungan);
    
    // Simpan perubahan
    localStorage.setItem('total_penjualan', JSON.stringify(totalPenjualan));
}

startScanner() {
    window.startScanner();
}

startTransactionScanner() {
    console.log("Memulai scanner transaksi...");
    if (window.scannerModule) {
        window.scannerModule.startScanner((code) => {
            console.log("Kode barcode terdeteksi:", code);
            this.cariProduk(code);
        });
    } else {
        console.error("Scanner module tidak tersedia");
        Swal.fire({
            title: 'Error',
            text: 'Scanner tidak tersedia. Pastikan browser mendukung kamera.',
            icon: 'error',
            confirmButtonColor: '#7c3aed'
        });
    }
}

closeScanner() {
    window.scannerModule.closeScanner();
}
    }

    function formatRupiah(input) {
        let angka = input.value.replace(/\D/g, '');
        input.value = angka ? `Rp ${new Intl.NumberFormat('id-ID').format(angka)}` : '';
    }

    function showTab(tabId) {
        posApp.showTab(tabId);
    }

    function showAddProductModal() {
        posApp.showAddProductModal();
    }

    function closeProductModal() {
        posApp.closeProductModal();
    }

    function saveProduct() {
        posApp.saveProduct();
    }

    let posApp;
    document.addEventListener('DOMContentLoaded', function() {
        posApp = new POSApp();
    });
    
