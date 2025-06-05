// ==============Konfigurasi dasar aplikasi rapor digital berbasis Google Sheets============================================
const CONFIG = {
  spreadsheetId: '175ZFDxLZ-cQAjm7l9tYj-ycMZQDi2hjdKxbIg_Evkww',
  adminSheet: 'Admin',// Nama sheet menyimpan data pengguna yang memiliki akses 
  studentSheet: 'Nama Siswa',// Nama sheet yang berisi daftar nama siswa
  subjectSheet: 'Mata Pelajaran',// Nama sheet berisi  mata pelajaran
  gradeSheet: 'Nilai',// Nama sheet tempat nilai-nilai siswa disimpan
  raportSheet: 'Raport',// Nama sheet tempat nilai-nilai siswa disimpan
  nonakademikSheet: 'Non Akademik',// Nama sheet Non Akademik
  descriptionSheet: 'Deskripsi', // // Nama sheet tempat Deskripsi
  rankSheet: 'Rank' // Tambahan Sheet Rank
};

// ===========================================Konfigurasi function doGet=====================================================
/**
 * Menangani permintaan GET dan menyajikan konten HTML yang sesuai
 * @param {Object} e - Parameter event
 * @return {HtmlOutput} Konten HTML yang akan ditampilkan
 */
function doGet(e = {}) {
  const action = e.parameter?.action || 'login';
  const pageHandlers = {
    'dashboard': serveDashboard,
    'input-nilai': serveInputNilaiPage,
    'data-siswa': serveDataSiswaPage,
    'data-mapel': serveDataMapelPage,
    'non-akademik': serveNonAkademikPage,  // Pastikan ini ada
    'raport': serveRaportPage,
    'deskripsi': serveDeskripsiPage,
    'rank': serveRankPage,         
    'nilai': serveNilaiPage,         
    'login': serveLoginPage
  };
  
  try {
    const handler = pageHandlers[action] || serveLoginPage;
    return handler();
  } catch (error) {
    console.error('Error serving page:', error);
    return createHtmlOutput('Error', 'Error - Sistem Raport Digital')
      .setContent(`<h1>Terjadi Kesalahan</h1><p>${error.message}</p>`);
  }
}

/**
 * Redirects to another page
 * @param {string} page - The page to redirect to
 * @return {string} The redirect URL
 */
function navigateToPage(page) {
  return getRedirectUrl(page);
}

// ===========================================FUNGSI PENYAJIAN HALAMAN=====================================================

function serveLoginPage() {
  return createHtmlOutput('Login', 'Login - Sistem Raport Digital');
}
function serveDashboard() {
  return createHtmlOutput('Dashboard', 'Dashboard - Sistem Raport Digital');
}
function serveInputNilaiPage() {
  return createHtmlOutput('input-nilai', 'Input Nilai - Sistem Raport Digital');
}
function serveDataSiswaPage() {
  const template = HtmlService.createTemplateFromFile('Data-siswa');
  template.dataSiswa = getStudentData();
  return template.evaluate()
    .setTitle('Data Siswa - Sistem Raport Digital')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function serveDataMapelPage() {
  return createHtmlOutput('Data-mapel', 'Mata Pelajaran - Sistem Raport Digital');
}

function serveNonAkademikPage() {
  return createHtmlOutput('non-akademik', 'Non Akademik - Sistem Raport Digital');
}

function serveRaportPage() {
  return createHtmlOutput('Raport', 'Raport - Sistem Raport Digital');
}
 function serveNilaiPage() {
  const template = HtmlService.createTemplateFromFile('Nilai');
  template.gradeData = getGradeData();
  return template.evaluate()
    .setTitle('Nilai - Sistem Raport Digital')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function serveDeskripsiPage() {
  return createHtmlOutput('Deskripsi', 'Deskripsi - Sistem Raport Digital');
}

function serveRankPage() {
  return createHtmlOutput('Rank', 'Peringkat - Sistem Raport Digital');
}

function createHtmlOutput(templateName, title) {
  return HtmlService.createTemplateFromFile(templateName)
    .evaluate()
    .setTitle(title)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ====================================== FUNGSI LAMAN LOGIN  ===============================================================

function authenticate(username, password) {
  try {
    if (!username || !password) {
      return { success: false, message: 'Username dan password harus diisi' };
    }
    
    const ss = SpreadsheetApp.openById(CONFIG.spreadsheetId);
    const sheet = ss.getSheetByName(CONFIG.adminSheet);
    const data = sheet.getRange(2, 1, sheet.getLastRow()-1, sheet.getLastColumn()).getValues();
    const user = data.find(row => row[1] === username && row[2] === password);
    
    if (user) {
      logActivity(user[0], 'LOGIN', 'User logged in');
      return {
        success: true,
        redirectUrl: getRedirectUrl('dashboard'),
        user: {
          id: user[0],
          name: user[3],
          role: user[4],
          email: user[5]
        }
      };
    }
    
    return { success: false, message: 'Username atau password salah' };
  } catch (error) {
    console.error(`Authentication error: ${error}`);
    return { 
      success: false, 
      message: 'Terjadi kesalahan sistem. Silakan coba lagi nanti.' 
    };
  }
}

function getCurrentUser() {
  // In a real implementation, use Session or Cache service
  return {
    name: "Admin",
    role: "Markus Paru",
    email: "admin@sekolah.example"
  };
}

// ============================================== FUNCTION DATA SISWA  ======================================================

/**
 * Get the student sheet with proper initialization
 * @return {Sheet} The student data sheet
 */
function getStudentSheet() {
  const ss = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  let sheet = ss.getSheetByName(CONFIG.studentSheet);
  
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.studentSheet);
    initializeStudentSheet();
  }
  
  return sheet;
}

/**
 * Get all student data with proper error handling
 * @return {Array} Array of student objects
 */
function getStudentData() {
  try {
    const sheet = getStudentSheet();
    const data = sheet.getDataRange().getDisplayValues(); // Use getDisplayValues for formatted dates
    
    if (data.length <= 1) return [];
    
    const headers = data[0].map(h => h.trim());
    const students = [];
    
    // Define column indexes
    const colIndex = {
      no: headers.indexOf("No"),
      nama: headers.indexOf("Nama Siswa"),
      jenisKelamin: headers.indexOf("Jenis Kelamin"),
      tempatLahir: headers.indexOf("Tempat Lahir"),
      tanggalLahir: headers.indexOf("Tanggal Lahir"),
      agama: headers.indexOf("Agama"),
      nisn: headers.indexOf("NISN"),
      kelas: headers.indexOf("Kelas"),
      namaIbu: headers.indexOf("Nama Ibu Kandung")
    };
    
    // Validate required columns
    if (colIndex.nisn === -1 || colIndex.nama === -1) {
      throw new Error("Struktur sheet tidak valid. Kolom wajib tidak ditemukan.");
    }
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Skip empty rows
      if (!row[colIndex.nisn] && !row[colIndex.nama]) continue;
      
      const student = {
        "No": row[colIndex.no] || i,
        "Nama Siswa": row[colIndex.nama] || '',
        "Jenis Kelamin": row[colIndex.jenisKelamin] || '',
        "Tempat Lahir": row[colIndex.tempatLahir] || '',
        "Tanggal Lahir": row[colIndex.tanggalLahir] || '',
        "Agama": row[colIndex.agama] || '',
        "NISN": row[colIndex.nisn] || '',
        "Kelas": row[colIndex.kelas] || '',
        "Nama Ibu Kandung": row[colIndex.namaIbu] || ''
      };
      
      students.push(student);
    }
    
    return students;
  } catch (error) {
    console.error("Error getting student data:", error);
    throw new Error("Gagal memuat data siswa: " + error.message);
  }
}

/**
 * Add a new student with improved validation
 * @param {Object} studentData - The student data to add
 * @return {Object} Result object with status and message
 */
function addStudent(studentData) {
  try {
    const sheet = getStudentSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => h.trim());
    
    // Validate required fields
    if (!studentData.nisn || !studentData.nama) {
      throw new Error("NISN dan Nama harus diisi");
    }
    
    // Validate NISN format
    if (!/^\d{10}$/.test(studentData.nisn)) {
      throw new Error("NISN harus 10 digit angka");
    }
    
    // Check for duplicate NISN
    const nisnCol = headers.indexOf("NISN");
    if (nisnCol === -1) throw new Error("Kolom NISN tidak ditemukan");
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][nisnCol] && data[i][nisnCol].toString() === studentData.nisn) {
        throw new Error("Siswa dengan NISN ini sudah ada");
      }
    }
    
    // Format date for storage
    const formattedDate = studentData.tanggal_lahir ? 
      formatDateForSheet(studentData.tanggal_lahir) : '';
    
    // Prepare new row data according to headers
    const newRow = headers.map(header => {
      switch(header) {
        case 'No': return sheet.getLastRow();
        case 'Nama Siswa': return studentData.nama;
        case 'Jenis Kelamin': return studentData.jenis_kelamin;
        case 'Tempat Lahir': return studentData.tempat_lahir;
        case 'Tanggal Lahir': return formattedDate;
        case 'Agama': return studentData.agama;
        case 'NISN': return studentData.nisn;
        case 'Kelas': return studentData.kelas;
        case 'Nama Ibu Kandung': return studentData.nama_ibu;
        default: return '';
      }
    });
    
    sheet.appendRow(newRow);
    
    // Log activity
    logActivity('SYSTEM', 'ADD_STUDENT', `Added student ${studentData.nisn} - ${studentData.nama}`);
    
    return { success: true, message: "Siswa berhasil ditambahkan" };
  } catch (error) {
    console.error("Error adding student:", error);
    throw error;
  }
}

/**
 * Update an existing student with improved data handling
 * @param {string} nisn - The NISN of the student to update
 * @param {Object} studentData - The updated student data
 * @return {Object} Result object with status and message
 */
function updateStudent(nisn, studentData) {
  try {
    const sheet = getStudentSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => h.trim());
    
    // Find student row
    const nisnCol = headers.indexOf("NISN");
    if (nisnCol === -1) throw new Error("Kolom NISN tidak ditemukan");
    
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][nisnCol] && data[i][nisnCol].toString() === nisn.toString()) {
        rowIndex = i + 1; // +1 for sheet row
        break;
      }
    }
    
    if (rowIndex === -1) throw new Error("Siswa tidak ditemukan");
    
    // Format date for storage
    const formattedDate = studentData.tanggal_lahir ? 
      formatDateForSheet(studentData.tanggal_lahir) : '';
    
    // Update only the allowed fields (preserve NISN and No)
    const updates = {
      'Nama Siswa': studentData.nama,
      'Jenis Kelamin': studentData.jenis_kelamin,
      'Tempat Lahir': studentData.tempat_lahir,
      'Tanggal Lahir': formattedDate,
      'Agama': studentData.agama,
      'Kelas': studentData.kelas,
      'Nama Ibu Kandung': studentData.nama_ibu
    };
    
    // Prepare update values according to headers
    const updateValues = headers.map(header => {
      if (header === 'No') return sheet.getRange(rowIndex, 1).getValue(); // Preserve No
      if (header === 'NISN') return nisn; // Preserve original NISN
      return updates[header] !== undefined ? updates[header] : data[rowIndex-1][headers.indexOf(header)];
    });
    
    sheet.getRange(rowIndex, 1, 1, headers.length).setValues([updateValues]);
    
    // Log activity
    logActivity('SYSTEM', 'UPDATE_STUDENT', `Updated student ${nisn}`);
    
    return { success: true, message: "Data siswa berhasil diperbarui" };
  } catch (error) {
    console.error("Error updating student:", error);
    throw error;
  }
}

/**
 * Delete a student with improved validation
 * @param {string} nisn - The NISN of the student to delete
 * @return {Object} Result object with status and message
 */
function deleteStudent(nisn) {
  try {
    const sheet = getStudentSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => h.trim());
    const nisnCol = headers.indexOf("NISN");
    
    if (nisnCol === -1) throw new Error("Kolom NISN tidak ditemukan");
    
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][nisnCol] && data[i][nisnCol].toString() === nisn.toString()) {
        rowIndex = i + 1;
        break;
      }
    }
    
    if (rowIndex === -1) throw new Error("Siswa tidak ditemukan");
    
    // Get student name for logging before deletion
    const namaCol = headers.indexOf("Nama Siswa");
    const studentName = namaCol !== -1 ? data[rowIndex-1][namaCol] : '';
    
    sheet.deleteRow(rowIndex);
    
    // Update row numbers after deletion
    updateRowNumbers(sheet);
    
    // Log activity
    logActivity('SYSTEM', 'DELETE_STUDENT', `Deleted student ${nisn} - ${studentName}`);
    
    return { success: true, message: "Siswa berhasil dihapus" };
  } catch (error) {
    console.error("Error deleting student:", error);
    throw error;
  }
}

/**
 * Update row numbers after changes
 * @param {Sheet} sheet - The sheet to update
 */
function updateRowNumbers(sheet) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    sheet.getRange(i + 1, 1).setValue(i);
  }
}

/**
 * Format date for sheet storage (dd-MM-yyyy)
 * @param {string} dateString - The date string to format
 * @return {string} Formatted date string
 */
function formatDateForSheet(dateString) {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return Utilities.formatDate(date, Session.getScriptTimeZone(), "dd-MM-yyyy");
  } catch (e) {
    console.error("Error formatting date:", e);
    return dateString;
  }
}

/**
 * Initialize the student sheet with headers if empty
 */
function initializeStudentSheet() {
  const sheet = getStudentSheet();
  if (sheet.getLastRow() === 0) {
    const headers = [
      "No",
      "Nama Siswa",
      "Jenis Kelamin",
      "Tempat Lahir",
      "Tanggal Lahir",
      "Agama",
      "NISN",
      "Kelas",
      "Nama Ibu Kandung"
    ];
    
    sheet.appendRow(headers);
    
    // Format header row
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#4361ee");
    headerRange.setFontColor("#ffffff");
    headerRange.setFontWeight("bold");
    headerRange.setHorizontalAlignment("center");
    
    // Set column widths
    sheet.setColumnWidth(1, 50); // No
    sheet.setColumnWidth(2, 200); // Nama Siswa
    sheet.setColumnWidth(3, 100); // Jenis Kelamin
    sheet.setColumnWidth(4, 150); // Tempat Lahir
    sheet.setColumnWidth(5, 120); // Tanggal Lahir
    sheet.setColumnWidth(6, 100); // Agama
    sheet.setColumnWidth(7, 120); // NISN
    sheet.setColumnWidth(8, 80);  // Kelas
    sheet.setColumnWidth(9, 200); // Nama Ibu Kandung
    
    // Freeze header row
    sheet.setFrozenRows(1);
  }
}

// Initialize the sheet when the script is loaded
initializeStudentSheet();

// =========================================== =FUNCTION DATA MATA PELAJARAN ===============================================

/**
 * Get the subject sheet with proper initialization
 * @return {Sheet} The subject data sheet
 */
// Di fungsi getSubjectSheet()
function getSubjectSheet() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(CONFIG.subjectSheet);
    
    if (!sheet) {
      sheet = initializeSubjectSheet();
    }
    
    // Validasi struktur sheet
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const requiredHeaders = ["No", "Kode Mapel", "Nama Mata Pelajaran"];
    
    requiredHeaders.forEach(header => {
      if (!headers.includes(header)) {
        throw new Error(`Kolom '${header}' tidak ditemukan di sheet Mata Pelajaran`);
      }
    });
    
    return sheet;
  } catch (error) {
    console.error("Error getting subject sheet:", error);
    throw new Error("Gagal mengakses sheet Mata Pelajaran: " + error.message);
  }
}

/**
 * Get all subject data for the table
 * @return {Array} Array of subject objects
 */
function getSubjectData() {
  try {
    const sheet = getSubjectSheet();
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) return [];
    
    // Pastikan header sesuai
    const headers = data[0].map(h => h.toString().trim().toLowerCase());
    const requiredHeaders = ['kode mapel', 'nama mata pelajaran'];
    
    // Validasi header
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      throw new Error(`Kolom wajib tidak ditemukan: ${missingHeaders.join(', ')}`);
    }
    
    // Proses data
    return data.slice(1).map((row, index) => {
      // Skip baris kosong
      if (!row[headers.indexOf('kode mapel')] && !row[headers.indexOf('nama mata pelajaran')]) {
        return null;
      }
      
      return {
        no: index + 1,
        kode: row[headers.indexOf('kode mapel')]?.toString().trim() || '',
        nama: row[headers.indexOf('nama mata pelajaran')]?.toString().trim() || ''
      };
    }).filter(item => item !== null); // Hapus baris null
    
  } catch (error) {
    console.error("Error in getSubjectData:", error);
    throw new Error(`Gagal memuat data: ${error.message}`);
  }
}

function checkSubjectSheetStructure() {
  try {
    const sheet = getSubjectSheet();
    const data = sheet.getDataRange().getValues();
    
    if (data.length === 0) {
      return {
        valid: false,
        message: "Sheet mata pelajaran kosong",
        suggestion: "Tambahkan header: No, Kode Mapel, Nama Mata Pelajaran"
      };
    }
    
    const headers = data[0].map(h => h.toString().trim().toLowerCase());
    const required = ['kode mapel', 'nama mata pelajaran'];
    const missing = required.filter(h => !headers.includes(h));
    
    if (missing.length > 0) {
      return {
        valid: false,
        message: `Header yang hilang: ${missing.join(', ')}`,
        suggestion: "Pastikan header mengandung: " + required.join(', ')
      };
    }
    
    return {
      valid: true,
      message: "Struktur sheet valid",
      headers: data[0]
    };
  } catch (error) {
    return {
      valid: false,
      message: `Error: ${error.message}`,
      suggestion: "Periksa konfigurasi sheet"
    };
  }
}

/**
 * Get single subject by code for editing
 * @param {string} kode Subject code
 * @return {Object} Subject data
 */
function getSubjectByCode(kode) {
  try {
    const subjects = getSubjectData();
    const subject = subjects.find(s => s.kode === kode);
    
    if (!subject) {
      throw new Error("Subject not found");
    }
    
    return subject;
  } catch (error) {
    console.error("Error getting subject:", error);
    throw error;
  }
}

/**
 * Add new subject with validation
 * @param {Object} subjectData Subject data {kode, nama}
 * @return {Object} Operation result
 */
function addSubject(subjectData) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // Wait up to 10 seconds
    
    // Validate input
    const errors = validateSubjectData(subjectData);
    if (errors) {
      throw new Error(errors.join(", "));
    }
    
    const sheet = getSubjectSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => h.toString().trim().toLowerCase());
    
    // Check for duplicate code
    const kodeCol = headers.indexOf("kode mapel");
    for (let i = 1; i < data.length; i++) {
      if (data[i][kodeCol] && data[i][kodeCol].toString().trim().toUpperCase() === 
          subjectData.kode.toUpperCase()) {
        throw new Error("Kode mapel sudah digunakan");
      }
    }
    
    // Prepare new row
    const newRow = [
      sheet.getLastRow(),              // No
      subjectData.kode.toUpperCase(), // Kode Mapel
      subjectData.nama                // Nama Mata Pelajaran
    ];
    
    sheet.appendRow(newRow);
    
    // Log activity
    logActivity('SYSTEM', 'ADD_SUBJECT', `Added subject ${subjectData.kode} - ${subjectData.nama}`);
    
    return { 
      success: true, 
      message: "Mata pelajaran berhasil ditambahkan",
      data: {
        no: sheet.getLastRow() - 1,
        kode: subjectData.kode,
        nama: subjectData.nama
      }
    };
  } catch (error) {
    console.error("Error adding subject:", error);
    throw error;
  } finally {
    lock.releaseLock();
  }
}

/**
 * Update existing subject
 * @param {string} oldKode Original subject code
 * @param {Object} subjectData Updated subject data
 * @return {Object} Operation result
 */
function updateSubject(oldKode, subjectData) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    
    // Validate input
    const errors = validateSubjectData(subjectData);
    if (errors) {
      throw new Error(errors.join(", "));
    }
    
    const sheet = getSubjectSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => h.toString().trim().toLowerCase());
    
    // Find subject to update
    const kodeCol = headers.indexOf("kode mapel");
    let rowIndex = -1;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][kodeCol] && data[i][kodeCol].toString().trim() === oldKode) {
        rowIndex = i + 1;
        break;
      }
    }
    
    if (rowIndex === -1) throw new Error("Subject not found");
    
    // Check for duplicate if code changed
    if (subjectData.kode.toUpperCase() !== oldKode.toUpperCase()) {
      for (let i = 1; i < data.length; i++) {
        if (data[i][kodeCol] && 
            data[i][kodeCol].toString().trim().toUpperCase() === subjectData.kode.toUpperCase() &&
            (i + 1) !== rowIndex) {
          throw new Error("Subject with this code already exists");
        }
      }
    }
    
    // Update the row
    sheet.getRange(rowIndex, 1, 1, 3).setValues([[
      sheet.getRange(rowIndex, 1).getValue(), // Keep original No
      subjectData.kode.toUpperCase(),
      subjectData.nama
    ]]);
    
    return { 
      success: true, 
      message: "Subject updated successfully",
      data: {
        no: rowIndex - 1,
        kode: subjectData.kode,
        nama: subjectData.nama
      }
    };
  } catch (error) {
    console.error("Error updating subject:", error);
    throw error;
  } finally {
    lock.releaseLock();
  }
}

/**
 * Delete subject
 * @param {string} kode Subject code to delete
 * @return {Object} Operation result
 */
function deleteSubject(kode) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    
    const sheet = getSubjectSheet();
    const data = sheet.getDataRange().getValues();
    const kodeCol = data[0].indexOf("Kode Mapel");
    
    if (kodeCol === -1) throw new Error("Kode Mapel column not found");
    
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][kodeCol] && data[i][kodeCol].toString().trim() === kode) {
        rowIndex = i + 1;
        break;
      }
    }
    
    if (rowIndex === -1) throw new Error("Subject not found");
    
    sheet.deleteRow(rowIndex);
    
    // Update remaining row numbers
    updateRowNumbers(sheet);
    
    return { success: true, message: "Subject deleted successfully" };
  } catch (error) {
    console.error("Error deleting subject:", error);
    throw error;
  } finally {
    lock.releaseLock();
  }
}

/**
 * Validate subject data
 * @param {Object} subjectData Subject data to validate
 * @return {Array|null} Array of errors or null if valid
 */
function validateSubjectData(subjectData) {
  const errors = [];
  
  if (!subjectData.kode || !/^[A-Z0-9]{3,10}$/i.test(subjectData.kode)) {
    errors.push("Kode harus 3-10 karakter alfanumerik");
  }
  
  if (!subjectData.nama || subjectData.nama.trim().length < 3) {
    errors.push("Nama minimal 3 karakter");
  }
  
  return errors.length ? errors : null;
}

/**
 * Update row numbers after changes
 * @param {Sheet} sheet The sheet to update
 */
function updateRowNumbers(sheet) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    sheet.getRange(i + 1, 1).setValue(i);
  }
}

// ================================================= FUNCTION IMPUT NILAI =================================================

/**
 * Get student data for input form
 * @return {Array} Array of student objects (nama, nisn, kelas)
 */
function ambilDataSiswaUntukInput() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Nama Siswa');
    
    if (!sheet) {
      console.error("ERROR: Sheet 'Nama Siswa' tidak ditemukan!");
      SpreadsheetApp.getUi().alert("ERROR: Sheet 'Nama Siswa' tidak ditemukan!");
      return [];
    }
    
    const lastRow = sheet.getLastRow();
    
    if (lastRow < 2) {
      console.warn("Peringatan: Tidak ada data siswa (hanya header)");
      return [];
    }
    
    // Ambil semua data yang diperlukan dalam satu range (B2:H)
    const data = sheet.getRange(2, 1, lastRow - 1, 8).getValues();
    
    // Format data dengan mengambil kolom yang diperlukan:
    // Kolom B (index 1), G (index 6), H (index 7)
    return data.map((row, index) => ({
      nama: row[1] || 'Siswa ' + (index + 1),  // Kolom B (index 1)
      nisn: row[6] || '',                      // Kolom G (index 6)
      kelas: row[7] || ''                      // Kolom H (index 7)
    }));
    
  } catch (error) {
    console.error("ERROR dalam ambilDataSiswaUntukInput:", error);
    return [];
  }
}

/**
 * Get list of classes
 * @return {Array} Array of unique class names
 */
function ambilDataKelas() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Nama Siswa');
    
    if (!sheet) {
      console.error("ERROR: Sheet 'Nama Siswa' tidak ditemukan!");
      return [];
    }
    
    const lastRow = sheet.getLastRow();
    
    if (lastRow < 2) {
      console.warn("Peringatan: Tidak ada data kelas (hanya header)");
      return [];
    }
    
    // Ambil data kelas (kolom H)
    const kelasData = sheet.getRange(2, 8, lastRow - 1, 1).getValues();
    
    // Buat array unik
    const uniqueKelas = [...new Set(kelasData.flat())];
    
    return uniqueKelas.filter(kelas => kelas !== '');
    
  } catch (error) {
    console.error("ERROR dalam ambilDataKelas:", error);
    return [];
  }
}

/**
 * Find grade data by NISN and subject
 * @param {string} nisn Student ID
 * @param {string} mataPelajaran Subject name
 * @return {Object|null} Grade data if found, null otherwise
 */
function cariDataNilai(nisn, mataPelajaran) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Data');
    
    if (!sheet) {
      console.error('Sheet "Data" tidak ditemukan!');
      return null;
    }
    
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][2] == nisn && data[i][3] == mataPelajaran) {
        return {
          no: data[i][0],
          nama_siswa: data[i][1],
          nisn: data[i][2],
          mata_pelajaran: data[i][3],
          kelas: data[i][4],
          tp1: data[i][5],
          tp2: data[i][6],
          tp3: data[i][7],
          tp4: data[i][8],
          tp5: data[i][9],
          tp6: data[i][10],
          tp7: data[i][11],
          tp8: data[i][12],
          tp9: data[i][13],
          tp10: data[i][14],
          tp11: data[i][15],
          tp12: data[i][16],
          lm1: data[i][17],
          lm2: data[i][18],
          lm3: data[i][19],
          lm4: data[i][20],
          lm5: data[i][21],
          lm6: data[i][22],
          lm7: data[i][23],
          lm8: data[i][24],
          lm9: data[i][25],
          lm10: data[i][26],
          lm11: data[i][27],
          lm12: data[i][28],
          sts: data[i][29],
          sas: data[i][30],
          na_tp: data[i][31],
          na_lm: data[i][32],
          nilai_raport: data[i][33],
          tgl_input: data[i][34]
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error cariDataNilai:', error);
    return null;
  }
}

/**
 * Search grade data by criteria
 * @param {string} nama Student name
 * @param {string} kelas Class name
 * @param {string} mataPelajaran Subject name
 * @return {Array} Array of matching grade data
 */
function cariDataBerdasarkanKriteria(nama, kelas, mataPelajaran) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Data');
    
    if (!sheet) {
      console.error('Sheet "Data" tidak ditemukan!');
      return [];
    }
    
    const data = sheet.getDataRange().getValues();
    const results = [];
    
    // Jika semua kriteria kosong, kembalikan semua data
    if (!nama && !kelas && !mataPelajaran) {
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        results.push(createResultObject(row));
      }
      return results;
    }
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Filter berdasarkan kriteria
      const namaMatch = !nama || 
                       (row[1] && row[1].toString().toLowerCase().includes(nama.toLowerCase()));
      const kelasMatch = !kelas || 
                        (row[4] && row[4].toString().toLowerCase() === kelas.toLowerCase());
      const mapelMatch = !mataPelajaran || 
                        (row[3] && row[3].toString().toLowerCase() === mataPelajaran.toLowerCase());
      
      if (namaMatch && kelasMatch && mapelMatch) {
        results.push(createResultObject(row));
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error cariDataBerdasarkanKriteria:', error);
    return [];
  }
}

// Helper function to create result object
function createResultObject(row) {
  return {
    no: row[0],
    nama_siswa: row[1],
    nisn: row[2],
    mata_pelajaran: row[3],
    kelas: row[4],
    nilai_raport: row[33] || 0,
    tgl_input: row[34] || ''
  };
}

/**
 * Save grade data to spreadsheet
 * @param {Object} data Grade data to save
 * @return {Object} Operation result
 */
function simpanDataNilai(data) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); // Wait up to 30 seconds
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Data') || ss.insertSheet('Data');
    
    // Initialize headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      const headers = [
        'No', 'Nama Siswa', 'NISN', 'Mata Pelajaran', 'Kelas',
        'TP1', 'TP2', 'TP3', 'TP4', 'TP5', 'TP6', 'TP7', 'TP8', 'TP9', 'TP10', 'TP11', 'TP12',
        'LM1', 'LM2', 'LM3', 'LM4', 'LM5', 'LM6', 'LM7', 'LM8', 'LM9', 'LM10', 'LM11', 'LM12',
        'STS', 'SAS', 'NA TP', 'NA LM', 'Nilai Raport', 'Tanggal Input'
      ];
      sheet.appendRow(headers);
    }
    
    // Check for duplicate data
    const existingData = cariDataNilai(data.nisn, data.mata_pelajaran);
    if (existingData) {
      return {
        sukses: false,
        pesan: 'Data nilai untuk siswa dan mata pelajaran ini sudah ada'
      };
    }
    
    // Prepare new row
    const newRow = [
      sheet.getLastRow(), // No
      data.nama_siswa,
      data.nisn,
      data.mata_pelajaran,
      data.kelas,
      // TP values
      parseFloat(data.tp1) || 0,
      parseFloat(data.tp2) || 0,
      parseFloat(data.tp3) || 0,
      parseFloat(data.tp4) || 0,
      parseFloat(data.tp5) || 0,
      parseFloat(data.tp6) || 0,
      parseFloat(data.tp7) || 0,
      parseFloat(data.tp8) || 0,
      parseFloat(data.tp9) || 0,
      parseFloat(data.tp10) || 0,
      parseFloat(data.tp11) || 0,
      parseFloat(data.tp12) || 0,
      // LM values
      parseFloat(data.lm1) || 0,
      parseFloat(data.lm2) || 0,
      parseFloat(data.lm3) || 0,
      parseFloat(data.lm4) || 0,
      parseFloat(data.lm5) || 0,
      parseFloat(data.lm6) || 0,
      parseFloat(data.lm7) || 0,
      parseFloat(data.lm8) || 0,
      parseFloat(data.lm9) || 0,
      parseFloat(data.lm10) || 0,
      parseFloat(data.lm11) || 0,
      parseFloat(data.lm12) || 0,
      // Exam values
      parseFloat(data.sts) || 0,
      parseFloat(data.sas) || 0,
      // Calculated values
      parseFloat(data.na_tp) || 0,
      parseFloat(data.na_lm) || 0,
      parseFloat(data.nilai_raport) || 0,
      new Date() // Tanggal Input
    ];
    
    // Append new row
    sheet.appendRow(newRow);
    
    return {
      sukses: true,
      pesan: 'Data nilai berhasil disimpan',
      rowNumber: sheet.getLastRow()
    };
    
  } catch (error) {
    console.error('Error saving grade data:', error);
    return {
      sukses: false,
      pesan: 'Gagal menyimpan data: ' + error.message
    };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Update grade data
 * @param {Object} data Grade data to update
 * @return {Object} Operation result
 */
function updateDataNilai(data) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    
    const existingData = cariDataNilai(data.nisn, data.mata_pelajaran);
    if (!existingData) {
      return {
        success: false,
        message: 'Data tidak ditemukan untuk diupdate'
      };
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Data');
    
    // Prepare updated row
    const updatedRow = [
      existingData.no, // Keep original No
      data.nama_siswa || existingData.nama_siswa,
      data.nisn || existingData.nisn,
      data.mata_pelajaran || existingData.mata_pelajaran,
      data.kelas || existingData.kelas,
      // TP values
      parseFloat(data.tp1) || existingData.tp1 || 0,
      parseFloat(data.tp2) || existingData.tp2 || 0,
      parseFloat(data.tp3) || existingData.tp3 || 0,
      parseFloat(data.tp4) || existingData.tp4 || 0,
      parseFloat(data.tp5) || existingData.tp5 || 0,
      parseFloat(data.tp6) || existingData.tp6 || 0,
      parseFloat(data.tp7) || existingData.tp7 || 0,
      parseFloat(data.tp8) || existingData.tp8 || 0,
      parseFloat(data.tp9) || existingData.tp9 || 0,
      parseFloat(data.tp10) || existingData.tp10 || 0,
      parseFloat(data.tp11) || existingData.tp11 || 0,
      parseFloat(data.tp12) || existingData.tp12 || 0,
      // LM values
      parseFloat(data.lm1) || existingData.lm1 || 0,
      parseFloat(data.lm2) || existingData.lm2 || 0,
      parseFloat(data.lm3) || existingData.lm3 || 0,
      parseFloat(data.lm4) || existingData.lm4 || 0,
      parseFloat(data.lm5) || existingData.lm5 || 0,
      parseFloat(data.lm6) || existingData.lm6 || 0,
      parseFloat(data.lm7) || existingData.lm7 || 0,
      parseFloat(data.lm8) || existingData.lm8 || 0,
      parseFloat(data.lm9) || existingData.lm9 || 0,
      parseFloat(data.lm10) || existingData.lm10 || 0,
      parseFloat(data.lm11) || existingData.lm11 || 0,
      parseFloat(data.lm12) || existingData.lm12 || 0,
      // Exam values
      parseFloat(data.sts) || existingData.sts || 0,
      parseFloat(data.sas) || existingData.sas || 0,
      // Calculated values
      parseFloat(data.na_tp) || existingData.na_tp || 0,
      parseFloat(data.na_lm) || existingData.na_lm || 0,
      parseFloat(data.nilai_raport) || existingData.nilai_raport || 0,
      new Date() // Update timestamp
    ];
    
    // Update the row
    sheet.getRange(existingData.no + 1, 1, 1, updatedRow.length).setValues([updatedRow]);
    
    return {
      success: true,
      message: 'Data berhasil diperbarui'
    };
    
  } catch (error) {
    console.error('Error updating grade data:', error);
    return {
      success: false,
      message: 'Gagal memperbarui data: ' + error.message
    };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Delete grade data
 * @param {string} nisn Student ID
 * @param {string} mataPelajaran Subject name
 * @return {Object} Operation result
 */
function hapusDataNilai(nisn, mataPelajaran) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    
    const existingData = cariDataNilai(nisn, mataPelajaran);
    if (!existingData) {
      return {
        success: false,
        message: 'Data tidak ditemukan untuk dihapus'
      };
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Data');
    
    // Delete the row
    sheet.deleteRow(existingData.no + 1);
    
    // Update row numbers
    const lastRow = sheet.getLastRow();
    for (let i = 2; i <= lastRow; i++) {
      sheet.getRange(i, 1).setValue(i - 1);
    }
    
    return {
      success: true,
      message: 'Data berhasil dihapus'
    };
    
  } catch (error) {
    console.error('Error deleting grade data:', error);
    return {
      success: false,
      message: 'Gagal menghapus data: ' + error.message
    };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Delete all grade data
 * @return {Object} Operation result
 */
function hapusSemuaDataNilai() {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Data');
    
    if (!sheet) {
      return {
        success: true,
        message: 'Tidak ada data yang perlu dihapus (sheet Data tidak ada)'
      };
    }
    
    // Delete all rows except header
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.deleteRows(2, lastRow - 1);
    }
    
    return {
      success: true,
      message: 'Semua data nilai berhasil dihapus'
    };
    
  } catch (error) {
    console.error('Error deleting all grade data:', error);
    return {
      success: false,
      message: 'Gagal menghapus semua data: ' + error.message
    };
  } finally {
    lock.releaseLock();
  }
}
// ===================================FUNCTION LAPORAN KE DASHBOARD ==========================================================

function getDashboardStats() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.spreadsheetId);
    
    return {
      totalStudents: getRecordCount(ss, CONFIG.studentSheet),
      totalSubjects: getRecordCount(ss, CONFIG.subjectSheet),
      totalGrades: getRecordCount(ss, CONFIG.gradeSheet),
      lastUpdated: new Date().toLocaleString()
    };
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    return {
      totalStudents: 0,
      totalSubjects: 0,
      totalGrades: 0,
      lastUpdated: 'N/A'
    };
  }
}

function include(filename) {
  try {
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
  } catch (e) {
    console.error('Error including file:', filename, e);
    return `<div class="alert alert-danger">Error loading ${filename}</div>`;
  }
}

function logActivity(userId, action, description) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.spreadsheetId);
    const sheet = ss.getSheetByName(CONFIG.activitySheet);
    
    sheet.appendRow([
      new Date(),
      userId,
      action,
      description
    ]);
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

function updateRowNumbers(sheet) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    sheet.getRange(i+1, 1).setValue(i);
  }
}

function formatDateForSheet(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "dd/MM/yyyy");
}

function formatTTLForDisplay(ttl) {
  if (!ttl) return '-';
  const parts = ttl.split(',');
  if (parts.length < 2) return ttl;
  
  const tempat = parts[0].trim();
  const tanggal = new Date(parts[1].trim());
  
  if (isNaN(tanggal.getTime())) return ttl;
  
  const formattedDate = Utilities.formatDate(tanggal, Session.getScriptTimeZone(), "dd MM yyyy");
  return `${tempat}, ${formattedDate}`;
}

function getRedirectUrl(action = 'dashboard') {
  const baseUrl = ScriptApp.getService().getUrl();
  return `${baseUrl}?action=${action}`;
}

function getRecordCount(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  return sheet ? Math.max(0, sheet.getLastRow() - 1) : 0;
}

// ===============================FINAL FUNGSI IDENTITAS SEKOLAH ===========================================================
/**
 * Mendapatkan data identitas sekolah untuk dashboard
 * @return {Object} Data identitas format khusus dashboard
 */
function getSchoolIdentity() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Identitas');
    
    if (!sheet) {
      throw new Error("Sheet Identitas tidak ditemukan");
    }

    // Data sekolah (baris 2)
    const sekolahData = sheet.getRange("A2:F2").getValues()[0];
    // Data guru (baris 5)
    const guruData = sheet.getRange("A5:E5").getValues()[0];

    return {
      namaSekolah: sekolahData[0] || '',
      alamatSekolah: sekolahData[1] || '',
      kelas: sekolahData[2] || '',
      fase: sekolahData[3] || '',
      semester: sekolahData[4] || '',
      tahunPelajaran: sekolahData[5] || '',
      tempatTanggal: guruData[0] || '',
      namaGuru: guruData[1] || '',
      nipGuru: guruData[2] || '',
      kepalaSekolah: guruData[3] || '',
      nipKepalaSekolah: guruData[4] || ''
    };
  } catch (error) {
    console.error("Error in getSchoolIdentity:", error);
    throw error;
  }
}
/**
 * Menyimpan data identitas sekolah ke struktur yang sudah ada
 * @param {Object} data - Data identitas sekolah
 * @return {string} Pesan sukses/gagal
 */
function saveIdentitasData(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Identitas');
    
    if (!sheet) {
      throw new Error("Sheet 'Identitas' tidak ditemukan!");
    }
    
    // Validasi data sebelum disimpan
    validateIdentitasData(data);
    
    // Siapkan data dalam format array 2D untuk setValues
    const row2Data = [
      data.namaSekolah,
      data.alamatSekolah,
      data.kelas,
      data.fase,
      data.semester,
      data.tahunPelajaran
    ];
    
    const row5Data = [
      data.tempatTanggal,
      data.namaGuru,
      data.nipGuru,
      data.kepalaSekolah,
      data.nipKepalaSekolah
    ];
    
    // Update sheet dalam satu operasi
    sheet.getRange("A2:F2").setValues([row2Data]);
    sheet.getRange("A5:E5").setValues([row5Data]);
    
    // Log aktivitas
    logActivity('System', 'UPDATE_IDENTITAS', 'Memperbarui data identitas sekolah');
    
    return "Data berhasil disimpan";
    
  } catch (error) {
    console.error('Error saveIdentitasData:', error);
    throw error; // Dilempar kembali ke client
  }
}

/**
 * Validasi data identitas sebelum disimpan
 * @param {Object} data - Data yang akan divalidasi
 * @throws {Error} Jika validasi gagal
 */
function validateIdentitasData(data) {
  const errors = [];
  
  // Validasi data sekolah
  if (!data.namaSekolah || data.namaSekolah.trim().length < 3) {
    errors.push("Nama sekolah minimal 3 karakter");
  }
  
  if (!data.alamatSekolah || data.alamatSekolah.trim().length < 10) {
    errors.push("Alamat sekolah minimal 10 karakter");
  }
  
  if (!data.tahunPelajaran || !/\d{4}\/\d{4}/.test(data.tahunPelajaran)) {
    errors.push("Format tahun pelajaran harus YYYY/YYYY");
  }
  
  // Validasi data guru
  if (!data.namaGuru || data.namaGuru.trim().length < 3) {
    errors.push("Nama guru minimal 3 karakter");
  }
  
  if (data.nipGuru && !/^\d+$/.test(data.nipGuru)) {
    errors.push("NIP guru harus berupa angka");
  }
  
  if (errors.length > 0) {
    throw new Error(errors.join(", "));
  }
}
//======================================================RAPORT CETAK==========================================================

// Fungsi ini akan dijalankan secara otomatis saat spreadsheet dibuka
function onOpen() {
  var ui = SpreadsheetApp.getUi(); // Mendapatkan antarmuka pengguna dari spreadsheet
  ui.createMenu('Menu Raport')     // Membuat menu kustom dengan nama 'Menu Raport' di bar menu Google Sheets
    .addItem('Update Data & Pelajaran', 'updateNamaMapel') // Menambahkan item menu untuk memicu fungsi updateNamaMapel
    .addItem('Update Nilai & Deskripsi', 'updateNilaiDanDeskripsi') // Menambahkan item menu untuk memicu fungsi updateNilaiDanDeskripsi
    .addItem('Update Catatan Guru', 'updateCatatan') // Menambahkan item menu untuk memicu fungsi updateCatatan
    .addToUi(); // Menambahkan menu ke antarmuka pengguna
}

// Fungsi untuk memperbarui nama mata pelajaran dari sheet 'Mapel' ke sheet 'Nilai' dan 'Raport'
function updateNamaMapel() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(); // Mengakses spreadsheet aktif
  var sheetMapel = ss.getSheetByName("Mapel");    // Mengakses sheet bernama 'Mapel'
  var sheetNilai = ss.getSheetByName("Nilai");    // Mengakses sheet bernama 'Nilai'
  var sheetRaport = ss.getSheetByName("Raport");  // Mengakses sheet bernama 'Raport'

  // Jika salah satu sheet tidak ditemukan, tampilkan peringatan dan hentikan fungsi
  if (!sheetMapel || !sheetNilai || !sheetRaport) {
    SpreadsheetApp.getUi().alert("Sheet 'Mapel', 'Nilai', atau 'Raport' tidak ditemukan!");
    return; // Menghentikan eksekusi jika ada sheet yang tidak tersedia
  }
  // Daftar kolom target untuk nama mata pelajaran di sheet 'Nilai'
var targetMapelCols = ["D", "I", "N", "S", "X", "AC", "AH", "AM", "AR", "AW", "BB", "BG", "BL", "BQ", "BV"];

// Daftar kolom target untuk ekstrakurikuler di sheet 'Nilai'
var targetEkstraCols = ["CB", "CD", "CF", "CH", "CJ"];

// Mengambil data mata pelajaran dari sheet 'Mapel' pada rentang B2:B16 (15 mata pelajaran)
var mapelData = sheetMapel.getRange("B2:B16").getValues();

// Mengambil data ekstrakurikuler dari sheet 'Mapel' pada rentang B18:B22 (5 ekstrakurikuler)
var ekstraData = sheetMapel.getRange("B18:B22").getValues();

// Menampilkan kembali semua kolom yang mungkin disembunyikan sebelumnya di sheet 'Nilai'
sheetNilai.showColumns(1, sheetNilai.getMaxColumns());

// Mengisi header kolom sheet 'Nilai' dengan nama mata pelajaran dari sheet 'Mapel'
for (var i = 0; i < mapelData.length; i++) {
  // Mendapatkan index kolom berdasarkan huruf kolom dari array targetMapelCols
  var colIndex = sheetNilai.getRange(targetMapelCols[i] + "1").getColumn();

  if (mapelData[i][0]) {
    // Jika ada nama mapel, isi sel baris pertama pada kolom tersebut
    sheetNilai.getRange(1, colIndex).setValue(mapelData[i][0]);
  } else {
    // Jika kosong, sembunyikan 5 kolom mulai dari kolom ini (biasanya karena tiap mapel memakai 5 kolom)
    sheetNilai.hideColumns(colIndex, 5);
  }
}

// Mengisi header kolom sheet 'Nilai' dengan nama ekstrakurikuler dari sheet 'Mapel'
for (var j = 0; j < ekstraData.length; j++) {
  // Mendapatkan index kolom berdasarkan huruf kolom dari array targetEkstraCols
  var colIndexEkstra = sheetNilai.getRange(targetEkstraCols[j] + "1").getColumn();

  if (ekstraData[j][0]) {
    // Jika ada nama ekstra, isi sel baris pertama pada kolom tersebut
    sheetNilai.getRange(1, colIndexEkstra).setValue(ekstraData[j][0]);
  } else {
    // Jika kosong, sembunyikan 2 kolom (biasanya untuk nilai & deskripsi)
    sheetNilai.hideColumns(colIndexEkstra, 2);
  }
}

// Mengambil data siswa dari kolom A, B, dan C di sheet 'Nilai' (biasanya berisi No, Nama, NISN atau Kelas)
var dataNama = sheetNilai.getRange("A2:C" + sheetNilai.getLastRow()).getValues();

// Menyalin data siswa tadi ke sheet 'Raport' di kolom A sampai C mulai dari baris 2
sheetRaport.getRange("A2:C" + (dataNama.length + 1)).setValues(dataNama);

// Menampilkan pesan bahwa proses update selesai
SpreadsheetApp.getUi().alert("Nama Mapel, Ekstrakurikuler, dan data siswa berhasil diperbarui!");
}
function updateNilaiDanDeskripsi() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetNilai = ss.getSheetByName("Nilai");
  const sheetDeskripsi = ss.getSheetByName("Deskripsi");

  if (!sheetNilai || !sheetDeskripsi) {
    SpreadsheetApp.getUi().alert("Sheet 'Nilai' atau 'Deskripsi' tidak ditemukan!");
    return;
  }

  const range = sheetNilai.getRange("A2:" + sheetNilai.getLastColumnLetter() + sheetNilai.getLastRow());
  const dataNilai = range.getValues();

  // Misal logika deskripsi kamu di sini
  // sheetDeskripsi.getRange(...).setValues(...);
  
  SpreadsheetApp.getUi().alert("Nilai dan deskripsi berhasil diperbarui!");
}

function updateCatatan() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetNilai = ss.getSheetByName("Nilai");
  var sheetDeskripsi = ss.getSheetByName("Deskripsi");
  var sheetRaport = ss.getSheetByName("Raport");
  if (!sheetNilai || !sheetDeskripsi || !sheetRaport) {
    SpreadsheetApp.getUi().alert("Sheet 'Nilai', 'Deskripsi', atau 'Raport' tidak ditemukan!");
    return;
  }

  var nilaiRange = sheetNilai.getRange(2, 4, sheetNilai.getLastRow() - 1, 76).getValues();
  var catatanDeskripsi = sheetDeskripsi.getRange("B84:B86").getValues().flat();
  var catatanArray = [];
  nilaiRange.forEach(row => {
    var validNilai = row.filter(Number.isFinite);
    var rataRata = validNilai.length > 0 ? validNilai.reduce((a, b) => a + b, 0) / validNilai.length : 0;
    var catatan = "";
    if (rataRata >= 90) {
      catatan = catatanDeskripsi[0]; 
    } else if (rataRata >= 80) {
      catatan = catatanDeskripsi[1]; 
    } else if (rataRata >= 65) {
      catatan = catatanDeskripsi[2];
    }
    catatanArray.push([catatan]);
  });

  sheetNilai.getRange(2, 95, catatanArray.length, 1).setValues(catatanArray);
  sheetRaport.getRange(2, 65, catatanArray.length, 1).setValues(catatanArray);
  SpreadsheetApp.getUi().alert("Catatan guru berhasil diperbarui!");
}

function getIdentitas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Identitas');
  const data = sheet.getRange('A2:F2').getValues()[0];
  return {
    sekolah: data[0],
    alamat: data[1],
    kelas: data[2],
    fase: data[3],
    semester: data[4],
    tahun: data[5]
  };
}

function getLegalitasData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Identitas');
  const data = sheet.getRange('A5:E5').getValues()[0];
  return {
    tempatTanggal: data[0],
    namaGuru: data[1],
    nipGuru: data[2],
    kepalaSekolah: data[3],
    nipKepalaSekolah: data[4],
  };
}

function getStudentList() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Raport');
  if (!sheet) return [];
  const data = sheet.getRange('B2:C' + sheet.getLastRow()).getValues();
  return data.map(([nama, nis]) => ({ nama, nis }));
}

function getCapaianKompetensi(namaSiswa) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetData = ss.getSheetByName('Raport');
  const sheetMapel = ss.getSheetByName('Mapel');
  const muatanPelajaran = sheetMapel.getRange('B2:B16').getValues()
    .flat()
    .filter(mapel => mapel); 
  const data = sheetData.getRange(2, 2, sheetData.getLastRow() - 1, 48).getValues();
  const results = [];
  let nomorUrut = 1;
  const studentRow = data.find(row => row[0] === namaSiswa);
  if (!studentRow) return [];
  muatanPelajaran.forEach((mapel, i) => {
    results.push({
      id: nomorUrut++,
      mapel: mapel,
      nilai: studentRow[i * 3 + 2] || 0, 
      good: studentRow[i * 3 + 3] || 'Tidak Ada Mapel', 
      less: studentRow[i * 3 + 4] || 'Tidak Ada Mapel'
    });
  });
  return results;
}

function getEkstraData(namaSiswa) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetMapel = ss.getSheetByName('Mapel');
  const sheetRaport = ss.getSheetByName('Raport');
  if (!sheetMapel || !sheetRaport) return [];
  const namaEkstra = sheetMapel.getRange('B18:B22').getValues().flat();
  const dataRaport = sheetRaport.getRange(2, 2, sheetRaport.getLastRow() - 1, 59).getValues();
  const studentRow = dataRaport.find(row => row[0] === namaSiswa);
  if (!studentRow) return [];
  const ekstraData = studentRow.slice(48, 59);
  const results = [];
  let nomorUrut = 1;
  namaEkstra.forEach((ekstra, index) => {
    if (ekstra) {
      const predikat = ekstraData[index * 2] || '-';
      const keterangan = ekstraData[index * 2 + 1] || '-';
      results.push({
        no: nomorUrut++,
        ekstra,
        predikat,
        keterangan
      });
    }
  });
  return results;
}

function getPresensiData(namaSiswa) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetMapel = ss.getSheetByName('Mapel');
  const sheetRaport = ss.getSheetByName('Raport');
  if (!sheetMapel || !sheetRaport) return [];
  const jenisKetidakhadiran = sheetMapel.getRange('B24:B26').getValues().flat().filter(item => item);
  const data = sheetRaport.getRange(2, 2, sheetRaport.getLastRow() - 1, 62).getValues();
  const studentRow = data.find(row => row[0] === namaSiswa);
  if (!studentRow) return [];
  const jumlahPresensi = [60, 61, 62].map(index => studentRow[index - 1] || 0);
  return jenisKetidakhadiran.map((jenis, i) => ({
    no: i + 1,
    ketidakhadiran: jenis,
    keterangan: `${jumlahPresensi[i]} Hari`
  }));
}

function getCatatanSiswa(namaSiswa) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetRaport = ss.getSheetByName('Raport');
  if (!sheetRaport) return "Catatan tidak tersedia.";
  const dataRaport = sheetRaport.getRange(2, 2, sheetRaport.getLastRow() - 1, 65).getValues();
  const studentRow = dataRaport.find(row => row[0] === namaSiswa);
  if (!studentRow) return "Catatan tidak tersedia.";
  return studentRow[63] ? studentRow[63] : "Catatan tidak tersedia.";
}

function getKeputusanSiswa(namaSiswa) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetRaport = ss.getSheetByName('Raport');
  if (!sheetRaport) return { naik: "-", tinggal: "-" };
  const dataRaport = sheetRaport.getRange(2, 2, sheetRaport.getLastRow() - 1, 69).getValues();
  const studentRow = dataRaport.find(row => row[0] === namaSiswa);
  if (!studentRow) return { naik: "-", tinggal: "-" };
  return {
    naik: studentRow[66] || "-",
    tinggal: studentRow[67] || "-"
  };
}

// Pindahkan fungsi session ke luar
let sessionNama = null;

function setSessionNama(nama) {
  sessionNama = nama;
}

function getSessionNama() {
  return sessionNama;
}

//===============================================================RANKING======================================================
/**
 * Mendapatkan data ranking kelas
 * @param {string} kelas - Kelas yang dipilih
 * @param {string} semester - Semester yang dipilih
 * @return {Array} Array data ranking siswa
 */
function getClassRankings(kelas, semester) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Rank");
    
    if (!sheet) {
      throw new Error("Sheet 'Rank' tidak ditemukan!");
    }
    
    // Ambil semua data
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => h.toString().trim().toLowerCase());
    
    // Fungsi untuk menemukan index kolom dengan beberapa alternatif nama
    const findCol = (names) => {
      const lowerNames = names.map(n => n.toLowerCase());
      for (let i = 0; i < headers.length; i++) {
        if (lowerNames.includes(headers[i])) return i;
      }
      return -1;
    };
    
    // Temukan kolom-kolom penting dengan alternatif nama
    const cols = {
      nisn: findCol(['nisn', 'nomor induk']),
      nama: findCol(['nama', 'nama siswa', 'name']),
      nilai: findCol(['nilai raport', 'raport', 'nilai akhir']),
      predikat: findCol(['predikat', 'grade', 'nilai huruf']),
      rank: findCol(['rank', 'ranking', 'peringkat'])
    };
    
    // Validasi kolom wajib
    if (cols.nisn === -1 || cols.nama === -1 || cols.nilai === -1) {
      throw new Error("Kolom wajib (NISN/Nama/Nilai) tidak ditemukan!");
    }
    
    // Proses data
    const result = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const nisn = row[cols.nisn] ? row[cols.nisn].toString().trim() : null;
      
      if (!nisn) continue; // Skip baris tanpa NISN
      
      // Parse nilai
      let nilai = 0;
      if (cols.nilai !== -1 && row[cols.nilai]) {
        nilai = parseFloat(row[cols.nilai].toString().replace(',', '.')) || 0;
      }
      
      // Buat objek siswa
      const siswa = {
        NISN: nisn,
        NAMA_SISWA: row[cols.nama] || 'Nama tidak tersedia',
        NILAI_RAPORT: nilai,
        PREDIKAT: (cols.predikat !== -1 && row[cols.predikat]) ? row[cols.predikat].toString().trim() : '-',
        Rank: (cols.rank !== -1 && row[cols.rank]) ? parseInt(row[cols.rank]) || 0 : 0
      };
      
      result.push(siswa);
    }
    
    // Jika kolom rank tidak ada, buat ranking berdasarkan nilai
    if (cols.rank === -1) {
      result.sort((a, b) => b.NILAI_RAPORT - a.NILAI_RAPORT);
      result.forEach((siswa, index) => {
        siswa.Rank = index + 1;
      });
    } else {
      // Urutkan berdasarkan rank yang ada
      result.sort((a, b) => a.Rank - b.Rank);
    }
    
    return result;
    
  } catch (error) {
    console.error("Error in getClassRankings:", error);
    throw error;
  }
}

/**
 * Fungsi untuk memeriksa struktur sheet
 * @return {Object} Informasi struktur sheet
 */
function debugSheetStructure() {
  try {
    const ss = SpreadsheetApp.getActive();
    const sheet = ss.getSheetByName("Rank");
    
    if (!sheet) {
      return { error: "Sheet 'Rank' tidak ditemukan" };
    }
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn())
      .getValues()[0]
      .map(h => h.toString().trim());
    
    return {
      headers: headers,
      sampleData: sheet.getRange(2, 1, Math.min(5, sheet.getLastRow()-1), sheet.getLastColumn())
        .getValues(),
      suggestion: headers.includes("Rank") ? 
        "Kolom ranking sudah ada" : 
        "Tambahkan kolom 'Rank' atau sistem akan membuat otomatis"
    };
  } catch (error) {
    return { error: error.message };
  }
}

//==================================================NILAI SISWA========================================================

/**
 * Mendapatkan data nilai siswa dari Sheet Rekap
 * @return {Array} Array data siswa dengan format terstruktur
 */
function getGradeData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Rekap');
    
    if (!sheet) {
      throw new Error("Sheet 'Rekap' tidak ditemukan!");
    }

    // Ambil semua data mulai dari baris 4 (A4)
    const data = sheet.getRange(4, 1, sheet.getLastRow()-3, sheet.getLastColumn()).getValues();
    
    // Daftar mata pelajaran dan urutan kolom
    const subjects = [
      'Pendidikan Agama dan Budi Pakerti',
      'Matematika',
      'Bahasa Indonesia',
      'IPAS',
      'Pendidikan Pancasila',
      'Pendidikan Jasmani Olahraga dan Kesehatan',
      'Seni Tari',
      'Seni Musik',
      'Seni Rupa',
      'Muatan Lokal',
      'Bahasa Inggris'
    ];
    
    // Komponen penilaian
    const components = ['STP', 'SLM', 'STS', 'SAS'];
    
    // Hitung offset kolom untuk setiap mata pelajaran (4 kolom per mata pelajaran)
    const subjectOffsets = {};
    let currentOffset = 3; // Mulai setelah kolom NISN
    
    subjects.forEach(subject => {
      subjectOffsets[subject] = currentOffset;
      currentOffset += 4; // Setiap mata pelajaran menggunakan 4 kolom
    });
    
    // Kolom summary dan lainnya
    const summaryOffset = currentOffset;
    const attendanceOffset = summaryOffset + 7; // Setelah 7 kolom summary
    const extracurricularOffset = attendanceOffset + 4; // Setelah 4 kolom kehadiran
    
    // Proses data siswa
    const students = [];
    
    data.forEach((row, index) => {
      const student = {
        id: index + 1,
        name: row[1] || '', // Kolom B (Nama Siswa)
        nisn: row[2] || '', // Kolom C (NISN)
        class: '', // Tidak ada kolom kelas dalam struktur yang diberikan
        subjects: {},
        summary: {
          tp: row[summaryOffset] || 0,
          lm: row[summaryOffset + 1] || 0,
          sts: row[summaryOffset + 2] || 0,
          sas: row[summaryOffset + 3] || 0,
          jlh: row[summaryOffset + 4] || 0,
          rta: row[summaryOffset + 5] || 0,
          rank: row[summaryOffset + 6] || 0
        },
        attendance: {
          s: row[attendanceOffset] || 0,
          i: row[attendanceOffset + 1] || 0,
          tk: row[attendanceOffset + 2] || 0,
          h: row[attendanceOffset + 3] || 0
        },
        extracurricular: {
          pramuka: row[extracurricularOffset] === '✓',
          olahraga: row[extracurricularOffset + 1] === '✓',
          kesenian: row[extracurricularOffset + 2] === '✓',
          kerohanian: row[extracurricularOffset + 3] === '✓'
        }
      };
      
      // Proses nilai mata pelajaran
      subjects.forEach(subject => {
        const offset = subjectOffsets[subject];
        student.subjects[subject] = {
          stp: row[offset] || 0,
          slm: row[offset + 1] || 0,
          sts: row[offset + 2] || 0,
          sas: row[offset + 3] || 0
        };
      });
      
      students.push(student);
    });
    
    return students;
    
  } catch (error) {
    console.error('Error in getGradeData:', error);
    throw error;
  }
}

/**
 * Memeriksa struktur sheet untuk debugging
 * @return {Object} Informasi struktur sheet
 */
function checkSheetStructure() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Rekap');
  
  if (!sheet) {
    return {
      valid: false,
      message: "Sheet 'Rekap' tidak ditemukan"
    };
  }
  
  // Ambil 5 baris pertama untuk pemeriksaan
  const data = sheet.getRange(1, 1, Math.min(5, sheet.getLastRow()), sheet.getLastColumn()).getValues();
  
  return {
    valid: true,
    totalStudents: sheet.getLastRow() - 3, // Karena data dimulai dari baris 4
    sampleData: data,
    message: "Struktur sheet ditemukan"
  };
}

//==================================================NON AKADEMIK========================================================

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// Ambil data nama siswa dari Google Sheet
function getNamaSiswaFromSheet() {
  try {
    const spreadsheetId = '175ZFDxLZ-cQAjm7l9tYj-ycMZQDi2hjdKxbIg_Evkww'; // Ganti dengan ID Spreadsheet Anda
    const sheetName = 'Nama Siswa';
    const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName);
    
    if (!sheet) {
      throw new Error('Sheet "Nama Siswa" tidak ditemukan');
    }
    
    const data = sheet.getRange('B2:B' + sheet.getLastRow()).getValues();
    
    // Filter nilai yang tidak kosong dan unik
    const uniqueNames = [];
    const seen = {};
    
    data.forEach(row => {
      const name = row[0] ? row[0].toString().trim() : '';
      if (name && !seen[name]) {
        seen[name] = true;
        uniqueNames.push(name);
      }
    });
    
    return uniqueNames.sort();
  } catch (e) {
    console.error('Error in getNamaSiswaFromSheet:', e);
    throw e;
  }
}

// Simpan data ekstrakurikuler
function saveEkstrakurikuler(data) {
  try {
    // Validasi data
    if (!data || typeof data !== 'object') {
      throw new Error('Data tidak valid');
    }
    
    if (!data.namaSiswa) {
      throw new Error('Nama siswa harus diisi');
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('Data Ekstrakurikuler');
    
    // Jika sheet belum ada, buat baru
    if (!sheet) {
      sheet = ss.insertSheet('Data Ekstrakurikuler');
      // Buat header
      sheet.appendRow([
        'Nama Siswa', 'Pramuka - Predikat', 'Pramuka - Catatan',
        //'PMR - Predikat', 'PMR - Catatan',
        'Sepak Bola - Predikat', 'Sepak Bola - Catatan',
        //'Bola Voli - Predikat', 'Bola Voli - Catatan',
        //'Drum Band - Predikat', 'Drum Band - Catatan',
        'Seni Suara - Predikat', 'Seni Suara - Catatan',
        'Seni Tari - Predikat', 'Seni Tari - Catatan',
        'Sakit', 'Izin', 'Alpa',
        'Catatan Wali Kelas', 'Status'
      ]);
      
      // Format header
      const headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
      headerRange.setBackground('#4CAF50');
      headerRange.setFontColor('white');
      headerRange.setFontWeight('bold');
    }
    
    // Siapkan data untuk disimpan
    const newRow = [
      data.namaSiswa,
      data.ekstrakurikuler?.pramuka?.predikat || '',
      data.ekstrakurikuler?.pramuka?.catatan || '',
      //data.ekstrakurikuler?.pmr?.predikat || '',
      //data.ekstrakurikuler?.pmr?.catatan || '',
      data.ekstrakurikuler?.sepakbola?.predikat || '',
      data.ekstrakurikuler?.sepakbola?.catatan || '',
      //data.ekstrakurikuler?.bolavoli?.predikat || '',
      //data.ekstrakurikuler?.bolavoli?.catatan || '',
      //data.ekstrakurikuler?.drumband?.predikat || '',
      //data.ekstrakurikuler?.drumband?.catatan || '',
      data.ekstrakurikuler?.senisuara?.predikat || '',
      data.ekstrakurikuler?.senisuara?.catatan || '',
      data.ekstrakurikuler?.senitari?.predikat || '',
      data.ekstrakurikuler?.senitari?.catatan || '',
      data.kehadiran?.sakit || 0,
      data.kehadiran?.izin || 0,
      data.kehadiran?.alpa || 0,
      data.catatanWali || '',
      data.status || '1 (Satu)'
    ];

    // Cari data yang sudah ada berdasarkan ID
    if (data.id) {
      const existingData = sheet.getDataRange().getValues();
      for (let i = 1; i < existingData.length; i++) {
        if (existingData[i][0] === data.id) {
          sheet.getRange(i+1, 1, 1, newRow.length).setValues([newRow]);
          return { success: true, message: 'Data berhasil diupdate' };
        }
      }
    }
    
    // Jika tidak ditemukan atau data baru, tambahkan baris baru
    sheet.appendRow(newRow);
    
    // Format angka untuk kehadiran
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 18, 1, 3).setNumberFormat('0');
    
    return { success: true, message: 'Data berhasil disimpan' };
    
  } catch (e) {
    console.error('Error in saveEkstrakurikuler:', e);
    return { success: false, message: e.message };
  }
}

// Ambil semua data ekstrakurikuler
function getEkstrakurikulerData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Data Ekstrakurikuler');
    
    if (!sheet || sheet.getLastRow() <= 1) {
      return [];
    }
    
    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
    
    return data.map(row => ({
      namaSiswa: row[0],
      ekstrakurikuler: {
        pramuka: { predikat: row[1], catatan: row[2] },
        sepakbola: { predikat: row[3], catatan: row[4] },
        senisuara: { predikat: row[5], catatan: row[6] },
        senitari: { predikat: row[7], catatan: row[8] }
      },
      kehadiran: {
        sakit: row[9],
        izin: row[10],
        alpa: row[11]
      },
      catatanWali: row[12],
      status: row[13]
    }));
  } catch (e) {
    console.error('Error in getEkstrakurikulerData:', e);
    throw e;
  }
}

// Ambil data ekstrakurikuler berdasarkan ID
function getEkstrakurikulerById(id) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Data Ekstrakurikuler');
    
    if (!sheet || sheet.getLastRow() <= 1) {
      return null;
    }
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        return {
          namaSiswa: data[i][1],
          ekstrakurikuler: {
            pramuka: { predikat: data[i][2], catatan: data[i][3] },
            sepakbola: { predikat: data[i][4], catatan: data[i][5] },
            senisuara: { predikat: data[i][6], catatan: data[i][7] },
            senitari: { predikat: data[i][8], catatan: data[i][9] }
          },
          kehadiran: {
            sakit: data[i][10],
            izin: data[i][11],
            alpa: data[i][12]
          },
          catatanWali: data[i][13],
          status: data[i][14]
        };
      }
    }
    
    return null;
  } catch (e) {
    console.error('Error in getEkstrakurikulerById:', e);
    throw e;
  }
}

// Hapus data ekstrakurikuler berdasarkan ID
function deleteEkstrakurikuler(id) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Data Ekstrakurikuler');
    
    if (!sheet || sheet.getLastRow() <= 1) {
      return { success: false, message: 'Tidak ada data yang bisa dihapus' };
    }
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        sheet.deleteRow(i + 1);
        return { success: true, message: 'Data berhasil dihapus' };
      }
    }
    
    return { success: false, message: 'Data tidak ditemukan' };
  } catch (e) {
    console.error('Error in deleteEkstrakurikuler:', e);
    return { success: false, message: e.message };
  }
}

// Hapus semua data ekstrakurikuler
function deleteAllEkstrakurikuler() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Data Ekstrakurikuler');
    
    if (!sheet || sheet.getLastRow() <= 1) {
      return { success: false, message: 'Tidak ada data yang bisa dihapus' };
    }
    
    // Hapus semua baris kecuali header
    sheet.deleteRows(2, sheet.getLastRow() - 1);
    return { success: true, message: 'Semua data berhasil dihapus' };
  } catch (e) {
    console.error('Error in deleteAllEkstrakurikuler:', e);
    return { success: false, message: e.message };
  }
}

// Export data ke Excel
function exportDataToExcel() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Data Ekstrakurikuler');
    
    if (!sheet || sheet.getLastRow() <= 1) {
      return null;
    }
    
    // Buat spreadsheet baru untuk export
    const exportName = 'Data Ekstrakurikuler ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const exportSpreadsheet = SpreadsheetApp.create(exportName);
    const exportSheet = exportSpreadsheet.getSheets()[0];
    
    // Copy data
    const data = sheet.getDataRange().getValues();
    exportSheet.getRange(1, 1, data.length, data[0].length).setValues(data);
    
    // Format header
    const header = exportSheet.getRange(1, 1, 1, data[0].length);
    header.setBackground('#4CAF50');
    header.setFontColor('white');
    header.setFontWeight('bold');
    
    // Format angka untuk kehadiran
    if (data.length > 1) {
      exportSheet.getRange(2, 18, data.length - 1, 3).setNumberFormat('0');
    }
    
    // Set freeze rows dan auto resize columns
    exportSheet.setFrozenRows(1);
    for (let i = 1; i <= data[0].length; i++) {
      exportSheet.autoResizeColumn(i);
    }
    
    // Set permission untuk semua bisa melihat
    exportSpreadsheet.addViewer('anyoneWithLink');
    
    // Tunggu sebentar untuk memastikan file siap
    Utilities.sleep(2000);
    
    return exportSpreadsheet.getUrl();
  } catch (e) {
    console.error('Error in exportDataToExcel:', e);
    return null;
  }
}

//==================================================FUNGSI DESKRIPSI========================================================
// Config
const SPREADSHEET_ID = '175ZFDxLZ-cQAjm7l9tYj-ycMZQDi2hjdKxbIg_Evkww';
const SHEET_NAME = 'Deskripsi';

/**
 * Mendapatkan data dari spreadsheet
 * @return {Object} Berisi array descriptions dan subjects
 */
function getDataFromSheet() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    
    // Header row (asumsi kolom: No, ID, Kode Mapel, Nama Mapel, KKTP, Deskripsi)
    const headers = data[0];
    const rows = data.slice(1);
    
    const descriptions = [];
    const subjectsMap = new Map();
    
    rows.forEach((row, index) => {
      if (row[0] === '') return; // Skip baris kosong
      
      const description = {
        no: row[0],
        id: row[1] || generateId(),
        subjectCode: row[2],
        subjectName: row[3],
        kktp: row[4],
        deskripsi: row[5]
      };
      
      descriptions.push(description);
      
      // Tambahkan ke map subjects jika belum ada
      if (!subjectsMap.has(row[2])) {
        subjectsMap.set(row[2], {
          kode: row[2],
          nama: row[3]
        });
      }
    });
    
    // Konversi Map ke Array
    const subjects = Array.from(subjectsMap.values());
    
    return {
      descriptions: descriptions,
      subjects: subjects
    };
    
  } catch (error) {
    console.error('Error in getDataFromSheet:', error);
    throw new Error('Gagal memuat data dari spreadsheet');
  }
}

/**
 * Mendapatkan daftar mata pelajaran dari spreadsheet
 * @return {Array} Daftar mata pelajaran
 */
function getSubjectsFromSheet() {
  try {
    const data = getDataFromSheet();
    return data.subjects;
  } catch (error) {
    console.error('Error in getSubjectsFromSheet:', error);
    throw new Error('Gagal memuat daftar mata pelajaran');
  }
}

/**
 * Menambahkan deskripsi baru ke spreadsheet
 * @param {Object} data Data deskripsi baru
 * @return {Object} Deskripsi yang berhasil ditambahkan
 */
function addDescriptionToSheet(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    // Cari subject name berdasarkan kode
    const subjects = getSubjectsFromSheet();
    const subject = subjects.find(s => s.kode === data.subjectCode) || { nama: data.subjectCode };
    
    // Generate nomor urut untuk mapel ini
    const descriptions = getDataFromSheet().descriptions;
    const lastNo = descriptions
      .filter(d => d.subjectCode === data.subjectCode)
      .reduce((max, d) => Math.max(max, d.no), 0);
    
    // Tambahkan baris baru
    const newRow = [
      lastNo + 1,                          // No
      generateId(),                        // ID
      data.subjectCode,                    // Kode Mapel
      subject.nama,                        // Nama Mapel
      data.kktp,                           // KKTP
      data.deskripsi                       // Deskripsi
    ];
    
    sheet.appendRow(newRow);
    
    return {
      ...data,
      id: newRow[1],
      no: newRow[0],
      subjectName: subject.nama
    };
    
  } catch (error) {
    console.error('Error in addDescriptionToSheet:', error);
    throw new Error('Gagal menambahkan deskripsi baru');
  }
}

/**
 * Memperbarui deskripsi di spreadsheet
 * @param {Object} data Data deskripsi yang akan diupdate
 * @return {Object} Deskripsi yang berhasil diupdate
 */
function updateDescriptionInSheet(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    const range = sheet.getDataRange();
    const values = range.getValues();
    
    // Header row (asumsi kolom: No, ID, Kode Mapel, Nama Mapel, KKTP, Deskripsi)
    const headers = values[0];
    const idColIndex = headers.indexOf('ID');
    
    if (idColIndex === -1) {
      throw new Error('Kolom ID tidak ditemukan di spreadsheet');
    }
    
    // Cari baris yang sesuai dengan ID
    for (let i = 1; i < values.length; i++) {
      if (values[i][idColIndex] === data.id) {
        // Update nilai di baris yang ditemukan
        values[i][2] = data.subjectCode;  // Kode Mapel
        values[i][4] = data.kktp;         // KKTP
        values[i][5] = data.deskripsi;    // Deskripsi
        
        // Update nama mapel jika kode mapel berubah
        const subjects = getSubjectsFromSheet();
        const subject = subjects.find(s => s.kode === data.subjectCode) || { nama: data.subjectCode };
        values[i][3] = subject.nama;      // Nama Mapel
        
        // Tulis kembali ke spreadsheet
        range.setValues(values);
        
        return {
          ...data,
          subjectName: subject.nama
        };
      }
    }
    
    throw new Error('Deskripsi dengan ID ' + data.id + ' tidak ditemukan');
    
  } catch (error) {
    console.error('Error in updateDescriptionInSheet:', error);
    throw new Error('Gagal memperbarui deskripsi');
  }
}

/**
 * Menghapus deskripsi dari spreadsheet
 * @param {String} id ID deskripsi yang akan dihapus
 * @return {Boolean} True jika berhasil dihapus
 */
function deleteDescriptionFromSheet(id) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    const range = sheet.getDataRange();
    const values = range.getValues();
    
    // Header row (asumsi kolom: No, ID, Kode Mapel, Nama Mapel, KKTP, Deskripsi)
    const headers = values[0];
    const idColIndex = headers.indexOf('ID');
    
    if (idColIndex === -1) {
      throw new Error('Kolom ID tidak ditemukan di spreadsheet');
    }
    
    // Cari baris yang sesuai dengan ID
    for (let i = 1; i < values.length; i++) {
      if (values[i][idColIndex] === id) {
        // Hapus baris (row number = i + 1 karena array dimulai dari 0)
        sheet.deleteRow(i + 1);
        
        // Perbarui nomor urut untuk mapel yang sama
        updateRowNumbers(sheet);
        
        return true;
      }
    }
    
    throw new Error('Deskripsi dengan ID ' + id + ' tidak ditemukan');
    
  } catch (error) {
    console.error('Error in deleteDescriptionFromSheet:', error);
    throw new Error('Gagal menghapus deskripsi');
  }
}

/**
 * Memperbarui nomor urut setelah penghapusan
 * @param {Sheet} sheet Sheet yang akan diupdate
 */
function updateRowNumbers(sheet) {
  const range = sheet.getDataRange();
  const values = range.getValues();
  
  // Header row (asumsi kolom: No, ID, Kode Mapel, Nama Mapel, KKTP, Deskripsi)
  const headers = values[0];
  const noColIndex = headers.indexOf('No');
  const subjectColIndex = headers.indexOf('Kode Mapel');
  
  if (noColIndex === -1 || subjectColIndex === -1) {
    return; // Kolom tidak ditemukan, skip update
  }
  
  // Group by subject code
  const subjectGroups = {};
  
  // Mulai dari baris 1 (setelah header)
  for (let i = 1; i < values.length; i++) {
    const subjectCode = values[i][subjectColIndex];
    
    if (!subjectGroups[subjectCode]) {
      subjectGroups[subjectCode] = [];
    }
    
    subjectGroups[subjectCode].push(i); // Simpan index baris
  }
  
  // Update nomor urut per kelompok subject
  Object.keys(subjectGroups).forEach(subjectCode => {
    const rowIndices = subjectGroups[subjectCode];
    
    rowIndices.forEach((rowIndex, idx) => {
      values[rowIndex][noColIndex] = idx + 1; // Update nomor urut
    });
  });
  
  // Tulis kembali ke spreadsheet
  range.setValues(values);
}

/**
 * Memperbarui banyak deskripsi sekaligus
 * @param {Array} updates Array berisi data yang akan diupdate
 * @return {Boolean} True jika berhasil
 */
function updateMultipleDescriptionsInSheet(updates) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    const range = sheet.getDataRange();
    const values = range.getValues();
    
    // Header row (asumsi kolom: No, ID, Kode Mapel, Nama Mapel, KKTP, Deskripsi)
    const headers = values[0];
    const idColIndex = headers.indexOf('ID');
    
    if (idColIndex === -1) {
      throw new Error('Kolom ID tidak ditemukan di spreadsheet');
    }
    
    // Buat map untuk pencarian lebih cepat
    const updateMap = new Map(updates.map(update => [update.id, update]));
    
    // Cari dan update semua baris yang sesuai
    for (let i = 1; i < values.length; i++) {
      const id = values[i][idColIndex];
      
      if (updateMap.has(id)) {
        const data = updateMap.get(id);
        
        // Update nilai di baris yang ditemukan
        values[i][2] = data.subjectCode;  // Kode Mapel
        values[i][4] = data.kktp;         // KKTP
        values[i][5] = data.deskripsi;    // Deskripsi
        
        // Update nama mapel jika kode mapel berubah
        const subjects = getSubjectsFromSheet();
        const subject = subjects.find(s => s.kode === data.subjectCode) || { nama: data.subjectCode };
        values[i][3] = subject.nama;      // Nama Mapel
      }
    }
    
    // Tulis kembali ke spreadsheet
    range.setValues(values);
    
    return true;
    
  } catch (error) {
    console.error('Error in updateMultipleDescriptionsInSheet:', error);
    throw new Error('Gagal memperbarui beberapa deskripsi sekaligus');
  }
}

/**
 * Mendapatkan informasi pengguna yang login
 * @return {Object} Berisi nama dan role pengguna
 */
function getUserInfo() {
  try {
    const user = Session.getActiveUser();
    return {
      name: user.getEmail().split('@')[0],
      role: 'Administrator' // Ini bisa disesuaikan dengan kebutuhan
    };
  } catch (error) {
    console.error('Error in getUserInfo:', error);
    return {
      name: 'Admin',
      role: 'Administrator'
    };
  }
}

/**
 * Generate ID unik
 * @return {String} ID unik
 */
function generateId() {
  return Utilities.getUuid();
}

// Fungsi untuk diakses dari frontend

function getAllDescriptions() {
  return getDataFromSheet();
}

function getSubjects() {
  return getSubjectsFromSheet();
}

function addDescription(data) {
  return addDescriptionToSheet(data);
}

function updateDescription(data) {
  return updateDescriptionInSheet(data);
}

function deleteDescription(id) {
  return deleteDescriptionFromSheet(id);
}

function updateMultipleDescriptions(updates) {
  return updateMultipleDescriptionsInSheet(updates);
}