export enum RecordType {
  EXONERATION = 'EXONERATION',
  HIRING = 'HIRING',
  GOVERNOR_ACT = 'GOVERNOR_ACT',
  OTHER = 'OTHER'
}

export interface OfficialAct {
  type: RecordType;
  secretariat: string; // Nome da secretaria (SAD, Saúde, Esportes, etc.)
  personName: string; // Nome do servidor
  role?: string; // O cargo
  description: string; // Resumo do ato
}

export interface ExtractionResponse {
  acts: OfficialAct[];
  summary: string;
}

export interface AnalysisState {
  status: 'IDLE' | 'ANALYZING' | 'SUCCESS' | 'ERROR';
  data: ExtractionResponse | null;
  error: string | null;
}