import Dexie from 'dexie';

export const db = new Dexie('telehealthDb');

db.version(1).stores({
  doctors: '&id, name, specialization',
  medicines: '&id, name, category',
  firstAidGuides: '&id, title',
  appointments: '&id, patientName, doctorId, date, status',
  medicalRecords: '&id, patientName, title, createdAt',
});

export async function seedDatabaseFromJson(jsonData) {
  if (!jsonData) return;

  const doctorCount = await db.doctors.count();
  if (doctorCount === 0) {
    await db.doctors.bulkAdd(jsonData.doctors || []);
  }

  const medicineCount = await db.medicines.count();
  if (medicineCount === 0) {
    await db.medicines.bulkAdd(jsonData.medicines || []);
  }

  const guideCount = await db.firstAidGuides.count();
  if (guideCount === 0) {
    await db.firstAidGuides.bulkAdd(jsonData.firstAidGuides || []);
  }
}

export async function loadInitialData() {
  const response = await fetch(`${import.meta.env.BASE_URL}database_awal.json`);
  if (!response.ok) throw new Error('Gagal memuat data awal');
  const data = await response.json();
  await seedDatabaseFromJson(data);
  return data;
}
