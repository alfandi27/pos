/**
 * FUNGSI EKSPOR DATA KE EXCEL
 * File ini berisi fungsi-fungsi untuk mengekspor data ke Excel menjadi link yang bisa diunduh
 * Versi diperbarui: Mendukung ekspor data berdasarkan filter dashboard
 */
//22042025
class ExportFunctions {
    constructor() {
        // Inisialisasi modal untuk link download
        this.createDownloadModal();
    }
    
    // Generate string tanggal untuk nama file
    generateDateStr() {
        const date = new Date();
        return `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // Generate random number
    generateRandomNumber(length = 8) {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += Math.floor(Math.random() * 10);
        }
        return result;
    }
    
    // Generate random letters
    generateRandomLetters(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    
    // Buat modal untuk menampilkan link download
    createDownloadModal() {
        // Cek jika modal sudah ada
        if (document.getElementById('downloadLinkModal')) return;
        
        // Buat modal
        const modal = document.createElement('div');
        modal.id = 'downloadLinkModal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="w-full max-w-md bg-white shadow-xl rounded-xl">
                <div class="p-6">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-xl font-semibold">Link Download Excel</h3>
                        <button type="button" onclick="document.getElementById('downloadLinkModal').classList.add('hidden')" class="text-secondary hover:text-gray-700">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    
                    <div class="space-y-4">
                        <p class="text-secondary">Salin link berikut untuk mengunduh file Excel:</p>
                        <div class="relative">
                            <input type="text" id="linkUnduhan" readonly
                                  class="w-full px-3 py-2 pr-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all">
                            <button type="button" onclick="exportFunctions.copyDownloadLink()" 
                                   class="absolute right-2 top-1/2 transform -translate-y-1/2 text-secondary hover:text-primary">
                                <i class="fas fa-copy text-xl"></i>
                            </button>
                        </div>
                        <div id="linkStatus" class="text-sm text-green-500 hidden">
                            Link berhasil disalin!
                        </div>
                    </div>
                    
                    <div class="mt-6">
                        <button type="button" onclick="window.open(document.getElementById('linkUnduhan').value, '_blank')" 
                               class="w-full px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-all">
                            Buka Link
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Tambahkan ke dokumen
        document.body.appendChild(modal);
    }
    
    // Copy link download
    copyDownloadLink() {
        const linkInput = document.getElementById('linkUnduhan');
        linkInput.select();
        document.execCommand('copy');
        
        // Tampilkan status
        const linkStatus = document.getElementById('linkStatus');
        linkStatus.classList.remove('hidden');
        
        // Sembunyikan status setelah 2 detik
        setTimeout(() => {
            linkStatus.classList.add('hidden');
        }, 2000);
    }
    
    // Tampilkan modal download link
    showDownloadLink(link) {
        document.getElementById('linkUnduhan').value = link;
        document.getElementById('downloadLinkModal').classList.remove('hidden');
    }
    
    // Upload file Excel ke server dan dapatkan link
    uploadExcelFile(excelData, fileName) {
        // Tampilkan loading
        Swal.fire({
            title: 'Memproses...',
            text: 'Sedang mengupload file Excel...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Buat FormData dengan file Excel
        const formData = new FormData();
        formData.append(
            "file", 
            new Blob([excelData], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), 
            fileName
        );
        
        // Upload ke server
        fetch("https://upload-eosin.vercel.app/", {
            method: "POST",
            body: formData,
        })
        .then((response) => response.text())
        .then((data) => {
            // Tutup loading
            Swal.close();
            
            const downloadLink = data.trim();
            if (downloadLink) {
                // Tampilkan modal dengan link
                this.showDownloadLink(downloadLink);
            } else {
                Swal.fire({
                    title: 'Error',
                    text: 'Gagal mendapatkan link download',
                    icon: 'error',
                    confirmButtonColor: '#7c3aed'
                });
            }
        })
        .catch((error) => {
            console.error("Error saat mengupload file:", error);
            Swal.fire({
                title: 'Error',
                text: 'Terjadi kesalahan saat mengupload file',
                icon: 'error',
                confirmButtonColor: '#7c3aed'
            });
        });
    }
    
    // Mendapatkan data transaksi berdasarkan filter aktif
    getFilteredTransaksi() {
        // Cek apakah posApp tersedia
        if (!window.posApp) {
            return this.getAllTransaksi();
        }
        
        const dataTransaksi = JSON.parse(localStorage.getItem('data_transaksi')) || [];
        let startDate, endDate;
        
        // Tentukan rentang tanggal berdasarkan filter yang aktif
        switch (window.posApp.activeFilter) {
            case 'hari': // Hari ini
                startDate = new Date();
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date();
                endDate.setHours(23, 59, 59, 999);
                break;
                
            case 'minggu': // Minggu ini
                startDate = new Date();
                const day = startDate.getDay();
                const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
                startDate = new Date(startDate.setDate(diff));
                startDate.setHours(0, 0, 0, 0);
                
                endDate = new Date();
                endDate.setHours(23, 59, 59, 999);
                break;
                
            case 'bulan': // Bulan ini
                startDate = new Date();
                startDate.setDate(1);
                startDate.setHours(0, 0, 0, 0);
                
                endDate = new Date();
                endDate.setHours(23, 59, 59, 999);
                break;
                
            case 'custom': // Tanggal kustom
                if (window.posApp.els.dashboardFilterTanggalMulai && 
                    window.posApp.els.dashboardFilterTanggalAkhir) {
                    const startDateStr = window.posApp.els.dashboardFilterTanggalMulai.value;
                    const endDateStr = window.posApp.els.dashboardFilterTanggalAkhir.value;
                    
                    if (startDateStr && endDateStr) {
                        startDate = new Date(startDateStr);
                        startDate.setHours(0, 0, 0, 0);
                        
                        endDate = new Date(endDateStr);
                        endDate.setHours(23, 59, 59, 999);
                    } else {
                        return this.getAllTransaksi();
                    }
                } else {
                    return this.getAllTransaksi();
                }
                break;
                
            case 'semua':
            default:
                return this.getAllTransaksi();
        }
        
        // Filter transaksi berdasarkan rentang tanggal
        return dataTransaksi.filter(trx => {
            const trxDate = new Date(trx.tanggal);
            return trxDate >= startDate && trxDate <= endDate;
        });
    }
    
    // Mendapatkan semua data transaksi
    getAllTransaksi() {
        return JSON.parse(localStorage.getItem('data_transaksi')) || [];
    }
    
    // Mendapatkan informasi filter untuk judul file
    getFilterInfo() {
        // Cek apakah posApp tersedia
        if (!window.posApp) {
            return '';
        }
        
        switch (window.posApp.activeFilter) {
            case 'hari': 
                return 'HariIni';
            case 'minggu': 
                return 'MingguIni';
            case 'bulan': 
                return 'BulanIni';
            case 'custom':
                return 'Custom';
            case 'semua':
            default:
                return 'Semua';
        }
    }
    
    // Ekspor data transaksi ke Excel
    exportTransaksiToExcel() {
        // Ambil data transaksi berdasarkan filter
        const dataTransaksi = this.getFilteredTransaksi();
        
        if (dataTransaksi.length === 0) {
            Swal.fire({
                title: 'Peringatan',
                text: 'Belum ada data transaksi yang dapat diekspor untuk periode ini!',
                icon: 'warning',
                confirmButtonColor: '#7c3aed'
            });
            return;
        }
        
        // Persiapkan data untuk Excel
        const excelData = [];
        
        dataTransaksi.forEach(transaksi => {
            // Format tanggal
            const tanggal = new Date(transaksi.tanggal);
            const tanggalStr = `${tanggal.getDate()}/${tanggal.getMonth() + 1}/${tanggal.getFullYear()} ${tanggal.getHours()}:${tanggal.getMinutes()}`;
            
            // Tiap item dalam transaksi akan menjadi baris tersendiri
            transaksi.items.forEach(item => {
                excelData.push({
                    'No. Transaksi': transaksi.nomor,
                    'Tanggal': tanggalStr,
                    'Metode Pembayaran': transaksi.metodePembayaran === 'tunai' ? 'Tunai' : 'QRIS',
                    'Barcode': item.barcode,
                    'Nama Produk': item.nama,
                    'Harga Jual': item.harga,
                    'Harga Modal': item.modal,
                    'Jumlah': item.jumlah,
                    'Subtotal': item.subtotal,
                    'Subtotal Modal': item.subtotalModal,
                    'Keuntungan': item.keuntungan
                });
            });
        });
        
        // Buat workbook Excel
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Transaksi');
        
        // Generate nama file
        const randomNumber = this.generateRandomNumber(8);
        const randomLetters = this.generateRandomLetters(8);
        const filterInfo = this.getFilterInfo();
        const fileName = `DataTransaksi_${filterInfo}_${randomNumber}_${randomLetters}.xlsx`;
        
        // Ekspor ke array
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        
        // Upload file dan dapatkan link
        this.uploadExcelFile(excelBuffer, fileName);
    }
    
    // Ekspor data produk ke Excel
    exportProdukToExcel() {
        // Ambil data produk
        const produkList = JSON.parse(localStorage.getItem('produk')) || [];
        
        if (produkList.length === 0) {
            Swal.fire({
                title: 'Peringatan',
                text: 'Belum ada data produk yang dapat diekspor!',
                icon: 'warning',
                confirmButtonColor: '#7c3aed'
            });
            return;
        }
        
        // Persiapkan data untuk Excel
        const excelData = produkList.map(produk => {
            return {
                'Barcode': produk.barcode,
                'Nama Produk': produk.nama,
                'Harga Jual': produk.harga,
                'Harga Modal': produk.modal || 'Rp 0',
                'Keuntungan': `Rp ${new Intl.NumberFormat('id-ID').format(produk.keuntungan || 0)}`,
                'Stok': produk.stok,
                'Tanggal Ditambahkan': new Date(produk.createdAt).toLocaleDateString('id-ID')
            };
        });
        
        // Buat workbook Excel
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Produk');
        
        // Generate nama file
        const randomNumber = this.generateRandomNumber(8);
        const randomLetters = this.generateRandomLetters(8);
        const fileName = `DataProduk_${randomNumber}_${randomLetters}.xlsx`;
        
        // Ekspor ke array
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        
        // Upload file dan dapatkan link
        this.uploadExcelFile(excelBuffer, fileName);
    }
    
    // Mendapatkan data penjualan berdasarkan filter
    getFilteredSalesData() {
        // Ambil transaksi yang difilter
        const filteredTransaksi = this.getFilteredTransaksi();
        
        // Hitung total dan keuntungan
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
        
        return {
            total: totalPenjualan,
            totalModal: totalModal,
            keuntungan: totalKeuntungan,
            produkTerjual: produkTerjual
        };
    }
    
    // Ekspor laporan keuntungan ke Excel
    exportLaporanKeuntungan() {
        // Ambil data penjualan berdasarkan filter yang aktif
        const totalPenjualan = this.getFilteredSalesData();
        
        if (totalPenjualan.total === 0) {
            Swal.fire({
                title: 'Peringatan',
                text: 'Belum ada data penjualan yang dapat diekspor untuk periode ini!',
                icon: 'warning',
                confirmButtonColor: '#7c3aed'
            });
            return;
        }
        
        // Data ringkasan
        const ringkasanData = [
            {
                'Keterangan': 'Periode',
                'Nilai': this.getFilterInfo()
            },
            {
                'Keterangan': 'Total Penjualan',
                'Nilai': `Rp ${new Intl.NumberFormat('id-ID').format(totalPenjualan.total)}`
            },
            {
                'Keterangan': 'Total Modal',
                'Nilai': `Rp ${new Intl.NumberFormat('id-ID').format(totalPenjualan.totalModal || 0)}`
            },
            {
                'Keterangan': 'Total Keuntungan',
                'Nilai': `Rp ${new Intl.NumberFormat('id-ID').format(totalPenjualan.keuntungan || 0)}`
            }
        ];
        
        // Data per produk
        const produkData = Object.entries(totalPenjualan.produkTerjual || {}).map(([nama, data]) => {
            return {
                'Nama Produk': nama,
                'Jumlah Terjual': data.jumlah || 0,
                'Keuntungan': `Rp ${new Intl.NumberFormat('id-ID').format(data.keuntungan || 0)}`
            };
        });
        
        // Buat workbook Excel
        const workbook = XLSX.utils.book_new();
        
        // Sheet ringkasan
        const ringkasanSheet = XLSX.utils.json_to_sheet(ringkasanData);
        XLSX.utils.book_append_sheet(workbook, ringkasanSheet, 'Ringkasan');
        
        // Sheet detail produk
        const produkSheet = XLSX.utils.json_to_sheet(produkData);
        XLSX.utils.book_append_sheet(workbook, produkSheet, 'Detail Per Produk');
        
        // Generate nama file
        const randomNumber = this.generateRandomNumber(8);
        const randomLetters = this.generateRandomLetters(8);
        const filterInfo = this.getFilterInfo();
        const fileName = `LaporanKeuntungan_${filterInfo}_${randomNumber}_${randomLetters}.xlsx`;
        
        // Ekspor ke array
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        
        // Upload file dan dapatkan link
        this.uploadExcelFile(excelBuffer, fileName);
    }
    
    // Dialog pilihan ekspor
    showExportOptions() {
        // Dapatkan info filter untuk judul
        const filterInfo = this.getFilterInfo();
        let filterTitle = 'Semua Data';
        
        if (filterInfo !== 'Semua') {
            filterTitle = `Data ${filterInfo}`;
        }
        
        Swal.fire({
            title: `Ekspor ${filterTitle}`,
            html: `
                <div class="space-y-4">
                    <p class="text-left">Pilih jenis data yang ingin diekspor:</p>
                    <div class="grid grid-cols-1 gap-3">
                        <button type="button" id="btn-ekspor-transaksi" class="w-full px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-all">
                            <i class="fas fa-file-invoice mr-2"></i>Data Transaksi
                        </button>
                        <button type="button" id="btn-ekspor-produk" class="w-full px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-all">
                            <i class="fas fa-box mr-2"></i>Data Produk
                        </button>
                        <button type="button" id="btn-ekspor-laporan" class="w-full px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-all">
                            <i class="fas fa-chart-pie mr-2"></i>Laporan Keuntungan
                        </button>
                    </div>
                </div>
            `,
            showConfirmButton: false,
            showCancelButton: true,
            cancelButtonText: 'Tutup',
            cancelButtonColor: '#6b7280',
            didOpen: () => {
                // Setup event listeners
                document.getElementById('btn-ekspor-transaksi').addEventListener('click', () => {
                    Swal.close();
                    this.exportTransaksiToExcel();
                });
                
                document.getElementById('btn-ekspor-produk').addEventListener('click', () => {
                    Swal.close();
                    this.exportProdukToExcel();
                });
                
                document.getElementById('btn-ekspor-laporan').addEventListener('click', () => {
                    Swal.close();
                    this.exportLaporanKeuntungan();
                });
            }
        });
    }
}

// Inisialisasi export functions jika belum ada
let exportFunctions;
if (typeof window !== 'undefined') {
    if (!window.exportFunctions) {
        window.exportFunctions = new ExportFunctions();
    }
    exportFunctions = window.exportFunctions;
}

// Ekspor fungsi agar bisa digunakan di POSApp
function exportToExcel() {
    exportFunctions.showExportOptions();
}
