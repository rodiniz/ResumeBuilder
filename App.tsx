import React, { useEffect, useState, useRef } from 'react';
import { initDB, getAllResumes, saveResume, deleteResume, getTemplates } from './db';
import { ResumeData, ResumeDBEntry, Template } from './types';
import ResumeForm from './components/ResumeForm';
import TemplateRenderer from './components/TemplateRenderer';
import LinkedInImport from './components/LinkedInImport';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { FileText, Layout, Download, Save, Plus, Trash2, ArrowLeft, Loader2, Database, Upload } from 'lucide-react';

const INITIAL_RESUME: ResumeData = {
  personalInfo: { fullName: 'Your Name', email: '', phone: '', linkedin: '', website: '', summary: '', location: '' },
  experience: [],
  education: [],
  skills: []
};

const App: React.FC = () => {
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [resumes, setResumes] = useState<ResumeDBEntry[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [currentResume, setCurrentResume] = useState<ResumeData>(INITIAL_RESUME);
  const [currentResumeId, setCurrentResumeId] = useState<number | undefined>(undefined);
  const [currentResumeName, setCurrentResumeName] = useState('My Resume');
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Initialize DB and load data
  useEffect(() => {
    const start = async () => {
      const success = await initDB();
      if (success) {
        setResumes(getAllResumes());
        setTemplates(getTemplates());
      }
      setLoading(false);
    };
    start();
  }, []);

  const handleCreateNew = () => {
    setCurrentResume(INITIAL_RESUME);
    setCurrentResumeId(undefined);
    setCurrentResumeName('New Resume');
    setSelectedTemplate('modern');
    setView('editor');
  };

  const handleEdit = (entry: ResumeDBEntry) => {
    setCurrentResume(entry.data);
    setCurrentResumeId(entry.id);
    setCurrentResumeName(entry.name);
    setSelectedTemplate(entry.templateId);
    setView('editor');
  };

  const handleDelete = (id: number) => {
      if (confirm('Are you sure you want to delete this resume?')) {
        deleteResume(id);
        setResumes(getAllResumes());
      }
  };

  const handleSave = async () => {
      setSaving(true);
      // Simulate small delay for UX
      await new Promise(r => setTimeout(r, 500));
      const id = saveResume({
          name: currentResumeName,
          templateId: selectedTemplate,
          data: currentResume
      }, currentResumeId);
      
      setCurrentResumeId(id);
      setResumes(getAllResumes());
      setSaving(false);
  };

  const handleImport = (imported: Partial<ResumeData>) => {
      setCurrentResume(prev => ({
          ...prev,
          ...imported,
          personalInfo: { ...prev.personalInfo, ...imported.personalInfo },
          experience: imported.experience || prev.experience,
          education: imported.education || prev.education,
          skills: imported.skills || prev.skills
      }));
  };

  const handleDownloadPDF = async () => {
    const input = document.getElementById('resume-preview');
    if (!input) return;

    try {
        const canvas = await html2canvas(input, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${currentResumeName.replace(/\s+/g, '_')}.pdf`);
    } catch (e) {
        console.error("PDF Gen Error", e);
        alert("Failed to generate PDF");
    }
  };

  if (loading) {
      return (
          <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
             <Loader2 size={48} className="animate-spin text-blue-600" />
             <div className="text-slate-500 font-medium">Initializing SQLite Database...</div>
          </div>
      );
  }

  // --- DASHBOARD VIEW ---
  if (view === 'list') {
      return (
          <div className="min-h-screen bg-slate-50 p-8">
              <div className="max-w-6xl mx-auto">
                  <header className="flex justify-between items-center mb-12">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                             <Database size={20} />
                          </div>
                          <h1 className="text-2xl font-bold text-slate-900">My Resumes</h1>
                      </div>
                      <button onClick={handleCreateNew} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-all hover:shadow-md">
                          <Plus size={20} /> Create New
                      </button>
                  </header>

                  {resumes.length === 0 ? (
                      <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 shadow-sm">
                          <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                          <h3 className="text-lg font-medium text-slate-700 mb-1">No resumes yet</h3>
                          <p className="text-slate-500 mb-6">Create your first professional resume with AI assistance.</p>
                          <button onClick={handleCreateNew} className="text-blue-600 hover:text-blue-800 font-medium">Get Started &rarr;</button>
                      </div>
                  ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {resumes.map(r => (
                              <div key={r.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                                  <div className="flex justify-between items-start mb-4">
                                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                                          <FileText size={20} />
                                      </div>
                                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                          <button onClick={() => handleDelete(r.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                                      </div>
                                  </div>
                                  <h3 className="font-bold text-lg text-slate-900 mb-1">{r.name}</h3>
                                  <p className="text-xs text-slate-500 mb-4">Updated: {new Date(r.updatedAt).toLocaleDateString()}</p>
                                  <button onClick={() => handleEdit(r)} className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-sm font-medium border border-slate-200">
                                      Edit Resume
                                  </button>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          </div>
      );
  }

  // --- EDITOR VIEW ---
  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
        {/* Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10 shrink-0">
            <div className="flex items-center gap-4">
                <button onClick={() => setView('list')} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full">
                    <ArrowLeft size={20} />
                </button>
                <input 
                    type="text" 
                    value={currentResumeName} 
                    onChange={e => setCurrentResumeName(e.target.value)}
                    className="text-lg font-bold text-slate-800 bg-transparent border-none focus:ring-0 px-0 w-64"
                />
            </div>
            
            <div className="flex items-center gap-3">
                 <div className="flex items-center gap-2 mr-4 bg-slate-100 p-1 rounded-lg">
                    {templates.map(t => (
                        <button 
                            key={t.id}
                            onClick={() => setSelectedTemplate(t.id)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${selectedTemplate === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {t.name}
                        </button>
                    ))}
                 </div>

                {/* Header Import Button */}
                <button onClick={() => setIsImportOpen(true)} className="flex items-center gap-2 text-slate-600 hover:bg-slate-100 px-3 py-2 rounded-lg text-sm font-medium transition-colors hidden md:flex">
                    <Upload size={18} className="text-blue-600" /> Import
                </button>
                
                <button onClick={handleSave} className="flex items-center gap-2 text-slate-600 hover:bg-slate-100 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                    {saving ? <Loader2 size={18} className="animate-spin"/> : <Save size={18} />} Save
                </button>
                <button onClick={handleDownloadPDF} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors">
                    <Download size={18} /> Download PDF
                </button>
            </div>
        </header>

        {/* Main Workspace */}
        <main className="flex-1 flex overflow-hidden">
            {/* Form Side */}
            <div className="w-[450px] border-r border-slate-200 bg-white overflow-y-auto p-6 scrollbar-thin">
                <ResumeForm 
                    data={currentResume} 
                    onChange={setCurrentResume} 
                />
            </div>

            {/* Preview Side */}
            <div className="flex-1 bg-slate-100 overflow-y-auto p-8 flex justify-center preview-scroll">
                 <div className="origin-top transform scale-[0.65] md:scale-[0.75] lg:scale-[0.85] xl:scale-100 transition-transform duration-300">
                    <TemplateRenderer id="resume-preview" data={currentResume} templateId={selectedTemplate} />
                 </div>
            </div>
        </main>

        {isImportOpen && (
            <LinkedInImport onImport={handleImport} onClose={() => setIsImportOpen(false)} />
        )}
    </div>
  );
};

export default App;