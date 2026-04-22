// lib/offlineStorage.ts
// Handles saving and retrieving questions from IndexedDB for offline use

const DB_NAME    = 'prepwise-offline';
const DB_VERSION = 1;
const STORES     = {
  questions: 'offline-questions',
  metadata:  'offline-metadata',
};

// ── Open DB ───────────────────────────────────────────────────
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;

      // questions store — keyed by subject:examType
      if (!db.objectStoreNames.contains(STORES.questions)) {
        const store = db.createObjectStore(STORES.questions, { keyPath: 'id' });
        store.createIndex('subjectExam', ['subject', 'examType'], { unique: false });
      }

      // metadata store — tracks download time per subject
      if (!db.objectStoreNames.contains(STORES.metadata)) {
        db.createObjectStore(STORES.metadata, { keyPath: 'key' });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

// ── Save questions for a subject (merges with existing) ──────
export async function saveQuestionsOffline(
  subject: string,
  examType: string,
  questions: any[]
): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx    = db.transaction([STORES.questions, STORES.metadata], 'readwrite');
    const store = tx.objectStore(STORES.questions);
    const meta  = tx.objectStore(STORES.metadata);

    // Use put() — adds new questions, updates existing ones by id
    // This merges rather than overwrites so the pool grows each session
    questions.forEach(q => {
      store.put({ ...q, subject, examType });
    });

    // Get current count to update metadata accurately
    const countReq = store.index('subjectExam')
      .count(IDBKeyRange.only([subject, examType]));

    countReq.onsuccess = () => {
      meta.put({
        key:     `${subject}:${examType}`,
        subject,
        examType,
        savedAt: Date.now(),
        count:   countReq.result,
      });
    };

    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

// ── Get questions for a subject (offline) ─────────────────────
export async function getOfflineQuestions(
  subject: string,
  examType: string
): Promise<any[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx      = db.transaction(STORES.questions, 'readonly');
    const store   = tx.objectStore(STORES.questions);
    const index   = store.index('subjectExam');
    const request = index.getAll(IDBKeyRange.only([subject, examType]));

    request.onsuccess = () => resolve(request.result ?? []);
    request.onerror   = () => reject(request.error);
  });
}

// ── Get metadata for all downloaded subjects ──────────────────
export async function getOfflineMetadata(): Promise<Array<{
  key: string;
  subject: string;
  examType: string;
  savedAt: number;
  count: number;
}>> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx      = db.transaction(STORES.metadata, 'readonly');
    const store   = tx.objectStore(STORES.metadata);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result ?? []);
    request.onerror   = () => reject(request.error);
  });
}

// ── Check if a subject is downloaded ─────────────────────────
export async function isSubjectDownloaded(
  subject: string,
  examType: string
): Promise<boolean> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx      = db.transaction(STORES.metadata, 'readonly');
    const store   = tx.objectStore(STORES.metadata);
    const request = store.get(`${subject}:${examType}`);

    request.onsuccess = () => resolve(!!request.result);
    request.onerror   = () => reject(request.error);
  });
}

// ── Delete a subject's offline data ──────────────────────────
export async function deleteOfflineSubject(
  subject: string,
  examType: string
): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx    = db.transaction([STORES.questions, STORES.metadata], 'readwrite');
    const store = tx.objectStore(STORES.questions);
    const meta  = tx.objectStore(STORES.metadata);
    const index = store.index('subjectExam');

    // Get all question IDs for this subject then delete them
    const getReq = index.getAllKeys(IDBKeyRange.only([subject, examType]));
    getReq.onsuccess = () => {
      (getReq.result as IDBValidKey[]).forEach(key => store.delete(key));
      meta.delete(`${subject}:${examType}`);
    };

    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

// ── Shuffle helper (same as backend shuffleArray) ─────────────
export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}