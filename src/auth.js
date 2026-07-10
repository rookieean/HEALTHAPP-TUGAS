const SESSION_KEY = 'telehealth-session';

export const demoUsers = [
  {
    id: 'patient-1',
    name: 'Ayu Puspita',
    email: 'pasien@demo.com',
    password: '123456',
    role: 'pasien',
  },
  {
    id: 'doctor-1',
    name: 'dr. Anisa Putri',
    email: 'dokter@demo.com',
    password: '123456',
    role: 'dokter',
  },
];

export function getStoredSession() {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession(user) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(SESSION_KEY);
}

export function signIn(email, password) {
  const user = demoUsers.find((entry) => entry.email === email && entry.password === password);
  if (!user) {
    throw new Error('Email atau password salah.');
  }

  const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
  saveSession(safeUser);
  return safeUser;
}
