import React, { useState } from 'react';
import { OfficialAct, RecordType } from '../types';

interface ResultSectionProps {
  secretariatName: string;
  acts: OfficialAct[];
  isPriority: boolean;
}

const ResultSection: React.FC<ResultSectionProps> = ({ secretariatName, acts, isPriority }) => {
  const [isOpen, setIsOpen] = useState(isPriority); 

  if (acts.length === 0) return null;

  const containerClass = isPriority 
    ? 'border-blue-200 shadow-md bg-white' 
    : 'border-gray-200 shadow-sm bg-white opacity-95';
    
  const headerBg = isPriority 
    ? 'bg-gradient-to-r from-blue-50 to-white text-blue-900' 
    : 'bg-white text-gray-700 hover:bg-gray-50';

  return (
    <div className={`border rounded-xl overflow-hidden transition-all duration-300 ${containerClass}`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-5 text-left border-b transition-colors ${headerBg} ${isOpen ? 'border-b-gray-100' : 'border-b-transparent'}`}
      >
        <div className="flex items-center gap-4">
          {isPriority ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 shadow-sm shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
                <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 0 1 3.5 2h9a1.5 1.5 0 0 1 1.5 1.5v13a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 16.5v-13ZM3.5 3a.5.5 0 0 0-.5.5v13a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-13a.5.5 0 0 0-.5-.5h-9Z" clipRule="evenodd" />
                <path d="M6.5 7a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5ZM6.5 10a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5ZM6 13.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5Z" />
              </svg>
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 shrink-0">
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                 <path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 0 0 2 4.25v11.5A2.25 2.25 0 0 0 4.25 18h11.5A2.25 2.25 0 0 0 18 15.75V4.25A2.25 2.25 0 0 0 15.75 2H4.25Zm4.03 6.28a.75.75 0 0 0-1.06-1.06L4.97 9.47a.75.75 0 0 0 0 1.06l2.25 2.25a.75.75 0 0 0 1.06-1.06L6.56 10l1.72-1.72Z" clipRule="evenodd" />
               </svg>
            </div>
          )}
          
          <div>
            <h3 className="text-lg font-bold tracking-tight">
              {secretariatName}
            </h3>
            {!isOpen && (
              <p className="text-xs text-gray-500 mt-0.5 font-medium">
                {acts.length} atos registrados
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
            {/* Badge Count sempre visível */}
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${isPriority ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                 {acts.length}
            </span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={2} 
              stroke="currentColor" 
              className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
        </div>
      </button>

      {isOpen && (
        <div className="bg-gray-50 p-4 grid gap-4 md:grid-cols-1 lg:grid-cols-2 animate-in slide-in-from-top-2 fade-in duration-200">
          {acts.map((act, index) => (
            <div key={index} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex flex-col hover:shadow-md transition-shadow duration-200">
              <div className="flex justify-between items-start mb-3 gap-3">
                <div className="flex-1">
                  <span className="font-bold text-gray-900 text-base block mb-1">
                    {act.personName && act.personName !== "Nome não especificado" ? act.personName : "Nome não identificado"}
                  </span>
                  {act.role && (
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                      {act.role}
                    </span>
                  )}
                </div>
                
                <div className="shrink-0">
                  {act.type === RecordType.EXONERATION && (
                    <span className="px-2 py-1 rounded-md bg-red-50 text-red-700 text-[10px] font-bold uppercase border border-red-100">
                      Exoneração
                    </span>
                  )}
                  {act.type === RecordType.HIRING && (
                    <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase border border-emerald-100">
                      Nomeação
                    </span>
                  )}
                  {act.type === RecordType.GOVERNOR_ACT && (
                     <span className="px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase border border-indigo-100">
                       Decreto
                     </span>
                  )}
                   {act.type === RecordType.OTHER && (
                     <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-[10px] font-bold uppercase border border-gray-200">
                       Outro
                     </span>
                  )}
                </div>
              </div>
              
              <p className="text-gray-600 text-sm leading-relaxed bg-slate-50 p-3 rounded border border-slate-100 mt-auto">
                {act.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResultSection;