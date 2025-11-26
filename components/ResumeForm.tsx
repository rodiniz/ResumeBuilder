import React, { useState } from 'react';
import { ResumeData, Experience, Education, Skill } from '../types';
import { Plus, Trash2, Sparkles, ChevronDown, ChevronUp, X, Wand2, Check } from 'lucide-react';
import { improveContent, suggestSkills } from '../services/geminiService';

interface Props {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

const COMMON_SKILLS = [
  "JavaScript", "TypeScript", "React", "Node.js", "Python", "Java", "C++", "C#", "Go", "Rust", "PHP", "Ruby",
  "HTML", "CSS", "Tailwind CSS", "Sass", "SQL", "PostgreSQL", "MySQL", "MongoDB", "NoSQL", "Redis",
  "Git", "GitHub", "GitLab", "Docker", "Kubernetes", "AWS", "Azure", "Google Cloud", "Firebase", "Supabase",
  "Figma", "Adobe XD", "Photoshop", "Illustrator", "InDesign", "Canva",
  "Project Management", "Agile", "Scrum", "JIRA", "Trello", "Asana", "Notion",
  "Communication", "Leadership", "Teamwork", "Problem Solving", "Time Management", "Critical Thinking", "Adaptability",
  "Public Speaking", "Writing", "Research", "Data Analysis", "Machine Learning", "Artificial Intelligence",
  "DevOps", "CI/CD", "Linux", "Terraform", "Ansible", "Jenkins",
  "Android", "iOS", "Swift", "Kotlin", "Flutter", "React Native", "Expo",
  "Angular", "Vue.js", "Svelte", "Next.js", "Nuxt.js", "Express", "NestJS", "Spring Boot", "Django", "Flask", "FastAPI",
  "Excel", "Power BI", "Tableau", "Salesforce", "SAP",
  "English", "Spanish", "French", "German", "Mandarin", "Japanese", "Arabic", "Portuguese", "Russian"
].sort();

interface SkillItemProps {
    skill: Skill;
    index: number;
    updateSkill: (index: number, field: keyof Skill, value: any) => void;
    removeSkill: (index: number) => void;
    categories: string[];
}

const SkillItem: React.FC<SkillItemProps> = ({ skill, index, updateSkill, removeSkill, categories }) => {
    const [focused, setFocused] = useState(false);
    
    const filteredSuggestions = COMMON_SKILLS.filter(s => 
        s.toLowerCase().includes(skill.name.toLowerCase()) && 
        s.toLowerCase() !== skill.name.toLowerCase()
    ).slice(0, 6);

    return (
        <div className="flex flex-col md:flex-row gap-2 items-start md:items-center bg-slate-50 p-3 rounded-lg border border-slate-100 relative">
             <div className="flex-1 w-full relative z-20">
                <label className="text-xs text-slate-500 block md:hidden mb-1">Skill Name</label>
                <input 
                    placeholder="Skill (e.g. React, Project Management)" 
                    className="p-2 border border-slate-300 rounded w-full focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={skill.name} 
                    onChange={(e) => updateSkill(index, 'name', e.target.value)} 
                    onFocus={() => setFocused(true)}
                    onBlur={() => setTimeout(() => setFocused(false), 200)}
                />
                
                {/* Autocomplete Dropdown */}
                {focused && skill.name.length > 0 && filteredSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-100">
                        {filteredSuggestions.map(suggestion => (
                            <div 
                                key={suggestion}
                                className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm text-slate-700 border-b border-slate-50 last:border-0"
                                onMouseDown={(e) => {
                                    e.preventDefault(); // Prevent blur
                                    updateSkill(index, 'name', suggestion);
                                    setFocused(false);
                                }}
                            >
                                {suggestion}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <div className="w-full md:w-40 z-10">
                <label className="text-xs text-slate-500 block md:hidden mb-1">Category</label>
                <select 
                    className="p-2 border border-slate-300 rounded text-sm w-full bg-white focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={skill.category || 'Technical'} 
                    onChange={(e) => updateSkill(index, 'category', e.target.value)}
                >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            <div className="w-full md:w-32 z-10">
                <label className="text-xs text-slate-500 block md:hidden mb-1">Level</label>
                <select 
                    className="p-2 border border-slate-300 rounded text-sm w-full bg-white focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={skill.level} 
                    onChange={(e) => updateSkill(index, 'level', e.target.value)}
                >
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                    <option>Expert</option>
                </select>
            </div>
            
            <button onClick={() => removeSkill(index)} className="text-slate-400 hover:text-red-500 p-2 self-end md:self-center transition-colors"><Trash2 size={16}/></button>
        </div>
    );
};

const ResumeForm: React.FC<Props> = ({ data, onChange }) => {
  const [activeSection, setActiveSection] = useState<string | null>('personal');
  const [improving, setImproving] = useState<string | null>(null);
  
  // AI Options Modal State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [pendingImprovement, setPendingImprovement] = useState<{text: string, type: 'summary' | 'experience', path: string} | null>(null);
  const [aiOptions, setAiOptions] = useState({ tone: 'Professional', industry: '' });

  // AI Skills State
  const [skillModalOpen, setSkillModalOpen] = useState(false);
  const [targetJob, setTargetJob] = useState('');
  const [suggestedSkills, setSuggestedSkills] = useState<Skill[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(false);

  const updatePersonal = (field: string, value: string) => {
    onChange({
      ...data,
      personalInfo: { ...data.personalInfo, [field]: value }
    });
  };

  const initiateImprove = (text: string, type: 'summary' | 'experience', path: string) => {
    if (!text) return;
    setPendingImprovement({ text, type, path });
    setAiModalOpen(true);
  };

  const executeImprove = async () => {
    if (!pendingImprovement) return;
    setAiModalOpen(false);
    setImproving(pendingImprovement.path);
    
    const improved = await improveContent(pendingImprovement.text, pendingImprovement.type, aiOptions);
    
    if (pendingImprovement.path === 'summary') {
        updatePersonal('summary', improved);
    } else if (pendingImprovement.path.startsWith('exp-')) {
        const index = parseInt(pendingImprovement.path.split('-')[1]);
        const newExp = [...data.experience];
        newExp[index].description = improved;
        onChange({ ...data, experience: newExp });
    }
    
    setImproving(null);
    setPendingImprovement(null);
  };

  const handleSuggestSkills = async () => {
      if (!targetJob) return;
      setLoadingSkills(true);
      try {
          const suggestions = await suggestSkills(targetJob);
          setSuggestedSkills(suggestions);
      } catch (e) {
          console.error(e);
      } finally {
          setLoadingSkills(false);
      }
  };

  const addSuggestedSkill = (skill: Skill) => {
      onChange({
          ...data,
          skills: [...data.skills, { ...skill, id: Date.now().toString() }]
      });
      // Optional: remove from suggestions to avoid duplicates visually
      setSuggestedSkills(prev => prev.filter(s => s.name !== skill.name));
  };

  const addExperience = () => {
    const newExp: Experience = {
      id: Date.now().toString(),
      company: '',
      role: '',
      startDate: '',
      endDate: '',
      current: false,
      description: ''
    };
    onChange({ ...data, experience: [...data.experience, newExp] });
  };

  const updateExperience = (index: number, field: keyof Experience, value: any) => {
    const newExp = [...data.experience];
    newExp[index] = { ...newExp[index], [field]: value };
    onChange({ ...data, experience: newExp });
  };

  const removeExperience = (index: number) => {
    const newExp = data.experience.filter((_, i) => i !== index);
    onChange({ ...data, experience: newExp });
  };
  
  const addEducation = () => {
    const newEdu: Education = {
        id: Date.now().toString(),
        school: '',
        degree: '',
        startDate: '',
        endDate: '',
        current: false
    };
    onChange({ ...data, education: [...data.education, newEdu] });
  };

  const updateEducation = (index: number, field: keyof Education, value: any) => {
      const newEdu = [...data.education];
      newEdu[index] = { ...newEdu[index], [field]: value };
      onChange({ ...data, education: newEdu });
  };

  const removeEducation = (index: number) => {
      onChange({ ...data, education: data.education.filter((_, i) => i !== index) });
  };

  const addSkill = () => {
      onChange({ 
        ...data, 
        skills: [...data.skills, { id: Date.now().toString(), name: '', level: 'Intermediate', category: 'Technical' }] 
      });
  };

  const updateSkill = (index: number, field: keyof Skill, value: any) => {
      const newSkills = [...data.skills];
      newSkills[index] = { ...newSkills[index], [field]: value };
      onChange({ ...data, skills: newSkills });
  };

  const removeSkill = (index: number) => {
      onChange({ ...data, skills: data.skills.filter((_, i) => i !== index) });
  };

  const SectionHeader = ({ title, id, extraAction }: { title: string, id: string, extraAction?: React.ReactNode }) => (
    <div 
        className="flex justify-between items-center p-4 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 mb-2"
        onClick={() => setActiveSection(activeSection === id ? null : id)}
    >
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            {title}
            {extraAction && (
                <div onClick={e => e.stopPropagation()}>
                    {extraAction}
                </div>
            )}
        </h3>
        {activeSection === id ? <ChevronUp size={20} className="text-slate-400"/> : <ChevronDown size={20} className="text-slate-400"/>}
    </div>
  );

  const SKILL_CATEGORIES = ['Technical', 'Soft Skills', 'Languages', 'Tools', 'Other'];

  return (
    <div className="space-y-4">
      
      <div className="flex justify-between items-center px-1 mb-2">
         <h2 className="text-lg font-bold text-slate-800">Resume Editor</h2>
      </div>

      {/* PERSONAL INFO */}
      <div>
        <SectionHeader title="Personal Information" id="personal" />
        {activeSection === 'personal' && (
            <div className="p-4 bg-white border border-t-0 border-slate-200 rounded-b-lg -mt-2 space-y-4 shadow-sm animate-in slide-in-from-top-2">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-500">Full Name</label>
                        <input type="text" className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                            value={data.personalInfo.fullName} onChange={e => updatePersonal('fullName', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-500">Email</label>
                        <input type="email" className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                            value={data.personalInfo.email} onChange={e => updatePersonal('email', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-500">Phone</label>
                        <input type="text" className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                            value={data.personalInfo.phone} onChange={e => updatePersonal('phone', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-500">Location</label>
                        <input type="text" className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                            value={data.personalInfo.location} onChange={e => updatePersonal('location', e.target.value)} />
                    </div>
                    <div className="space-y-1 col-span-2">
                         <label className="text-xs font-medium text-slate-500">LinkedIn URL</label>
                        <input type="text" className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                            value={data.personalInfo.linkedin} onChange={e => updatePersonal('linkedin', e.target.value)} />
                    </div>
                    <div className="space-y-1 col-span-2">
                         <label className="text-xs font-medium text-slate-500 flex justify-between">
                            Summary 
                            <button 
                                onClick={(e) => { e.stopPropagation(); initiateImprove(data.personalInfo.summary, 'summary', 'summary'); }}
                                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs"
                                disabled={improving === 'summary'}
                            >
                                <Sparkles size={12}/> {improving === 'summary' ? 'Improving...' : 'AI Improve'}
                            </button>
                         </label>
                        <textarea className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none h-24" 
                            value={data.personalInfo.summary} onChange={e => updatePersonal('summary', e.target.value)} />
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* EXPERIENCE */}
      <div>
        <SectionHeader title="Experience" id="experience" />
        {activeSection === 'experience' && (
            <div className="p-4 bg-white border border-t-0 border-slate-200 rounded-b-lg -mt-2 space-y-6 shadow-sm">
                {data.experience.map((exp, index) => (
                    <div key={exp.id} className="relative p-4 border border-slate-100 bg-slate-50 rounded-lg group">
                        <button onClick={() => removeExperience(index)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 size={16} />
                        </button>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <input placeholder="Company" className="p-2 border border-slate-300 rounded" value={exp.company} onChange={(e) => updateExperience(index, 'company', e.target.value)} />
                            <input placeholder="Role" className="p-2 border border-slate-300 rounded" value={exp.role} onChange={(e) => updateExperience(index, 'role', e.target.value)} />
                            <input type="month" className="p-2 border border-slate-300 rounded" value={exp.startDate} onChange={(e) => updateExperience(index, 'startDate', e.target.value)} />
                            <div className="flex items-center gap-2">
                                {!exp.current && <input type="month" className="p-2 border border-slate-300 rounded w-full" value={exp.endDate} onChange={(e) => updateExperience(index, 'endDate', e.target.value)} />}
                                <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                                    <input type="checkbox" checked={exp.current} onChange={(e) => updateExperience(index, 'current', e.target.checked)} /> Current
                                </label>
                            </div>
                        </div>
                        <div className="relative">
                             <div className="flex justify-between mb-1">
                                <label className="text-xs text-slate-500">Description</label>
                                <button 
                                    onClick={() => initiateImprove(exp.description, 'experience', `exp-${index}`)}
                                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs"
                                    disabled={improving === `exp-${index}`}
                                >
                                    <Sparkles size={12}/> {improving === `exp-${index}` ? 'Improving...' : 'AI Improve'}
                                </button>
                             </div>
                             <textarea 
                                className="w-full p-2 border border-slate-300 rounded h-24 text-sm" 
                                value={exp.description} 
                                onChange={(e) => updateExperience(index, 'description', e.target.value)}
                             />
                        </div>
                    </div>
                ))}
                <button onClick={addExperience} className="w-full py-2 border-2 border-dashed border-slate-300 rounded text-slate-500 hover:border-blue-500 hover:text-blue-500 flex justify-center items-center gap-2">
                    <Plus size={16} /> Add Experience
                </button>
            </div>
        )}
      </div>

       {/* EDUCATION */}
       <div>
        <SectionHeader title="Education" id="education" />
        {activeSection === 'education' && (
            <div className="p-4 bg-white border border-t-0 border-slate-200 rounded-b-lg -mt-2 space-y-4 shadow-sm">
                {data.education.map((edu, index) => (
                    <div key={edu.id} className="relative p-4 border border-slate-100 bg-slate-50 rounded-lg group">
                         <button onClick={() => removeEducation(index)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 size={16} />
                        </button>
                        <div className="grid grid-cols-2 gap-4">
                            <input placeholder="School / University" className="p-2 border border-slate-300 rounded" value={edu.school} onChange={(e) => updateEducation(index, 'school', e.target.value)} />
                            <input placeholder="Degree" className="p-2 border border-slate-300 rounded" value={edu.degree} onChange={(e) => updateEducation(index, 'degree', e.target.value)} />
                            <input type="month" className="p-2 border border-slate-300 rounded" value={edu.startDate} onChange={(e) => updateEducation(index, 'startDate', e.target.value)} />
                            <input type="month" className="p-2 border border-slate-300 rounded" value={edu.endDate} onChange={(e) => updateEducation(index, 'endDate', e.target.value)} />
                        </div>
                    </div>
                ))}
                <button onClick={addEducation} className="w-full py-2 border-2 border-dashed border-slate-300 rounded text-slate-500 hover:border-blue-500 hover:text-blue-500 flex justify-center items-center gap-2">
                    <Plus size={16} /> Add Education
                </button>
            </div>
        )}
      </div>

       {/* SKILLS */}
       <div>
        <SectionHeader 
            title="Skills & Technologies" 
            id="skills" 
            extraAction={
                <button 
                    onClick={() => setSkillModalOpen(true)}
                    className="flex items-center gap-1 text-[10px] md:text-xs bg-purple-50 text-purple-600 hover:bg-purple-100 px-2 py-1 rounded-full border border-purple-200 transition-colors"
                    title="Get AI Suggestions"
                >
                    <Sparkles size={10} /> AI Suggest
                </button>
            }
        />
        {activeSection === 'skills' && (
            <div className="p-4 bg-white border border-t-0 border-slate-200 rounded-b-lg -mt-2 shadow-sm">
                <div className="space-y-3 mb-4">
                    {data.skills.map((skill, index) => (
                        <SkillItem 
                            key={skill.id}
                            skill={skill}
                            index={index}
                            updateSkill={updateSkill}
                            removeSkill={removeSkill}
                            categories={SKILL_CATEGORIES}
                        />
                    ))}
                </div>
                 <button onClick={addSkill} className="w-full py-2 border-2 border-dashed border-slate-300 rounded text-slate-500 hover:border-blue-500 hover:text-blue-500 flex justify-center items-center gap-2">
                    <Plus size={16} /> Add Skill
                </button>
            </div>
        )}
      </div>

      {/* AI Config Modal */}
      {aiModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Wand2 size={18} className="text-blue-600"/> AI Enhancement
                    </h3>
                    <button onClick={() => setAiModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={18} />
                    </button>
                </div>
                
                <div className="p-5 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Desired Tone</label>
                        <select 
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
                            value={aiOptions.tone}
                            onChange={e => setAiOptions({...aiOptions, tone: e.target.value})}
                        >
                            <option value="Professional">Professional (Default)</option>
                            <option value="Executive">Executive</option>
                            <option value="Creative">Creative</option>
                            <option value="Concise">Concise</option>
                            <option value="Technical">Technical</option>
                            <option value="Enthusiastic">Enthusiastic</option>
                        </select>
                    </div>
                    
                    <div className="space-y-1.5">
                         <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Target Industry</label>
                         <input 
                            type="text" 
                            placeholder="e.g. Software, Finance, Marketing"
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={aiOptions.industry}
                            onChange={e => setAiOptions({...aiOptions, industry: e.target.value})}
                         />
                    </div>

                    <div className="text-xs text-slate-500 leading-relaxed bg-blue-50 p-3 rounded-lg border border-blue-100">
                        The AI will rewrite your content to match this tone and industry while preserving your key achievements.
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 flex gap-3 bg-slate-50/50">
                    <button 
                        onClick={() => setAiModalOpen(false)}
                        className="flex-1 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={executeImprove}
                        className="flex-1 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                    >
                        Generate
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Skills Suggestion Modal */}
      {skillModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
                  <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          <Sparkles size={18} className="text-purple-600"/> Skill Suggestions
                      </h3>
                      <button onClick={() => setSkillModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                          <X size={18} />
                      </button>
                  </div>

                  <div className="p-5 flex-1 flex flex-col min-h-0 overflow-y-auto">
                      <div className="flex gap-2 mb-4 shrink-0">
                          <input 
                              type="text" 
                              placeholder="Target Job Title (e.g. Product Manager)"
                              className="flex-1 p-2 border border-slate-300 rounded focus:ring-2 focus:ring-purple-500 outline-none"
                              value={targetJob}
                              onChange={e => setTargetJob(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleSuggestSkills()}
                          />
                          <button 
                              onClick={handleSuggestSkills}
                              disabled={loadingSkills || !targetJob}
                              className="px-4 py-2 bg-purple-600 text-white rounded font-medium disabled:opacity-50"
                          >
                              {loadingSkills ? '...' : 'Get'}
                          </button>
                      </div>

                      <div className="space-y-2">
                          {suggestedSkills.length > 0 ? (
                              suggestedSkills.map((skill, i) => (
                                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 group hover:border-purple-200 transition-colors">
                                      <div>
                                          <div className="font-medium text-slate-800">{skill.name}</div>
                                          <div className="text-xs text-slate-500">{skill.category} • {skill.level}</div>
                                      </div>
                                      <button 
                                          onClick={() => addSuggestedSkill(skill)}
                                          className="p-1.5 rounded-full bg-white text-purple-600 border border-purple-100 hover:bg-purple-600 hover:text-white transition-all shadow-sm"
                                          title="Add to Resume"
                                      >
                                          <Plus size={16} />
                                      </button>
                                  </div>
                              ))
                          ) : (
                              !loadingSkills && <div className="text-center text-slate-400 text-sm py-8">Enter a job title to see top skills.</div>
                          )}
                          {loadingSkills && (
                              <div className="space-y-3 animate-pulse">
                                  {[1,2,3].map(i => (
                                      <div key={i} className="h-14 bg-slate-100 rounded-lg"></div>
                                  ))}
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default ResumeForm;