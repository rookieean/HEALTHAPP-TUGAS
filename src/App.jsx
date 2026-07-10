import { useEffect, useMemo, useState } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { analyzeSymptomsWithAI } from './ai';
import { clearSession, getStoredSession, signIn } from './auth';
import { db, loadInitialData } from './db';

function HomePage({ currentUser, onLogout }) {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOnline, setIsOnline] = useState(() => (typeof window !== 'undefined' ? window.navigator.onLine : true));
  const [doctors, setDoctors] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [guides, setGuides] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [symptomInput, setSymptomInput] = useState('');
  const [symptomResult, setSymptomResult] = useState(null);
  const [symptomLoading, setSymptomLoading] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({
    patientName: currentUser?.name || 'Ayu',
    doctorId: '',
    date: '',
    complaint: '',
  });
  const [recordForm, setRecordForm] = useState({
    patientName: currentUser?.name || 'Ayu',
    title: '',
    notes: '',
  });

  const filteredMedicines = useMemo(() => {
    const keyword = searchTerm.toLowerCase();
    return medicines.filter((medicine) => {
      const haystack = `${medicine.name} ${medicine.category} ${medicine.indication}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [medicines, searchTerm]);

  async function refreshData() {
    const [doctorList, medicineList, guideList, appointmentList, recordList] = await Promise.all([
      db.doctors.toArray(),
      db.medicines.toArray(),
      db.firstAidGuides.toArray(),
      db.appointments.toArray(),
      db.medicalRecords.toArray(),
    ]);

    setDoctors(doctorList);
    setMedicines(medicineList);
    setGuides(guideList);
    setAppointments(appointmentList);
    setRecords(recordList);
  }

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        await db.open();
        await loadInitialData().catch(() => undefined);
        await refreshData();
        if (mounted) {
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (mounted) {
          setError('Data tidak bisa dimuat. Coba buka aplikasi lagi.');
          setLoading(false);
        }
      }
    };

    init();

    const onlineHandler = () => setIsOnline(window.navigator.onLine);
    window.addEventListener('online', onlineHandler);
    window.addEventListener('offline', onlineHandler);

    return () => {
      mounted = false;
      window.removeEventListener('online', onlineHandler);
      window.removeEventListener('offline', onlineHandler);
    };
  }, []);

  const handleAppointmentSubmit = async (event) => {
    event.preventDefault();
    await db.appointments.add({
      id: crypto.randomUUID(),
      patientName: appointmentForm.patientName,
      doctorId: appointmentForm.doctorId,
      date: appointmentForm.date,
      complaint: appointmentForm.complaint,
      status: 'Menunggu konfirmasi',
    });
    setAppointmentForm({ patientName: currentUser?.name || 'Ayu', doctorId: '', date: '', complaint: '' });
    await refreshData();
  };

  const handleRecordSubmit = async (event) => {
    event.preventDefault();
    await db.medicalRecords.add({
      id: crypto.randomUUID(),
      patientName: recordForm.patientName,
      title: recordForm.title,
      notes: recordForm.notes,
      createdAt: new Date().toISOString(),
    });
    setRecordForm({ patientName: currentUser?.name || 'Ayu', title: '', notes: '' });
    await refreshData();
  };

  const handleSymptomSubmit = async (event) => {
    event.preventDefault();
    if (!symptomInput.trim()) return;

    setSymptomLoading(true);
    try {
      const result = await analyzeSymptomsWithAI(symptomInput);
      setSymptomResult(result);
    } catch (error) {
      console.error(error);
      setSymptomResult({
        level: 'Perlu evaluasi',
        summary: 'Tidak bisa memproses analisis AI saat ini.',
        advice: 'Silakan coba lagi nanti atau konsultasikan langsung dengan dokter.',
      });
    } finally {
      setSymptomLoading(false);
    }
  };

  const menuItems = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'janji', label: 'Buat Janji' },
    { key: 'rekam', label: 'Rekam Medis' },
    { key: 'obat', label: 'Direktori Obat' },
    { key: 'p3k', label: 'P3K Offline' },
    { key: 'ai', label: 'AI Checker' },
  ];

  const isDoctor = currentUser?.role === 'dokter';

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #effcf8 0%, #f8fafc 100%)', color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', background: 'rgba(15, 118, 110, 0.95)', color: 'white', boxShadow: '0 10px 30px rgba(15, 118, 110, 0.2)' }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>Telehealth Support</div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link to="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 600 }}>Beranda</Link>
          <Link to="/about" style={{ color: 'white', textDecoration: 'none', fontWeight: 600 }}>Tentang</Link>
          <button type="button" onClick={onLogout} style={{ border: '1px solid rgba(255,255,255,0.4)', background: 'transparent', color: 'white', padding: '0.5rem 0.8rem', borderRadius: '999px', cursor: 'pointer' }}>
            Keluar
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.25rem' }}>
        <section style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1.2fr 0.8fr', marginBottom: '1.25rem' }}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '1.25rem', boxShadow: '0 20px 45px rgba(15, 23, 42, 0.08)' }}>
            <p style={{ display: 'inline-block', padding: '0.35rem 0.75rem', borderRadius: '999px', background: '#ccfbf1', color: '#115e59', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              PWA • Offline Ready • Rekam Medis • AI Checker
            </p>
            <h1 style={{ margin: '0 0 0.5rem', fontSize: 'clamp(1.7rem, 3vw, 2.5rem)' }}>Selamat datang, {currentUser?.name}</h1>
            <p style={{ color: '#475569', lineHeight: 1.7 }}>
              {isDoctor
                ? 'Anda masuk sebagai dokter: pantau janji yang masuk, lihat rekam medis, dan bantu pasien dengan cepat.'
                : 'Buat janji dokter, simpan rekam medis, cek keluhan awal, dan akses panduan P3K bahkan saat sedang offline.'}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
              <span style={{ padding: '0.75rem 1rem', borderRadius: '12px', background: '#f8fafc', color: '#0f766e', fontWeight: 700 }}>
                Status: {isOnline ? 'Online' : 'Offline'}
              </span>
              <span style={{ padding: '0.75rem 1rem', borderRadius: '12px', background: '#f8fafc', color: '#0f766e', fontWeight: 700 }}>
                Peran: {isDoctor ? 'Dokter' : 'Pasien'}
              </span>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '24px', padding: '1.25rem', boxShadow: '0 20px 45px rgba(15, 23, 42, 0.08)' }}>
            <p style={{ color: '#0f766e', fontWeight: 700, marginBottom: '0.5rem' }}>Ringkasan akun</p>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '0.9rem' }}><strong>{doctors.length}</strong> dokter terdaftar</div>
              <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '0.9rem' }}><strong>{medicines.length}</strong> obat dalam direktori</div>
              <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '0.9rem' }}><strong>{appointments.length}</strong> janji dokter tersimpan</div>
            </div>
          </div>
        </section>

        <section style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {menuItems.map((item) => (
            <button key={item.key} type="button" onClick={() => setActiveMenu(item.key)} style={{ border: 'none', padding: '0.7rem 0.95rem', borderRadius: '999px', background: activeMenu === item.key ? '#0f766e' : '#e2e8f0', color: activeMenu === item.key ? 'white' : '#334155', fontWeight: 700, cursor: 'pointer' }}>
              {item.label}
            </button>
          ))}
        </section>

        {loading && <p style={{ textAlign: 'center', padding: '2rem 0', color: '#475569' }}>Memuat data aplikasi...</p>}
        {error && <p style={{ textAlign: 'center', padding: '2rem 0', color: '#b91c1c' }}>{error}</p>}

        {!loading && !error && (
          <>
            {activeMenu === 'dashboard' && (
              <section style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ background: 'white', borderRadius: '24px', padding: '1.25rem', boxShadow: '0 20px 45px rgba(15, 23, 42, 0.08)' }}>
                  <h2 style={{ marginTop: 0 }}>Mode akun saat ini</h2>
                  <p style={{ color: '#475569', lineHeight: 1.7 }}>
                    {isDoctor
                      ? 'Anda melihat pengalaman dokter: pantau janji yang masuk dan catatan pasien.'
                      : 'Anda melihat pengalaman pasien: buat janji, simpan rekam medis, dan cek obat.'}
                  </p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div style={{ background: 'white', borderRadius: '20px', padding: '1rem', boxShadow: '0 10px 25px rgba(15, 23, 42, 0.06)' }}>
                    <h3 style={{ marginTop: 0 }}>Janji dokter</h3>
                    <p style={{ color: '#475569' }}>Buat jadwal konsultasi cepat dengan dokter yang sesuai.</p>
                  </div>
                  <div style={{ background: 'white', borderRadius: '20px', padding: '1rem', boxShadow: '0 10px 25px rgba(15, 23, 42, 0.06)' }}>
                    <h3 style={{ marginTop: 0 }}>Rekam medis</h3>
                    <p style={{ color: '#475569' }}>Catat riwayat dan hasil konsultasi dengan aman.</p>
                  </div>
                  <div style={{ background: 'white', borderRadius: '20px', padding: '1rem', boxShadow: '0 10px 25px rgba(15, 23, 42, 0.06)' }}>
                    <h3 style={{ marginTop: 0 }}>P3K offline</h3>
                    <p style={{ color: '#475569' }}>Panduan tetap tersedia saat jaringan terputus.</p>
                  </div>
                </div>
              </section>
            )}

            {activeMenu === 'janji' && (
              <section style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ background: 'white', borderRadius: '24px', padding: '1.25rem', boxShadow: '0 20px 45px rgba(15, 23, 42, 0.08)' }}>
                  <h2 style={{ marginTop: 0 }}>Buat janji dokter</h2>
                  {!isDoctor && (
                    <form onSubmit={handleAppointmentSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
                      <input value={appointmentForm.patientName} onChange={(e) => setAppointmentForm({ ...appointmentForm, patientName: e.target.value })} placeholder="Nama pasien" style={inputStyle} />
                      <select value={appointmentForm.doctorId} onChange={(e) => setAppointmentForm({ ...appointmentForm, doctorId: e.target.value })} style={inputStyle} required>
                        <option value="">Pilih dokter</option>
                        {doctors.map((doctor) => (
                          <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
                        ))}
                      </select>
                      <input type="date" value={appointmentForm.date} onChange={(e) => setAppointmentForm({ ...appointmentForm, date: e.target.value })} style={inputStyle} required />
                      <textarea value={appointmentForm.complaint} onChange={(e) => setAppointmentForm({ ...appointmentForm, complaint: e.target.value })} placeholder="Keluhan atau catatan" style={{ ...inputStyle, minHeight: '90px' }} required />
                      <button type="submit" style={buttonStyle}>Simpan janji</button>
                    </form>
                  )}
                  {isDoctor && <p style={{ color: '#475569' }}>Panel dokter menampilkan janji yang tertulis dan siap dipantau.</p>}
                </div>
                <div style={{ background: 'white', borderRadius: '24px', padding: '1.25rem', boxShadow: '0 20px 45px rgba(15, 23, 42, 0.08)' }}>
                  <h3 style={{ marginTop: 0 }}>Riwayat janji</h3>
                  {appointments.length === 0 ? <p style={{ color: '#64748b' }}>Belum ada janji.</p> : appointments.map((appointment) => (
                    <div key={appointment.id} style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                      <strong>{appointment.patientName}</strong>
                      <div style={{ color: '#475569' }}>{appointment.complaint}</div>
                      <div style={{ color: '#0f766e', fontSize: '0.95rem' }}>{appointment.date} • {appointment.status}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeMenu === 'rekam' && (
              <section style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ background: 'white', borderRadius: '24px', padding: '1.25rem', boxShadow: '0 20px 45px rgba(15, 23, 42, 0.08)' }}>
                  <h2 style={{ marginTop: 0 }}>Rekam medis</h2>
                  {!isDoctor && (
                    <form onSubmit={handleRecordSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
                      <input value={recordForm.patientName} onChange={(e) => setRecordForm({ ...recordForm, patientName: e.target.value })} placeholder="Nama pasien" style={inputStyle} />
                      <input value={recordForm.title} onChange={(e) => setRecordForm({ ...recordForm, title: e.target.value })} placeholder="Judul catatan" style={inputStyle} required />
                      <textarea value={recordForm.notes} onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })} placeholder="Catatan rekam medis" style={{ ...inputStyle, minHeight: '90px' }} required />
                      <button type="submit" style={buttonStyle}>Simpan rekam medis</button>
                    </form>
                  )}
                  {isDoctor && <p style={{ color: '#475569' }}>Dokter dapat melihat catatan medis dan menyiapkan penanganan yang tepat.</p>}
                </div>
                <div style={{ background: 'white', borderRadius: '24px', padding: '1.25rem', boxShadow: '0 20px 45px rgba(15, 23, 42, 0.08)' }}>
                  <h3 style={{ marginTop: 0 }}>Catatan terbaru</h3>
                  {records.length === 0 ? <p style={{ color: '#64748b' }}>Belum ada rekam medis.</p> : records.map((record) => (
                    <div key={record.id} style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                      <strong>{record.title}</strong>
                      <div style={{ color: '#475569' }}>{record.notes}</div>
                      <div style={{ color: '#0f766e', fontSize: '0.95rem' }}>{record.patientName} • {new Date(record.createdAt).toLocaleString('id-ID')}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeMenu === 'obat' && (
              <section style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ background: 'white', borderRadius: '24px', padding: '1.25rem', boxShadow: '0 20px 45px rgba(15, 23, 42, 0.08)' }}>
                  <h2 style={{ marginTop: 0 }}>Direktori obat</h2>
                  <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Cari nama obat atau kategori" style={{ ...inputStyle, marginBottom: '1rem' }} />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    {filteredMedicines.map((medicine) => (
                      <div key={medicine.id} style={{ background: '#f8fafc', borderRadius: '18px', padding: '1rem' }}>
                        <p style={{ color: '#0f766e', fontWeight: 700, marginBottom: '0.25rem' }}>{medicine.category}</p>
                        <h3 style={{ margin: '0 0 0.35rem' }}>{medicine.name}</h3>
                        <p style={{ color: '#64748b', margin: '0 0 0.25rem' }}>{medicine.genericName}</p>
                        <p style={{ color: '#334155', lineHeight: 1.6, margin: 0 }}>{medicine.indication}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {activeMenu === 'p3k' && (
              <section style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ background: 'white', borderRadius: '24px', padding: '1.25rem', boxShadow: '0 20px 45px rgba(15, 23, 42, 0.08)' }}>
                  <h2 style={{ marginTop: 0 }}>Panduan P3K offline</h2>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {guides.map((guide) => (
                      <div key={guide.id} style={{ background: '#f8fafc', borderRadius: '18px', padding: '1rem' }}>
                        <h3 style={{ marginTop: 0 }}>{guide.title}</h3>
                        <ul style={{ paddingLeft: '1rem', color: '#475569', lineHeight: 1.7 }}>
                          {guide.steps.map((step) => <li key={step}>{step}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {activeMenu === 'ai' && (
              <section style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ background: 'white', borderRadius: '24px', padding: '1.25rem', boxShadow: '0 20px 45px rgba(15, 23, 42, 0.08)' }}>
                  <h2 style={{ marginTop: 0 }}>AI Symptom Checker</h2>
                  <p style={{ color: '#475569', lineHeight: 1.7 }}>
                    Jelaskan keluhan Anda dan sistem akan memberi penilaian awal mengenai urgensi medis.
                  </p>
                  <form onSubmit={handleSymptomSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
                    <textarea value={symptomInput} onChange={(e) => setSymptomInput(e.target.value)} placeholder="Contoh: demam tinggi, batuk, mual selama 2 hari" style={{ ...inputStyle, minHeight: '100px' }} />
                    <button type="submit" style={buttonStyle} disabled={symptomLoading}>
                      {symptomLoading ? 'Memproses...' : 'Cek kondisi saya'}
                    </button>
                  </form>
                  {symptomResult && (
                    <div style={{ marginTop: '1rem', background: '#f8fafc', borderRadius: '18px', padding: '1rem' }}>
                      <p style={{ color: '#0f766e', fontWeight: 700, marginBottom: '0.25rem' }}>{symptomResult.level}</p>
                      <p style={{ margin: '0 0 0.25rem', color: '#334155' }}>{symptomResult.summary}</p>
                      <p style={{ margin: 0, color: '#475569' }}>{symptomResult.advice}</p>
                    </div>
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('pasien@demo.com');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = signIn(email, password);
      onLogin(user);
    } catch (err) {
      setError(err.message || 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #ecfeff 0%, #f0fdfa 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.25rem', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '420px', background: 'white', borderRadius: '24px', padding: '1.5rem', boxShadow: '0 20px 45px rgba(15, 23, 42, 0.12)' }}>
        <h1 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1.7rem' }}>Masuk Telehealth</h1>
        <p style={{ marginTop: 0, color: '#64748b', lineHeight: 1.6 }}>Akses dashboard pasien atau dokter dengan akun demo.</p>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.8rem' }}>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" style={inputStyle} />
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" style={inputStyle} />
          <button type="submit" style={buttonStyle} disabled={loading}>{loading ? 'Memproses...' : 'Masuk'}</button>
        </form>
        {error && <p style={{ color: '#b91c1c', marginTop: '0.75rem' }}>{error}</p>}
        <div style={{ marginTop: '1rem', color: '#475569', lineHeight: 1.7 }}>
          <p style={{ margin: 0 }}><strong>Pasien demo:</strong> pasien@demo.com / 123456</p>
          <p style={{ margin: '0.2rem 0 0' }}><strong>Dokter demo:</strong> dokter@demo.com / 123456</p>
        </div>
      </div>
    </div>
  );
}

function AboutPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: 'Inter, sans-serif', padding: '2rem 1.25rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', background: 'white', borderRadius: '24px', padding: '1.5rem', boxShadow: '0 20px 45px rgba(15, 23, 42, 0.08)' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.6rem' }}>Tentang aplikasi</h2>
        <p style={{ color: '#475569', lineHeight: 1.7 }}>
          Aplikasi ini dirancang untuk merepresentasikan prototype sistem telehealth modern dengan fitur janji dokter, rekam medis, direktori obat, panduan P3K offline, dan AI symptom checker.
        </p>
        <ul style={{ color: '#334155', lineHeight: 1.8, paddingLeft: '1.1rem' }}>
          <li>Data tersimpan secara lokal melalui IndexedDB.</li>
          <li>UI dibuat responsif untuk desktop, tablet, dan smartphone.</li>
          <li>Sudah siap dikembangkan lebih lanjut dengan backend API dan autentikasi real.</li>
        </ul>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  border: '1px solid #cbd5e1',
  borderRadius: '12px',
  padding: '0.8rem 0.9rem',
  fontSize: '1rem',
  boxSizing: 'border-box',
};

const buttonStyle = {
  border: 'none',
  padding: '0.8rem 1rem',
  borderRadius: '12px',
  background: '#0f766e',
  color: 'white',
  fontWeight: 700,
  cursor: 'pointer',
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const session = getStoredSession();
    if (session) {
      setCurrentUser(session);
    }
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
  };

  return (
    <div>
      <Routes>
        <Route path="/" element={currentUser ? <HomePage currentUser={currentUser} onLogout={handleLogout} /> : <LoginPage onLogin={handleLogin} />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </div>
  );
}
