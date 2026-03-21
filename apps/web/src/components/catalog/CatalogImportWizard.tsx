"use client";

import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpTrayIcon, CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { fetchApi } from '@/lib/api';

interface CatalogImportWizardProps {
  onSuccess: () => void;
}

type Mapping = {
  name: string;
  barcode: string;
  unit: string;
  category_name: string;
};

export const CatalogImportWizard: React.FC<CatalogImportWizardProps> = ({ onSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [csvData, setCsvData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Mapping>({
    name: '',
    barcode: '',
    unit: '',
    category_name: '',
  });
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep('upload');
    setCsvData([]);
    setHeaders([]);
    setMapping({ name: '', barcode: '', unit: '', category_name: '' });
    setIsImporting(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.meta.fields) {
          setHeaders(results.meta.fields);
          setCsvData(results.data);
          
          // Auto-mapping tentative
          const autoMapping = { ...mapping };
          results.meta.fields.forEach(field => {
            const lower = field.toLowerCase();
            if (lower.includes('nom') || lower.includes('name') || lower.includes('produit')) autoMapping.name = field;
            if (lower.includes('ean') || lower.includes('code') || lower.includes('barcode')) autoMapping.barcode = field;
            if (lower.includes('unité') || lower.includes('unit')) autoMapping.unit = field;
            if (lower.includes('rayon') || lower.includes('category') || lower.includes('catégorie')) autoMapping.category_name = field;
          });
          setMapping(autoMapping);
          setStep('mapping');
        }
      },
    });
    e.target.value = '';
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const items = csvData.map(row => ({
        name: row[mapping.name],
        barcode: (mapping.barcode && mapping.barcode !== 'none_selection') ? row[mapping.barcode] : undefined,
        unit: (mapping.unit && mapping.unit !== 'none_selection') ? row[mapping.unit] : undefined,
        category_name: (mapping.category_name && mapping.category_name !== 'none_selection') ? row[mapping.category_name] : undefined,
      })).filter(item => item.name);

      await fetchApi('/shopping-lists/catalog/import', {
        method: 'POST',
        body: JSON.stringify({ items }),
      });

      onSuccess();
      setIsOpen(false);
      reset();
    } catch (error) {
      alert("Erreur lors de l'importation.");
    } finally {
      setIsImporting(false);
    }
  };

  const previewData = csvData.slice(0, 5).map(row => ({
    name: row[mapping.name],
    barcode: (mapping.barcode && mapping.barcode !== 'none_selection') ? row[mapping.barcode] : '-',
    unit: (mapping.unit && mapping.unit !== 'none_selection') ? row[mapping.unit] : '-',
    category: (mapping.category_name && mapping.category_name !== 'none_selection') ? row[mapping.category_name] : '-',
  }));

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="border-gray-200 text-gray-500 font-bold rounded-2xl px-6 py-6 shadow-sm hover:bg-gray-50 transition-all"
      >
        <ArrowUpTrayIcon className="w-5 h-5 mr-2" strokeWidth={2} />
        Importer CSV
      </Button>

      <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) reset(); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col text-[#1A365D]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Importation de produits</DialogTitle>
            <DialogDescription>
              {step === 'upload' && "Sélectionnez un fichier CSV pour commencer."}
              {step === 'mapping' && "Faites correspondre les colonnes de votre fichier aux champs de l'application."}
              {step === 'preview' && "Vérifiez les données avant l'importation finale."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2 py-4">
            {step === 'upload' && (
              <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-3xl gap-4">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
                <div className="p-4 bg-gray-50 rounded-full">
                  <ArrowUpTrayIcon className="w-12 h-12 text-gray-300" />
                </div>
                <Button onClick={() => fileInputRef.current?.click()} className="bg-[#1A365D] hover:bg-[#2d3748]">
                  Choisir un fichier CSV
                </Button>
                <p className="text-xs text-gray-400">Le fichier doit contenir au moins une colonne pour le nom.</p>
              </div>
            )}

            {step === 'mapping' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase text-gray-400 tracking-widest">Champ : Nom (Obligatoire)</label>
                      <Select value={mapping.name} onValueChange={(v) => setMapping({ ...mapping, name: v })}>
                        <SelectTrigger className="font-bold border-gray-200">
                          <SelectValue placeholder="Choisir la colonne..." />
                        </SelectTrigger>
                        <SelectContent>
                          {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase text-gray-400 tracking-widest">Champ : Code-barres</label>
                      <Select value={mapping.barcode} onValueChange={(v) => setMapping({ ...mapping, barcode: v })}>
                        <SelectTrigger className="font-bold border-gray-200">
                          <SelectValue placeholder="Aucun" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none_selection">Aucun</SelectItem>
                          {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase text-gray-400 tracking-widest">Champ : Unité</label>
                      <Select value={mapping.unit} onValueChange={(v) => setMapping({ ...mapping, unit: v })}>
                        <SelectTrigger className="font-bold border-gray-200">
                          <SelectValue placeholder="Aucun" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none_selection">Aucun</SelectItem>
                          {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase text-gray-400 tracking-widest">Champ : Rayon (Nom)</label>
                      <Select value={mapping.category_name} onValueChange={(v) => setMapping({ ...mapping, category_name: v })}>
                        <SelectTrigger className="font-bold border-gray-200">
                          <SelectValue placeholder="Aucun" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none_selection">Aucun</SelectItem>
                          {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 'preview' && (
              <div className="space-y-6">
                <div className="border border-gray-100 rounded-2xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="font-black text-xs uppercase">Nom</TableHead>
                        <TableHead className="font-black text-xs uppercase">Code-barres</TableHead>
                        <TableHead className="font-black text-xs uppercase">Unité</TableHead>
                        <TableHead className="font-black text-xs uppercase">Rayon</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-bold">{row.name}</TableCell>
                          <TableCell className="font-mono text-xs">{row.barcode}</TableCell>
                          <TableCell>{row.unit}</TableCell>
                          <TableCell className="text-[#FF6B35] font-bold">{row.category}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl flex items-start gap-3">
                  <ExclamationTriangleIcon className="w-5 h-5 text-blue-500 mt-0.5" />
                  <p className="text-xs text-blue-700 leading-relaxed">
                    L'importation va ajouter <strong>{csvData.length}</strong> produits au catalogue. 
                    Si un rayon n'est pas reconnu par son nom, le produit sera importé sans rayon.
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t border-gray-50">
            {step === 'mapping' && (
              <>
                <Button variant="ghost" onClick={reset}>Annuler</Button>
                <Button 
                  disabled={!mapping.name} 
                  onClick={() => setStep('preview')}
                  className="bg-[#FF6B35] hover:bg-[#e55a2b]"
                >
                  Suivant
                </Button>
              </>
            )}
            {step === 'preview' && (
              <>
                <Button variant="ghost" onClick={() => setStep('mapping')}>Retour</Button>
                <Button 
                  disabled={isImporting} 
                  onClick={handleImport}
                  className="bg-[#FF6B35] hover:bg-[#e55a2b]"
                >
                  {isImporting ? "Importation..." : `Confirmer l'import (${csvData.length})`}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
