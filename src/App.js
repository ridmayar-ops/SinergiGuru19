import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Inisialisasi Supabase menggunakan Environment Variables dari Vercel
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
