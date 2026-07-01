import { useEffect, useState } from 'react';
import { Link, Route, Routes } from 'react-router-dom';

function HomePage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}database_awal.json`)
      .then((response) => response.json())
      .then((result) => setData(result))
      .catch((error) => console.error('Gagal memuat database_awal.json:', error));
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'Inter, sans-serif' }}>
      <h1>Telehealth Support</h1>
      <p>Halaman ini menggunakan routing hash agar aman di GitHub Pages.</p>
      {data ? (
        <pre>{JSON.stringify(data, null, 2)}</pre>
      ) : (
        <p>Memuat data...</p>
      )}
    </div>
  );
}

function AboutPage() {
  return (
    <div style={{ padding: '2rem' }}>
      <h2>Tentang Aplikasi</h2>
      <p>Versi demo yang sudah disesuaikan untuk deployment GitHub Pages.</p>
    </div>
  );
}

export default function App() {
  return (
    <div>
      <nav style={{ display: 'flex', gap: '1rem', padding: '1rem 2rem', background: '#0f766e', color: 'white' }}>
        <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>
          Beranda
        </Link>
        <Link to="/about" style={{ color: 'white', textDecoration: 'none' }}>
          Tentang
        </Link>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </div>
  );
}
