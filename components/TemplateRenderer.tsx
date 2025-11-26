import React from 'react';
import { ResumeData, Skill } from '../types';
import { MapPin, Mail, Phone, Linkedin, Globe, Calendar } from 'lucide-react';

interface Props {
  data: ResumeData;
  templateId: string;
  id?: string; // HTML ID for PDF generation
}

const ResumeContainer: React.FC<{ children: React.ReactNode; id?: string }> = ({ children, id }) => (
  <div id={id} className="w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-lg mx-auto overflow-hidden print:shadow-none relative">
    {children}
  </div>
);

const TemplateRenderer: React.FC<Props> = ({ data, templateId, id }) => {
  const { personalInfo, experience, education, skills } = data;

  const groupedSkills = skills.reduce((acc, skill) => {
    const cat = skill.category || 'Technical';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  // --- MODERN TEMPLATE ---
  if (templateId === 'modern') {
    return (
      <ResumeContainer id={id}>
        <div className="flex h-full min-h-[297mm]">
          {/* Left Sidebar */}
          <div className="w-1/3 bg-slate-900 text-white p-8 space-y-8">
            <div className="space-y-4">
               {/* Avatar Placeholder if needed, omitted for simplicity */}
               <h1 className="text-3xl font-bold leading-tight">{personalInfo.fullName}</h1>
               <div className="text-slate-400 text-sm space-y-2">
                 {personalInfo.location && <div className="flex items-center gap-2"><MapPin size={14}/> {personalInfo.location}</div>}
                 {personalInfo.email && <div className="flex items-center gap-2"><Mail size={14}/> {personalInfo.email}</div>}
                 {personalInfo.phone && <div className="flex items-center gap-2"><Phone size={14}/> {personalInfo.phone}</div>}
                 {personalInfo.linkedin && <div className="flex items-center gap-2"><Linkedin size={14}/> {personalInfo.linkedin}</div>}
                 {personalInfo.website && <div className="flex items-center gap-2"><Globe size={14}/> {personalInfo.website}</div>}
               </div>
            </div>

            {Object.keys(groupedSkills).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold uppercase tracking-wider border-b border-slate-700 pb-2 mb-4">Skills</h3>
                <div className="space-y-4">
                  {Object.entries(groupedSkills).map(([category, categorySkills]) => (
                    <div key={category}>
                      <h4 className="text-xs text-slate-400 uppercase font-semibold mb-2">{category}</h4>
                      <div className="flex flex-wrap gap-2">
                        {(categorySkills as Skill[]).map((skill, i) => (
                          <span key={i} className="bg-slate-800 px-3 py-1 rounded text-sm text-slate-200">
                            {skill.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {education.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold uppercase tracking-wider border-b border-slate-700 pb-2 mb-4">Education</h3>
                <div className="space-y-4">
                  {education.map((edu, i) => (
                    <div key={i}>
                      <div className="font-bold">{edu.school}</div>
                      <div className="text-sm text-slate-400">{edu.degree}</div>
                      <div className="text-xs text-slate-500 mt-1">{edu.startDate} - {edu.current ? 'Present' : edu.endDate}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="w-2/3 p-8 space-y-8 bg-white">
            {personalInfo.summary && (
              <div>
                 <h2 className="text-xl font-bold text-slate-800 uppercase tracking-widest border-b-2 border-slate-200 pb-2 mb-4">Profile</h2>
                 <p className="text-slate-600 leading-relaxed">{personalInfo.summary}</p>
              </div>
            )}

            {experience.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-slate-800 uppercase tracking-widest border-b-2 border-slate-200 pb-2 mb-4">Experience</h2>
                <div className="space-y-6">
                  {experience.map((exp, i) => (
                    <div key={i}>
                      <div className="flex justify-between items-baseline">
                        <h3 className="text-lg font-bold text-slate-900">{exp.role}</h3>
                        <span className="text-sm text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                        </span>
                      </div>
                      <div className="text-blue-600 font-medium mb-2">{exp.company}</div>
                      <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                        {exp.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </ResumeContainer>
    );
  }

  // --- CLASSIC TEMPLATE ---
  if (templateId === 'classic') {
    return (
      <ResumeContainer id={id}>
        <div className="p-12 max-w-full">
          <header className="border-b-2 border-black pb-6 mb-8 text-center">
            <h1 className="text-4xl font-serif font-bold text-black mb-3">{personalInfo.fullName}</h1>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-700 font-serif">
               {personalInfo.email && <span>{personalInfo.email}</span>}
               {personalInfo.phone && <span>• {personalInfo.phone}</span>}
               {personalInfo.location && <span>• {personalInfo.location}</span>}
               {personalInfo.linkedin && <span>• {personalInfo.linkedin}</span>}
            </div>
          </header>

          {personalInfo.summary && (
            <section className="mb-8">
              <h2 className="text-lg font-serif font-bold uppercase border-b border-gray-300 mb-4 pb-1">Professional Summary</h2>
              <p className="text-gray-800 leading-relaxed font-serif">{personalInfo.summary}</p>
            </section>
          )}

          {experience.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-serif font-bold uppercase border-b border-gray-300 mb-4 pb-1">Work History</h2>
              <div className="space-y-6">
                {experience.map((exp, i) => (
                  <div key={i}>
                    <div className="flex justify-between font-serif mb-1">
                      <div className="font-bold text-lg">{exp.company}</div>
                      <div className="italic">{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</div>
                    </div>
                    <div className="font-serif font-semibold text-gray-700 mb-2">{exp.role}</div>
                    <div className="text-gray-800 font-serif text-sm leading-relaxed whitespace-pre-line">
                      {exp.description}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="grid grid-cols-2 gap-8">
            {education.length > 0 && (
              <section>
                <h2 className="text-lg font-serif font-bold uppercase border-b border-gray-300 mb-4 pb-1">Education</h2>
                {education.map((edu, i) => (
                  <div key={i} className="mb-3 font-serif">
                    <div className="font-bold">{edu.school}</div>
                    <div>{edu.degree}</div>
                    <div className="text-sm text-gray-600">{edu.startDate} - {edu.current ? 'Present' : edu.endDate}</div>
                  </div>
                ))}
              </section>
            )}
            
            {Object.keys(groupedSkills).length > 0 && (
              <section>
                <h2 className="text-lg font-serif font-bold uppercase border-b border-gray-300 mb-4 pb-1">Skills</h2>
                <div className="space-y-3 font-serif">
                  {Object.entries(groupedSkills).map(([category, categorySkills]) => (
                    <div key={category}>
                        <span className="font-bold text-gray-900">{category}: </span>
                        <span className="text-gray-800">{(categorySkills as Skill[]).map(s => s.name).join(', ')}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </ResumeContainer>
    );
  }

  // --- DEFAULT / CREATIVE TEMPLATE ---
  return (
      <ResumeContainer id={id}>
        <div className="h-4 bg-purple-600 w-full"></div>
        <div className="p-10">
            <header className="flex justify-between items-start mb-12">
                <div>
                    <h1 className="text-5xl font-bold text-purple-900 mb-2">{personalInfo.fullName}</h1>
                    <p className="text-xl text-purple-600 font-medium">{experience[0]?.role || "Professional"}</p>
                </div>
                <div className="text-right text-sm text-gray-500 space-y-1">
                    {personalInfo.email && <div className="block">{personalInfo.email}</div>}
                    {personalInfo.phone && <div className="block">{personalInfo.phone}</div>}
                    {personalInfo.location && <div className="block">{personalInfo.location}</div>}
                </div>
            </header>

            <div className="grid grid-cols-12 gap-8">
                <div className="col-span-8 space-y-8">
                    {personalInfo.summary && (
                        <section>
                            <h3 className="text-purple-800 font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                                <span className="w-8 h-1 bg-purple-600 block"></span> About Me
                            </h3>
                            <p className="text-slate-700 leading-relaxed">{personalInfo.summary}</p>
                        </section>
                    )}

                    {experience.length > 0 && (
                        <section>
                            <h3 className="text-purple-800 font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
                                <span className="w-8 h-1 bg-purple-600 block"></span> Experience
                            </h3>
                            <div className="space-y-8 border-l-2 border-purple-100 pl-6 ml-2">
                                {experience.map((exp, i) => (
                                    <div key={i} className="relative">
                                        <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-purple-600 border-4 border-white"></div>
                                        <div className="flex justify-between items-center mb-1">
                                            <h4 className="font-bold text-lg text-slate-800">{exp.role}</h4>
                                            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded">{exp.startDate} — {exp.current ? 'Now' : exp.endDate}</span>
                                        </div>
                                        <div className="text-purple-700 font-medium mb-2">{exp.company}</div>
                                        <p className="text-slate-600 text-sm">{exp.description}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                <div className="col-span-4 space-y-8">
                    {Object.keys(groupedSkills).length > 0 && (
                         <section className="bg-slate-50 p-6 rounded-xl">
                            <h3 className="text-purple-800 font-bold uppercase tracking-wider mb-4">Skills</h3>
                            <div className="space-y-6">
                                {Object.entries(groupedSkills).map(([category, categorySkills]) => (
                                    <div key={category}>
                                        <h4 className="text-xs font-bold text-purple-600 uppercase mb-2">{category}</h4>
                                        <div className="space-y-3">
                                            {(categorySkills as Skill[]).map((skill, i) => (
                                                <div key={i}>
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="font-medium text-slate-700">{skill.name}</span>
                                                        <span className="text-slate-400">{skill.level}</span>
                                                    </div>
                                                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-purple-500 rounded-full" 
                                                            style={{ width: skill.level === 'Expert' ? '100%' : skill.level === 'Advanced' ? '75%' : skill.level === 'Intermediate' ? '50%' : '25%' }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                         </section>
                    )}

                    {education.length > 0 && (
                        <section>
                             <h3 className="text-purple-800 font-bold uppercase tracking-wider mb-4">Education</h3>
                             <div className="space-y-4">
                                {education.map((edu, i) => (
                                    <div key={i} className="bg-white border border-purple-100 p-4 rounded-lg shadow-sm">
                                        <div className="font-bold text-slate-800">{edu.school}</div>
                                        <div className="text-purple-600 text-sm">{edu.degree}</div>
                                        <div className="text-slate-400 text-xs mt-1">{edu.startDate} - {edu.endDate}</div>
                                    </div>
                                ))}
                             </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
      </ResumeContainer>
  );
};

export default TemplateRenderer;