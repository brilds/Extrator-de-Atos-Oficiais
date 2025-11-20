import { GoogleGenAI, Type, Schema, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { ExtractionResponse, RecordType } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Definição estrita do Schema para forçar a IA a responder corretamente
const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "Um resumo executivo de 2 linhas sobre os principais atos encontrados no documento.",
    },
    acts: {
      type: Type.ARRAY,
      description: "Lista de atos oficiais de pessoal identificados.",
      items: {
        type: Type.OBJECT,
        properties: {
          secretariat: {
            type: Type.STRING,
            description: "Nome da secretaria. Se for 'Agente de Contratação' ou 'Equipe de Apoio', use 'SAD'. Se 'Secretaria de Administração', use 'SAD'.",
          },
          personName: {
            type: Type.STRING,
            description: "Nome do servidor em CAIXA ALTA. Se não houver nome, use 'Nome não identificado'.",
          },
          type: {
            type: Type.STRING,
            enum: [RecordType.EXONERATION, RecordType.HIRING, RecordType.GOVERNOR_ACT, RecordType.OTHER],
            description: "Tipo do ato.",
          },
          role: {
            type: Type.STRING,
            description: "Cargo ou função gratificada.",
          },
          description: {
            type: Type.STRING,
            description: "Descrição resumida do ato.",
          },
        },
        required: ["secretariat", "personName", "type", "description"],
      },
    },
  },
  required: ["acts", "summary"],
};

export const analyzePdf = async (base64Pdf: string): Promise<ExtractionResponse> => {
  try {
    // Usando Gemini 2.5 Flash que tem excelente suporte a JSON Schema e Multimodal
    const model = "gemini-2.5-flash";
    
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: base64Pdf
            }
          },
          {
            text: `Analise este Diário Oficial. Extraia atos de pessoal (Nomeações, Exonerações, Designações).
            
            ATENÇÃO ÀS REGRAS DE NEGÓCIO:
            1. Priorize atos da "Secretaria de Administração" (SAD) e "Atos da Governadora".
            2. Se o cargo for "Agente de Contratação" ou "Equipe de Apoio", a secretaria DEVE ser "SAD".
            3. Ignore licitações, avisos de férias e erratas simples.
            4. Extraia o nome completo das pessoas (geralmente em UPPERCASE).
            `
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1, // Baixa criatividade para ser fiel aos dados
        systemInstruction: "Você é um assistente especializado em Transparência Pública e Auditoria Governamental. Sua tarefa é extrair dados públicos de Diários Oficiais para facilitar o controle social. Os dados são públicos e não sensíveis.",
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ],
      }
    });

    if (!response.text) {
       console.warn("Resposta vazia da API.", response);
       throw new Error("A IA retornou uma resposta vazia. O documento pode conter apenas imagens não legíveis ou o modelo bloqueou o conteúdo.");
    }

    // Parse direto pois o responseMimeType garante JSON
    try {
        const data = JSON.parse(response.text) as ExtractionResponse;
        
        if (!data.acts) data.acts = [];
        
        // Fallback para resumo se vier vazio
        if (!data.summary) {
            data.summary = `Análise concluída. ${data.acts.length} atos processados.`;
        }

        return data;
    } catch (e) {
        console.error("Erro ao fazer parse do JSON estruturado:", e);
        console.log("Texto recebido:", response.text);
        throw new Error("Erro ao processar a estrutura de dados retornada pela IA.");
    }

  } catch (error) {
    console.error("Erro na análise Gemini:", error);
    throw error;
  }
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = error => reject(error);
  });
};
