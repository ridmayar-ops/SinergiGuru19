import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Inisialisasi Supabase menggunakan Environment Variables dari Vercel
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tambahkan objek gaya ini di luar fungsi App atau di bagian atas
const styles = {
  container: { padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f7f6', minHeight: '100vh' },
  header: { textAlign: 'center', color: '#2c3e50', marginBottom: '30px' },
  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px' },
  card: { 
    backgroundColor: '#fff', 
    padding: '20px', 
    borderRadius: '15px', 
    textAlign: 'center', 
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    transition: 'transform 0.2s'
  },
  icon: { fontSize: '30px', marginBottom: '10px', display: 'block' },
  label: { fontWeight: 'bold', color: '#34495e', fontSize: '14px' },
  logoutBtn: { marginTop: '30px', padding: '10px', width: '100%', borderRadius: '10px', border: 'none', backgroundColor: '#e74c3c', color: '#fff' }
};

// Di dalam return App() setelah user login:
return (
  <div style={styles.container}>
    <div style={styles.header}>
      <h2>Halo, Bapak/Ibu Guru</h2>
      <p style={{ fontSize: '14px', color: '#7f8c8d' }}>{user.email}</p>
    </div>

    <div style={styles.cardGrid}>
      <div style={styles.card} onClick={() => alert("Membuka Absensi...")}>
        <span style={styles.icon}>📋</span>
        <span style={styles.label}>Absen Siswa</span>
      </div>

      <div style={styles.card} onClick={() => alert("Membuka Daftar Nilai...")}>
        <span style={styles.icon}>📊</span>
        <span style={styles.label}>Input Nilai</span>
      </div>

      <div style={styles.card} onClick={() => alert("Membuka Jadwal...")}>
        <span style={styles.icon}>📅</span>
        <span style={styles.label}>Jadwal Mengajar</span>
      </div>

      <div style={styles.card} onClick={() => alert("Membuka AI Helper...")}>
        <span style={styles.icon}>🤖</span>
        <span style={styles.label}>Asisten AI</span>
      </div>
    </div>

    <button style={styles.logoutBtn} onClick={() => supabase.auth.signOut()}>
      Keluar Aplikasi
    </button>
  </div>
);

// Variabel penenang ESLint yang Anda tanyakan sebelumnya
const __app_id = 'sinergi-guru-v8';
const __initial_auth_token = null;

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fungsi Pendaftaran Akun (Sesuai kebutuhan Anda)
  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert("Gagal Daftar: " + error.message);
    } else {
      alert("Cek email Anda untuk konfirmasi pendaftaran!");
      setUser(data.user);
    }
    setLoading(false);
  };

  // Fungsi Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert("Login Gagal: " + error.message);
    } else {
      setUser(data.user);
    }
    setLoading(false);
  };

  // Fungsi Placeholder agar tidak error "not defined"
  const recordAttendance = () => { console.log("Fitur Absen Aktif"); };
  const addGrade = () => { console.log("Fitur Nilai Aktif"); };

  return (
    <div className="App" style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Sinergi Guru AI</h1>
      {!user ? (
        <form style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px', margin: 'auto' }}>
          <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
          <button onClick={handleLogin} disabled={loading}>Login</button>
          <button onClick={handleSignUp} disabled={loading}>Daftar Akun Baru</button>
        </form>
      ) : (
        <div>
          <p>Selamat Datang, {user.email}!</p>
          <button onClick={() => supabase.auth.signOut()}>Logout</button>
          <hr />
          <button onClick={recordAttendance}>Catat Kehadiran</button>
          <button onClick={addGrade}>Input Nilai</button>
        </div>
      )}
    </div>
  );
}

export default App;

