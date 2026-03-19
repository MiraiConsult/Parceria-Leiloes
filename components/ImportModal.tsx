import React, { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { UploadCloud, File, X, Loader, Download, AlertTriangle } from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: Record<string, unknown>[]) => Promise<{ success: boolean; errors: string[] }>;
  generateTemplate: () => void;
  title: string;
  templateName: string;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport, generateTemplate, title, templateName }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const resetState = () => {
    setFile(null);
    setIsProcessing(false);
    setErrors([]);
    setIsDragging(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileSelect = (selectedFile: File | null) => {
    if (selectedFile && (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || selectedFile.name.endsWith('.xlsx'))) {
      setFile(selectedFile);
      setErrors([]);
    } else {
      setErrors(['Por favor, selecione um arquivo .xlsx válido.']);
    }
  };

  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      handleFileSelect(event.dataTransfer.files[0]);
    }
  }, []);

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };
  
  const handleImportClick = async () => {
    if (!file) {
      setErrors(['Nenhum arquivo selecionado.']);
      return;
    }

    setIsProcessing(true);
    setErrors([]);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { blankrows: false, defval: "", raw: false });

        const result = await onImport(jsonData);
        
        if (result.success && result.errors.length === 0) {
          // Message is handled in Transactions.tsx now to show partial success
          handleClose();
        } else {
          setErrors(result.errors);
        }
      } catch (err) {
        console.error("Erro ao processar o arquivo:", err);
        setErrors(['Ocorreu um erro ao ler o arquivo. Verifique se o formato está correto.']);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={handleClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/70 rounded-t-xl">
          <h3 className="font-bold text-lg text-gray-800">{title}</h3>
          <button onClick={handleClose} className="p-1.5 hover:bg-gray-200 rounded-full text-gray-500"><X size={20} /></button>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Step 1: Download Template */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Passo 1: Baixe o Modelo</h4>
            <p className="text-sm text-gray-500 mb-3">
              Use nosso modelo para garantir que seus dados estejam no formato correto e evitar erros na importação.
            </p>
            <button onClick={generateTemplate} className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors">
              <Download size={16} /> Baixar {templateName}
            </button>
          </div>

          {/* Step 2: Upload File */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Passo 2: Envie o Arquivo Preenchido</h4>
            <div 
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragging ? 'border-brand-600 bg-brand-50' : 'border-gray-300 bg-gray-50/70 hover:border-gray-400'}`}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <input type="file" id="file-upload" className="hidden" accept=".xlsx" onChange={(e) => handleFileSelect(e.target.files ? e.target.files[0] : null)} />
              {file ? (
                <div className="flex flex-col items-center gap-2 text-gray-700">
                  <File size={32} className="text-brand-700" />
                  <span className="font-medium">{file.name}</span>
                  <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-xs text-red-500 hover:underline">Trocar arquivo</button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-500">
                  <UploadCloud size={32} />
                  <p className="font-medium">Arraste e solte o arquivo aqui</p>
                  <p className="text-sm">ou <span className="text-brand-700 font-semibold">clique para selecionar</span></p>
                  <p className="text-xs mt-1">Apenas arquivos .xlsx</p>
                </div>
              )}
            </div>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Foram encontrados {errors.length} erro(s) na validação:</h3>
                        <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1 max-h-40 overflow-y-auto">
                            {errors.map((error, index) => <li key={index}>{error}</li>)}
                        </ul>
                    </div>
                </div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
          <button onClick={handleClose} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancelar</button>
          <button onClick={handleImportClick} disabled={isProcessing || !file} className="px-4 py-2 bg-brand-800 text-white rounded-lg text-sm font-medium hover:bg-brand-900 disabled:bg-brand-700 disabled:opacity-70 flex items-center gap-2 min-w-[120px] justify-center">
            {isProcessing ? <><Loader size={16} className="animate-spin" /> Processando...</> : 'Importar'}
          </button>
        </div>
      </div>
    </div>
  );
};