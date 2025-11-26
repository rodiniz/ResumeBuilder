import React, { useState, useRef } from 'react';
import { parseResumeData } from '../services/geminiService';
import { ResumeData } from '../types';
import { Loader2, Download, AlertCircle, FileText, FileUp, UploadCloud } from 'lucide-react';

interface Props {
  onImport: (data: Partial<ResumeData>) => void;
  onClose: () => void;
}

const LinkedInImport: React.FC<Props> = ({ onImport, onClose }) => {
  const [mode, setMode] = useState<'text' | 'pdf'>('pdf');
  const [inputValue, setInputValue] = useState('');
  const [pdfFile, setPdfFile] = useState<{name: string, base64: string} | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (file.type !== 'application/pdf') {
            setError("Please upload a PDF file.");
            return;
        }
        if (file.size > 4 * 1024 * 1024) {
            setError("File size too large. Please upload a PDF smaller than 4MB.");
            return;
        }

        setError(null);
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            // Extract base64 part only
            const base64 = result.split(',')[1];
            setPdfFile({
                name: file.name,
                base64: base64
            });
        };
        reader.readAsDataURL(file);
    }
  };

  const handleParse = async () => {
    setLoading(true);
    setError(null);
    try {
        let input = inputValue;
        let type: 'text' | 'pdf' = mode;

        if (mode === 'pdf') {
            if (!pdfFile) {
                setError("Please select a PDF file.");
                setLoading(false);
                return;
            }
            input = pdfFile.base64;
        } else if (!input.trim()) {
            setError("Please enter text.");
            setLoading(false);
            return;
        }

        const parsed = await parseResumeData(input, type);
        onImport(parsed);
        onClose();
    } catch (e) {
        console.error(e);
        setError("Failed to import data. Please try again or check your input.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Import Resume</h2>
                    <p className="text-sm text-slate-500 mt-1">Upload a PDF or paste text to extract data automatically.</p>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="flex border-b border-slate-100">
                <button 
                    onClick={() => setMode('pdf')}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${mode === 'pdf' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <FileUp size={16}/> Upload PDF
                </button>
                <button 
                    onClick={() => setMode('text')}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${mode === 'text' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <FileText size={16}/> Paste Text
                </button>
            </div>
            
            <div className="p-6 flex-1 flex flex-col min-h-0">
                {mode === 'pdf' && (
                    <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative min-h-[200px]"
                         onClick={() => fileInputRef.current?.click()}>
                        <input 
                            type="file" 
                            accept=".pdf" 
                            className="hidden" 
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />
                        {pdfFile ? (
                            <div className="text-center p-8">
                                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <FileText size={32} />
                                </div>
                                <p className="font-medium text-slate-900 mb-1">{pdfFile.name}</p>
                                <p className="text-sm text-slate-500">Ready to import</p>
                                <button className="mt-4 text-sm text-blue-600 hover:text-blue-800 underline">Change file</button>
                            </div>
                        ) : (
                            <div className="text-center p-8">
                                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <UploadCloud size={32} />
                                </div>
                                <p className="font-medium text-slate-900 mb-1">Click to upload PDF</p>
                                <p className="text-sm text-slate-500">Maximum file size: 4MB</p>
                            </div>
                        )}
                    </div>
                )}
                
                {mode === 'text' && (
                    <textarea 
                        className="w-full flex-1 p-4 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-slate-50 text-sm font-mono min-h-[200px]"
                        placeholder="Paste text from your resume..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        autoFocus
                    />
                )}
                
                {error && (
                    <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
                <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button 
                    onClick={handleParse} 
                    disabled={loading || (mode === 'text' && !inputValue) || (mode === 'pdf' && !pdfFile)}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                    {loading ? 'Analyzing...' : 'Import'}
                </button>
            </div>
        </div>
    </div>
  );
};

export default LinkedInImport;