/* ============================================================
   IoT at Home — Centralized data store
   Satu sumber data untuk website utama & Admin Dashboard.
   Prototype: penyimpanan LocalStorage (frontend-only).
   ============================================================ */
const STORE_KEY = 'iotAtHome.data.v1';
const AUTH_KEY = 'iotAtHome.auth.v1';
const SESSION_KEY = 'iotAtHome.session.v1';
const SESSION_TTL = 8 * 60 * 60 * 1000; // 8 jam

const DEFAULT_CREDENTIALS = { username: 'admin', password: 'admin' };

/* ---------------- Seed data ---------------- */
function seedState() {
  const categories = [
    { id: 'cat_garden', name: 'Smart Garden', slug: 'smart-garden', icon: '🌱', description: 'Otomasi penyiraman, pemantauan kelembapan tanah, dan perawatan tanaman.', image: '', status: 'active' },
    { id: 'cat_room', name: 'Smart Room', slug: 'smart-room', icon: '🛋️', description: 'Kontrol suasana kamar: suhu, kelembapan, dan kenyamanan ruangan.', image: '', status: 'active' },
    { id: 'cat_lighting', name: 'Smart Lighting', slug: 'smart-lighting', icon: '💡', description: 'Lampu pintar dengan sensor gerak dan kontrol aplikasi.', image: '', status: 'active' },
    { id: 'cat_security', name: 'Smart Security', slug: 'smart-security', icon: '🔒', description: 'Kunci pintu pintar, alarm, dan pemantauan keamanan rumah.', image: '', status: 'active' },
    { id: 'cat_env', name: 'Environment Monitoring', slug: 'environment-monitoring', icon: '🌡️', description: 'Pantau kualitas udara, suhu, dan kondisi lingkungan sekitar.', image: '', status: 'active' },
    { id: 'cat_kitchen', name: 'Smart Kitchen', slug: 'smart-kitchen', icon: '🍳', description: 'Deteksi kebocoran gas, pengingat masak, dan dapur yang lebih aman.', image: '', status: 'active' },
    { id: 'cat_pet', name: 'Smart Pet Care', slug: 'smart-pet-care', icon: '🐾', description: 'Pemberi makan otomatis dan pemantauan hewan peliharaan.', image: '', status: 'active' },
    { id: 'cat_robot', name: 'Robotics', slug: 'robotics', icon: '🤖', description: 'Robot sederhana berbasis sensor dan motor untuk belajar otomasi.', image: '', status: 'active' },
    { id: 'cat_voice', name: 'Voice Assistant', slug: 'voice-assistant', icon: '🎙️', description: 'Kendali perangkat rumah dengan perintah suara.', image: '', status: 'active' },
    { id: 'cat_automation', name: 'Home Automation', slug: 'home-automation', icon: '🏠', description: 'Integrasi perangkat rumah untuk rutinitas otomatis.', image: '', status: 'active' },
    { id: 'cat_custom', name: 'Custom Projects', slug: 'custom-projects', icon: '✨', description: 'Proyek eksperimen dan ide unik dari komunitas.', image: '', status: 'active' }
  ];

  const components = [
    {
      id: 'cmp_esp32', name: 'ESP32 DevKit V1', slug: 'esp32-devkit-v1', image: '', category: 'Microcontroller',
      description: 'Mikrokontroler dengan Wi-Fi & Bluetooth built-in, cocok untuk proyek IoT berbasis cloud.',
      function: 'Menjadi otak proyek: membaca sensor, mengontrol aktuator, dan mengirim data lewat Wi-Fi.',
      price: 65000, voltage: '3.3V (input 5V)', current: '80–240 mA', communication: 'Wi-Fi, Bluetooth, I2C, SPI, UART',
      spec: 'Dual-core 240 MHz, 4 MB flash, 34 GPIO, ADC 12-bit', compatibility: 'Arduino IDE, ESP-IDF, MicroPython',
      difficulty: 'Beginner', datasheet: 'https://www.espressif.com/sites/default/files/documentation/esp32_datasheet_en.pdf',
      shopee: 'https://shopee.co.id/search?keyword=esp32%20devkit', tokopedia: 'https://www.tokopedia.com/search?q=esp32+devkit',
      notes: 'Gunakan regulator 3.3V yang stabil jika menambah banyak sensor.',
      alternatives: [
        { name: 'ESP8266 NodeMCU', price: 45000, compatibility: 'Cukup untuk sensor tunggal, GPIO lebih sedikit', description: 'Alternatif hemat jika tidak butuh Bluetooth.', type: 'Budget' },
        { name: 'ESP32-S3 DevKit', price: 110000, compatibility: 'Pin lebih banyak, cocok untuk kamera/display', description: 'Upgrade untuk proyek dengan kebutuhan I/O tinggi.', type: 'Premium' }
      ],
      createdAt: daysAgo(120, 1), updatedAt: daysAgo(30, 2)
    },
    {
      id: 'cmp_nodemcu', name: 'ESP8266 NodeMCU', slug: 'esp8266-nodemcu', image: '', category: 'Microcontroller',
      description: 'Board Wi-Fi murah dan ringkas untuk proyek IoT sederhana.',
      function: 'Menghubungkan sensor ke jaringan Wi-Fi dan mengirim data ke dashboard.',
      price: 45000, voltage: '3.3V (input 5V)', current: '70–170 mA', communication: 'Wi-Fi, I2C, SPI, UART',
      spec: '80 MHz, 4 MB flash, 11 GPIO', compatibility: 'Arduino IDE, MicroPython',
      difficulty: 'Beginner', datasheet: 'https://www.espressif.com/sites/default/files/documentation/0a-esp8266ex_datasheet_en.pdf',
      shopee: 'https://shopee.co.id/search?keyword=nodemcu%20esp8266', tokopedia: 'https://www.tokopedia.com/search?q=nodemcu',
      notes: 'Hanya satu pin analog (A0) — cukup untuk satu sensor analog.',
      alternatives: [{ name: 'ESP32 DevKit V1', price: 65000, compatibility: 'Drop-in upgrade, pin analog lebih banyak', description: 'Pilih jika butuh lebih dari satu sensor analog.', type: 'Recommended' }],
      createdAt: daysAgo(118, 2), updatedAt: daysAgo(45, 1)
    },
    {
      id: 'cmp_arduino', name: 'Arduino Uno R3', slug: 'arduino-uno-r3', image: '', category: 'Microcontroller',
      description: 'Board klasik untuk belajar elektronika dengan dokumentasi paling lengkap.',
      function: 'Mengontrol komponen dengan logika sederhana tanpa koneksi internet.',
      price: 120000, voltage: '5V', current: '40–200 mA', communication: 'UART, I2C, SPI',
      spec: 'ATmega328P, 16 MHz, 14 digital pin, 6 analog pin', compatibility: 'Arduino IDE',
      difficulty: 'Beginner', datasheet: 'https://docs.arduino.cc/hardware/uno-rev3/',
      shopee: 'https://shopee.co.id/search?keyword=arduino%20uno', tokopedia: 'https://www.tokopedia.com/search?q=arduino+uno',
      notes: 'Butuh modul Wi-Fi tambahan (ESP-01) jika ingin terhubung internet.',
      alternatives: [{ name: 'Arduino Nano', price: 75000, compatibility: 'Sama secara fungsional, ukuran lebih kecil', description: 'Cocok untuk proyek yang butuh board ringkas.', type: 'Budget' }],
      createdAt: daysAgo(116, 3), updatedAt: daysAgo(60, 2)
    },
    {
      id: 'cmp_dht22', name: 'Sensor DHT22 (AM2302)', slug: 'sensor-dht22', image: '', category: 'Sensor',
      description: 'Sensor suhu dan kelembapan digital dengan akurasi baik.',
      function: 'Mengukur suhu (°C) dan kelembapan udara (%) di sekitar perangkat.',
      price: 32000, voltage: '3.3–5V', current: '1.5 mA', communication: 'Digital one-wire',
      spec: 'Suhu -40..80 °C (±0.5 °C), kelembapan 0–100% RH (±2%)', compatibility: 'ESP32, ESP8266, Arduino',
      difficulty: 'Beginner', datasheet: 'https://www.sparkfun.com/datasheets/Sensors/Temperature/DHT22.pdf',
      shopee: 'https://shopee.co.id/search?keyword=dht22', tokopedia: 'https://www.tokopedia.com/search?q=dht22',
      notes: 'Butuh pull-up 10kΩ pada jalur data.',
      alternatives: [{ name: 'DHT11', price: 12000, compatibility: 'Pin sama, akurasi lebih rendah', description: 'Versi hemat untuk pemantauan kasar.', type: 'Budget' }, { name: 'SHT31', price: 78000, compatibility: 'I2C, akurasi tinggi', description: 'Pilihan premium untuk data yang lebih presisi.', type: 'Premium' }],
      createdAt: daysAgo(112, 4), updatedAt: daysAgo(20, 1)
    },
    {
      id: 'cmp_soil', name: 'Soil Moisture Sensor', slug: 'soil-moisture-sensor', image: '', category: 'Sensor',
      description: 'Sensor kadar air tanah untuk tanaman.',
      function: 'Mendeteksi kelembapan tanah sebagai dasar otomasi penyiraman.',
      price: 15000, voltage: '3.3–5V', current: '5 mA', communication: 'Analog / Digital',
      spec: 'Output analog + komparator digital, probe tahan korosi ringan', compatibility: 'ESP32, ESP8266, Arduino',
      difficulty: 'Beginner', datasheet: 'https://components101.com/sensors/soil-moisture-sensor',
      shopee: 'https://shopee.co.id/search?keyword=soil%20moisture%20sensor', tokopedia: 'https://www.tokopedia.com/search?q=soil+moisture',
      notes: 'Jangan rendam bagian PCB, hanya probe yang masuk tanah.',
      alternatives: [{ name: 'Capacitive Soil Moisture v1.2', price: 28000, compatibility: 'Analog, tidak mudah korosi', description: 'Lebih awet untuk pemakaian jangka panjang.', type: 'Recommended' }],
      createdAt: daysAgo(110, 5), updatedAt: daysAgo(18, 3)
    },
    {
      id: 'cmp_pir', name: 'PIR Motion Sensor HC-SR501', slug: 'pir-hc-sr501', image: '', category: 'Sensor',
      description: 'Sensor gerak inframerah pasif dengan jangkauan hingga 7 meter.',
      function: 'Mendeteksi pergerakan orang untuk menyalakan lampu atau alarm.',
      price: 18000, voltage: '5V', current: '50 µA (idle)', communication: 'Digital output',
      spec: 'Jangkauan 7 m, sudut 110°, delay 5–300 detik', compatibility: 'ESP32, ESP8266, Arduino',
      difficulty: 'Beginner', datasheet: 'https://www.mpja.com/download/31227sc.pdf',
      shopee: 'https://shopee.co.id/search?keyword=pir%20hc-sr501', tokopedia: 'https://www.tokopedia.com/search?q=pir+sensor',
      notes: 'Butuh waktu kalibrasi ±30 detik setelah dinyalakan.',
      alternatives: [{ name: 'RCWL-0516 Radar', price: 16000, compatibility: 'Bisa mendeteksi menembus kaca tipis', description: 'Alternatif untuk deteksi tanpa lensa fresnel.', type: 'Budget' }],
      createdAt: daysAgo(108), updatedAt: daysAgo(25)
    },
    {
      id: 'cmp_ultrasonic', name: 'Ultrasonic HC-SR04', slug: 'ultrasonic-hc-sr04', image: '', category: 'Sensor',
      description: 'Sensor jarak ultrasonik 2–400 cm.',
      function: 'Mengukur jarak objek untuk deteksi level air atau navigasi robot.',
      price: 15000, voltage: '5V', current: '15 mA', communication: 'Trigger/Echo (digital)',
      spec: 'Rentang 2–400 cm, akurasi ±3 mm', compatibility: 'ESP32 (via divider), Arduino',
      difficulty: 'Beginner', datasheet: 'https://cdn.sparkfun.com/datasheets/Sensors/Proximity/HCSR04.pdf',
      shopee: 'https://shopee.co.id/search?keyword=hc-sr04', tokopedia: 'https://www.tokopedia.com/search?q=hc-sr04',
      notes: 'Pin Echo 5V — gunakan pembagi tegangan bila memakai ESP32.',
      alternatives: [{ name: 'VL53L0X ToF', price: 42000, compatibility: 'I2C, 3.3V langsung', description: 'Lebih presisi untuk jarak pendek.', type: 'Premium' }],
      createdAt: daysAgo(106, 1), updatedAt: daysAgo(22, 2)
    },
    {
      id: 'cmp_mq2', name: 'Sensor Gas MQ-2', slug: 'sensor-gas-mq-2', image: '', category: 'Sensor',
      description: 'Sensor gas untuk LPG, asap, dan metana.',
      function: 'Mendeteksi kebocoran gas di dapur dan memicu alarm.',
      price: 22000, voltage: '5V', current: '150 mA', communication: 'Analog / Digital',
      spec: 'Mendeteksi LPG, propana, metana, asap; pemanasan 24 jam', compatibility: 'ESP32 (ADC), Arduino',
      difficulty: 'Beginner', datasheet: 'https://www.pololu.com/file/0J309/MQ2.pdf',
      shopee: 'https://shopee.co.id/search?keyword=mq-2%20sensor', tokopedia: 'https://www.tokopedia.com/search?q=mq2+sensor',
      notes: 'Perlu pemanasan awal untuk hasil stabil; bukan alat keselamatan bersertifikat.',
      alternatives: [{ name: 'MQ-9 (CO & gas mudah terbakar)', price: 26000, compatibility: 'Pin sama', description: 'Tambahan deteksi karbon monoksida.', type: 'Recommended' }],
      createdAt: daysAgo(104, 2), updatedAt: daysAgo(16, 1)
    },
    {
      id: 'cmp_mq135', name: 'Sensor Kualitas Udara MQ-135', slug: 'sensor-mq-135', image: '', category: 'Sensor',
      description: 'Sensor kualitas udara untuk asap, CO2, dan gas lain.',
      function: 'Memantau kualitas udara ruangan secara relatif.',
      price: 28000, voltage: '5V', current: '150 mA', communication: 'Analog / Digital',
      spec: 'Sensitif terhadap NH3, NOx, alkohol, asap, CO2', compatibility: 'ESP32 (ADC), Arduino',
      difficulty: 'Intermediate', datasheet: 'https://www.olimex.com/Products/Components/Sensors/Gas/SNS-MQ135/resources/SNS-MQ135.pdf',
      shopee: 'https://shopee.co.id/search?keyword=mq-135', tokopedia: 'https://www.tokopedia.com/search?q=mq135',
      notes: 'Nilai ADC perlu dikalibrasi di ruangan bersih untuk baseline.',
      alternatives: [{ name: 'SGP30 TVOC/eCO2', price: 115000, compatibility: 'I2C 3.3V', description: 'Sensor digital dengan output terkalibrasi.', type: 'Premium' }],
      createdAt: daysAgo(102, 3), updatedAt: daysAgo(15, 2)
    },
    {
      id: 'cmp_relay', name: 'Modul Relay 4 Channel', slug: 'modul-relay-4-channel', image: '', category: 'Actuator',
      description: 'Modul relay untuk mengontrol perangkat 220V dari mikrokontroler.',
      function: 'Menyalakan atau mematikan pompa, lampu, atau katup listrik.',
      price: 25000, voltage: '5V (koil)', current: '20 mA per channel', communication: 'Digital input',
      spec: '4 channel, kontak 10A 250VAC, optocoupler', compatibility: 'ESP32, ESP8266, Arduino',
      difficulty: 'Intermediate', datasheet: 'https://components101.com/switches/5v-relay-module',
      shopee: 'https://shopee.co.id/search?keyword=modul%20relay%204%20channel', tokopedia: 'https://www.tokopedia.com/search?q=relay+4+channel',
      notes: 'Hati-hati tegangan 220V. Gunakan kotak isolasi dan jangan menyentuh saat aktif.',
      alternatives: [{ name: 'Modul Relay 1 Channel', price: 10000, compatibility: 'Cukup untuk satu beban', description: 'Lebih murah untuk proyek satu aktuator.', type: 'Budget' }],
      createdAt: daysAgo(100, 4), updatedAt: daysAgo(19, 1)
    },
    {
      id: 'cmp_pump', name: 'Pompa Air Mini 5V', slug: 'pompa-air-mini-5v', image: '', category: 'Actuator',
      description: 'Pompa submersible kecil untuk irigasi otomatis.',
      function: 'Mengalirkan air dari wadah ke tanaman.',
      price: 35000, voltage: '3–6V DC', current: '120–220 mA', communication: '—',
      spec: 'Laju 1.2–1.8 L/menit, head max 40 cm', compatibility: 'Relay / MOSFET driver',
      difficulty: 'Beginner', datasheet: 'https://components101.com/motors/mini-submersible-water-pump',
      shopee: 'https://shopee.co.id/search?keyword=pompa%20air%205v', tokopedia: 'https://www.tokopedia.com/search?q=pompa+air+mini',
      notes: 'Jangan disambung langsung ke pin GPIO — gunakan relay.',
      alternatives: [{ name: 'Solenoid Valve 12V', price: 55000, compatibility: 'Butuh adaptor 12V + relay', description: 'Cocok untuk jalur air bertekanan.', type: 'Premium' }],
      createdAt: daysAgo(98, 5), updatedAt: daysAgo(21, 2)
    },
    {
      id: 'cmp_led', name: 'LED Strip WS2812B (1 m)', slug: 'led-strip-ws2812b', image: '', category: 'Actuator',
      description: 'LED RGB addressable untuk pencahayaan dekoratif.',
      function: 'Memberi pencahayaan berwarna yang bisa diatur per LED.',
      price: 55000, voltage: '5V', current: '60 mA per LED (maks)', communication: 'Digital one-wire',
      spec: '60 LED/m, warna 24-bit, dapat dirangkai', compatibility: 'ESP32, ESP8266, Arduino',
      difficulty: 'Beginner', datasheet: 'https://cdn-shop.adafruit.com/datasheets/WS2812B.pdf',
      shopee: 'https://shopee.co.id/search?keyword=ws2812b%201m', tokopedia: 'https://www.tokopedia.com/search?q=ws2812b',
      notes: 'Gunakan power supply terpisah untuk strip panjang.',
      alternatives: [{ name: 'LED Strip 5050 RGB (non-addressable)', price: 30000, compatibility: 'Butuh transistor 3 channel', description: 'Lebih murah, warna seragam.', type: 'Budget' }],
      createdAt: daysAgo(96), updatedAt: daysAgo(28, 1)
    },
    {
      id: 'cmp_servo', name: 'Micro Servo SG90', slug: 'micro-servo-sg90', image: '', category: 'Actuator',
      description: 'Servo kecil dengan torsi 1.8 kg·cm.',
      function: 'Menggerakkan mekanisme seperti pintu feeder atau katup.',
      price: 18000, voltage: '4.8–6V', current: '100–250 mA', communication: 'PWM',
      spec: 'Rotasi 0–180°, torsi 1.8 kg·cm', compatibility: 'ESP32, ESP8266, Arduino',
      difficulty: 'Beginner', datasheet: 'http://www.ee.ic.ac.uk/pcheung/teaching/DE1_EE/stores/sg90_datasheet.pdf',
      shopee: 'https://shopee.co.id/search?keyword=servo%20sg90', tokopedia: 'https://www.tokopedia.com/search?q=servo+sg90',
      notes: 'Jangan diberi beban melebihi torsi — motor akan bergetar.',
      alternatives: [{ name: 'Servo MG996R', price: 45000, compatibility: 'Butuh arus lebih besar', description: 'Torsi lebih kuat untuk mekanik berat.', type: 'Premium' }],
      createdAt: daysAgo(94, 1), updatedAt: daysAgo(24, 2)
    },
    {
      id: 'cmp_rfid', name: 'RFID Reader RC522', slug: 'rfid-reader-rc522', image: '', category: 'Sensor',
      description: 'Modul pembaca kartu RFID 13.56 MHz dengan kartu dan tag.',
      function: 'Membaca ID kartu untuk akses pintu atau absensi.',
      price: 28000, voltage: '3.3V', current: '13–26 mA', communication: 'SPI',
      spec: '13.56 MHz, jangkauan ±3 cm, termasuk kartu + tag', compatibility: 'ESP32, Arduino (3.3V)',
      difficulty: 'Intermediate', datasheet: 'https://www.nxp.com/docs/en/data-sheet/MFRC522.pdf',
      shopee: 'https://shopee.co.id/search?keyword=rc522', tokopedia: 'https://www.tokopedia.com/search?q=rc522',
      notes: 'Wajib 3.3V — jangan hubungkan ke 5V.',
      alternatives: [{ name: 'Keypad 4x4', price: 18000, compatibility: 'Butuh pin digital lebih banyak', description: 'Alternatif akses dengan PIN.', type: 'Budget' }],
      createdAt: daysAgo(92, 2), updatedAt: daysAgo(26, 1)
    },
    {
      id: 'cmp_buzzer', name: 'Active Buzzer 5V', slug: 'active-buzzer-5v', image: '', category: 'Output',
      description: 'Buzzer aktif untuk alarm dan notifikasi bunyi.',
      function: 'Memberi peringatan suara saat kondisi tertentu terpenuhi.',
      price: 5000, voltage: '3.3–5V', current: '25 mA', communication: 'Digital output',
      spec: 'Frekuensi ±2.3 kHz, suara 85 dB', compatibility: 'ESP32, ESP8266, Arduino',
      difficulty: 'Beginner', datasheet: 'https://components101.com/buzzer-pinout-working-datasheet',
      shopee: 'https://shopee.co.id/search?keyword=active%20buzzer%205v', tokopedia: 'https://www.tokopedia.com/search?q=buzzer+aktif',
      notes: 'Tambahkan resistor 100Ω untuk mengurangi arus.',
      alternatives: [{ name: 'Speaker 8Ω + amplifier', price: 20000, compatibility: 'Butuh modul audio', description: 'Untuk nada kustom.', type: 'Premium' }],
      createdAt: daysAgo(90, 3), updatedAt: daysAgo(23)
    },
    {
      id: 'cmp_oled', name: 'OLED Display 0.96" I2C', slug: 'oled-display-096-i2c', image: '', category: 'Display',
      description: 'Layar OLED kecil untuk menampilkan data sensor.',
      function: 'Menampilkan suhu, status, atau pesan langsung di perangkat.',
      price: 38000, voltage: '3.3–5V', current: '20 mA', communication: 'I2C',
      spec: '128×64 piksel, SSD1306, alamat I2C 0x3C', compatibility: 'ESP32, ESP8266, Arduino',
      difficulty: 'Beginner', datasheet: 'https://cdn-shop.adafruit.com/datasheets/SSD1306.pdf',
      shopee: 'https://shopee.co.id/search?keyword=oled%200.96%20i2c', tokopedia: 'https://www.tokopedia.com/search?q=oled+096',
      notes: 'Beberapa modul hanya bekerja di 3.3V.',
      alternatives: [{ name: 'LCD 16x2 I2C', price: 32000, compatibility: 'Karakter saja', description: 'Lebih mudah dibaca di siang hari.', type: 'Budget' }],
      createdAt: daysAgo(88, 4), updatedAt: daysAgo(17, 1)
    },
    {
      id: 'cmp_rtc', name: 'RTC DS3231', slug: 'rtc-ds3231', image: '', category: 'Module',
      description: 'Real-time clock dengan baterai cadangan.',
      function: 'Menjaga waktu tetap akurat meski perangkat restart.',
      price: 22000, voltage: '3.3–5V', current: '200 µA', communication: 'I2C',
      spec: 'Akurasi ±2 menit/tahun, alarm, suhu terintegrasi', compatibility: 'ESP32, ESP8266, Arduino',
      difficulty: 'Intermediate', datasheet: 'https://datasheets.maximintegrated.com/en/ds/DS3231.pdf',
      shopee: 'https://shopee.co.id/search?keyword=ds3231', tokopedia: 'https://www.tokopedia.com/search?q=ds3231',
      notes: 'Gunakan baterai CR2032 baru untuk cadangan waktu.',
      alternatives: [{ name: 'NTP via Wi-Fi', price: 0, compatibility: 'Butuh koneksi internet', description: 'Gratis jika perangkat selalu online.', type: 'Budget' }],
      createdAt: daysAgo(86, 5), updatedAt: daysAgo(14, 2)
    },
    {
      id: 'cmp_power', name: 'Power Supply 5V 2A + Adaptor', slug: 'power-supply-5v-2a', image: '', category: 'Power',
      description: 'Adaptor 5V 2A dengan jack DC untuk memberi daya proyek.',
      function: 'Menyuplai daya stabil untuk board, sensor, dan aktuator.',
      price: 30000, voltage: '5V', current: '2 A', communication: '—',
      spec: 'Input 100–240VAC, output 5V 2A, jack 5.5 mm', compatibility: 'Semua board 5V',
      difficulty: 'Beginner', datasheet: 'https://components101.com/power-supply/5v-2a-power-supply',
      shopee: 'https://shopee.co.id/search?keyword=adaptor%205v%202a', tokopedia: 'https://www.tokopedia.com/search?q=adaptor+5v+2a',
      notes: 'Pilih adaptor dengan arus minimal 1.5× kebutuhan total.',
      alternatives: [{ name: 'Power Bank 5V', price: 85000, compatibility: 'Portabel, kapasitas terbatas', description: 'Cocok untuk demo tanpa stopkontak.', type: 'Recommended' }],
      createdAt: daysAgo(84), updatedAt: daysAgo(13, 1)
    },
    {
      id: 'cmp_jumper', name: 'Jumper Wires + Breadboard', slug: 'jumper-wires-breadboard', image: '', category: 'Prototyping',
      description: 'Set kabel jumper dan breadboard 830 titik untuk prototipe.',
      function: 'Menghubungkan komponen tanpa solder saat pengujian.',
      price: 25000, voltage: '—', current: '1 A', communication: '—',
      spec: 'Breadboard 830 titik, 60 kabel jumper', compatibility: 'Semua board',
      difficulty: 'Beginner', datasheet: 'https://components101.com/misc/breadboard',
      shopee: 'https://shopee.co.id/search?keyword=breadboard%20jumper', tokopedia: 'https://www.tokopedia.com/search?q=breadboard+jumper',
      notes: 'Untuk instalasi permanen, solder ke PCB dot matrix.',
      alternatives: [{ name: 'PCB Dot Matrix', price: 12000, compatibility: 'Butuh solder', description: 'Lebih rapi dan tahan lama.', type: 'Premium' }],
      createdAt: daysAgo(82, 1), updatedAt: daysAgo(12, 2)
    },
    {
      id: 'cmp_microsd', name: 'MicroSD Card Module', slug: 'microsd-card-module', image: '', category: 'Module',
      description: 'Modul pembaca kartu microSD untuk penyimpanan data lokal.',
      function: 'Menyimpan log sensor saat perangkat offline.',
      price: 15000, voltage: '3.3–5V', current: '10 mA', communication: 'SPI',
      spec: 'Mendukung FAT16/FAT32, kartu hingga 32 GB', compatibility: 'ESP32, Arduino',
      difficulty: 'Intermediate', datasheet: 'https://components101.com/modules/micro-sd-card-module',
      shopee: 'https://shopee.co.id/search?keyword=microsd%20module', tokopedia: 'https://www.tokopedia.com/search?q=microsd+module',
      notes: 'Gunakan kartu microSD kelas 10 agar penulisan stabil.',
      alternatives: [{ name: 'LittleFS (flash internal)', price: 0, compatibility: 'Kapasitas kecil', description: 'Tanpa hardware tambahan.', type: 'Budget' }],
      createdAt: daysAgo(80, 2), updatedAt: daysAgo(11, 1)
    },
    {
      id: 'cmp_waterlevel', name: 'Water Level Sensor', slug: 'water-level-sensor', image: '', category: 'Sensor',
      description: 'Sensor level air untuk wadah penampung.',
      function: 'Mendeteksi ketinggian air agar pompa tidak kering.',
      price: 12000, voltage: '3.3–5V', current: '5 mA', communication: 'Analog',
      spec: '10 area pembacaan, output analog 0–4.2V', compatibility: 'ESP32, Arduino',
      difficulty: 'Beginner', datasheet: 'https://components101.com/sensors/water-level-sensor',
      shopee: 'https://shopee.co.id/search?keyword=water%20level%20sensor', tokopedia: 'https://www.tokopedia.com/search?q=water+level+sensor',
      notes: 'Bersihkan probe secara berkala untuk menjaga akurasi.',
      alternatives: [{ name: 'Float Switch', price: 18000, compatibility: 'Digital on/off', description: 'Lebih tahan lama untuk indikator batas.', type: 'Recommended' }],
      createdAt: daysAgo(78, 3), updatedAt: daysAgo(10, 2)
    },
    {
      id: 'cmp_stepper', name: 'Stepper NEMA17 + Driver A4988', slug: 'stepper-nema17-a4988', image: '', category: 'Actuator',
      description: 'Motor stepper dengan driver untuk gerakan presisi.',
      function: 'Menggerakkan gorden atau mekanisme rel dengan akurasi tinggi.',
      price: 120000, voltage: '12V (motor), 3.3–5V (logic)', current: '1.5 A', communication: 'Step/Dir',
      spec: '1.8°/step, torsi 40 N·cm', compatibility: 'ESP32 + driver, Arduino',
      difficulty: 'Advanced', datasheet: 'https://www.pololu.com/product/1182',
      shopee: 'https://shopee.co.id/search?keyword=nema17%20a4988', tokopedia: 'https://www.tokopedia.com/search?q=nema17+a4988',
      notes: 'Atur batas arus driver sebelum dipakai agar motor tidak overheat.',
      alternatives: [{ name: 'Motor DC + limit switch', price: 45000, compatibility: 'Butuh kalibrasi posisi', description: 'Lebih murah untuk buka-tutup sederhana.', type: 'Budget' }],
      createdAt: daysAgo(76, 4), updatedAt: daysAgo(9, 1)
    }
  ];

  const projects = [
    {
      id: 'prj_plant', slug: 'smart-plant-watering-system', name: 'Smart Plant Watering System',
      image: '', category: 'cat_garden', difficulty: 'Beginner', duration: '1–2 hari', budget: 250000,
      type: 'default', status: 'published', tags: ['otomasi', 'tanaman', 'esp32', 'kelembapan'],
      shortDescription: 'Siram tanaman otomatis saat tanah mulai kering, lengkap dengan notifikasi.',
      description: 'Proyek ini membaca kelembapan tanah secara berkala dan menyalakan pompa air ketika nilai sensor melewati batas kering. Cocok untuk tanaman dalam pot di balkon atau ruangan yang sering ditinggal.',
      purpose: 'Menjaga tanaman tetap terawat tanpa harus menyiram setiap hari.',
      outcome: 'Penyiraman otomatis berdasarkan kondisi tanah nyata, bukan jadwal tetap.',
      features: ['Penyiraman otomatis berdasarkan kelembapan tanah', 'Ambang batas kering dapat diubah di kode', 'Indikator LED & status di serial monitor', 'Notifikasi Wi-Fi (opsional)', 'Proteksi pompa saat wadah air kosong'],
      howItWorks: ['Sensor kelembapan membaca kondisi tanah', 'ESP32 membandingkan nilai dengan ambang batas', 'Relay menyalakan pompa selama durasi tertentu', 'Sistem menunggu 30 menit sebelum membaca ulang'],
      architecture: {
        description: 'ESP32 menjadi pusat kendali yang membaca sensor analog dan mengaktifkan pompa melalui relay.',
        input: 'Soil moisture sensor (analog)', controller: 'ESP32 DevKit V1', processing: 'Threshold + delay anti-penyiraman berlebih',
        output: 'Pompa 5V via relay + LED indikator', communication: 'Wi-Fi (opsional), Serial monitor'
      },
      components: [
        { componentId: 'cmp_esp32', qty: 1, mandatory: true, notes: 'Gunakan board dengan regulator 3.3V stabil.' },
        { componentId: 'cmp_soil', qty: 1, mandatory: true, notes: 'Tanam probe ±5 cm ke dalam tanah.' },
        { componentId: 'cmp_relay', qty: 1, mandatory: true, notes: 'Gunakan channel 1 saja untuk pompa.' },
        { componentId: 'cmp_pump', qty: 1, mandatory: true, notes: 'Rendam pompa di wadah air bersih.' },
        { componentId: 'cmp_jumper', qty: 1, mandatory: true, notes: 'Untuk prototipe di breadboard.' },
        { componentId: 'cmp_power', qty: 1, mandatory: true, notes: 'Adaptor 5V 2A untuk board + pompa.' },
        { componentId: 'cmp_waterlevel', qty: 1, mandatory: false, notes: 'Opsional: cegah pompa menyala saat air habis.' }
      ],
      buildGuide: [
        { title: 'Siapkan & uji board', description: 'Pastikan ESP32 terbaca di komputer.', image: '', instructions: ['Install Arduino IDE dan board manager ESP32.', 'Pilih board "ESP32 Dev Module" dan port yang benar.', 'Upload sketch Blink untuk memastikan board berfungsi.'], notes: 'Jika board tidak terdeteksi, coba kabel USB lain.', warning: '' },
        { title: 'Rangkai sensor kelembapan', description: 'Hubungkan sensor ke pin analog ESP32.', image: '', instructions: ['VCC sensor → 3.3V ESP32.', 'GND sensor → GND ESP32.', 'AO sensor → GPIO34 (ADC1).'], notes: 'Gunakan GPIO34/35/36/39 yang aman untuk ADC.', warning: '' },
        { title: 'Hubungkan relay & pompa', description: 'Relay memisahkan arus pompa dari board.', image: '', instructions: ['IN relay → GPIO26.', 'VCC relay → VIN 5V, GND → GND.', 'Pompa dihubungkan ke kontak COM & NO relay.', 'Suplai pompa dari adaptor 5V, bukan dari pin board.'], notes: 'Uji relay tanpa pompa terlebih dahulu.', warning: 'Jangan menyentuh bagian 220V. Proyek ini memakai 5V DC, tetap berhati-hati dengan air dan listrik.' },
        { title: 'Upload kode & kalibrasi', description: 'Sesuaikan ambang batas dengan kondisi tanah.', image: '', instructions: ['Buka Serial Monitor 115200 baud.', 'Catat nilai saat tanah kering dan basah.', 'Ubah THRESHOLD_DRY sesuai hasil pengukuran.', 'Uji dengan menaruh probe di tanah kering.'], notes: 'Nilai ADC berbeda tiap sensor — selalu kalibrasi.', warning: '' },
        { title: 'Pasang di pot & uji 24 jam', description: 'Pastikan tidak ada penyiraman berlebih.', image: '', instructions: ['Rapikan kabel dan letakkan elektronik jauh dari air.', 'Jalankan selama 24 jam dan pantau log.', 'Periksa tanah setelah penyiraman pertama.'], notes: 'Tambahkan water level sensor agar pompa aman.', warning: '' }
      ],
      testing: [
        { name: 'Uji pembacaan sensor', description: 'Bandingkan nilai ADC dengan kondisi tanah nyata.', expected: 'Nilai turun jelas saat tanah basah dan naik saat kering.', instructions: 'Buka Serial Monitor, catat nilai pada tanah kering, lembap, dan basah.' },
        { name: 'Uji relay & pompa', description: 'Pastikan pompa menyala hanya saat dibutuhkan.', expected: 'Pompa menyala 3–5 detik saat nilai melewati ambang, lalu berhenti.', instructions: 'Paksa nilai ambang di kode untuk memicu penyiraman.' },
        { name: 'Uji anti double-watering', description: 'Pastikan ada jeda antar penyiraman.', expected: 'Tidak ada penyiraman baru dalam 30 menit.', instructions: 'Amati log selama 1 jam tanpa mengubah tanah.' }
      ],
      troubleshooting: [
        { problem: 'Pompa tidak menyala', cause: 'Relay tidak mendapat sinyal atau daya pompa kurang.', solution: 'Cek koneksi IN relay ke GPIO26, pastikan adaptor 5V terhubung, dan uji relay dengan LED.' },
        { problem: 'Nilai sensor selalu 0 atau 4095', cause: 'Pin ADC salah atau sensor tidak mendapat daya.', solution: 'Gunakan GPIO34, pastikan VCC 3.3V, dan ukur tegangan AO dengan multimeter.' },
        { problem: 'Tanah terlalu basah', cause: 'Ambang batas terlalu tinggi atau durasi pompa terlalu lama.', solution: 'Naikkan THRESHOLD_DRY dan turunkan durasi pompa menjadi 3 detik.' }
      ],
      upgrades: ['Tambahkan notifikasi Telegram saat penyiraman terjadi.', 'Gunakan sensor kapasitif agar lebih tahan korosi.', 'Tambahkan dashboard web untuk melihat grafik kelembapan.'],
      wiring: 'ESP32 GPIO34 → AO sensor, GPIO26 → IN relay. Relay channel 1 memutus jalur positif pompa 5V.',
      sourceCode: `// Smart Plant Watering — ESP32
#define SOIL_PIN 34
#define RELAY_PIN 26
#define THRESHOLD_DRY 2600   // kalibrasi ulang sesuai sensor
#define PUMP_MS 4000
#define COOLDOWN_MS 30UL * 60UL * 1000UL

unsigned long lastWater = 0;

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH); // relay aktif LOW
}

void loop() {
  int soil = analogRead(SOIL_PIN);
  Serial.printf("Soil: %d\\n", soil);

  bool dry = soil > THRESHOLD_DRY;
  bool cooldownDone = millis() - lastWater > COOLDOWN_MS;

  if (dry && cooldownDone) {
    digitalWrite(RELAY_PIN, LOW);
    delay(PUMP_MS);
    digitalWrite(RELAY_PIN, HIGH);
    lastWater = millis();
    Serial.println("Penyiraman selesai");
  }
  delay(2000);
}`,
      views: 0, createdAt: daysAgo(64, 1), updatedAt: daysAgo(6, 2)
    },
    {
      id: 'prj_climate', slug: 'smart-room-climate-monitor', name: 'Smart Room Climate Monitor',
      image: '', category: 'cat_room', difficulty: 'Beginner', duration: '1 hari', budget: 170000,
      type: 'default', status: 'published', tags: ['suhu', 'kelembapan', 'oled', 'esp32'],
      shortDescription: 'Pantau suhu dan kelembapan kamar langsung dari layar OLED kecil.',
      description: 'Alat pemantau iklim ruangan dengan tampilan lokal dan opsi pengiriman data ke spreadsheet atau dashboard web. Ideal sebagai proyek pertama untuk memahami sensor digital.',
      purpose: 'Mengetahui kenyamanan ruangan dan mengambil keputusan ventilasi.',
      outcome: 'Data suhu & kelembapan real-time dengan indikator status nyaman/tidak.',
      features: ['Pembacaan suhu & kelembapan tiap 5 detik', 'Tampilan OLED 128×64', 'Indikator "nyaman" berdasarkan ambang', 'Data dapat dikirim via Wi-Fi', 'Riwayat minimum/maksimum harian'],
      howItWorks: ['DHT22 membaca suhu dan kelembapan', 'ESP32 menghitung status kenyamanan', 'OLED menampilkan nilai terkini', 'Data opsional dikirim ke server setiap menit'],
      architecture: { description: 'Sensor digital DHT22 dibaca ESP32 dan ditampilkan ke OLED melalui I2C.', input: 'DHT22 (suhu & kelembapan)', controller: 'ESP32 DevKit V1', processing: 'Rata-rata 5 pembacaan + klasifikasi status', output: 'OLED 0.96" + LED status', communication: 'I2C (OLED), Wi-Fi (opsional)' },
      components: [
        { componentId: 'cmp_esp32', qty: 1, mandatory: true, notes: '' },
        { componentId: 'cmp_dht22', qty: 1, mandatory: true, notes: 'Tambahkan resistor pull-up 10kΩ.' },
        { componentId: 'cmp_oled', qty: 1, mandatory: true, notes: 'Alamat I2C biasanya 0x3C.' },
        { componentId: 'cmp_jumper', qty: 1, mandatory: true, notes: '' },
        { componentId: 'cmp_power', qty: 1, mandatory: true, notes: '' }
      ],
      buildGuide: [
        { title: 'Rangkai I2C OLED', description: 'Hubungkan OLED ke ESP32.', image: '', instructions: ['SDA → GPIO21, SCL → GPIO22.', 'VCC → 3.3V, GND → GND.', 'Jalankan I2C scanner untuk memastikan alamat 0x3C.'], notes: 'Jika layar gelap, cek alamat I2C.', warning: '' },
        { title: 'Pasang DHT22', description: 'Sensor suhu kelembapan pada pin digital.', image: '', instructions: ['VCC → 3.3V, GND → GND.', 'DATA → GPIO4.', 'Pasang resistor 10kΩ antara VCC dan DATA.'], notes: 'Jauhkan dari sumber panas langsung.', warning: '' },
        { title: 'Upload firmware', description: 'Install library DHT dan Adafruit SSD1306.', image: '', instructions: ['Install library "DHT sensor library" dan "Adafruit SSD1306".', 'Sesuaikan pin pada kode.', 'Upload dan buka Serial Monitor.'], notes: '', warning: '' },
        { title: 'Kalibrasi & casing', description: 'Bandingkan dengan termometer ruangan.', image: '', instructions: ['Bandingkan pembacaan dengan termometer.', 'Beri selisih kalibrasi pada kode bila perlu.', 'Masukkan ke casing dengan ventilasi.'], notes: 'Jangan tutup rapat sensor DHT22.', warning: '' }
      ],
      testing: [
        { name: 'Uji akurasi suhu', description: 'Bandingkan dengan termometer.', expected: 'Selisih ≤ 1 °C setelah kalibrasi.', instructions: 'Letakkan berdampingan selama 10 menit lalu bandingkan.' },
        { name: 'Uji tampilan OLED', description: 'Pastikan semua baris tampil.', expected: 'Suhu, kelembapan, dan status terlihat tanpa terpotong.', instructions: 'Nyalakan ulang dan amati layar.' }
      ],
      troubleshooting: [
        { problem: 'OLED tidak menampilkan apa pun', cause: 'Alamat I2C salah atau kabel tertukar.', solution: 'Jalankan I2C scanner, cek SDA/SCL, dan pastikan VCC 3.3V.' },
        { problem: 'Pembacaan DHT22 gagal (NaN)', cause: 'Interval pembacaan terlalu cepat.', solution: 'Beri jeda minimal 2 detik antar pembacaan dan cek pull-up.' }
      ],
      upgrades: ['Tambahkan grafik riwayat di OLED.', 'Kirim data ke Google Sheets via Apps Script.', 'Tambahkan kipas otomatis saat suhu di atas 30 °C.'],
      wiring: 'DHT22 DATA → GPIO4 dengan pull-up 10kΩ. OLED SDA → GPIO21, SCL → GPIO22.',
      sourceCode: `// Smart Room Climate Monitor — ESP32
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <DHT.h>

#define DHTPIN 4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);
Adafruit_SSD1306 display(128, 64, &Wire, -1);

void setup() {
  Serial.begin(115200);
  dht.begin();
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  display.clearDisplay();
}

void loop() {
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  if (isnan(t) || isnan(h)) { delay(2000); return; }

  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(2);
  display.setCursor(0, 0);
  display.printf("%.1f C\\n", t);
  display.printf("%.0f %%RH", h);
  display.setTextSize(1);
  display.setCursor(0, 48);
  display.print((t >= 22 && t <= 28) ? "Status: Nyaman" : "Status: Kurang nyaman");
  display.display();
  delay(5000);
}`,
      views: 0, createdAt: daysAgo(52, 3), updatedAt: daysAgo(9, 1)
    },
    {
      id: 'prj_light', slug: 'motion-activated-smart-light', name: 'Motion-Activated Smart Light',
      image: '', category: 'cat_lighting', difficulty: 'Beginner', duration: '1 hari', budget: 175000,
      type: 'default', status: 'published', tags: ['lampu', 'pir', 'led', 'otomasi'],
      shortDescription: 'Lampu lorong menyala otomatis saat ada gerakan dan mati setelah 30 detik.',
      description: 'Menggunakan sensor PIR dan LED strip WS2812B, lampu menyala lembut saat ada gerakan pada malam hari. Warna dan durasi dapat diubah dari kode atau melalui web sederhana.',
      purpose: 'Menghemat energi dan memberi pencahayaan otomatis di area gelap.',
      outcome: 'Lampu menyala hanya ketika dibutuhkan, dengan transisi halus.',
      features: ['Deteksi gerak 110° hingga 7 meter', 'Efek fade-in / fade-out halus', 'Mode malam dengan ambang cahaya', 'Warna LED dapat diubah', 'Timer mati otomatis 30 detik'],
      howItWorks: ['PIR mendeteksi pergerakan', 'ESP32 menyalakan LED strip dengan efek fade', 'Timer berjalan selama tidak ada gerakan', 'LED meredup dan mati setelah 30 detik'],
      architecture: { description: 'PIR sebagai pemicu, ESP32 mengatur PWM LED strip.', input: 'PIR HC-SR501', controller: 'ESP32 DevKit V1', processing: 'Debounce + timer + efek fade', output: 'LED strip WS2812B', communication: 'Wi-Fi (opsional)' },
      components: [
        { componentId: 'cmp_esp32', qty: 1, mandatory: true, notes: '' },
        { componentId: 'cmp_pir', qty: 1, mandatory: true, notes: 'Atur jumper ke mode repeat.' },
        { componentId: 'cmp_led', qty: 1, mandatory: true, notes: '1 meter cukup untuk lorong kecil.' },
        { componentId: 'cmp_power', qty: 1, mandatory: true, notes: 'Gunakan adaptor 5V 2A.' },
        { componentId: 'cmp_jumper', qty: 1, mandatory: true, notes: '' }
      ],
      buildGuide: [
        { title: 'Uji sensor PIR', description: 'Pastikan sensor mendeteksi gerakan.', image: '', instructions: ['Hubungkan VCC ke 5V, GND ke GND, OUT ke GPIO27.', 'Tunggu 30 detik kalibrasi.', 'Pantau Serial Monitor saat tangan digerakkan.'], notes: 'Sesuaikan potensiometer sensitivitas bila perlu.', warning: '' },
        { title: 'Hubungkan LED strip', description: 'Data LED ke ESP32 dengan resistor.', image: '', instructions: ['DIN → GPIO13 melalui resistor 330Ω.', '5V strip → adaptor 5V.', 'GND strip dan ESP32 disatukan.'], notes: 'Untuk strip panjang, gunakan kapasitor 1000µF.', warning: '' },
        { title: 'Upload kode efek lampu', description: 'Install library FastLED atau Adafruit NeoPixel.', image: '', instructions: ['Install library "Adafruit NeoPixel".', 'Atur jumlah LED sesuai strip.', 'Upload dan uji efek fade.'], notes: '', warning: '' },
        { title: 'Pasang & atur timer', description: 'Sesuaikan dengan ukuran ruangan.', image: '', instructions: ['Pasang sensor menghadap area gerak.', 'Ubah HOLD_MS menjadi 30000.', 'Uji dengan berjalan melewati sensor.'], notes: '', warning: '' }
      ],
      testing: [
        { name: 'Uji deteksi gerak', description: 'Pastikan lampu menyala saat ada gerakan.', expected: 'Lampu menyala < 1 detik setelah gerakan terdeteksi.', instructions: 'Gerakkan tangan di depan sensor dan amati LED.' },
        { name: 'Uji timer mati', description: 'Pastikan lampu mati saat tidak ada gerakan.', expected: 'Lampu meredup dan mati setelah ±30 detik.', instructions: 'Diamkan area selama 45 detik.' }
      ],
      troubleshooting: [
        { problem: 'Lampu menyala terus', cause: 'Sensor PIR mendeteksi panas dari sumber lain atau mode repeat.', solution: 'Jauhkan sensor dari AC/lampu, atur sensitivitas, dan tunggu kalibrasi 30 detik.' },
        { problem: 'Warna LED tidak sesuai', cause: 'Urutan warna library berbeda.', solution: 'Tambahkan NEO_GRB + NEO_KHZ800 pada begin() dan uji warna dasar.' }
      ],
      upgrades: ['Tambahkan sensor LDR agar hanya aktif saat gelap.', 'Integrasikan dengan MQTT untuk kontrol dari aplikasi.', 'Tambahkan mode "party" dengan animasi warna.'],
      wiring: 'PIR OUT → GPIO27, VCC 5V. LED DIN → GPIO13 via resistor 330Ω. GND bersama.',
      sourceCode: `// Motion-Activated Smart Light — ESP32
#include <Adafruit_NeoPixel.h>

#define LED_PIN 13
#define LED_COUNT 30
#define PIR_PIN 27
#define HOLD_MS 30000

Adafruit_NeoPixel strip(LED_COUNT, LED_PIN, NEO_GRB + NEO_KHZ800);
unsigned long lastMotion = 0;
bool isOn = false;

void setup() {
  pinMode(PIR_PIN, INPUT);
  strip.begin();
  strip.show();
  Serial.begin(115200);
}

void loop() {
  if (digitalRead(PIR_PIN) == HIGH) {
    lastMotion = millis();
    if (!isOn) { isOn = true; fadeTo(120); }
  }
  if (isOn && millis() - lastMotion > HOLD_MS) { isOn = false; fadeTo(0); }
  delay(50);
}

void fadeTo(int target) {
  int current = isOn ? 0 : 120;
  int step = target > current ? 5 : -5;
  for (int b = current; b != target; b += step) {
    strip.fill(strip.Color(255, 190, 120));
    strip.setBrightness(constrain(b, 0, 120));
    strip.show();
    delay(18);
  }
  strip.setBrightness(target);
  strip.show();
}`,
      views: 0, createdAt: daysAgo(47, 2), updatedAt: daysAgo(8, 3)
    },
    {
      id: 'prj_lock', slug: 'rfid-smart-door-lock', name: 'RFID Smart Door Lock',
      image: '', category: 'cat_security', difficulty: 'Intermediate', duration: '2–3 hari', budget: 340000,
      type: 'default', status: 'published', tags: ['rfid', 'keamanan', 'servo', 'kunci'],
      shortDescription: 'Kunci pintu dengan kartu RFID, buzzer, dan log akses sederhana.',
      description: 'Sistem akses pintu yang hanya membuka kunci untuk kartu terdaftar. Setiap percobaan akses dicatat dan ditampilkan di OLED, sehingga cocok untuk belajar konsep autentikasi perangkat.',
      purpose: 'Mengganti kunci manual dengan akses kartu yang lebih praktis.',
      outcome: 'Pintu terbuka otomatis untuk kartu terdaftar dan menolak kartu lain.',
      features: ['Registrasi kartu baru via Serial Monitor', 'Buzzer & OLED untuk umpan balik', 'Log akses 20 entri terakhir', 'Kunci otomatis kembali setelah 5 detik', 'Mode master card untuk menambah kartu'],
      howItWorks: ['RC522 membaca UID kartu', 'ESP32 membandingkan dengan daftar UID', 'Jika cocok, servo membuka kunci', 'OLED & buzzer memberi umpan balik', 'Kunci menutup otomatis setelah 5 detik'],
      architecture: { description: 'RC522 membaca kartu, ESP32 memverifikasi UID, servo menggerakkan latch.', input: 'RFID RC522 + master card', controller: 'ESP32 DevKit V1', processing: 'Verifikasi UID + log akses', output: 'Servo SG90, OLED, buzzer', communication: 'SPI (RFID), I2C (OLED)' },
      components: [
        { componentId: 'cmp_esp32', qty: 1, mandatory: true, notes: '' },
        { componentId: 'cmp_rfid', qty: 1, mandatory: true, notes: 'Wajib 3.3V.' },
        { componentId: 'cmp_servo', qty: 1, mandatory: true, notes: 'Servo menggerakkan latch sederhana.' },
        { componentId: 'cmp_oled', qty: 1, mandatory: true, notes: 'Menampilkan status akses.' },
        { componentId: 'cmp_buzzer', qty: 1, mandatory: true, notes: '' },
        { componentId: 'cmp_power', qty: 1, mandatory: true, notes: 'Servo butuh arus cukup saat bergerak.' },
        { componentId: 'cmp_jumper', qty: 1, mandatory: true, notes: '' }
      ],
      buildGuide: [
        { title: 'Sambungkan RC522 (SPI)', description: 'Modul RFID bekerja pada 3.3V.', image: '', instructions: ['SDA/SS → GPIO5, SCK → GPIO18.', 'MOSI → GPIO23, MISO → GPIO19.', 'RST → GPIO4, VCC → 3.3V, GND → GND.'], notes: 'Jangan hubungkan VCC ke 5V.', warning: '' },
        { title: 'Pasang servo & buzzer', description: 'Aktuator umpan balik akses.', image: '', instructions: ['Servo signal → GPIO14, VCC 5V, GND bersama.', 'Buzzer + → GPIO32 via resistor 100Ω.'], notes: 'Uji servo tanpa beban lebih dulu.', warning: '' },
        { title: 'Registrasi kartu', description: 'Simpan UID kartu yang diizinkan.', image: '', instructions: ['Upload sketch, buka Serial Monitor.', 'Tempelkan kartu dan catat UID.', 'Masukkan UID ke array ALLOWED_UIDS.', 'Upload ulang.'], notes: 'Simpan minimal dua kartu cadangan.', warning: '' },
        { title: 'Pasang mekanisme kunci', description: 'Servo memutar latch pintu.', image: '', instructions: ['Pasang servo pada bracket.', 'Hubungkan tuas ke latch.', 'Atur sudut OPEN/CLOSE hingga pas.'], notes: 'Pastikan pintu bisa dibuka manual dari dalam.', warning: 'Ini prototipe belajar, bukan sistem keamanan bersertifikat.' }
      ],
      testing: [
        { name: 'Uji kartu terdaftar', description: 'Akses dengan kartu yang diizinkan.', expected: 'Servo bergerak, OLED "Access granted", buzzer pendek.', instructions: 'Tempelkan kartu terdaftar lalu amati.' },
        { name: 'Uji kartu asing', description: 'Akses dengan kartu tidak terdaftar.', expected: 'Akses ditolak, buzzer panjang, servo tidak bergerak.', instructions: 'Gunakan kartu lain dan amati respons.' },
        { name: 'Uji auto-lock', description: 'Pastikan kunci kembali otomatis.', expected: 'Servo kembali ke posisi tertutup setelah 5 detik.', instructions: 'Buka dengan kartu lalu tunggu 5 detik.' }
      ],
      troubleshooting: [
        { problem: 'RC522 tidak terbaca', cause: 'Tegangan salah atau kabel SPI longgar.', solution: 'Pastikan VCC 3.3V, cek urutan SCK/MOSI/MISO, dan gunakan kabel pendek.' },
        { problem: 'Servo bergetar saat bergerak', cause: 'Arus adaptor tidak cukup.', solution: 'Gunakan adaptor 5V 2A dan kapasitor 470µF dekat servo.' }
      ],
      upgrades: ['Tambahkan keypad sebagai cadangan akses.', 'Simpan log ke microSD atau Firebase.', 'Tambahkan solenoid lock 12V untuk pintu asli.'],
      wiring: 'RC522: SS 5, SCK 18, MOSI 23, MISO 19, RST 4. Servo signal 14. Buzzer 32. OLED I2C 21/22.',
      sourceCode: `// RFID Smart Door Lock — ESP32
#include <SPI.h>
#include <MFRC522.h>
#include <ESP32Servo.h>

#define SS_PIN 5
#define RST_PIN 4
#define SERVO_PIN 14
#define BUZZER_PIN 32

MFRC522 rfid(SS_PIN, RST_PIN);
Servo lock;
const String ALLOWED[] = { "A1B2C3D4", "11223344" };

void setup() {
  Serial.begin(115200);
  SPI.begin();
  rfid.PCD_Init();
  lock.attach(SERVO_PIN);
  lock.write(0);
  pinMode(BUZZER_PIN, OUTPUT);
  Serial.println("Tempelkan kartu...");
}

void loop() {
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) return;
  String uidStr = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    uidStr += String(rfid.uid.uidByte[i], HEX);
  }
  uidStr.toUpperCase();
  Serial.println("UID: " + uidStr);

  bool allowed = false;
  for (String u : ALLOWED) if (u == uidStr) allowed = true;

  if (allowed) {
    tone(BUZZER_PIN, 1800, 120);
    lock.write(90);
    delay(5000);
    lock.write(0);
  } else {
    tone(BUZZER_PIN, 400, 600);
  }
  rfid.PICC_HaltA();
}`,
      views: 0, createdAt: daysAgo(40, 1), updatedAt: daysAgo(7, 2)
    },
    {
      id: 'prj_air', slug: 'room-air-quality-station', name: 'Room Air Quality Station',
      image: '', category: 'cat_env', difficulty: 'Intermediate', duration: '2 hari', budget: 260000,
      type: 'default', status: 'published', tags: ['kualitas udara', 'mq135', 'oled', 'monitoring'],
      shortDescription: 'Stasiun pemantau kualitas udara dengan indikator visual dan alarm.',
      description: 'Membaca kualitas udara ruangan menggunakan MQ-135, menampilkan indeks relatif di OLED, dan menyalakan indikator saat kualitas udara memburuk.',
      purpose: 'Memberi kesadaran tentang ventilasi dan kualitas udara dalam ruangan.',
      outcome: 'Indikator kualitas udara relatif yang dapat dipantau setiap saat.',
      features: ['Pembacaan kualitas udara kontinu', 'Indikator status: baik / sedang / buruk', 'Alarm buzzer saat ambang buruk', 'Baseline otomatis saat start', 'Data dapat dikirim ke dashboard web'],
      howItWorks: ['MQ-135 membaca konsentrasi gas', 'ESP32 menghitung baseline dan selisih', 'Status ditampilkan di OLED', 'Buzzer aktif saat status buruk'],
      architecture: { description: 'Sensor analog MQ-135 dibaca ADC ESP32, hasilnya diklasifikasikan.', input: 'MQ-135 (analog)', controller: 'ESP32 DevKit V1', processing: 'Baseline 60 detik + moving average', output: 'OLED + buzzer + LED indikator', communication: 'Wi-Fi / I2C' },
      components: [
        { componentId: 'cmp_esp32', qty: 1, mandatory: true, notes: '' },
        { componentId: 'cmp_mq135', qty: 1, mandatory: true, notes: 'Perlu pemanasan 24 jam untuk akurasi terbaik.' },
        { componentId: 'cmp_oled', qty: 1, mandatory: true, notes: '' },
        { componentId: 'cmp_buzzer', qty: 1, mandatory: true, notes: '' },
        { componentId: 'cmp_power', qty: 1, mandatory: true, notes: '' },
        { componentId: 'cmp_jumper', qty: 1, mandatory: true, notes: '' }
      ],
      buildGuide: [
        { title: 'Sambungkan MQ-135', description: 'Sensor gas membutuhkan 5V.', image: '', instructions: ['VCC → 5V, GND → GND.', 'AO → GPIO35 (ADC1).'], notes: 'Jangan memberi 5V ke pin ADC.', warning: '' },
        { title: 'Baseline & kalibrasi', description: 'Tentukan nilai udara bersih.', image: '', instructions: ['Nyalakan alat di ruangan bersih 60 detik.', 'Catat nilai baseline pada Serial Monitor.', 'Simpan BASELINE di kode.'], notes: 'Lakukan saat jendela terbuka.', warning: '' },
        { title: 'Tampilan & alarm', description: 'Atur ambang status.', image: '', instructions: ['Sambungkan OLED I2C 21/22.', 'Atur AMBER dan RED pada kode.', 'Upload dan uji dengan asap lilin jauh.'], notes: 'Uji di luar ruangan.', warning: 'Jangan menguji dengan gas berbahaya.' }
      ],
      testing: [
        { name: 'Uji baseline', description: 'Pastikan nilai awal stabil.', expected: 'Nilai berfluktuasi kecil setelah 60 detik.', instructions: 'Amati Serial Monitor di ruangan bersih.' },
        { name: 'Uji indikator', description: 'Simulasikan udara buruk.', expected: 'Status berubah dan buzzer menyala.', instructions: 'Ubah nilai ambang sementara atau dekatkan sumber asap ringan di luar ruangan.' }
      ],
      troubleshooting: [
        { problem: 'Nilai selalu tinggi', cause: 'Sensor belum dipanaskan atau baseline salah.', solution: 'Panaskan 24 jam lalu kalibrasi ulang baseline.' },
        { problem: 'OLED & sensor bentrok', cause: 'Pin I2C bertabrakan dengan pin lain.', solution: 'Gunakan GPIO21/22 khusus I2C dan hindari pin input-only untuk output.' }
      ],
      upgrades: ['Kirim data ke ThingSpeak untuk grafik harian.', 'Tambahkan sensor suhu untuk kompensasi.', 'Tambahkan kipas exhaust otomatis.'],
      wiring: 'MQ-135 AO → GPIO35, VCC 5V. OLED SDA 21 / SCL 22. Buzzer + → GPIO32.',
      sourceCode: `// Room Air Quality Station — ESP32
#define MQ_PIN 35
#define BUZZER 32
#define BASELINE 1200   // ukur di udara bersih

void setup() {
  Serial.begin(115200);
  pinMode(BUZZER, OUTPUT);
  digitalWrite(BUZZER, LOW);
}

void loop() {
  int raw = analogRead(MQ_PIN);
  int delta = raw - BASELINE;
  String status = delta < 150 ? "Baik" : delta < 400 ? "Sedang" : "Buruk";
  Serial.printf("Raw: %d | Delta: %d | %s\\n", raw, delta, status.c_str());

  if (status == "Buruk") {
    tone(BUZZER, 1500, 200);
  }
  delay(2000);
}`,
      views: 0, createdAt: daysAgo(33, 4), updatedAt: daysAgo(5, 1)
    },
    {
      id: 'prj_pet', slug: 'automatic-pet-feeder', name: 'Automatic Pet Feeder',
      image: '', category: 'cat_pet', difficulty: 'Intermediate', duration: '2–3 hari', budget: 290000,
      type: 'default', status: 'published', tags: ['hewan', 'servo', 'jadwal', 'rtc'],
      shortDescription: 'Beri makan hewan peliharaan otomatis sesuai jadwal harian.',
      description: 'Feeder dengan jadwal dua kali sehari yang menggunakan servo untuk membuka katup makanan. RTC menjaga jadwal tetap akurat walau listrik sempat mati.',
      purpose: 'Menjaga pola makan hewan saat pemilik sibuk atau bepergian.',
      outcome: 'Makanan keluar pada jam yang ditentukan dengan porsi terkendali.',
      features: ['Dua jadwal harian yang dapat diubah', 'RTC menjaga waktu tetap akurat', 'Tombol manual untuk pemberian makan', 'OLED menampilkan jadwal berikutnya', 'Buzzer memanggil hewan'],
      howItWorks: ['RTC memberi waktu saat ini', 'ESP32 membandingkan dengan jadwal', 'Servo membuka katup makanan', 'Porsi diatur dari durasi buka katup'],
      architecture: { description: 'RTC sebagai penjaga waktu, servo sebagai aktuator katup.', input: 'RTC DS3231 + tombol manual', controller: 'ESP32 DevKit V1', processing: 'Perbandingan jadwal + debounce tombol', output: 'Servo + buzzer + OLED', communication: 'I2C (RTC & OLED)' },
      components: [
        { componentId: 'cmp_esp32', qty: 1, mandatory: true, notes: '' },
        { componentId: 'cmp_rtc', qty: 1, mandatory: true, notes: 'Pasang baterai CR2032.' },
        { componentId: 'cmp_servo', qty: 1, mandatory: true, notes: 'Gunakan servo torsi cukup untuk katup.' },
        { componentId: 'cmp_oled', qty: 1, mandatory: true, notes: '' },
        { componentId: 'cmp_buzzer', qty: 1, mandatory: true, notes: '' },
        { componentId: 'cmp_power', qty: 1, mandatory: true, notes: '' },
        { componentId: 'cmp_jumper', qty: 1, mandatory: true, notes: '' }
      ],
      buildGuide: [
        { title: 'Rangkai RTC & OLED', description: 'Dua perangkat I2C pada bus yang sama.', image: '', instructions: ['SDA keduanya → GPIO21, SCL → GPIO22.', 'VCC 3.3V, GND bersama.', 'Jalankan I2C scanner.'], notes: 'RTC DS3231 biasanya 0x57, OLED 0x3C.', warning: '' },
        { title: 'Buat mekanisme katup', description: 'Servo memutar penutup wadah makanan.', image: '', instructions: ['Buat lubang keluaran pada wadah.', 'Pasang penutup yang dihubungkan ke servo.', 'Uji sudut 0° (tutup) dan 90° (buka).'], notes: 'Pastikan makanan tidak menyumbat.', warning: '' },
        { title: 'Atur jadwal', description: 'Tentukan jam pemberian makan.', image: '', instructions: ['Ubah array FEED_HOURS pada kode.', 'Sinkronkan waktu RTC sekali via Serial.', 'Upload dan uji dengan jadwal 1 menit ke depan.'], notes: 'Uji dulu tanpa makanan.', warning: '' }
      ],
      testing: [
        { name: 'Uji jadwal', description: 'Pastikan servo aktif pada jam yang ditentukan.', expected: 'Katup terbuka sesuai jadwal dan menutup kembali.', instructions: 'Set jadwal 1 menit ke depan, amati gerakan servo.' },
        { name: 'Uji tombol manual', description: 'Pemberian makan manual berfungsi.', expected: 'Satu tekan = satu porsi.', instructions: 'Tekan tombol dan ukur porsi yang keluar.' }
      ],
      troubleshooting: [
        { problem: 'Jadwal tidak sesuai', cause: 'Waktu RTC belum disinkronkan.', solution: 'Set waktu RTC sekali melalui Serial Monitor lalu restart.' },
        { problem: 'Porsi tidak konsisten', cause: 'Sudut servo atau bentuk katup kurang tepat.', solution: 'Kalibrasi sudut dan gunakan katup berbentuk tabung.' }
      ],
      upgrades: ['Tambahkan sensor berat untuk mengukur porsi.', 'Tambahkan kamera ESP32-CAM untuk memantau.', 'Kirim notifikasi saat makanan habis.'],
      wiring: 'RTC SDA 21 / SCL 22 (0x57). OLED 0x3C. Servo signal 13. Buzzer 32.',
      sourceCode: `// Automatic Pet Feeder — ESP32
#include <Wire.h>
#include <RTClib.h>
#include <ESP32Servo.h>

RTC_DS3231 rtc;
Servo gate;
const int FEED_HOURS[] = { 7, 18 };
bool fedToday[2] = { false, false };

void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22);
  rtc.begin();
  gate.attach(13);
  gate.write(0);
}

void loop() {
  DateTime now = rtc.now();
  for (int i = 0; i < 2; i++) {
    if (now.hour() == FEED_HOURS[i] && now.minute() == 0 && !fedToday[i]) {
      feed();
      fedToday[i] = true;
    }
  }
  if (now.hour() == 0 && now.minute() == 1) {
    fedToday[0] = fedToday[1] = false;
  }
  delay(1000);
}

void feed() {
  gate.write(90);
  delay(1200);
  gate.write(0);
}`,
      views: 0, createdAt: daysAgo(28, 2), updatedAt: daysAgo(4, 3)
    },
    {
      id: 'prj_curtain', slug: 'auto-curtain-home-automation', name: 'Auto Curtain Home Automation',
      image: '', category: 'cat_automation', difficulty: 'Advanced', duration: '3–4 hari', budget: 430000,
      type: 'default', status: 'draft', tags: ['gorden', 'stepper', 'otomasi', 'cahaya'],
      shortDescription: 'Gorden otomatis terbuka saat pagi dan menutup saat malam.',
      description: 'Proyek lanjutan yang menggerakkan gorden dengan stepper motor berdasarkan jadwal dan intensitas cahaya. Membutuhkan mekanik rel yang stabil.',
      purpose: 'Mengotomasi pencahayaan alami dan privasi ruangan.',
      outcome: 'Gorden bergerak halus sesuai jadwal atau tombol manual.',
      features: ['Jadwal buka/tutup otomatis', 'Kontrol tombol manual', 'Sensor cahaya untuk mode adaptif', 'Posisi tersimpan saat restart', 'Gerakan halus dengan microstepping'],
      howItWorks: ['RTC/LDR memberi konteks waktu & cahaya', 'ESP32 mengirim sinyal step/dir ke driver', 'Stepper menggerakkan rel gorden', 'Posisi disimpan di memori'],
      architecture: { description: 'Driver A4988 mengatur stepper berdasarkan perintah ESP32.', input: 'LDR + tombol + jadwal', controller: 'ESP32 DevKit V1', processing: 'State machine posisi + jadwal', output: 'Stepper NEMA17 via A4988', communication: 'Wi-Fi (opsional)' },
      components: [
        { componentId: 'cmp_esp32', qty: 1, mandatory: true, notes: '' },
        { componentId: 'cmp_stepper', qty: 1, mandatory: true, notes: 'Set limit arus driver ±1A.' },
        { componentId: 'cmp_rtc', qty: 1, mandatory: false, notes: 'Untuk jadwal tanpa internet.' },
        { componentId: 'cmp_power', qty: 1, mandatory: true, notes: 'Stepper butuh 12V — tambahkan adaptor 12V.' },
        { componentId: 'cmp_jumper', qty: 1, mandatory: true, notes: '' }
      ],
      buildGuide: [
        { title: 'Siapkan driver stepper', description: 'Atur arus driver sebelum digunakan.', image: '', instructions: ['Set Vref A4988 sesuai arus motor.', 'Hubungkan MS1/MS2/MS3 untuk microstepping.', 'Pasang kapasitor 100µF pada VIN.'], notes: 'Jangan melepas motor saat driver menyala.', warning: 'Motor dan driver bisa panas — beri heatsink.' },
        { title: 'Rangkai kontrol', description: 'Hubungkan step/dir/enable.', image: '', instructions: ['STEP → GPIO18, DIR → GPIO19.', 'ENABLE → GPIO5.', 'Tombol buka/tutup → GPIO32/33.'], notes: '', warning: '' },
        { title: 'Uji gerakan rel', description: 'Pastikan arah dan langkah benar.', image: '', instructions: ['Uji tanpa gorden.', 'Tentukan jumlah langkah penuh.', 'Simpan posisi di Preferences.'], notes: 'Tambahkan limit switch untuk keamanan.', warning: '' }
      ],
      testing: [
        { name: 'Uji arah gerak', description: 'Pastikan buka/tutup tidak terbalik.', expected: 'Tombol buka menggerakkan gorden ke arah terbuka.', instructions: 'Tekan masing-masing tombol dan amati.' },
        { name: 'Uji posisi setelah restart', description: 'Posisi tersimpan.', expected: 'Gorden tidak bergerak liar setelah restart.', instructions: 'Matikan saat setengah terbuka lalu nyalakan lagi.' }
      ],
      troubleshooting: [
        { problem: 'Motor hanya bergetar', cause: 'Kabel coil salah urutan atau arus kurang.', solution: 'Cek pasangan coil dengan multimeter dan naikkan Vref perlahan.' },
        { problem: 'Langkah terlewat', cause: 'Beban terlalu berat atau microstepping terlalu halus.', solution: 'Kurangi microstepping dan gunakan rel yang lebih lancar.' }
      ],
      upgrades: ['Tambahkan limit switch di kedua ujung rel.', 'Integrasikan dengan Home Assistant via MQTT.', 'Tambahkan panel surya + baterai.'],
      wiring: 'A4988 STEP 18, DIR 19, ENABLE 5. Motor 12V terpisah, GND disatukan.',
      sourceCode: `// Auto Curtain — ESP32 + A4988
#define STEP_PIN 18
#define DIR_PIN 19
#define EN_PIN 5
#define STEPS_FULL 1600

bool isOpen = false;

void moveCurtain(bool open) {
  digitalWrite(EN_PIN, LOW);
  digitalWrite(DIR_PIN, open ? HIGH : LOW);
  for (int i = 0; i < STEPS_FULL; i++) {
    digitalWrite(STEP_PIN, HIGH);
    delayMicroseconds(700);
    digitalWrite(STEP_PIN, LOW);
    delayMicroseconds(700);
  }
  digitalWrite(EN_PIN, HIGH);
  isOpen = open;
}`,
      views: 0, createdAt: daysAgo(21, 1), updatedAt: daysAgo(3, 2)
    },
    {
      id: 'prj_voice', slug: 'voice-controlled-room-assistant', name: 'Voice-Controlled Room Assistant',
      image: '', category: 'cat_voice', difficulty: 'Advanced', duration: '4–5 hari', budget: 520000,
      type: 'default', status: 'published', tags: ['suara', 'assistant', 'otomasi', 'esp32'],
      shortDescription: 'Kendalikan lampu dan perangkat ruangan dengan perintah suara sederhana.',
      description: 'Prototipe asisten suara lokal menggunakan modul pengenal suara untuk menyalakan lampu dan kipas. Bukan asisten AI percakapan penuh, tetapi fondasi yang baik untuk belajar kontrol suara.',
      purpose: 'Membuat kontrol perangkat tanpa sentuhan, cocok untuk kamar atau studio.',
      outcome: 'Perintah suara dasar dikenali dan memicu aktuator yang tepat.',
      features: ['Pengenalan 5 perintah suara', 'Kontrol lampu & kipas via relay', 'Umpan balik buzzer & OLED', 'Mode fallback tombol manual', 'Log perintah terakhir'],
      howItWorks: ['Modul suara mendeteksi kata kunci', 'ESP32 memetakan perintah ke aksi', 'Relay menyalakan perangkat', 'OLED menampilkan perintah terakhir'],
      architecture: { description: 'Modul pengenal suara memberi sinyal digital, ESP32 mengeksekusi aksi.', input: 'Modul voice recognition + tombol', controller: 'ESP32 DevKit V1', processing: 'Mapping perintah → aksi', output: 'Relay 4 channel, OLED, buzzer', communication: 'Digital input, I2C' },
      components: [
        { componentId: 'cmp_esp32', qty: 1, mandatory: true, notes: '' },
        { componentId: 'cmp_relay', qty: 1, mandatory: true, notes: 'Untuk lampu & kipas.' },
        { componentId: 'cmp_oled', qty: 1, mandatory: true, notes: '' },
        { componentId: 'cmp_buzzer', qty: 1, mandatory: true, notes: '' },
        { componentId: 'cmp_power', qty: 1, mandatory: true, notes: '' },
        { componentId: 'cmp_jumper', qty: 1, mandatory: true, notes: '' }
      ],
      buildGuide: [
        { title: 'Latih modul suara', description: 'Rekam perintah pada modul.', image: '', instructions: ['Ikuti panduan modul untuk merekam perintah.', 'Rekam: "nyala", "mati", "lampu", "kipas", "semua".', 'Uji keluaran digital modul.'], notes: 'Rekam di ruangan tenang.', warning: '' },
        { title: 'Hubungkan relay & beban', description: 'Kontrol lampu dan kipas.', image: '', instructions: ['IN1..IN4 → GPIO 25, 26, 27, 14.', 'Gunakan beban 5V untuk pengujian awal.', 'Tambahkan sekring untuk beban 220V.'], notes: '', warning: 'Gunakan kotak tertutup untuk 220V.' },
        { title: 'Upload logika perintah', description: 'Petakan perintah ke aktuator.', image: '', instructions: ['Sesuaikan pin pada kode.', 'Uji satu perintah pada satu waktu.', 'Tambahkan debounce 300 ms.'], notes: '', warning: '' }
      ],
      testing: [
        { name: 'Uji tiap perintah', description: 'Pastikan semua perintah dikenali.', expected: 'Setiap perintah memicu relay yang benar.', instructions: 'Ucapkan lima perintah satu per satu.' },
        { name: 'Uji salah perintah', description: 'Perintah asing tidak memicu aksi.', expected: 'Tidak ada relay berubah.', instructions: 'Ucapkan kata acak.' }
      ],
      troubleshooting: [
        { problem: 'Perintah sering salah dikenali', cause: 'Kebisingan atau pelatihan kurang.', solution: 'Latih ulang di ruangan tenang dan dekatkan mikrofon.' },
        { problem: 'Relay aktif sendiri', cause: 'Pin floating atau noise.', solution: 'Tambahkan pull-down 10kΩ dan kabel pendek.' }
      ],
      upgrades: ['Gunakan ESP32 + API speech-to-text online untuk kalimat bebas.', 'Tambahkan balasan suara via DFPlayer.', 'Integrasikan dengan Nara Assistant di website.'],
      wiring: 'Relay IN1–IN4 → GPIO25/26/27/14. OLED I2C 21/22. Buzzer 32.',
      sourceCode: `// Voice-Controlled Room Assistant — ESP32
const int CMD_PINS[] = { 34, 35, 36, 39 };  // input-only, dari modul suara
const int RELAY_PINS[] = { 25, 26, 27, 14 };
bool states[4] = { false, false, false, false };

void setup() {
  Serial.begin(115200);
  for (int i = 0; i < 4; i++) {
    pinMode(CMD_PINS[i], INPUT);
    pinMode(RELAY_PINS[i], OUTPUT);
    digitalWrite(RELAY_PINS[i], HIGH); // aktif LOW
  }
}

void loop() {
  for (int i = 0; i < 4; i++) {
    if (digitalRead(CMD_PINS[i]) == HIGH) {
      states[i] = !states[i];
      digitalWrite(RELAY_PINS[i], states[i] ? LOW : HIGH);
      Serial.printf("Toggle channel %d -> %d\\n", i + 1, states[i]);
      delay(400);
    }
  }
}`,
      views: 0, createdAt: daysAgo(15, 3), updatedAt: daysAgo(2, 1)
    },
    {
      id: 'prj_robot', slug: 'line-following-robot', name: 'Line Following Robot',
      image: '', category: 'cat_robot', difficulty: 'Beginner', duration: '2 hari', budget: 245000,
      type: 'default', status: 'published', tags: ['robot', 'sensor', 'motor', 'belajar'],
      shortDescription: 'Robot sederhana yang mengikuti garis hitam menggunakan sensor inframerah.',
      description: 'Robot dua roda dengan sensor IR untuk mengikuti jalur. Proyek yang menyenangkan untuk memahami logika kontrol dan motor driver.',
      purpose: 'Belajar dasar robotika dan kontrol motor.',
      outcome: 'Robot mengikuti garis dengan koreksi arah otomatis.',
      features: ['Dua sensor IR untuk deteksi garis', 'Kontrol kecepatan PWM', 'Kalibrasi otomatis di awal', 'Buzzer start', 'Chassis ringkas'],
      howItWorks: ['Sensor IR membaca warna permukaan', 'ESP32 menentukan arah koreksi', 'Driver motor mengatur kecepatan roda', 'Robot bergerak mengikuti garis'],
      architecture: { description: 'Sensor IR memberi input digital, ESP32 mengontrol dua motor DC.', input: '2× sensor IR', controller: 'ESP32 DevKit V1', processing: 'Logika koreksi kiri/kanan', output: '2× motor DC + driver L298N', communication: 'Serial (debug)' },
      components: [
        { componentId: 'cmp_esp32', qty: 1, mandatory: true, notes: '' },
        { componentId: 'cmp_ultrasonic', qty: 1, mandatory: false, notes: 'Opsional untuk deteksi rintangan.' },
        { componentId: 'cmp_buzzer', qty: 1, mandatory: true, notes: '' },
        { componentId: 'cmp_power', qty: 1, mandatory: true, notes: 'Gunakan baterai 18650 untuk motor.' },
        { componentId: 'cmp_jumper', qty: 1, mandatory: true, notes: '' }
      ],
      buildGuide: [
        { title: 'Rakit chassis', description: 'Pasang motor dan roda.', image: '', instructions: ['Pasang dua motor DC pada chassis.', 'Pasang roda castor depan.', 'Rekatkan sensor IR di depan bawah.'], notes: 'Jarak sensor ke lantai ±5 mm.', warning: '' },
        { title: 'Wiring motor driver', description: 'Hubungkan L298N ke ESP32.', image: '', instructions: ['IN1–IN4 → GPIO 25, 26, 27, 14.', 'ENA/ENB → GPIO 32, 33 (PWM).', 'GND motor driver dan ESP32 disatukan.'], notes: '', warning: '' },
        { title: 'Upload & kalibrasi', description: 'Sesuaikan kecepatan dan ambang.', image: '', instructions: ['Upload sketch line follower.', 'Letakkan di trek garis hitam.', 'Sesuaikan BASE_SPEED sampai gerak stabil.'], notes: 'Trek dengan kontras tinggi lebih mudah.', warning: '' }
      ],
      testing: [
        { name: 'Uji sensor garis', description: 'Pastikan sensor membedakan hitam/putih.', expected: 'Nilai berubah konsisten di garis hitam.', instructions: 'Buka Serial Monitor dan gerakkan robot manual.' },
        { name: 'Uji lintasan', description: 'Robot mengikuti trek sederhana.', expected: 'Robot tidak keluar trek pada tikungan landai.', instructions: 'Uji di trek oval.' }
      ],
      troubleshooting: [
        { problem: 'Robot berputar di tempat', cause: 'Urutan kabel motor terbalik.', solution: 'Tukar dua kabel salah satu motor.' },
        { problem: 'Robot keluar trek', cause: 'Kecepatan terlalu tinggi atau sensor terlalu tinggi.', solution: 'Turunkan kecepatan dan dekatkan sensor ke lantai.' }
      ],
      upgrades: ['Tambahkan kontrol PID untuk lintasan lebih cepat.', 'Tambahkan ultrasonik untuk menghindari rintangan.', 'Tambahkan Bluetooth untuk kontrol manual.'],
      wiring: 'L298N IN1–IN4 → 25/26/27/14. Sensor IR kiri 34, kanan 35. Buzzer 32.',
      sourceCode: `// Line Following Robot — ESP32
#define LEFT_SENSOR 34
#define RIGHT_SENSOR 35
#define BASE_SPEED 150

void setMotors(int left, int right) {
  // sesuaikan pin PWM & arah dengan driver motor
  analogWrite(32, constrain(left, 0, 255));
  analogWrite(33, constrain(right, 0, 255));
}

void loop() {
  bool leftOnLine = digitalRead(LEFT_SENSOR) == LOW;
  bool rightOnLine = digitalRead(RIGHT_SENSOR) == LOW;

  if (leftOnLine && !rightOnLine) setMotors(60, BASE_SPEED);       // belok kiri
  else if (!leftOnLine && rightOnLine) setMotors(BASE_SPEED, 60);  // belok kanan
  else setMotors(BASE_SPEED, BASE_SPEED);                          // lurus
}`,
      views: 0, createdAt: daysAgo(11, 2), updatedAt: daysAgo(2, 3)
    },
    {
      id: 'prj_gas', slug: 'kitchen-gas-leak-alert', name: 'Kitchen Gas Leak Alert',
      image: '', category: 'cat_kitchen', difficulty: 'Beginner', duration: '1 hari', budget: 195000,
      type: 'default', status: 'published', tags: ['gas', 'alarm', 'dapur', 'mq2'],
      shortDescription: 'Alarm kebocoran gas dapur dengan buzzer dan notifikasi Wi-Fi.',
      description: 'Mendeteksi kebocoran gas LPG menggunakan MQ-2 dan memberi peringatan dini. Alat bantu tambahan, bukan pengganti detektor gas bersertifikat.',
      purpose: 'Memberi peringatan awal jika terjadi kebocoran gas di dapur.',
      outcome: 'Alarm berbunyi dan pesan terkirim saat gas terdeteksi.',
      features: ['Deteksi gas LPG & asap', 'Buzzer 85 dB', 'LED indikator status', 'Notifikasi Wi-Fi opsional', 'Tombol uji alarm'],
      howItWorks: ['MQ-2 membaca konsentrasi gas', 'ESP32 membandingkan dengan ambang', 'Buzzer dan LED aktif', 'Notifikasi dikirim via Wi-Fi'],
      architecture: { description: 'Sensor gas analog dibaca ESP32 dengan ambang keamanan.', input: 'MQ-2', controller: 'ESP32 DevKit V1', processing: 'Threshold + pemanasan sensor', output: 'Buzzer + LED + notifikasi', communication: 'Wi-Fi (opsional)' },
      components: [
        { componentId: 'cmp_esp32', qty: 1, mandatory: true, notes: '' },
        { componentId: 'cmp_mq2', qty: 1, mandatory: true, notes: 'Letakkan dekat area kompor.' },
        { componentId: 'cmp_buzzer', qty: 1, mandatory: true, notes: '' },
        { componentId: 'cmp_power', qty: 1, mandatory: true, notes: 'Wajib selalu menyala.' },
        { componentId: 'cmp_jumper', qty: 1, mandatory: true, notes: '' }
      ],
      buildGuide: [
        { title: 'Rangkai MQ-2', description: 'Sensor perlu pemanasan 24 jam.', image: '', instructions: ['VCC 5V, GND GND.', 'AO → GPIO35.', 'Biarkan menyala 24 jam untuk stabilisasi.'], notes: '', warning: 'Jangan menguji dengan gas asli di ruang tertutup.' },
        { title: 'Pasang alarm', description: 'Buzzer aktif untuk peringatan.', image: '', instructions: ['Buzzer + → GPIO32.', 'Tambahkan LED di GPIO33.', 'Uji dengan perintah Serial.'], notes: '', warning: '' },
        { title: 'Atur ambang', description: 'Kalibrasi dengan udara bersih.', image: '', instructions: ['Catat baseline di dapur bersih.', 'Atur THRESHOLD pada kode.', 'Uji dengan uji tombol/test mode.'], notes: '', warning: '' }
      ],
      testing: [
        { name: 'Uji baseline', description: 'Nilai sensor stabil di udara bersih.', expected: 'Fluktuasi < 5% setelah pemanasan.', instructions: 'Amati Serial Monitor 10 menit.' },
        { name: 'Uji alarm', description: 'Buzzer menyala saat ambang terlampaui.', expected: 'Buzzer berbunyi dan LED menyala.', instructions: 'Gunakan fungsi testAlarm() tanpa gas.' }
      ],
      troubleshooting: [
        { problem: 'Alarm palsu', cause: 'Sensor belum stabil atau ambang terlalu rendah.', solution: 'Panaskan 24 jam dan naikkan ambang sesuai baseline.' },
        { problem: 'Tidak mendeteksi apa pun', cause: 'Sensor tidak mendapat 5V.', solution: 'Ukur VCC dengan multimeter; pin AO harus 0–5V.' }
      ],
      upgrades: ['Tambahkan solenoid valve otomatis.', 'Tambahkan deteksi CO dengan MQ-9.', 'Kirim notifikasi Telegram.'],
      wiring: 'MQ-2 AO → GPIO35. Buzzer 32, LED 33.',
      sourceCode: `// Kitchen Gas Leak Alert — ESP32
#define GAS_PIN 35
#define BUZZER 32
#define LED 33
#define THRESHOLD 1800

void setup() {
  Serial.begin(115200);
  pinMode(BUZZER, OUTPUT);
  pinMode(LED, OUTPUT);
}

void loop() {
  int gas = analogRead(GAS_PIN);
  bool leak = gas > THRESHOLD;
  digitalWrite(LED, leak);
  if (leak) {
    for (int i = 0; i < 5; i++) {
      tone(BUZZER, 2000, 200);
      delay(250);
    }
    Serial.println("PERINGATAN: gas terdeteksi!");
  }
  delay(1000);
}`,
      views: 0, createdAt: daysAgo(7, 2), updatedAt: daysAgo(1, 3)
    },
    {
      id: 'prj_ai_hydro', slug: 'ai-smart-hydroponic-garden', name: 'AI Smart Hydroponic Garden',
      image: '', category: 'cat_garden', difficulty: 'Intermediate', duration: '3 hari', budget: 385000,
      type: 'ai', status: 'generated', tags: ['hidroponik', 'nutrisi', 'otomasi', 'generated'],
      shortDescription: 'Hidroponik otomatis dengan pemantauan nutrisi, level air, dan pompa sirkulasi.',
      description: 'Sistem hidroponik yang memantau level air, menyalakan pompa sirkulasi, dan memberi pengingat pengisian nutrisi. Dirancang untuk tanaman selada dan daun hijau.',
      purpose: 'Membuat perawatan hidroponik lebih konsisten untuk pemula.',
      outcome: 'Sirkulasi air terjadwal dan pengingat nutrisi otomatis.',
      features: ['Sirkulasi air terjadwal', 'Deteksi level air rendah', 'Pengingat nutrisi 7 hari', 'Tampilan status di OLED', 'Notifikasi Wi-Fi'],
      howItWorks: ['Sensor level memeriksa air', 'ESP32 menjalankan jadwal pompa', 'Status ditampilkan di OLED', 'Pengingat nutrisi dihitung dari RTC'],
      architecture: { description: 'Kontroler memadukan jadwal pompa, level air, dan pengingat nutrisi.', input: 'Water level sensor', controller: 'ESP32 DevKit V1', processing: 'Jadwal + safety check', output: 'Pompa sirkulasi + buzzer + OLED', communication: 'Wi-Fi (opsional)' },
      components: [
        { componentId: 'cmp_esp32', qty: 1, mandatory: true, notes: '' },
        { componentId: 'cmp_waterlevel', qty: 1, mandatory: true, notes: 'Deteksi air rendah.' },
        { componentId: 'cmp_relay', qty: 1, mandatory: true, notes: 'Untuk pompa sirkulasi.' },
        { componentId: 'cmp_pump', qty: 1, mandatory: true, notes: 'Pompa sirkulasi hidroponik.' },
        { componentId: 'cmp_oled', qty: 1, mandatory: false, notes: '' },
        { componentId: 'cmp_power', qty: 1, mandatory: true, notes: '' },
        { componentId: 'cmp_jumper', qty: 1, mandatory: true, notes: '' }
      ],
      buildGuide: [
        { title: 'Siapkan wadah hidroponik', description: 'Pastikan jalur air tidak tersumbat.', image: '', instructions: ['Susun wadah nutrisi dan net pot.', 'Pasang pompa di dasar wadah.', 'Uji aliran air tanpa tanaman.'], notes: '', warning: '' },
        { title: 'Rangkai sensor level', description: 'Sensor di batas minimum air.', image: '', instructions: ['AO → GPIO34.', 'VCC 3.3V, GND GND.', 'Tandai batas minimum pada wadah.'], notes: '', warning: '' },
        { title: 'Hubungkan pompa & relay', description: 'Pompa melalui relay channel 1.', image: '', instructions: ['IN relay → GPIO26.', 'Pompa melalui COM/NO.', 'Suplai 5V terpisah.'], notes: '', warning: 'Jauhkan elektronik dari percikan air.' },
        { title: 'Upload jadwal sirkulasi', description: 'Siklus 15 menit nyala / 45 menit mati.', image: '', instructions: ['Upload kode.', 'Pantau Serial Monitor.', 'Sesuaikan ON_MS dan OFF_MS.'], notes: '', warning: '' }
      ],
      testing: [
        { name: 'Uji level air', description: 'Pompa berhenti saat air minimum.', expected: 'Relay mati saat sensor di bawah batas.', instructions: 'Angkat sensor dari air dan amati.' },
        { name: 'Uji siklus pompa', description: 'Pompa menyala sesuai jadwal.', expected: 'Pompa aktif 15 menit setiap 60 menit.', instructions: 'Amati log 1 jam.' }
      ],
      troubleshooting: [
        { problem: 'Pompa berbunyi tapi air tidak mengalir', cause: 'Selang tertekuk atau pompa kering.', solution: 'Periksa jalur selang dan pastikan pompa terendam.' },
        { problem: 'Sensor level selalu basah', cause: 'Posisi sensor terlalu rendah.', solution: 'Naikkan sensor ke batas minimum yang diinginkan.' }
      ],
      upgrades: ['Tambahkan sensor pH dan TDS.', 'Tambahkan kamera timelapse pertumbuhan.', 'Kirim data ke dashboard web.'],
      wiring: 'Water level AO → GPIO34. Relay IN → GPIO26. OLED I2C 21/22.',
      sourceCode: `// AI Smart Hydroponic Garden — ESP32 (blueprint lokal)
#define LEVEL_PIN 34
#define RELAY_PIN 26
#define ON_MS 15UL * 60UL * 1000UL
#define OFF_MS 45UL * 60UL * 1000UL
#define DRY_LEVEL 300

unsigned long lastCycle = 0;
bool pumping = false;

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH);
}

void loop() {
  int level = analogRead(LEVEL_PIN);
  bool waterLow = level < DRY_LEVEL;

  if (!pumping && !waterLow && millis() - lastCycle > OFF_MS) {
    digitalWrite(RELAY_PIN, LOW);
    pumping = true;
    Serial.println("Pompa ON");
  } else if (pumping && (millis() - lastCycle > OFF_MS + ON_MS || waterLow)) {
    digitalWrite(RELAY_PIN, HIGH);
    pumping = false;
    lastCycle = millis();
    Serial.println("Pompa OFF");
  }
  delay(1000);
}`,
      aiMeta: { prompt: 'Buat hidroponik otomatis yang memantau level air dan menjadwalkan pompa sirkulasi untuk tanaman selada.', generatedAt: daysAgo(5, 2), reviewStatus: 'Generated', verified: false },
      views: 0, createdAt: daysAgo(5, 2), updatedAt: daysAgo(5, 2)
    },
    {
      id: 'prj_ai_sleep', slug: 'ai-smart-sleep-environment', name: 'AI Smart Sleep Environment',
      image: '', category: 'cat_room', difficulty: 'Intermediate', duration: '2 hari', budget: 275000,
      type: 'ai', status: 'reviewed', tags: ['tidur', 'cahaya', 'suhu', 'generated'],
      shortDescription: 'Suasana kamar otomatis meredup dan mendingin saat waktu tidur.',
      description: 'Mengatur lampu dan sirkulasi kamar berdasarkan jadwal tidur serta suhu ruangan. Dirancang sebagai blueprint yang masih perlu diverifikasi untuk keamanan perangkat listrik.',
      purpose: 'Membantu rutinitas tidur yang lebih konsisten.',
      outcome: 'Lampu meredup otomatis dan kipas aktif saat suhu tinggi.',
      features: ['Jadwal tidur & bangun', 'Dimmer LED bertahap', 'Kipas otomatis berdasarkan suhu', 'Mode bangun lembut', 'Tombol override manual'],
      howItWorks: ['RTC memberi jadwal tidur', 'DHT22 membaca suhu', 'ESP32 mengatur kecerahan LED', 'Relay menyalakan kipas bila perlu'],
      architecture: { description: 'Kontroler menyatukan jadwal, sensor suhu, dan aktuator.', input: 'RTC + DHT22', controller: 'ESP32 DevKit V1', processing: 'Jadwal + ambang suhu', output: 'LED strip + relay kipas', communication: 'I2C' },
      components: [
        { componentId: 'cmp_esp32', qty: 1, mandatory: true, notes: '' },
        { componentId: 'cmp_dht22', qty: 1, mandatory: true, notes: '' },
        { componentId: 'cmp_rtc', qty: 1, mandatory: true, notes: '' },
        { componentId: 'cmp_led', qty: 1, mandatory: true, notes: '' },
        { componentId: 'cmp_relay', qty: 1, mandatory: true, notes: 'Untuk kipas.' },
        { componentId: 'cmp_power', qty: 1, mandatory: true, notes: '' }
      ],
      buildGuide: [
        { title: 'Rangkai sensor & RTC', description: 'DHT22 dan RTC pada ESP32.', image: '', instructions: ['DHT22 DATA → GPIO4 dengan pull-up.', 'RTC SDA 21, SCL 22.', 'Cek alamat I2C.'], notes: '', warning: '' },
        { title: 'Pasang LED & relay kipas', description: 'LED untuk suasana, relay untuk kipas.', image: '', instructions: ['LED DIN → GPIO13.', 'Relay IN → GPIO26.', 'Gunakan beban 5V saat uji.'], notes: '', warning: '' },
        { title: 'Atur jadwal tidur', description: 'Waktu meredup dan mode bangun.', image: '', instructions: ['Ubah SLEEP_HOUR dan WAKE_HOUR.', 'Upload dan uji dengan waktu simulasi.'], notes: '', warning: '' }
      ],
      testing: [
        { name: 'Uji dimmer', description: 'LED meredup bertahap.', expected: 'Kecerahan turun dalam 10 langkah.', instructions: 'Picu mode tidur lewat Serial.' },
        { name: 'Uji kipas', description: 'Relay kipas aktif saat suhu tinggi.', expected: 'Relay aktif di atas 30 °C.', instructions: 'Ubah ambang sementara untuk pengujian.' }
      ],
      troubleshooting: [
        { problem: 'LED berkedip aneh', cause: 'Power supply kurang.', solution: 'Gunakan adaptor 5V 2A dan kapasitor 1000µF.' },
        { problem: 'Jadwal tidak jalan', cause: 'RTC belum diset.', solution: 'Set RTC saat pertama kali setup.' }
      ],
      upgrades: ['Tambahkan sensor cahaya untuk mode adaptif.', 'Integrasikan dengan alarm ponsel.', 'Tambahkan speaker white noise.'],
      wiring: 'LED DIN 13. DHT22 4. RTC I2C 21/22. Relay kipas 26.',
      sourceCode: `// AI Smart Sleep Environment — ESP32 (blueprint lokal)
#define LED_PIN 13
#define FAN_RELAY 26
#define SLEEP_HOUR 22
#define WAKE_HOUR 6

void setup() {
  Serial.begin(115200);
  pinMode(FAN_RELAY, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  // Contoh kerangka: integrasikan RTC + DHT22 pada implementasi nyata.
  int hour = 22; // ganti dengan rtc.now().hour()
  bool sleepMode = hour >= SLEEP_HOUR || hour < WAKE_HOUR;
  digitalWrite(LED_PIN, sleepMode ? LOW : HIGH);
  delay(60000);
}`,
      aiMeta: { prompt: 'Rancang suasana tidur otomatis dengan lampu meredup dan kipas saat suhu tinggi.', generatedAt: daysAgo(3, 1), reviewStatus: 'Reviewed', verified: false },
      views: 0, createdAt: daysAgo(3, 1), updatedAt: daysAgo(1, 2)
    },
    {
      id: 'prj_ai_laundry', slug: 'ai-smart-laundry-reminder', name: 'AI Smart Laundry Reminder',
      image: '', category: 'cat_automation', difficulty: 'Beginner', duration: '1 hari', budget: 160000,
      type: 'ai', status: 'draft', tags: ['laundry', 'pengingat', 'getar', 'generated'],
      shortDescription: 'Pengingat sederhana saat mesin cuci selesai berputar.',
      description: 'Mendeteksi getaran mesin cuci dan mengirim pengingat ketika siklus selesai. Blueprint ini masih berupa draft dan belum diuji pada mesin cuci nyata.',
      purpose: 'Menghindari cucian tertinggal terlalu lama di mesin.',
      outcome: 'Notifikasi muncul saat getaran mesin berhenti setelah siklus.',
      features: ['Deteksi getaran via sensor', 'Timer diam 3 menit', 'Notifikasi Wi-Fi', 'Buzzer lokal', 'Log siklus terakhir'],
      howItWorks: ['Sensor getar mendeteksi mesin aktif', 'ESP32 menunggu hingga getaran berhenti', 'Setelah 3 menit diam, notifikasi dikirim'],
      architecture: { description: 'Sensor getar + logika timer.', input: 'Sensor getar / SW-420', controller: 'ESP32 DevKit V1', processing: 'State machine aktif → diam', output: 'Buzzer + notifikasi', communication: 'Wi-Fi' },
      components: [
        { componentId: 'cmp_esp32', qty: 1, mandatory: true, notes: '' },
        { componentId: 'cmp_pir', qty: 1, mandatory: false, notes: 'Alternatif deteksi orang di area laundry.' },
        { componentId: 'cmp_buzzer', qty: 1, mandatory: true, notes: '' },
        { componentId: 'cmp_power', qty: 1, mandatory: true, notes: '' }
      ],
      buildGuide: [
        { title: 'Pasang sensor getar', description: 'Tempelkan pada bodi mesin.', image: '', instructions: ['Hubungkan sensor ke GPIO34.', 'Rekatkan sensor dengan double tape.', 'Uji getaran manual.'], notes: '', warning: '' },
        { title: 'Atur logika timer', description: 'Tentukan durasi diam.', image: '', instructions: ['Ubah QUIET_MS.', 'Upload dan uji dengan simulasi getaran.'], notes: '', warning: '' }
      ],
      testing: [
        { name: 'Uji deteksi getaran', description: 'Sensor membaca getaran.', expected: 'Nilai berubah saat mesin disentuh/bergetar.', instructions: 'Amati Serial Monitor.' }
      ],
      troubleshooting: [
        { problem: 'Notifikasi tidak terkirim', cause: 'Kredensial Wi-Fi belum diisi.', solution: 'Isi SSID dan password pada bagian konfigurasi.' }
      ],
      upgrades: ['Tambahkan sensor arus untuk deteksi daya mesin.', 'Kirim notifikasi ke Telegram.'],
      wiring: 'Sensor getar DO → GPIO34. Buzzer 32.',
      sourceCode: `// AI Smart Laundry Reminder — ESP32 (draft blueprint lokal)
#define VIB_PIN 34
#define BUZZER 32
#define QUIET_MS 3UL * 60UL * 1000UL

unsigned long lastVibration = 0;
bool running = false;

void loop() {
  if (digitalRead(VIB_PIN) == HIGH) {
    lastVibration = millis();
    running = true;
  }
  if (running && millis() - lastVibration > QUIET_MS) {
    tone(BUZZER, 1500, 500);
    Serial.println("Cucian selesai!");
    running = false;
  }
  delay(200);
}`,
      aiMeta: { prompt: 'Buat pengingat otomatis saat mesin cuci selesai berputar.', generatedAt: daysAgo(1, 4), reviewStatus: 'Draft', verified: false },
      views: 0, createdAt: daysAgo(1, 4), updatedAt: daysAgo(1, 4)
    }
  ];

  const activity = [];
  projects.forEach((p) => activity.push({
    id: uid('act'), type: 'create', entity: 'project',
    message: `Proyek "${p.name}" ditambahkan (${p.type === 'ai' ? 'AI generated' : 'default'})`,
    at: p.createdAt
  }));
  components.slice(0, 6).forEach((c) => activity.push({
    id: uid('act'), type: 'create', entity: 'component',
    message: `Komponen "${c.name}" ditambahkan ke database`,
    at: c.createdAt
  }));
  activity.sort((a, b) => new Date(b.at) - new Date(a.at));

  const events = [];
  const pageNames = ['home', 'explore', 'components', 'ai-builder', 'budget'];
  for (let d = 13; d >= 0; d--) {
    const views = 22 + ((d * 7) % 26) + (d % 3 === 0 ? 12 : 0);
    for (let i = 0; i < views; i++) {
      events.push({ id: uid('ev'), type: 'page_view', meta: { page: pageNames[i % pageNames.length] }, at: daysAgo(d, i % 8) });
    }
    if (d % 2 === 0) events.push({ id: uid('ev'), type: 'project_view', meta: { projectId: projects[d % projects.length].id }, at: daysAgo(d, 3) });
    if (d % 3 === 0) events.push({ id: uid('ev'), type: 'ai_builder_open', meta: {}, at: daysAgo(d, 5) });
    if (d % 4 === 0) events.push({ id: uid('ev'), type: 'project_generate', meta: { category: categories[d % categories.length].name, difficulty: 'Intermediate' }, at: daysAgo(d, 6) });
    if (d % 2 === 1) events.push({ id: uid('ev'), type: 'component_view', meta: { componentId: components[d % components.length].id }, at: daysAgo(d, 2) });
    if (d % 3 === 1) events.push({ id: uid('ev'), type: 'project_save', meta: { projectId: projects[(d + 2) % projects.length].id }, at: daysAgo(d, 4) });
  }
  events.sort((a, b) => new Date(b.at) - new Date(a.at));

  return {
    version: 1,
    settings: {
      siteName: 'IoT at Home',
      tagline: 'Discover. Design. Build.',
      logo: '',
      primaryColor: '#0d9488',
      accentColor: '#e0f2fe',
      footer: 'Platform belajar IoT berbasis AI untuk mengubah ide menjadi proyek nyata. Dibangun untuk eksplorasi, bukan pengganti sertifikasi teknis.'
    },
    hero: {
      title: 'Ubah ide jadi proyek IoT yang benar-benar bisa kamu bangun.',
      subtitle: 'Discover. Design. Build.',
      description: 'AI Builder menyusun daftar komponen, estimasi budget, wiring, source code, dan panduan langkah demi langkah — dari tanaman pintar sampai keamanan rumah.',
      image: '',
      ctaText: 'Mulai dengan AI Builder',
      ctaLink: '#/ai-builder'
    },
    sections: [
      { id: 'featured', title: 'Featured Projects', subtitle: 'Pilihan proyek yang paling siap dibangun minggu ini.', enabled: true },
      { id: 'popular', title: 'Popular Projects', subtitle: 'Proyek yang paling sering dilihat pengunjung.', enabled: true },
      { id: 'beginner', title: 'Beginner Friendly', subtitle: 'Mulai dari sini kalau baru pertama kali belajar IoT.', enabled: true },
      { id: 'budget', title: 'Budget-Based Projects', subtitle: 'Proyek di bawah Rp 200.000 untuk belajar hemat.', enabled: true },
      { id: 'categories', title: 'Jelajahi Kategori', subtitle: 'Temukan proyek sesuai area rumah yang ingin kamu otomasi.', enabled: true }
    ],
    featured: ['prj_plant', 'prj_light', 'prj_lock', 'prj_ai_hydro'],
    homeCategories: categories.map(c => c.id),
    admin: { username: DEFAULT_CREDENTIALS.username },
    categories,
    components,
    projects,
    activity,
    events,
    myBuild: [],
    shoppingList: []
  };
}

/* ---------------- Store implementation ---------------- */
const Store = (function () {
  let state = null;
  const listeners = new Set();

  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

  function read() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.projects)) return null;
      return parsed;
    } catch (err) {
      console.warn('Data store tidak valid, memuat data demo.', err);
      return null;
    }
  }

  function emit() { listeners.forEach(fn => { try { fn(state); } catch (e) { console.error(e); } }); }

  function save() {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
    emit();
  }

  function init() {
    state = read() || seedState();
    if (!read()) save();
    return state;
  }

  function get() { if (!state) init(); return state; }
  function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

  function logActivity(type, message, entity = 'system') {
    get().activity.unshift({ id: uid('act'), type, message, entity, at: new Date().toISOString() });
    get().activity = get().activity.slice(0, 300);
  }

  function track(type, meta = {}) {
    const s = get();
    s.events.unshift({ id: uid('ev'), type, meta, at: new Date().toISOString() });
    s.events = s.events.slice(0, 800);
    save();
  }

  /* --- lookups & derived --- */
  function categoryById(id) { return get().categories.find(c => c.id === id || c.slug === id) || null; }
  function componentById(id) { return get().components.find(c => c.id === id || c.slug === id) || null; }
  function projectById(id) { return get().projects.find(p => p.id === id) || null; }
  function projectBySlug(slug) { return get().projects.find(p => p.slug === slug) || null; }
  function isVisible(project) { return project && ['published', 'reviewed', 'generated'].includes(project.status); }
  function visibleProjects() { return get().projects.filter(isVisible); }
  function aiProjects() { return get().projects.filter(p => p.type === 'ai'); }
  function projectCost(project) {
    if (!project) return 0;
    const sum = (project.components || []).reduce((total, item) => {
      const comp = componentById(item.componentId);
      return total + (comp ? comp.price * (Number(item.qty) || 1) : 0);
    }, 0);
    return sum || Number(project.budget) || 0;
  }
  function projectComponentDetails(project) {
    return (project.components || []).map(item => ({ ...item, component: componentById(item.componentId) }))
      .filter(item => item.component);
  }
  function categoryProjectCount(catId) { return get().projects.filter(p => p.category === catId).length; }
  function componentUsageCount(compId) {
    return get().projects.filter(p => (p.components || []).some(c => c.componentId === compId)).length;
  }

  /* --- projects --- */
  function normalizeProject(data) {
    return {
      id: data.id || uid('prj'),
      slug: data.slug || slugify(data.name || ''),
      name: (data.name || 'Untitled project').trim(),
      image: data.image || '',
      category: data.category || get().categories[0]?.id || '',
      difficulty: data.difficulty || 'Beginner',
      duration: data.duration || '—',
      budget: Number(data.budget) || 0,
      type: data.type === 'ai' ? 'ai' : 'default',
      status: data.status || 'draft',
      tags: Array.isArray(data.tags) ? data.tags : String(data.tags || '').split(',').map(t => t.trim()).filter(Boolean),
      shortDescription: data.shortDescription || '',
      description: data.description || '',
      purpose: data.purpose || '',
      outcome: data.outcome || '',
      features: Array.isArray(data.features) ? data.features.map(f => String(f).trim()).filter(Boolean) : [],
      howItWorks: Array.isArray(data.howItWorks) ? data.howItWorks.map(f => String(f).trim()).filter(Boolean) : [],
      architecture: data.architecture || { description: '', input: '', controller: '', processing: '', output: '', communication: '' },
      components: Array.isArray(data.components) ? data.components : [],
      buildGuide: Array.isArray(data.buildGuide) ? data.buildGuide : [],
      testing: Array.isArray(data.testing) ? data.testing : [],
      troubleshooting: Array.isArray(data.troubleshooting) ? data.troubleshooting : [],
      upgrades: Array.isArray(data.upgrades) ? data.upgrades.map(u => String(u).trim()).filter(Boolean) : [],
      wiring: data.wiring || '',
      sourceCode: data.sourceCode || '',
      aiMeta: data.aiMeta || null,
      views: Number(data.views) || 0,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  function addProject(data) {
    const s = get();
    const project = normalizeProject(data);
    if (s.projects.some(p => p.slug === project.slug)) project.slug = `${project.slug}-${Math.random().toString(36).slice(2, 5)}`;
    s.projects.unshift(project);
    logActivity('create', `Proyek "${project.name}" ditambahkan`, 'project');
    save();
    return project;
  }

  function updateProject(id, data) {
    const s = get();
    const idx = s.projects.findIndex(p => p.id === id);
    if (idx < 0) return null;
    const merged = normalizeProject({ ...s.projects[idx], ...data, id });
    s.projects[idx] = merged;
    logActivity('update', `Proyek "${merged.name}" diperbarui`, 'project');
    save();
    return merged;
  }

  function deleteProject(id) {
    const s = get();
    const project = s.projects.find(p => p.id === id);
    if (!project) return false;
    s.projects = s.projects.filter(p => p.id !== id);
    s.featured = s.featured.filter(f => f !== id);
    s.myBuild = s.myBuild.filter(b => b.projectId !== id);
    s.shoppingList = s.shoppingList.filter(item => item.projectId !== id);
    logActivity('delete', `Proyek "${project.name}" dihapus`, 'project');
    save();
    return true;
  }

  function duplicateProject(id) {
    const s = get();
    const original = s.projects.find(p => p.id === id);
    if (!original) return null;
    const copy = clone(original);
    copy.id = uid('prj');
    copy.name = `${original.name} (Copy)`;
    copy.slug = `${original.slug}-copy-${Math.random().toString(36).slice(2, 5)}`;
    copy.status = 'draft';
    copy.type = original.type;
    copy.views = 0;
    copy.createdAt = new Date().toISOString();
    copy.updatedAt = copy.createdAt;
    if (copy.aiMeta) copy.aiMeta = { ...copy.aiMeta, reviewStatus: 'Draft' };
    s.projects.unshift(copy);
    logActivity('duplicate', `Proyek "${original.name}" diduplikasi menjadi "${copy.name}"`, 'project');
    save();
    return copy;
  }

  function setProjectStatus(id, status) {
    const p = get().projects.find(x => x.id === id);
    if (!p) return null;
    p.status = status;
    p.updatedAt = new Date().toISOString();
    if (p.aiMeta && status === 'published') p.aiMeta.reviewStatus = 'Published';
    if (p.aiMeta && status === 'reviewed') p.aiMeta.reviewStatus = 'Reviewed';
    logActivity('update', `Status proyek "${p.name}" diubah menjadi ${status}`, 'project');
    save();
    return p;
  }

  /* --- components --- */
  function normalizeComponent(data) {
    return {
      id: data.id || uid('cmp'),
      name: (data.name || 'Komponen baru').trim(),
      slug: data.slug || slugify(data.name || ''),
      image: data.image || '',
      category: data.category || 'Sensor',
      description: data.description || '',
      function: data.function || '',
      price: Number(data.price) || 0,
      voltage: data.voltage || '',
      current: data.current || '',
      communication: data.communication || '',
      spec: data.spec || '',
      compatibility: data.compatibility || '',
      difficulty: data.difficulty || 'Beginner',
      datasheet: data.datasheet || '',
      shopee: data.shopee || '',
      tokopedia: data.tokopedia || '',
      notes: data.notes || '',
      alternatives: Array.isArray(data.alternatives) ? data.alternatives : [],
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  function addComponent(data) {
    const s = get();
    const comp = normalizeComponent(data);
    s.components.unshift(comp);
    logActivity('create', `Komponen "${comp.name}" ditambahkan`, 'component');
    save();
    return comp;
  }

  function updateComponent(id, data) {
    const s = get();
    const idx = s.components.findIndex(c => c.id === id);
    if (idx < 0) return null;
    const merged = normalizeComponent({ ...s.components[idx], ...data, id });
    s.components[idx] = merged;
    logActivity('update', `Komponen "${merged.name}" diperbarui`, 'component');
    save();
    return merged;
  }

  function deleteComponent(id) {
    const s = get();
    const comp = s.components.find(c => c.id === id);
    if (!comp) return false;
    s.components = s.components.filter(c => c.id !== id);
    s.projects.forEach(p => { p.components = (p.components || []).filter(c => c.componentId !== id); });
    s.shoppingList = s.shoppingList.filter(item => item.componentId !== id);
    logActivity('delete', `Komponen "${comp.name}" dihapus dari database`, 'component');
    save();
    return true;
  }

  /* --- categories --- */
  function normalizeCategory(data) {
    return {
      id: data.id || uid('cat'),
      name: (data.name || 'Kategori baru').trim(),
      slug: data.slug || slugify(data.name || ''),
      icon: data.icon || '📦',
      description: data.description || '',
      image: data.image || '',
      status: data.status || 'active',
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  function addCategory(data) {
    const s = get();
    const cat = normalizeCategory(data);
    s.categories.push(cat);
    s.homeCategories.push(cat.id);
    logActivity('create', `Kategori "${cat.name}" ditambahkan`, 'category');
    save();
    return cat;
  }

  function updateCategory(id, data) {
    const s = get();
    const idx = s.categories.findIndex(c => c.id === id);
    if (idx < 0) return null;
    const merged = normalizeCategory({ ...s.categories[idx], ...data, id });
    s.categories[idx] = merged;
    logActivity('update', `Kategori "${merged.name}" diperbarui`, 'category');
    save();
    return merged;
  }

  function deleteCategory(id, reassignTo = null) {
    const s = get();
    const cat = s.categories.find(c => c.id === id);
    if (!cat) return false;
    if (reassignTo) {
      s.projects.forEach(p => { if (p.category === id) p.category = reassignTo; });
    } else {
      s.projects.forEach(p => { if (p.category === id) p.category = ''; });
    }
    s.categories = s.categories.filter(c => c.id !== id);
    s.homeCategories = s.homeCategories.filter(c => c !== id);
    logActivity('delete', `Kategori "${cat.name}" dihapus${reassignTo ? ' dan proyeknya dipindahkan' : ''}`, 'category');
    save();
    return true;
  }

  /* --- content --- */
  function updateHero(data) {
    get().hero = { ...get().hero, ...data };
    logActivity('update', 'Konten hero homepage diperbarui', 'content');
    save();
  }
  function updateSettings(data) {
    get().settings = { ...get().settings, ...data };
    logActivity('update', 'Pengaturan website diperbarui', 'settings');
    save();
  }
  function setFeatured(list) {
    get().featured = list;
    logActivity('update', 'Featured projects homepage diperbarui', 'content');
    save();
  }
  function setHomeCategories(list) {
    get().homeCategories = list;
    logActivity('update', 'Kategori homepage diperbarui', 'content');
    save();
  }
  function setSections(list) {
    get().sections = list;
    logActivity('update', 'Urutan & visibilitas section homepage diperbarui', 'content');
    save();
  }

  /* --- my build & shopping --- */
  function saveToMyBuild(projectId) {
    const s = get();
    if (s.myBuild.some(b => b.projectId === projectId)) return false;
    const project = projectById(projectId);
    if (!project) return false;
    s.myBuild.unshift({ projectId, progress: [], notes: '', savedAt: new Date().toISOString() });
    logActivity('update', `Proyek "${project.name}" disimpan ke My Build`, 'mybuild');
    track('project_save', { projectId });
    save();
    return true;
  }
  function removeFromMyBuild(projectId) {
    get().myBuild = get().myBuild.filter(b => b.projectId !== projectId);
    save();
  }
  function toggleBuildStep(projectId, stepIndex) {
    const item = get().myBuild.find(b => b.projectId === projectId);
    if (!item) return;
    const i = item.progress.indexOf(stepIndex);
    if (i >= 0) item.progress.splice(i, 1); else item.progress.push(stepIndex);
    save();
  }
  function setBuildNotes(projectId, notes) {
    const item = get().myBuild.find(b => b.projectId === projectId);
    if (!item) return;
    item.notes = notes;
    save();
  }
  function addToShoppingList(componentId, qty = 1, projectId = null) {
    const s = get();
    const existing = s.shoppingList.find(i => i.componentId === componentId);
    if (existing) existing.qty += Number(qty) || 1;
    else s.shoppingList.push({ componentId, qty: Number(qty) || 1, checked: false, projectId });
    const comp = componentById(componentId);
    logActivity('update', `"${comp ? comp.name : 'Komponen'}" ditambahkan ke Shopping List`, 'shopping');
    save();
  }
  function addProjectToShoppingList(projectId) {
    const project = projectById(projectId);
    if (!project) return 0;
    let count = 0;
    (project.components || []).forEach(item => { addToShoppingList(item.componentId, item.qty || 1, projectId); count++; });
    return count;
  }
  function updateShoppingQty(componentId, qty) {
    const item = get().shoppingList.find(i => i.componentId === componentId);
    if (!item) return;
    item.qty = Math.max(1, Number(qty) || 1);
    save();
  }
  function toggleShoppingChecked(componentId) {
    const item = get().shoppingList.find(i => i.componentId === componentId);
    if (!item) return;
    item.checked = !item.checked;
    save();
  }
  function removeShoppingItem(componentId) {
    get().shoppingList = get().shoppingList.filter(i => i.componentId !== componentId);
    logActivity('delete', 'Item shopping list dihapus', 'shopping');
    save();
  }
  function clearShoppingList() {
    get().shoppingList = [];
    logActivity('delete', 'Shopping list dikosongkan', 'shopping');
    save();
  }

  /* --- settings / admin creds / storage --- */
  function exportData() {
    const s = clone(get());
    return {
      exportedAt: new Date().toISOString(),
      app: 'IoT at Home',
      version: s.version,
      data: {
        settings: s.settings, hero: s.hero, sections: s.sections, featured: s.featured,
        homeCategories: s.homeCategories, categories: s.categories, components: s.components,
        projects: s.projects, activity: s.activity, events: s.events, myBuild: s.myBuild, shoppingList: s.shoppingList
      }
    };
  }

  function validateImport(payload) {
    const errors = [];
    if (!payload || typeof payload !== 'object') errors.push('Struktur JSON tidak valid.');
    const data = payload && payload.data ? payload.data : payload;
    if (!data || typeof data !== 'object') errors.push('Objek "data" tidak ditemukan.');
    ['projects', 'components', 'categories'].forEach((key) => {
      if (data && data[key] && !Array.isArray(data[key])) errors.push(`"${key}" harus berupa array.`);
    });
    if (data && data.projects && data.projects.some(p => !p || !p.name)) errors.push('Setiap proyek wajib memiliki "name".');
    if (data && data.components && data.components.some(c => !c || !c.name)) errors.push('Setiap komponen wajib memiliki "name".');
    if (data && data.categories && data.categories.some(c => !c || !c.name)) errors.push('Setiap kategori wajib memiliki "name".');
    return { valid: errors.length === 0, errors, data };
  }

  function importData(payload) {
    const check = validateImport(payload);
    if (!check.valid) return check;
    const current = get();
    const data = check.data;
    state = {
      ...current,
      settings: data.settings || current.settings,
      hero: data.hero || current.hero,
      sections: Array.isArray(data.sections) ? data.sections : current.sections,
      featured: Array.isArray(data.featured) ? data.featured : current.featured,
      homeCategories: Array.isArray(data.homeCategories) ? data.homeCategories : current.homeCategories,
      categories: Array.isArray(data.categories) ? data.categories : current.categories,
      components: Array.isArray(data.components) ? data.components : current.components,
      projects: Array.isArray(data.projects) ? data.projects.map(normalizeProject) : current.projects,
      activity: Array.isArray(data.activity) ? data.activity : current.activity,
      myBuild: Array.isArray(data.myBuild) ? data.myBuild : current.myBuild,
      shoppingList: Array.isArray(data.shoppingList) ? data.shoppingList : current.shoppingList
    };
    logActivity('update', 'Data diimpor dari file JSON', 'settings');
    save();
    return check;
  }

  function resetData() {
    state = seedState();
    save();
    logActivity('update', 'Data demo dikembalikan ke kondisi awal', 'settings');
    save();
  }

  function storageUsage() {
    let bytes = 0;
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('iotAtHome')) bytes += (localStorage.getItem(key) || '').length * 2;
    });
    return bytes;
  }

  return {
    init, get, save, subscribe, track, logActivity,
    categoryById, componentById, projectById, projectBySlug, isVisible, visibleProjects, aiProjects,
    projectCost, projectComponentDetails, categoryProjectCount, componentUsageCount,
    addProject, updateProject, deleteProject, duplicateProject, setProjectStatus,
    addComponent, updateComponent, deleteComponent,
    addCategory, updateCategory, deleteCategory,
    updateHero, updateSettings, setFeatured, setHomeCategories, setSections,
    saveToMyBuild, removeFromMyBuild, toggleBuildStep, setBuildNotes,
    addToShoppingList, addProjectToShoppingList, updateShoppingQty, toggleShoppingChecked,
    removeShoppingItem, clearShoppingList,
    exportData, validateImport, importData, resetData, storageUsage
  };
})();

/* ---------------- Auth (prototype, client-side saja) ---------------- */
const Auth = (function () {
  function creds() {
    try {
      return JSON.parse(localStorage.getItem(AUTH_KEY)) || { ...DEFAULT_CREDENTIALS };
    } catch (err) {
      return { ...DEFAULT_CREDENTIALS };
    }
  }
  function saveCreds(data) { localStorage.setItem(AUTH_KEY, JSON.stringify(data)); }

  function login(username, password, remember = true) {
    const c = creds();
    if (String(username).trim() !== c.username || String(password) !== c.password) {
      return { ok: false, error: 'Username atau password salah.' };
    }
    const session = { username: c.username, loginAt: new Date().toISOString(), expiresAt: Date.now() + SESSION_TTL, remember };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { ok: true, session };
  }

  function session() {
    try {
      const s = JSON.parse(localStorage.getItem(SESSION_KEY));
      if (!s) return null;
      if (!s.expiresAt || s.expiresAt < Date.now()) { localStorage.removeItem(SESSION_KEY); return null; }
      return s;
    } catch (err) { return null; }
  }

  function isAuthed() { return !!session(); }

  function refresh() {
    const s = session();
    if (!s) return null;
    s.expiresAt = Date.now() + SESSION_TTL;
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    return s;
  }

  function logout() { localStorage.removeItem(SESSION_KEY); }

  function updateCredentials({ username, password, currentPassword }) {
    const c = creds();
    if (currentPassword !== c.password) return { ok: false, error: 'Password saat ini tidak cocok.' };
    const next = { username: (username || c.username).trim(), password: password ? password : c.password };
    if (!next.username) return { ok: false, error: 'Username tidak boleh kosong.' };
    if (next.password.length < 4) return { ok: false, error: 'Password minimal 4 karakter.' };
    saveCreds(next);
    const s = session();
    if (s) { s.username = next.username; localStorage.setItem(SESSION_KEY, JSON.stringify(s)); }
    return { ok: true };
  }

  function resetCredentials() { saveCreds({ ...DEFAULT_CREDENTIALS }); }

  return { login, logout, isAuthed, session, refresh, creds, updateCredentials, resetCredentials };
})();
