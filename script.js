// ================= KONFIGURASI BLYNK =================
const BLYNK_AUTH = "gSrxdNtJ_kB3FolK5iv_f7dBr7Rpt5Qz";
const BLYNK_API = "https://blynk.cloud/external/api";

// ================= FUNGSI LOG =================
function logToTerminal(message, type = 'normal') {
    const terminal = document.getElementById('terminal');
    const time = new Date().toLocaleTimeString();
    const line = document.createElement('div');
    line.className = `terminal-line ${type}`;
    line.innerText = `[${time}] ${message}`;
    terminal.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight; // Auto-scroll ke bawah
}

// ================= KONTROL PERANGKAT (KIRIM KE BLYNK) =================
// vPin: 0 (Relay/L1) atau 1 (LED/L2)
// value: 0 (ON) atau 1 (OFF) -- Karena logika di Arduino Active LOW
async function controlBlynk(vPin, value) {
    try {
        const statusTxt = (value === 0) ? "ON" : "OFF";
        logToTerminal(`Mengirim perintah: V${vPin} = ${value} (${statusTxt})...`, 'info');
        
        // Menggunakan Blynk REST API (GET Request)
        const url = `${BLYNK_API}/update?token=${BLYNK_AUTH}&v${vPin}=${value}`;
        const response = await fetch(url);
        
        if (response.ok) {
            logToTerminal(`Berhasil! V${vPin} diatur ke ${statusTxt}`);
            updateButtonUI(vPin, value);
        } else {
            throw new Error("Gagal mengirim perintah");
        }
    } catch (error) {
        logToTerminal(`Error: ${error.message}`, 'error');
    }
}

// ================= UPDATE UI TOMBOL =================
function updateButtonUI(vPin, value) {
    // Mapping V0 ke L1, V1 ke L2
    let label = "";
    if (vPin === 0) label = "L1";
    if (vPin === 1) label = "L2";

    const btnOn = document.getElementById(`btn-${label}-on`);
    const btnOff = document.getElementById(`btn-${label}-off`);
    const card = document.getElementById(`card-${label}`);
    
    if (!btnOn || !btnOff) return;

    // Logika Active LOW: value 0 berarti ON, value 1 berarti OFF
    if (value == 0) {
        btnOn.classList.add('active-on');
        btnOff.classList.remove('active-off');
        card.style.borderColor = 'var(--accent-green)';
    } else {
        btnOn.classList.remove('active-on');
        btnOff.classList.add('active-off');
        card.style.borderColor = 'var(--accent-red)';
    }
}

// ================= POLLING STATUS DARI BLYNK =================
// Fungsi ini mengecek status V0 dan V1 setiap 3 detik
async function syncStatusFromBlynk() {
    try {
        // Baca pin V0 dan V1 sekaligus
        const url = `${BLYNK_API}/get?token=${BLYNK_AUTH}&v0&v1`;
        const response = await fetch(url);
        const data = await response.json();

        // Cek jika data valid
        if (data && !data.error) {
            if (data.v0 !== undefined) updateButtonUI(0, data.v0);
            if (data.v1 !== undefined) updateButtonUI(1, data.v1);
        }
    } catch (error) {
        // Silent error agar log tidak penuh saat koneksi terputus sesaat
        console.log("Gagal sinkronisasi:", error);
    }
}

// ================= INISIALISASI =================
// Panggil sinkronisasi pertama kali
syncStatusFromBlynk();

// Lakukan sinkronisasi setiap 3 detik
setInterval(syncStatusFromBlynk, 3000);

logToTerminal("Sistem siap. Menunggu perintah...", "info");