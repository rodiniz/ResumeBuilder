import { ResumeDBEntry, ResumeData } from './types';

// We declare the global initSqlJs function provided by the script tag in index.html
declare global {
  function initSqlJs(config: any): Promise<any>;
}

let db: any = null;

const DB_FILE_NAME = 'resume_builder.sqlite';

export const initDB = async (): Promise<boolean> => {
  if (db) return true;

  try {
    const SQL = await initSqlJs({
      // Fetch the wasm file from a reliable CDN
      locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
    });

    // Check if we have saved data in localStorage to simulate persistence
    const savedData = localStorage.getItem(DB_FILE_NAME);
    
    if (savedData) {
      const uInt8Array = new Uint8Array(JSON.parse(savedData));
      db = new SQL.Database(uInt8Array);
    } else {
      db = new SQL.Database();
      await createTables();
      await seedTemplates();
    }
    
    return true;
  } catch (error) {
    console.error("Failed to initialize database:", error);
    return false;
  }
};

const saveDB = () => {
  if (!db) return;
  const data = db.export();
  const arr = Array.from(data);
  localStorage.setItem(DB_FILE_NAME, JSON.stringify(arr));
}

const createTables = async () => {
  if (!db) return;
  
  const createResumesTable = `
    CREATE TABLE IF NOT EXISTS resumes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      template_id TEXT NOT NULL,
      data TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createTemplatesTable = `
    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      thumbnail_color TEXT
    );
  `;

  db.run(createResumesTable);
  db.run(createTemplatesTable);
  saveDB();
};

const seedTemplates = async () => {
  if (!db) return;
  // Check if templates exist
  const result = db.exec("SELECT count(*) as count FROM templates");
  if (result[0].values[0][0] > 0) return;

  const templates = [
    { id: 'modern', name: 'Modern Clean', description: 'A clean, minimalist design suitable for tech and creative roles.', thumbnail_color: '#3b82f6' },
    { id: 'classic', name: 'Executive Classic', description: 'Traditional serif layout for business and management roles.', thumbnail_color: '#475569' },
    { id: 'creative', name: 'Bold Creative', description: 'Stand out with bold headers and a unique sidebar layout.', thumbnail_color: '#8b5cf6' }
  ];

  const stmt = db.prepare("INSERT INTO templates (id, name, description, thumbnail_color) VALUES (?, ?, ?, ?)");
  templates.forEach(t => stmt.run([t.id, t.name, t.description, t.thumbnail_color]));
  stmt.free();
  saveDB();
};

// --- CRUD Operations ---

export const getTemplates = () => {
  if (!db) return [];
  const stmt = db.prepare("SELECT * FROM templates");
  const templates = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    templates.push(row);
  }
  stmt.free();
  return templates;
};

export const getAllResumes = (): ResumeDBEntry[] => {
  if (!db) return [];
  const stmt = db.prepare("SELECT * FROM resumes ORDER BY updated_at DESC");
  const resumes: ResumeDBEntry[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    try {
      resumes.push({
        id: row.id,
        name: row.name,
        templateId: row.template_id,
        data: JSON.parse(row.data),
        updatedAt: row.updated_at
      });
    } catch (e) {
      console.error("Error parsing resume data", e);
    }
  }
  stmt.free();
  return resumes;
};

export const saveResume = (resume: Omit<ResumeDBEntry, 'id' | 'updatedAt'>, id?: number): number => {
  if (!db) return -1;
  
  if (id) {
    const stmt = db.prepare("UPDATE resumes SET name = ?, template_id = ?, data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
    stmt.run([resume.name, resume.templateId, JSON.stringify(resume.data), id]);
    stmt.free();
    saveDB();
    return id;
  } else {
    const stmt = db.prepare("INSERT INTO resumes (name, template_id, data, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)");
    stmt.run([resume.name, resume.templateId, JSON.stringify(resume.data)]);
    stmt.free();
    
    // Get last ID
    const res = db.exec("SELECT last_insert_rowid()");
    saveDB();
    return res[0].values[0][0];
  }
};

export const deleteResume = (id: number) => {
  if (!db) return;
  db.run("DELETE FROM resumes WHERE id = ?", [id]);
  saveDB();
}
