/**
 * ScannerModule.js
 * Modul yang menangani pemindaian barcode menggunakan library ZXing.
 * 
 * @requires ZXing - Pastikan library ZXing (https://unpkg.com/@zxing/library@latest) sudah dimuat sebelum modul ini.
 * @requires SweetAlert2 - Digunakan untuk menampilkan notifikasi (opsional).
 */

/**
 * Kelas untuk mengelola pemindaian barcode
 */
export class ScannerModule {
  /**
   * Membuat instance dari ScannerModule
   * @param {string} containerId - ID elemen container untuk scanner
   * @param {string} statusId - ID elemen untuk menampilkan status pemindaian
   * @param {Object} options - Opsi konfigurasi untuk scanner
   * @param {number} [options.debounceTime=800] - Waktu debounce untuk pemindaian berulang (ms)
   * @param {number} [options.minDetections=2] - Jumlah deteksi minimal untuk memvalidasi kode
   * @param {boolean} [options.vibrate=true] - Mengaktifkan getar pada perangkat saat sukses
   * @param {Array} [options.formats] - Format barcode yang didukung
   */
  constructor(containerId, statusId, options = {}) {
    // Inisialisasi properti
    this.container = document.getElementById(containerId);
    this.statusElement = document.getElementById(statusId);
    this.options = {
      debounceTime: 400,
      minDetections: 1,
      vibrate: true,
      formats: [
        ZXing.BarcodeFormat.EAN_13,
        ZXing.BarcodeFormat.EAN_8,
        ZXing.BarcodeFormat.CODE_39,
        ZXing.BarcodeFormat.CODE_128,
        ZXing.BarcodeFormat.UPC_A,
        ZXing.BarcodeFormat.UPC_E
      ],
      ...options
    };
    
    // Periksa apakah ZXing tersedia
    if (typeof ZXing === 'undefined') {
      console.error("ZXing library tidak ditemukan. Pastikan dimuat sebelum modul scanner.");
      return;
    }
    
    // Inisialisasi ZXing code reader
    this.codeReader = new ZXing.BrowserMultiFormatReader();
    this.isScanning = false;
    this.scanCallback = null;
    this.setupScanner();
  }

  /**
   * Mengatur konfigurasi scanner
   * @private
   */
  setupScanner() {
    // Pastikan container ada
    if (!this.container) {
      console.error(`Elemen dengan ID "${this.containerId}" tidak ditemukan.`);
      return;
    }
    
    // Tambahkan event listener untuk tombol tutup scanner
    const closeButton = this.container.querySelector('[onclick="closeScanner()"]');
    if (closeButton) {
      closeButton.onclick = () => this.closeScanner();
    }
  }

  /**
   * Memulai pemindaian barcode
   * @param {Function} callback - Callback yang dipanggil ketika kode barcode terdeteksi
   * @returns {Promise<void>}
   */
  async startScanner(callback) {
    if (this.isScanning) return;
    
    this.scanCallback = callback;
    this.isScanning = true;
    this.updateStatus('Mendeteksi kamera...');
    
    try {
      const videoInputDevices = await this.codeReader.listVideoInputDevices();
      
      if (videoInputDevices.length === 0) {
        this.updateStatus('Tidak ada kamera yang terdeteksi!');
        this.showAlert({
          title: 'Error',
          text: 'Tidak ada kamera yang terdeteksi',
          icon: 'error'
        });
        this.isScanning = false;
        return;
      }
      
      // Coba temukan kamera belakang
      const backCameras = videoInputDevices.filter(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('belakang')
      );
      
      const selectedDeviceId = backCameras.length > 0 ? 
        backCameras[0].deviceId : videoInputDevices[0].deviceId;
      
      this.container.style.visibility = 'visible';
      this.container.classList.add('active');
      
      this.updateStatus('Mengaktifkan kamera...');
      const constraints = {
        video: {
          deviceId: { exact: selectedDeviceId },
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: 'environment',
          frameRate: { ideal: 30, min: 15 }
        }
      };
      
      const hints = new Map();
      hints.set(ZXing.DecodeHintType.TRY_HARDER, true);
      hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, this.options.formats);
      
      let lastDetectedCode = null;
      let lastDetectionTime = 0;
      let successiveDetections = {};
      
      this.updateStatus('Kamera siap, arahkan ke barcode');
      this.codeReader.decodeFromConstraints(constraints, 'video', (result, err) => {
        // Tambahkan feedback visual bahwa scanner sedang bekerja
        const scanRegion = this.container.querySelector('.scan-region');
        if (scanRegion) {
          scanRegion.classList.add('active-scan');
          setTimeout(() => scanRegion.classList.remove('active-scan'), 100);
        }
        
        if (result) {
          const code = result.getText();
          const now = Date.now();
          
          // Hanya tampilkan sebagian kode untuk keamanan
          const displayCode = code.length > 8 ? 
            `${code.substring(0, 8)}...` : code;
          
          this.updateStatus(`Kode terdeteksi: ${displayCode}`);
          
          if (code && code.length >= 8) {
            if (lastDetectedCode !== code || now - lastDetectionTime > this.options.debounceTime) {
              if (lastDetectedCode !== code) {
                // Reset jika kode berbeda
                successiveDetections = {};
              }
              
              successiveDetections[code] = (successiveDetections[code] || 0) + 1;
              this.updateStatus(`Memvalidasi kode (${successiveDetections[code]}/${this.options.minDetections})...`);
              
              if (successiveDetections[code] >= this.options.minDetections) {
                // Hapus variabel tracking setelah berhasil
                successiveDetections = {};
                
                // Vibrate jika perangkat mendukung
                if (this.options.vibrate && navigator.vibrate) {
                  navigator.vibrate([100, 50, 100]);
                }
                
                this.updateStatus('Berhasil! Kode valid.');
                if (scanRegion) {
                  scanRegion.classList.add('scan-success');
                  setTimeout(() => {
                    this.closeScanner();
                    this.scanCallback(code);
                  }, 300);
                } else {
                  this.closeScanner();
                  this.scanCallback(code);
                }
              }
              
              lastDetectedCode = code;
              lastDetectionTime = now;
            }
          }
        }
        
        if (err && !(err instanceof ZXing.NotFoundException)) {
          console.error('Error saat scan barcode:', err);
          if (err.message) {
            if (err.message.includes('Malformed')) {
              this.updateStatus('Error: Format barcode tidak valid. Coba dari jarak berbeda.');
            } else {
              this.updateStatus('Error: Gagal membaca. Coba lagi.');
            }
          }
        } else if (err instanceof ZXing.NotFoundException) {
          this.updateStatus('Mendeteksi...');
        }
      }, hints);
      
    } catch (err) {
      console.error('Error saat memulai scanner:', err);
      this.updateStatus('Error: Tidak dapat mengakses kamera!');
      this.showAlert({
        title: 'Error',
        text: 'Tidak dapat mengakses kamera. Pastikan browser mendukung dan izin kamera diberikan.',
        icon: 'error'
      });
      this.closeScanner();
    }
  }

  /**
   * Memperbarui teks status scanner
   * @param {string} message - Pesan status
   */
  updateStatus(message) {
    if (this.statusElement) {
      this.statusElement.textContent = message;
    }
  }

  /**
   * Menutup scanner dan membatalkan pemindaian
   */
  closeScanner() {
    // Reset kamera dan pemindaian
    this.codeReader.reset();
    this.container.classList.remove('active');
    this.isScanning = false;
    
    // Transisi smooth saat menutup
    setTimeout(() => {
      this.container.style.visibility = 'hidden';
      this.updateStatus('Mendeteksi...');
    }, 300);
  }

  /**
   * Menampilkan dialog alert (menggunakan SweetAlert2 jika tersedia)
   * @param {Object} options - Opsi alert
   * @param {string} options.title - Judul alert
   * @param {string} options.text - Teks alert
   * @param {string} options.icon - Ikon alert (success, error, warning, info)
   * @private
   */
  showAlert(options) {
    const { title, text, icon } = options;
    
    // Gunakan SweetAlert2 jika tersedia
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title,
        text,
        icon,
        confirmButtonColor: '#7c3aed'
      });
    } else {
      // Fallback ke alert standar
      alert(`${title}\n\n${text}`);
    }
  }
  
  /**
   * Memeriksa apakah perangkat mendukung kamera
   * @returns {Promise<boolean>} - Promise yang menyelesaikan ke boolean
   */
  static async isSupported() {
    // Periksa dukungan browser untuk mediaDevices API
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return false;
    }
    
    try {
      // Coba dapatkan akses ke kamera
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Tutup stream setelah pengujian
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (err) {
      console.error('Error memeriksa dukungan kamera:', err);
      return false;
    }
  }
  
  /**
   * Mendapatkan daftar kamera yang tersedia
   * @returns {Promise<Array>} - Promise yang menyelesaikan ke array device
   */
  async getAvailableCameras() {
    if (!this.codeReader) {
      throw new Error('Scanner belum diinisialisasi');
    }
    
    try {
      return await this.codeReader.listVideoInputDevices();
    } catch (err) {
      console.error('Error mendapatkan daftar kamera:', err);
      throw err;
    }
  }
}

/**
 * Contoh penggunaan:
 * 
 * // Impor module
 * import { ScannerModule } from './ScannerModule.js';
 * 
 * // Inisialisasi scanner
 * const scanner = new ScannerModule('scanner', 'scanner-status', {
 *   debounceTime: 500,
 *   minDetections: 1
 * });
 * 
 * // Mulai pemindaian
 * scanner.startScanner((barcode) => {
 *   console.log('Barcode terdeteksi:', barcode);
 *   // Lakukan sesuatu dengan kode barcode
 * });
 * 
 * // Tutup scanner
 * scanner.closeScanner();
 */
