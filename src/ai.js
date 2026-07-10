export async function analyzeSymptomsWithAI(prompt) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    return {
      level: 'Mode demo',
      summary: 'API key Gemini belum diatur. Sistem akan memakai respons demo.',
      advice: 'Masukkan keluhan Anda, dan aplikasi akan memberi penilaian awal berdasarkan logika lokal.',
    };
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `Anda adalah asisten kesehatan. Berikan respons singkat, jelas, dan aman. Kembalikan format JSON: {"level":"...","summary":"...","advice":"..."}. Keluhan: ${prompt}`,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error('Gagal memanggil Gemini API');
  }

  const payload = await response.json();
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

  try {
    return JSON.parse(text);
  } catch {
    return {
      level: 'Perlu evaluasi',
      summary: 'Respons AI tidak valid.',
      advice: 'Silakan coba lagi dengan keluhan yang lebih jelas.',
    };
  }
}
