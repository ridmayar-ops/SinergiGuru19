import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  FileSpreadsheet, 
  Settings, 
  LogOut, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Printer,
  User,
  GraduationCap,
  Save,
  Trash2,
  FileText,
  AlertCircle,
  ChevronRight,
  ClipboardList,
  Mail, 
  Lock,
  ArrowRight,
  Image as ImageIcon,
  Video,
  MapPin,
  Upload,
  UserPlus,
  UsersRound,
  Briefcase,
  UserCircle
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend 
} from 'recharts';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInAnonymously, 
  signInWithCustomToken,
  signOut 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where
} from 'firebase/firestore';

// --- Konfigurasi Firebase ---
const firebaseConfig = {
  apiKey: "AIzaSyDxnTv7_L3T1-x-_BtJwJftLszmMzM8-Y0",
  authDomain: "sinergiguru19.firebaseapp.com",
  projectId: "sinergiguru19",
  storageBucket: "sinergiguru19.firebasestorage.app",
  messagingSenderId: "897127062626",
  appId: "1:897127062626:web:932b2cdfc5f363ccbfc53b",
  measurementId: "G-BZ05M1WPSR"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'sinergi-guru-v8';

// --- Konstanta ---
const COLORS = ['#6366f1', '#f59e0b', '#ef4444']; // Indigo, Amber, Rose
const GRADE_TYPES = ['Formatif', 'Sumatif', 'Sikap'];
const EXTRA_DUTIES = ['Wakil Kepala Madrasah', 'Kepala Perpustakaan', 'Kepala Laboratorium', 'Wali Kelas', 'Pembina Ekskul', 'Tugas Piket', 'Rapat/Workshop', 'Lainnya'];

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [authMode, setAuthMode] = useState('login');
  
  // State Data Guru & Madrasah
  const [teacherProfile, setTeacherProfile] = useState({ 
    name: 'Guru Sinergi, S.Pd.', 
    nip: '-',
    photoUrl: '', // Tautan foto guru
    school: 'Madrasah Digital Indonesia', 
    bio: 'Pendidik Profesional Abad 21',
    location: 'Jakarta',
    headmasterName: 'Kepala Madrasah, M.Pd.',
    headmasterNip: '-'
  });
  
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [journals, setJournals] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [grades, setGrades] = useState([]);
  
  // UI States
  const [importText, setImportText] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('Semua');
  const [journalType, setJournalType] = useState('Mengajar');

  // --- Autentikasi ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        }
      } catch (error) {
        console.error("Auth error", error);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // --- Sinkronisasi Data Firestore ---
  useEffect(() => {
    if (!user) return;

    const userPath = ['artifacts', appId, 'users', user.uid];
    
    const unsubProfile = onSnapshot(doc(db, ...userPath, 'profile', 'info'), (doc) => {
      if (doc.exists()) setTeacherProfile(doc.data());
    });

    const unsubSubjects = onSnapshot(collection(db, ...userPath, 'subjects'), (snap) => {
      setSubjects(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubClasses = onSnapshot(collection(db, ...userPath, 'classes'), (snap) => {
      setClasses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubStudents = onSnapshot(collection(db, ...userPath, 'students'), (snap) => {
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubJournals = onSnapshot(collection(db, ...userPath, 'journals'), (snap) => {
      setJournals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubAttendance = onSnapshot(collection(db, ...userPath, 'attendance'), (snap) => {
      setAttendance(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubGrades = onSnapshot(collection(db, ...userPath, 'grades'), (snap) => {
      setGrades(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubProfile(); unsubSubjects(); unsubClasses(); unsubStudents(); 
      unsubJournals(); unsubAttendance(); unsubGrades();
    };
  }, [user]);

  // --- Aksi Database ---
  const handleAuthAction = async (e) => {
    e.preventDefault();
    setLoading(true);
    try { await signInAnonymously(auth); } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const addItem = async (col, data) => {
    if (!user) return;
    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, col), { ...data, createdAt: new Date().toISOString() });
  };

  const deleteItem = async (col, id) => {
    if (!user) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, col, id));
  };

  const handleImportExcel = async () => {
    if (!importText.trim() || !user) return;
    const lines = importText.split('\n');
    const newStudents = lines.map(line => {
      const parts = line.split('\t'); 
      if (parts.length >= 2) {
        return { name: parts[0].trim(), className: parts[1].trim() };
      }
      return null;
    }).filter(Boolean);

    for (const s of newStudents) {
      await addItem('students', s);
    }
    setImportText('');
    alert(`${newStudents.length} siswa berhasil diimpor!`);
  };

  // --- Logic Helpers ---
  const todayStr = new Date().toISOString().split('T')[0];
  const filteredStudents = selectedClassFilter === 'Semua' 
    ? students 
    : students.filter(s => s.className === selectedClassFilter);

  const attendanceData = useMemo(() => {
    const today = attendance.filter(a => a.date === todayStr);
    if (today.length === 0) return [];
    const stats = { Hadir: 0, Izin: 0, Alpa: 0 };
    today.forEach(a => stats[a.status]++);
    return Object.entries(stats).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
  }, [attendance, todayStr]);

  if (loading) return <LoadingScreen />;

  if (!user) return (
    <AuthPage authMode={authMode} setAuthMode={setAuthMode} onAuth={handleAuthAction} />
  );

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-700">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-slate-200 sticky top-0 h-screen z-30 print:hidden shadow-sm">
        <div className="p-8 flex items-center gap-3">
          <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-xl shadow-indigo-100 rotate-3 group hover:rotate-0 transition-transform">
            <GraduationCap size={24} />
          </div>
          <span className="font-black text-2xl tracking-tighter text-slate-800 italic">SinergiGuru</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <NavItem icon={<LayoutDashboard size={20}/>} label="Beranda" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<UsersRound size={20}/>} label="Database Siswa" active={activeTab === 'siswa'} onClick={() => setActiveTab('siswa')} />
          <NavItem icon={<BookOpen size={20}/>} label="Jurnal Harian" active={activeTab === 'jurnal'} onClick={() => setActiveTab('jurnal')} />
          <NavItem icon={<Users size={20}/>} label="Kehadiran" active={activeTab === 'kehadiran'} onClick={() => setActiveTab('kehadiran')} />
          <NavItem icon={<FileSpreadsheet size={20}/>} label="Penilaian" active={activeTab === 'nilai'} onClick={() => setActiveTab('nilai')} />
          <NavItem icon={<Printer size={20}/>} label="Cetak Laporan" active={activeTab === 'cetak'} onClick={() => setActiveTab('cetak')} />
          <NavItem icon={<Settings size={20}/>} label="Pengaturan" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>

        <div className="p-6 border-t border-slate-50">
          <button onClick={() => signOut(auth)} className="flex items-center gap-3 px-5 py-4 w-full text-rose-500 hover:bg-rose-50 rounded-2xl transition-all font-bold text-sm">
            <LogOut size={18} /> Keluar Sistem
          </button>
        </div>
      </aside>

      {/* Konten Utama */}
      <main className="flex-1">
        <Header profile={teacherProfile} activeTab={activeTab} />

        <div className="p-8 max-w-7xl mx-auto space-y-8 pb-32">
          {activeTab === 'dashboard' && (
            <div className="animate-in fade-in duration-700 space-y-8">
              {/* Profil Utama Dashboard */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-10 relative overflow-hidden group">
                  <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-50/50 rounded-full group-hover:scale-150 transition-transform duration-1000" />
                  
                  {/* Avatar dengan Foto yang diunggah */}
                  <div className="w-44 h-44 bg-slate-100 rounded-[2.5rem] flex items-center justify-center text-white text-5xl shadow-2xl z-10 overflow-hidden ring-4 ring-white">
                    {teacherProfile.photoUrl ? (
                      <img src={teacherProfile.photoUrl} alt="Profil Guru" className="w-full h-full object-cover" onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1544717297-fa95b3ee51f3?q=80&w=2070&auto=format&fit=crop'} />
                    ) : (
                      <User size={80} className="text-indigo-600 opacity-20" />
                    )}
                  </div>

                  <div className="z-10 text-center md:text-left">
                    <h3 className="text-4xl font-black text-slate-900 mb-1 tracking-tight">{teacherProfile.name}</h3>
                    <p className="text-slate-400 font-bold mb-4 flex items-center justify-center md:justify-start gap-2">
                       <MapPin size={14} className="text-indigo-500" /> NIP. {teacherProfile.nip}
                    </p>
                    <p className="text-indigo-600 font-bold text-lg mb-8 leading-relaxed max-w-sm italic opacity-80">{teacherProfile.bio}</p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-3">
                      <Badge label={`${subjects.length} Mapel`} color="indigo" />
                      <Badge label={`${classes.length} Rombel`} color="amber" />
                      <Badge label={`${students.length} Peserta Didik`} color="emerald" />
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4 bg-white rounded-[3rem] p-8 shadow-sm border border-slate-100 flex flex-col justify-center">
                  <h4 className="font-black text-slate-800 mb-6 flex items-center gap-3 text-xs uppercase tracking-[0.2em] opacity-50">
                    <Users size={16} className="text-indigo-600" /> Statistik Kehadiran
                  </h4>
                  <div className="h-44 w-full">
                    {attendanceData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={attendanceData} innerRadius={45} outerRadius={60} paddingAngle={8} dataKey="value" stroke="none">
                            {attendanceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                       <div className="h-full flex flex-col items-center justify-center gap-3 opacity-20">
                          <AlertCircle size={40} />
                          <p className="text-[10px] font-black uppercase tracking-widest">Belum Ada Absensi</p>
                       </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Grid Aktivitas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InfoBox title="Agenda Hari Ini" icon={<Calendar size={18} className="text-indigo-500"/>}>
                   {journals.filter(j => j.date === todayStr).map((j, i) => (
                     <div key={i} className="mb-3 p-4 bg-slate-50 rounded-2xl text-[10px] font-bold border border-slate-100 hover:border-indigo-200 transition-colors">
                        <span className="text-indigo-600 uppercase tracking-tighter">[{j.type}]</span> <br/>
                        <span className="text-slate-800 text-xs block mt-1">{j.type === 'Mengajar' ? `${j.subject} - ${j.className}` : j.dutyType}</span>
                        <span className="text-slate-400 font-mono mt-1 block">{j.time}</span>
                     </div>
                   ))}
                   {journals.filter(j => j.date === todayStr).length === 0 && <p className="text-slate-300 text-xs italic py-4">Agenda masih kosong.</p>}
                </InfoBox>
                <InfoBox title="Verifikasi Nilai" icon={<CheckCircle2 size={18} className="text-amber-500"/>} badge={grades.filter(g => !g.checked).length}>
                   {grades.filter(g => !g.checked).slice(0, 3).map((g, i) => (
                     <div key={i} className="mb-3 p-4 bg-slate-50 rounded-2xl text-xs font-bold border border-slate-100 flex justify-between items-center">
                        <div className="min-w-0 pr-4">
                           <p className="truncate text-slate-800">{g.studentName}</p>
                           <p className="text-[9px] text-slate-400 uppercase">{g.taskName}</p>
                        </div>
                        <span className="bg-amber-100 text-amber-600 px-2 py-1 rounded-lg text-[9px] font-black">{g.type}</span>
                     </div>
                   ))}
                </InfoBox>
                <InfoBox title="Manajemen Siswa" icon={<UsersRound size={18} className="text-emerald-500"/>}>
                   <div className="flex items-end gap-2">
                      <div className="text-5xl font-black text-slate-900 tracking-tighter">{students.length}</div>
                      <div className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">Siswa Terdata</div>
                   </div>
                   <div className="mt-6 pt-6 border-t border-slate-50 grid grid-cols-2 gap-2">
                      <div className="text-center bg-indigo-50 p-3 rounded-2xl">
                         <p className="text-[9px] font-black text-indigo-400 uppercase">Kelas</p>
                         <p className="font-black text-indigo-600">{classes.length}</p>
                      </div>
                      <div className="text-center bg-emerald-50 p-3 rounded-2xl">
                         <p className="text-[9px] font-black text-emerald-400 uppercase">Mapel</p>
                         <p className="font-black text-emerald-600">{subjects.length}</p>
                      </div>
                   </div>
                </InfoBox>
              </div>
            </div>
          )}

          {activeTab === 'siswa' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input Manual */}
                <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100">
                  <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                     <UserPlus size={22} className="text-indigo-600" /> Pendaftaran Siswa Baru
                  </h3>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.target);
                    addItem('students', Object.fromEntries(fd));
                    e.target.reset();
                  }} className="space-y-5">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                       <input name="name" placeholder="Misal: Ahmad Zaelani" className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-100 outline-none font-bold" required />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rombongan Belajar / Kelas</label>
                       <select name="className" className="w-full p-4 rounded-2xl bg-slate-50 font-bold outline-none border-2 border-transparent focus:border-indigo-100" required>
                         <option value="">Pilih Kelas...</option>
                         {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                       </select>
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                       <Save size={18}/> SIMPAN BIODATA
                    </button>
                  </form>
                </div>

                {/* Impor Excel */}
                <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100">
                  <h3 className="text-xl font-black text-slate-900 mb-2 flex items-center gap-3">
                     <Upload size={22} className="text-emerald-600" /> Impor Masal (Excel)
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-8 tracking-widest leading-relaxed">
                     Buka Excel, salin kolom "Nama" dan "Kelas", lalu tempel pada area di bawah ini.
                  </p>
                  <textarea 
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="Contoh Format:&#10;Andi Wijaya	X-IPA 1&#10;Budi Santoso	X-IPA 1"
                    className="w-full p-5 h-40 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 focus:border-emerald-100 outline-none text-xs font-mono leading-loose"
                  ></textarea>
                  <button onClick={handleImportExcel} className="w-full mt-6 bg-emerald-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all">
                     PROSES DATA IMPOR
                  </button>
                </div>
              </div>

              {/* Tabel Siswa Terdaftar */}
              <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                  <h4 className="font-black text-slate-800 tracking-tight">Data Peserta Didik</h4>
                  <select value={selectedClassFilter} onChange={(e) => setSelectedClassFilter(e.target.value)} className="p-3 rounded-xl bg-white border border-slate-200 text-xs font-bold outline-none shadow-sm">
                    <option value="Semua">Semua Rombel</option>
                    {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-white text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                        <th className="px-10 py-5">Nama Peserta Didik</th>
                        <th className="px-10 py-5">Kelas / Rombel</th>
                        <th className="px-10 py-5 text-right">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredStudents.sort((a,b) => a.name.localeCompare(b.name)).map((s, i) => (
                        <tr key={i} className="hover:bg-indigo-50/30 transition-colors group">
                          <td className="px-10 py-5 font-black text-slate-800 text-sm tracking-tight">{s.name}</td>
                          <td className="px-10 py-5">
                             <span className="bg-indigo-100/50 text-indigo-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider">{s.className}</span>
                          </td>
                          <td className="px-10 py-5 text-right">
                            <button onClick={() => deleteItem('students', s.id)} className="text-rose-300 opacity-0 group-hover:opacity-100 hover:text-rose-600 transition-all p-2 rounded-lg hover:bg-rose-50">
                               <Trash2 size={16}/>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'jurnal' && (
            <div className="animate-in fade-in duration-500 space-y-8">
              <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Input Jurnal Aktivitas</h3>
                  <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] shadow-inner">
                    <button 
                      onClick={() => setJournalType('Mengajar')}
                      className={`px-8 py-2.5 rounded-[1rem] text-[10px] font-black transition-all uppercase tracking-widest ${journalType === 'Mengajar' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                    >
                      KBM
                    </button>
                    <button 
                      onClick={() => setJournalType('Tugas Tambahan')}
                      className={`px-8 py-2.5 rounded-[1rem] text-[10px] font-black transition-all uppercase tracking-widest ${journalType === 'Tugas Tambahan' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                    >
                      NON-KBM
                    </button>
                  </div>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  const data = Object.fromEntries(new FormData(e.target));
                  addItem('journals', { ...data, type: journalType });
                  e.target.reset();
                }} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {journalType === 'Mengajar' ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mata Pelajaran</label>
                        <select name="subject" className="w-full p-4 rounded-2xl bg-slate-50 font-bold outline-none border-2 border-transparent focus:border-indigo-100" required>
                           <option value="">Pilih Mapel...</option>
                           {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kelas</label>
                        <select name="className" className="w-full p-4 rounded-2xl bg-slate-50 font-bold outline-none border-2 border-transparent focus:border-indigo-100" required>
                           <option value="">Pilih Kelas...</option>
                           {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2 md:col-span-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipe Penugasan</label>
                       <select name="dutyType" className="w-full p-4 rounded-2xl bg-slate-50 font-bold outline-none border-2 border-transparent focus:border-indigo-100" required>
                         <option value="">Pilih Jenis Tugas Tambahan...</option>
                         {EXTRA_DUTIES.map(d => <option key={d} value={d}>{d}</option>)}
                       </select>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jam Pelaksanaan</label>
                    <input name="time" placeholder="Contoh: 08:00 - 10:00" className="w-full p-4 rounded-2xl bg-slate-50 font-bold outline-none border-2 border-transparent focus:border-indigo-100" required />
                  </div>

                  <div className="md:col-span-3 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deskripsi Kegiatan</label>
                    <textarea name="activity" placeholder={journalType === 'Mengajar' ? "Tuliskan materi atau bab yang diajarkan..." : "Jelaskan kegiatan non-KBM yang dilakukan..."} className="w-full p-5 rounded-2xl bg-slate-50 font-bold outline-none md:col-span-3 h-28 border-2 border-transparent focus:border-indigo-100" required></textarea>
                  </div>
                  
                  <button type="submit" className="md:col-span-3 bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                    <Save size={18}/> SIMPAN CATATAN JURNAL
                  </button>
                </form>
              </div>

              {/* Riwayat Jurnal */}
              <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-50 bg-slate-50/20 font-black text-slate-800 italic">
                  Catatan Harian Terbaru
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-white text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                        <th className="px-10 py-5">Hari / Waktu</th>
                        <th className="px-10 py-5">Aktivitas</th>
                        <th className="px-10 py-5 text-right">Kontrol</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {journals.sort((a,b) => b.createdAt.localeCompare(a.createdAt)).map((j, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-10 py-6">
                            <p className="font-black text-slate-800 text-xs">{j.date}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-1">{j.time}</p>
                          </td>
                          <td className="px-10 py-6">
                            <div className="flex items-center gap-2 mb-2">
                               <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider ${j.type === 'Mengajar' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'}`}>
                                 {j.type}
                               </span>
                               <p className="font-black text-slate-800 text-sm">{j.type === 'Mengajar' ? `${j.subject} (${j.className})` : j.dutyType}</p>
                            </div>
                            <p className="text-xs text-slate-500 italic max-w-xl leading-relaxed">{j.activity}</p>
                          </td>
                          <td className="px-10 py-6 text-right">
                            <button onClick={() => deleteItem('journals', j.id)} className="text-rose-300 opacity-0 group-hover:opacity-100 hover:text-rose-600 transition-all p-2 rounded-xl">
                               <Trash2 size={16}/>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'kehadiran' && (
            <div className="bg-white rounded-[3rem] p-12 shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <h3 className="text-2xl font-black text-slate-900 mb-10 tracking-tight">Presensi Kehadiran Siswa</h3>
               <form onSubmit={(e) => {
                 e.preventDefault();
                 recordAttendance(Object.fromEntries(new FormData(e.target)));
                 e.target.reset();
               }} className="grid grid-cols-1 md:grid-cols-4 gap-8 items-end">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cari Nama Siswa</label>
                    <select name="studentName" className="w-full p-4 rounded-2xl bg-slate-50 font-bold outline-none border-2 border-transparent focus:border-indigo-100" required>
                       <option value="">Pilih Siswa...</option>
                       {students.sort((a,b) => a.name.localeCompare(b.name)).map(s => <option key={s.id} value={s.name}>{s.name} ({s.className})</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mata Pelajaran</label>
                    <select name="subject" className="w-full p-4 rounded-2xl bg-slate-50 font-bold outline-none border-2 border-transparent focus:border-indigo-100" required>
                       {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status Absen</label>
                    <select name="status" className="w-full p-4 rounded-2xl bg-slate-50 font-bold outline-none border-2 border-transparent focus:border-indigo-100">
                       <option value="Hadir">HADIR (H)</option>
                       <option value="Izin">IZIN (I)</option>
                       <option value="Alpa">ALPA (A)</option>
                    </select>
                  </div>
                  <button type="submit" className="bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">
                     CATAT PRESENSI
                  </button>
               </form>
            </div>
          )}

          {activeTab === 'nilai' && (
             <div className="bg-white rounded-[3rem] p-12 shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <h3 className="text-2xl font-black text-slate-900 mb-10 tracking-tight">Penginputan Nilai Peserta Didik</h3>
               <form onSubmit={(e) => {
                 e.preventDefault();
                 addGrade(Object.fromEntries(new FormData(e.target)));
                 e.target.reset();
               }} className="grid grid-cols-1 md:grid-cols-4 gap-8 items-end">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Siswa</label>
                    <select name="studentName" className="w-full p-4 rounded-2xl bg-slate-50 font-bold outline-none border-2 border-transparent focus:border-indigo-100" required>
                       <option value="">Cari Nama...</option>
                       {students.sort((a,b) => a.name.localeCompare(b.name)).map(s => <option key={s.id} value={s.name}>{s.name} ({s.className})</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipe Nilai</label>
                    <select name="type" className="w-full p-4 rounded-2xl bg-slate-50 font-bold outline-none border-2 border-transparent focus:border-indigo-100">
                       {GRADE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Keterangan Tugas / Ujian</label>
                    <input name="taskName" placeholder="Contoh: Tugas Mandiri 1" className="w-full p-4 rounded-2xl bg-slate-50 font-bold outline-none border-2 border-transparent focus:border-indigo-100" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Skor Akhir</label>
                    <input name="score" type="number" min="0" max="100" placeholder="0 - 100" className="w-full p-4 rounded-2xl bg-slate-50 font-bold outline-none border-2 border-transparent focus:border-indigo-100" required />
                  </div>
                  <button type="submit" className="md:col-span-4 bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all uppercase tracking-widest">
                     SIMPAN DATA PENILAIAN
                  </button>
               </form>
             </div>
          )}

          {activeTab === 'settings' && (
            <div className="animate-in fade-in duration-500 space-y-10">
              {/* Profil Lengkap Pengaturan */}
              <div className="bg-white rounded-[3rem] p-12 shadow-sm border border-slate-100">
                <div className="flex items-center gap-4 mb-10">
                   <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600">
                      <Settings size={28} />
                   </div>
                   <h3 className="text-2xl font-black text-slate-900 tracking-tight">Pengaturan Profil & Kedinasan</h3>
                </div>
                
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const data = Object.fromEntries(new FormData(e.target));
                  await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'info'), data);
                  setTeacherProfile(data);
                  alert("Profil berhasil diperbarui!");
                }} className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nama Lengkap & Gelar</label>
                      <input name="name" defaultValue={teacherProfile.name} className="w-full p-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-100 font-bold outline-none" required />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">NIP Pegawai</label>
                      <input name="nip" defaultValue={teacherProfile.nip} className="w-full p-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-100 font-bold outline-none" required />
                    </div>
                    <div className="space-y-3 md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                         <ImageIcon size={14} className="text-indigo-500"/> Tautan Foto Profil (URL)
                      </label>
                      <input name="photoUrl" defaultValue={teacherProfile.photoUrl} className="w-full p-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-100 font-bold outline-none" placeholder="Masukkan URL foto profil Anda" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Instansi Madrasah</label>
                      <input name="school" defaultValue={teacherProfile.school} className="w-full p-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-100 font-bold outline-none" required />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Moto / Slogan</label>
                      <input name="bio" defaultValue={teacherProfile.bio} className="w-full p-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-100 font-bold outline-none" required />
                    </div>
                    
                    {/* Data Kepala Madrasah */}
                    <div className="md:col-span-2 pt-10 border-t border-slate-100">
                       <h4 className="text-indigo-600 font-black text-xs uppercase tracking-[0.2em] mb-8">Informasi Pimpinan Madrasah</h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nama Kepala Madrasah</label>
                            <input name="headmasterName" defaultValue={teacherProfile.headmasterName} className="w-full p-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-100 font-bold outline-none" required />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">NIP Kepala Madrasah</label>
                            <input name="headmasterNip" defaultValue={teacherProfile.headmasterNip} className="w-full p-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-100 font-bold outline-none" required />
                          </div>
                       </div>
                    </div>
                  </div>
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 px-10 rounded-2xl shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-3 active:scale-95">
                    <Save size={20}/> PERBARUI INFORMASI SISTEM
                  </button>
                </form>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Kelola Mapel */}
                <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100">
                  <h3 className="text-xl font-black text-slate-900 mb-8 tracking-tight">Katalog Mata Pelajaran</h3>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    addItem('subjects', { name: e.target.name.value });
                    e.target.reset();
                  }} className="flex gap-3 mb-8">
                    <input name="name" placeholder="Input Mapel Baru..." className="flex-1 p-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-indigo-100 font-bold outline-none shadow-inner" required />
                    <button className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg hover:rotate-12 transition-transform"><Plus size={24}/></button>
                  </form>
                  <div className="flex flex-wrap gap-2">
                    {subjects.map(s => <div key={s.id} className="bg-indigo-50 text-indigo-600 px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 border border-indigo-100 group">
                       {s.name} 
                       <button onClick={() => deleteItem('subjects', s.id)} className="opacity-0 group-hover:opacity-100 text-rose-500 transition-opacity">
                          <Trash2 size={12}/>
                       </button>
                    </div>)}
                  </div>
                </div>

                {/* Kelola Kelas */}
                <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100">
                  <h3 className="text-xl font-black text-slate-900 mb-8 tracking-tight">Daftar Rombongan Belajar</h3>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    addItem('classes', { name: e.target.name.value });
                    e.target.reset();
                  }} className="flex gap-3 mb-8">
                    <input name="name" placeholder="Input Kelas Baru..." className="flex-1 p-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-emerald-100 font-bold outline-none shadow-inner" required />
                    <button className="bg-emerald-600 text-white p-4 rounded-2xl shadow-lg hover:rotate-12 transition-transform"><Plus size={24}/></button>
                  </form>
                  <div className="flex flex-wrap gap-2">
                    {classes.map(c => <div key={c.id} className="bg-emerald-50 text-emerald-600 px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 border border-emerald-100 group">
                       {c.name} 
                       <button onClick={() => deleteItem('classes', c.id)} className="opacity-0 group-hover:opacity-100 text-rose-500 transition-opacity">
                          <Trash2 size={12}/>
                       </button>
                    </div>)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cetak' && (
            <div className="animate-in fade-in duration-500 space-y-12 print:block">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 print:hidden">
                <PrintTile title="Jurnal Aktivitas Harian" icon={<BookOpen size={48}/>} onClick={() => window.print()} color="indigo" />
                <PrintTile title="Rekapitulasi Nilai Siswa" icon={<FileSpreadsheet size={48}/>} onClick={() => window.print()} color="emerald" />
              </div>

              {/* Layout Cetak Laporan - Full Screen Print */}
              <div className="hidden print:block bg-white p-12 text-black min-h-screen">
                <div className="text-center border-b-4 border-black pb-4 mb-10">
                  <h1 className="text-2xl font-black uppercase tracking-tight">Laporan Administrasi Guru Terintegrasi</h1>
                  <h2 className="text-lg font-bold uppercase">{teacherProfile.school}</h2>
                  <p className="text-[10px] font-medium italic mt-1">Dihasilkan secara otomatis oleh sistem SinergiGuru.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-8 mb-10 text-xs font-bold uppercase">
                   <div className="space-y-1">
                      <p>Nama Guru: {teacherProfile.name}</p>
                      <p>NIP: {teacherProfile.nip}</p>
                   </div>
                   <div className="text-right space-y-1">
                      <p>Tahun Pelajaran: {new Date().getFullYear()}/{new Date().getFullYear() + 1}</p>
                      <p>Lokasi: {teacherProfile.location}</p>
                   </div>
                </div>

                <table className="w-full border-collapse border-2 border-black text-xs">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border-2 border-black p-3">NO</th>
                      <th className="border-2 border-black p-3 text-left">TIPE</th>
                      <th className="border-2 border-black p-3 text-left">KEGIATAN / MAPEL</th>
                      <th className="border-2 border-black p-3 text-left">RINGKASAN AKTIVITAS</th>
                      <th className="border-2 border-black p-3 text-center">WAKTU</th>
                    </tr>
                  </thead>
                  <tbody>
                    {journals.map((j, i) => (
                      <tr key={i}>
                        <td className="border-2 border-black p-3 text-center font-bold">{i+1}</td>
                        <td className="border-2 border-black p-3 font-bold uppercase text-[9px]">{j.type}</td>
                        <td className="border-2 border-black p-3 font-black uppercase">{j.type === 'Mengajar' ? `${j.subject} (${j.className})` : j.dutyType}</td>
                        <td className="border-2 border-black p-3 italic">{j.activity}</td>
                        <td className="border-2 border-black p-3 text-center whitespace-nowrap">{j.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-20 grid grid-cols-2 gap-20 text-center font-bold text-xs uppercase">
                   <div className="space-y-24">
                      <p>Mengetahui,<br/>Kepala Madrasah</p>
                      <div className="space-y-1">
                         <p className="underline">{teacherProfile.headmasterName}</p>
                         <p>NIP. {teacherProfile.headmasterNip}</p>
                      </div>
                   </div>
                   <div className="space-y-24">
                      <p>{teacherProfile.location}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>Guru Mata Pelajaran</p>
                      <div className="space-y-1">
                         <p className="underline">{teacherProfile.name}</p>
                         <p>NIP. {teacherProfile.nip}</p>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

// --- Sub-components UI ---

const LoadingScreen = () => (
  <div className="h-screen flex flex-col items-center justify-center bg-white gap-4">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600 border-r-4 border-r-transparent shadow-2xl shadow-indigo-100"></div>
    <p className="text-slate-400 font-black tracking-[0.2em] text-[10px] uppercase animate-pulse">Menghubungkan SinergiGuru...</p>
  </div>
);

const AuthPage = ({ authMode, setAuthMode, onAuth }) => (
  <div className="min-h-screen bg-slate-50 flex font-sans">
    <div className="hidden lg:flex flex-col justify-center items-center w-1/2 bg-indigo-600 p-20 text-white relative overflow-hidden shadow-2xl">
      <div className="absolute top-10 left-10 w-96 h-96 bg-white/10 rounded-full blur-[100px]" />
      <div className="relative z-10 text-center">
        <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-2xl">
           <GraduationCap size={56} className="text-white" />
        </div>
        <h1 className="text-7xl font-black italic tracking-tighter">SinergiGuru</h1>
        <p className="text-2xl mt-8 text-indigo-100 font-medium max-w-sm mx-auto leading-relaxed">Ekosistem Digital Guru untuk Administrasi Tanpa Beban.</p>
      </div>
    </div>
    <div className="w-full lg:w-1/2 flex items-center justify-center p-12 bg-white">
      <div className="max-w-md w-full animate-in fade-in slide-in-from-right-10 duration-700">
        <h2 className="text-5xl font-black text-slate-900 mb-2 tracking-tighter">Portal Guru</h2>
        <p className="text-slate-400 font-bold text-sm uppercase mb-12 tracking-widest">{authMode === 'login' ? 'Masuk ke Dasbor Anda' : 'Buat Akun Madrasah Baru'}</p>
        <form onSubmit={onAuth} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Sekolah</label>
            <div className="relative group">
               <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
               <input type="email" className="w-full pl-12 pr-4 py-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-100 outline-none font-bold shadow-inner" placeholder="nama@sekolah.id" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
            <div className="relative group">
               <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
               <input type="password" className="w-full pl-12 pr-4 py-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-100 outline-none font-bold shadow-inner" placeholder="••••••••" />
            </div>
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white font-black py-6 rounded-[1.5rem] shadow-2xl shadow-indigo-100 hover:scale-[1.02] active:scale-95 transition-all text-lg tracking-widest uppercase">
            {authMode === 'login' ? 'MULAI SINERGI' : 'DAFTAR AKUN'}
          </button>
        </form>
        <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="w-full mt-10 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] hover:text-indigo-600 transition-colors">
          {authMode === 'login' ? 'Daftar Sebagai Pengguna Baru' : 'Sudah Memiliki Akun? Login'}
        </button>
      </div>
    </div>
  </div>
);

const Header = ({ profile, activeTab }) => (
  <header className="bg-white/80 backdrop-blur-2xl border-b border-slate-100 p-8 sticky top-0 z-20 flex justify-between items-center print:hidden">
    <div>
      <h2 className="text-3xl font-black text-slate-900 tracking-tight capitalize italic">{activeTab}</h2>
      <p className="text-[10px] font-black text-indigo-400 mt-1 uppercase tracking-[0.2em]">Administrasi Pendidik Digital</p>
    </div>
    <div className="flex items-center gap-5">
      <div className="text-right hidden sm:block">
        <p className="text-sm font-black text-slate-800 leading-none mb-1">{profile.name}</p>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">NIP: {profile.nip}</p>
      </div>
      <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-indigo-600 font-black shadow-inner overflow-hidden">
        {profile.photoUrl ? (
           <img src={profile.photoUrl} alt="Avatar" className="w-full h-full object-cover" onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1544717297-fa95b3ee51f3?q=80&w=100&auto=format&fit=crop'} />
        ) : profile.name.charAt(0)}
      </div>
    </div>
  </header>
);

const NavItem = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all group ${active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 scale-[1.02]' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-800'}`}>
    <span className={active ? 'text-white' : 'text-slate-300 group-hover:text-indigo-500'}>{icon}</span>
    <span className="font-black text-sm tracking-tight">{label}</span>
    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
  </button>
);

const InfoBox = ({ title, icon, children, badge }) => (
  <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-50 flex flex-col h-full hover:shadow-xl transition-all group">
    <div className="flex justify-between items-center mb-8">
      <h4 className="font-black text-slate-800 flex items-center gap-3 text-[10px] tracking-[0.1em] uppercase opacity-40 group-hover:opacity-100 transition-opacity">{icon} {title}</h4>
      {badge > 0 && <span className="bg-rose-500 text-white text-[9px] font-black px-2.5 py-1 rounded-lg shadow-lg shadow-rose-100 animate-bounce">{badge}</span>}
    </div>
    <div className="flex-1 overflow-y-auto custom-scrollbar">{children}</div>
  </div>
);

const Badge = ({ label, color }) => (
  <span className={`px-5 py-2 bg-${color}-50 text-${color}-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-${color}-100/50 shadow-sm`}>{label}</span>
);

const PrintTile = ({ title, icon, onClick, color }) => (
  <button onClick={onClick} className={`bg-white rounded-[3rem] p-12 shadow-sm border border-slate-100 flex flex-col items-center gap-8 group hover:border-${color}-500 transition-all text-center relative overflow-hidden`}>
    <div className={`absolute -right-5 -bottom-5 w-24 h-24 bg-${color}-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity`} />
    <div className={`w-28 h-28 bg-${color}-50 text-${color}-600 rounded-[2.5rem] flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-xl shadow-${color}-100/50`}>{icon}</div>
    <div className="space-y-2 z-10">
       <h4 className="text-2xl font-black text-slate-900 tracking-tight italic">{title}</h4>
       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Generate PDF Resmi</p>
    </div>
    <div className={`w-full bg-${color}-600 text-white font-black py-5 px-10 rounded-2xl shadow-2xl shadow-${color}-100 active:scale-95 transition-all flex items-center justify-center gap-3 z-10`}><Printer size={20}/> CETAK SEKARANG</div>
  </button>
);

export default App;