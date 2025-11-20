import React, { useState, useRef, useMemo } from 'react';
import { analyzePdf, fileToBase64 } from './services/geminiService';
import { AnalysisState, OfficialAct } from './types';
import Header from './components/Header';
import ResultSection from './components/ResultSection';

const App: React.FC = () => {
  const [state, setState] = useState<AnalysisState>({
    status: 'IDLE',
    data: null,
    error: null,
  });
  const [fileName, setFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setState({ ...state, status: 'ERROR', error: 'Por favor, envie apenas arquivos PDF.' });
      return;
    }

    // Limite aumentado para lidar com DOs maiores, mas cuidado com timeout do browser
    if (file.size > 30 * 1024 * 1024) {
       setState({ ...state, status: 'ERROR', error: 'O arquivo é muito grande. O limite é 30MB.' });
       return;
    }

    setFileName(file.name);
    setState({ status: 'ANALYZING', data: null, error: null });

    try {
      const base64 = await fileToBase64(file);
      const result = await analyzePdf(base64);
      setState({ status: 'SUCCESS', data: result, error: null });
    } catch (err: any) {
      console.error(err);
      let errorMessage = "Ocorreu um erro ao processar o PDF.";
      
      if (err.message?.includes("API_KEY")) {
        errorMessage = "Erro de configuração: API Key não encontrada.";
      } else if (err.message?.includes("JSON")) {
        errorMessage = "O arquivo é muito complexo ou extenso, e a resposta foi interrompida. Tente cortar o PDF apenas nas páginas de interesse.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setState({ status: 'ERROR', data: null, error: errorMessage });
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Lógica de Agrupamento Inteligente
  const groupedActs = useMemo(() => {
    if (!state.data?.acts) return [];

    const groups: Record<string, OfficialAct[]> = {};
    
    state.data.acts.forEach(act => {
      let sec = act.secretariat ? act.secretariat.trim() : "Outros Órgãos";
      const roleLower = (act.role || "").toLowerCase();
      const descLower = (act.description || "").toLowerCase();

      // REGRA ESPECÍFICA: Agente de Contratação e Equipe de Apoio = SAD
      // Verificamos tanto no cargo quanto na descrição para garantir
      if (roleLower.includes('equipe de apoio') || 
          roleLower.includes('agente de contratação') || 
          roleLower.includes('agente de contratacao') ||
          descLower.includes('equipe de apoio') ||
          descLower.includes('agente de contratação')) {
        sec = 'SAD';
      }
      
      // Normalizações extras de segurança caso a IA falhe levemente ou para outras variações
      if (sec.toLowerCase().includes('administração') || sec.toUpperCase() === 'SECRETARIA DE ADMINISTRAÇÃO') {
        sec = 'SAD';
      }
      if (sec.toLowerCase().includes('governadora') || sec.toLowerCase().includes('governo')) {
        sec = 'Atos da Governadora';
      }
      if (sec === 'Nome não especificado' || sec === '') {
        sec = 'Outros Órgãos';
      }

      if (!groups[sec]) {
        groups[sec] = [];
      }
      groups[sec].push(act);
    });

    const groupArray = Object.entries(groups).map(([name, acts]) => ({
      name,
      acts,
      // Prioridade: SAD (1), Governadora (2), Resto (3)
      priority: name === 'SAD' ? 1 : 
                name === 'Atos da Governadora' ? 2 : 3
    }));

    // Ordenar
    groupArray.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.name.localeCompare(b.name);
    });

    return groupArray;
  }, [state.data]);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      <Header />

      <main className="flex-grow container mx-auto px-4 max-w-5xl pb-20">
        
        {/* Input Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-10 text-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf"
            className="hidden"
          />
          
          {state.status === 'IDLE' || state.status === 'ERROR' ? (
            <div 
              onClick={triggerFileInput}
              className="border-2 border-dashed border-gray-300 rounded-xl p-12 cursor-pointer hover:bg-brand-50 hover:border-brand-300 transition-colors duration-300 group"
            >
              <div className="w-16 h-16 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Clique para enviar o Diário Oficial (PDF)</h2>
              <p className="text-gray-500">Foco em SAD e Atos da Governadora</p>
              {state.error && (
                <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm max-w-lg mx-auto">
                  ⚠️ {state.error}
                </div>
              )}
            </div>
          ) : null}

          {state.status === 'ANALYZING' && (
            <div className="py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-6"></div>
              <h2 className="text-xl font-semibold text-gray-800 animate-pulse">Processando Diário Oficial...</h2>
              <p className="text-gray-500 mt-2">Isso pode levar até 2 minutos dependendo do tamanho do arquivo.</p>
              <p className="text-sm text-brand-600 font-medium mt-4 bg-brand-50 inline-block px-3 py-1 rounded-full">
                Arquivo: {fileName}
              </p>
            </div>
          )}

          {state.status === 'SUCCESS' && (
             <div className="flex justify-between items-center bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                   </div>
                   <div className="text-left">
                     <p className="font-semibold text-green-800">Extração concluída!</p>
                     <p className="text-xs text-green-600">{fileName}</p>
                   </div>
                </div>
                <button 
                  onClick={() => setState({ status: 'IDLE', data: null, error: null })}
                  className="px-4 py-2 bg-white text-gray-600 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Novo Arquivo
                </button>
             </div>
          )}
        </div>

        {/* Results Section */}
        {state.status === 'SUCCESS' && state.data && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Summary Card */}
            {state.data.summary && (
              <div className="bg-slate-800 text-white p-6 rounded-xl shadow-lg mb-8 border border-slate-700">
                <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-yellow-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 2.625a2.625 2.625 0 0 1-1.012 5.25H12m3.75-5.25a2.625 2.625 0 0 1-1.012-5.25H12m-3.75 5.25a2.625 2.625 0 0 0 1.012 5.25H12m-3.75-5.25a2.625 2.625 0 0 0 1.012-5.25H12" />
                  </svg>
                  Destaques do Documento
                </h3>
                <p className="text-slate-200 leading-relaxed">
                  {state.data.summary}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Atos por Secretaria</h2>
              <span className="bg-brand-100 text-brand-800 text-xs font-bold px-3 py-1 rounded-full">
                {state.data.acts.length} registros encontrados
              </span>
            </div>

            {/* Lista de Secretarias (Acordeões) */}
            <div className="space-y-4">
              {groupedActs.map((group) => (
                <ResultSection 
                  key={group.name}
                  secretariatName={group.name}
                  acts={group.acts}
                  isPriority={group.priority <= 2} // Expande automaticamente SAD e Governadora
                />
              ))}
            </div>

            {groupedActs.length === 0 && (
              <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500 font-medium">Nenhum ato de pessoal relevante encontrado neste documento.</p>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
};

export default App;