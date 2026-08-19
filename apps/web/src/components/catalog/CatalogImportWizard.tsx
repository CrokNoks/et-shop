"use client";

import React, { useState, useRef } from "react";
import Papa from "papaparse";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
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
import {
  ArrowUpTrayIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";

interface CatalogImportWizardProps {
  onImported: () => void;
  storeId: string;
}

type Mapping = {
  name: string;
  barcode: string;
  unit: string;
  category_name: string;
};

export const CatalogImportWizard: React.FC<CatalogImportWizardProps> = ({
  onImported,
  storeId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"upload" | "mapping" | "preview">("upload");
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Mapping>({
    name: "",
    barcode: "",
    unit: "",
    category_name: "",
  });
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep("upload");
    setCsvData([]);
    setHeaders([]);
    setMapping({ name: "", barcode: "", unit: "", category_name: "" });
    setIsImporting(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: Papa.ParseResult<Record<string, string>>) => {
        if (results.meta.fields) {
          setHeaders(results.meta.fields);
          setCsvData(results.data as Record<string, string>[]);

          // Auto-mapping tentative
          const autoMapping = { ...mapping };
          results.meta.fields.forEach((field) => {
            const lower = field.toLowerCase();
            if (
              lower.includes("nom") ||
              lower.includes("name") ||
              lower.includes("produit")
            )
              autoMapping.name = field;
            if (
              lower.includes("ean") ||
              lower.includes("code") ||
              lower.includes("barcode")
            )
              autoMapping.barcode = field;
            if (lower.includes("unité") || lower.includes("unit"))
              autoMapping.unit = field;
            if (
              lower.includes("rayon") ||
              lower.includes("category") ||
              lower.includes("catégorie")
            )
              autoMapping.category_name = field;
          });
          setMapping(autoMapping);
          setStep("mapping");
        }
      },
    });
    e.target.value = "";
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const items = csvData
        .map((row) => ({
          name: row[mapping.name],
          barcode:
            mapping.barcode && mapping.barcode !== "none_selection"
              ? row[mapping.barcode]
              : undefined,
          unit:
            mapping.unit && mapping.unit !== "none_selection"
              ? row[mapping.unit]
              : undefined,
          category_name:
            mapping.category_name && mapping.category_name !== "none_selection"
              ? row[mapping.category_name]
              : undefined,
        }))
        .filter((item) => item.name);

      await fetchApi("/shopping-lists/catalog/import", {
        method: "POST",
        body: JSON.stringify({
          items,
          store_id: storeId,
        }),
      });

      onImported();
      setIsOpen(false);
      reset();
      toast.success("Importation terminée avec succès !");
    } catch {
      toast.error("Erreur lors de l'importation.");
    } finally {
      setIsImporting(false);
    }
  };

  const previewData = csvData.slice(0, 5).map((row) => ({
    name: row[mapping.name],
    barcode:
      mapping.barcode && mapping.barcode !== "none_selection"
        ? row[mapping.barcode]
        : "-",
    unit:
      mapping.unit && mapping.unit !== "none_selection"
        ? row[mapping.unit]
        : "-",
    category:
      mapping.category_name && mapping.category_name !== "none_selection"
        ? row[mapping.category_name]
        : "-",
  }));

  const STEP_INDEX = { upload: 0, mapping: 1, preview: 2 } as const;

  const selectFieldClass =
    "font-mono text-[13px] border-[var(--es-hairline)] h-[42px] rounded-[10px]";

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex h-9 items-center gap-1.5 rounded-[10px] border border-[var(--es-hairline)] px-3 text-[13px] font-semibold text-[var(--es-secondary)]"
      >
        <ArrowUpTrayIcon className="h-4 w-4" />
        Importer CSV
      </button>

      <Sheet
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) reset();
        }}
      >
        <SheetContent
          side="bottom"
          className="mx-auto flex w-full max-w-lg flex-col rounded-t-[18px] bg-[var(--es-surface)] p-6 pt-3 text-[var(--es-ink)]"
        >
          <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-[var(--es-hairline)]" />

          {/* Jauge 3 segments */}
          <div className="mb-4 flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-[3px] flex-1 rounded-full ${
                  i <= STEP_INDEX[step]
                    ? "bg-[#FF6B35]"
                    : "bg-[var(--es-hairline)]"
                }`}
              />
            ))}
          </div>

          <SheetHeader className="p-0 text-left">
            <SheetTitle className="text-[20px] font-semibold">
              Importation de produits
            </SheetTitle>
            <SheetDescription className="text-[13px] text-[var(--es-secondary)]">
              {step === "upload" &&
                "Sélectionnez un fichier CSV pour commencer."}
              {step === "mapping" &&
                "Faites correspondre les colonnes de votre fichier aux champs de l'application."}
              {step === "preview" &&
                "Vérifiez les données avant l'importation finale."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {step === "upload" && (
              <div className="flex flex-col items-center justify-center gap-3 rounded-[14px] border-2 border-dashed border-[var(--es-hairline)] py-10">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv"
                  className="hidden"
                />
                <div className="rounded-full bg-[var(--es-field)] p-3">
                  <ArrowUpTrayIcon className="h-8 w-8 text-[var(--es-disabled)]" />
                </div>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="h-[46px] rounded-[14px] bg-[#1A365D] hover:bg-[#1A365D]/90"
                >
                  Choisir un fichier CSV
                </Button>
                <p className="text-[11.5px] text-[var(--es-tertiary)]">
                  Le fichier doit contenir au moins une colonne pour le nom.
                </p>
              </div>
            )}

            {step === "mapping" && (
              <div className="flex flex-col gap-3">
                <div className="flex h-[50px] items-center justify-between gap-3">
                  <label className="text-[13.5px] font-medium">
                    Nom (obligatoire)
                  </label>
                  <Select
                    value={mapping.name}
                    onValueChange={(v) =>
                      setMapping({ ...mapping, name: v ?? "" })
                    }
                  >
                    <SelectTrigger
                      className={`${selectFieldClass} ${!mapping.name ? "border-dashed" : ""}`}
                    >
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex h-[50px] items-center justify-between gap-3">
                  <label className="text-[13.5px] font-medium">
                    Code-barres
                  </label>
                  <Select
                    value={mapping.barcode}
                    onValueChange={(v) =>
                      setMapping({ ...mapping, barcode: v ?? "" })
                    }
                  >
                    <SelectTrigger
                      className={`${selectFieldClass} ${!mapping.barcode ? "border-dashed" : ""}`}
                    >
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none_selection">Aucun</SelectItem>
                      {headers.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex h-[50px] items-center justify-between gap-3">
                  <label className="text-[13.5px] font-medium">Unité</label>
                  <Select
                    value={mapping.unit}
                    onValueChange={(v) =>
                      setMapping({ ...mapping, unit: v ?? "" })
                    }
                  >
                    <SelectTrigger
                      className={`${selectFieldClass} ${!mapping.unit ? "border-dashed" : ""}`}
                    >
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none_selection">Aucun</SelectItem>
                      {headers.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex h-[50px] items-center justify-between gap-3">
                  <label className="text-[13.5px] font-medium">
                    Rayon (nom)
                  </label>
                  <Select
                    value={mapping.category_name}
                    onValueChange={(v) =>
                      setMapping({ ...mapping, category_name: v ?? "" })
                    }
                  >
                    <SelectTrigger
                      className={`${selectFieldClass} ${!mapping.category_name ? "border-dashed" : ""}`}
                    >
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none_selection">Aucun</SelectItem>
                      {headers.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {!mapping.name && (
                  <div className="flex items-start gap-2 rounded-[10px] border border-[rgba(255,107,53,0.35)] bg-[rgba(255,107,53,0.06)] p-3">
                    <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#8a4321]" />
                    <p className="text-[12px] leading-relaxed text-[#8a4321]">
                      La colonne « Nom » est obligatoire pour importer les
                      produits.
                    </p>
                  </div>
                )}
              </div>
            )}

            {step === "preview" && (
              <div className="flex flex-col gap-4">
                <div className="overflow-x-auto rounded-[14px] border border-[var(--es-hairline)]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[10.5px] font-semibold uppercase tracking-wide text-[var(--es-secondary)]">
                          Nom
                        </TableHead>
                        <TableHead className="text-[10.5px] font-semibold uppercase tracking-wide text-[var(--es-secondary)]">
                          Code-barres
                        </TableHead>
                        <TableHead className="text-[10.5px] font-semibold uppercase tracking-wide text-[var(--es-secondary)]">
                          Unité
                        </TableHead>
                        <TableHead className="text-[10.5px] font-semibold uppercase tracking-wide text-[var(--es-secondary)]">
                          Rayon
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-[13px] font-medium">
                            {row.name}
                          </TableCell>
                          <TableCell className="font-mono text-[12px] text-[var(--es-tertiary)]">
                            {row.barcode}
                          </TableCell>
                          <TableCell className="text-[13px]">
                            {row.unit}
                          </TableCell>
                          <TableCell className="text-[13px] font-semibold text-[var(--es-accent-text)]">
                            {row.category}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex items-start gap-2 rounded-[10px] border border-[rgba(255,107,53,0.35)] bg-[rgba(255,107,53,0.06)] p-3">
                  <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#8a4321]" />
                  <p className="text-[12px] leading-relaxed text-[#8a4321]">
                    L&apos;importation va ajouter{" "}
                    <strong>{csvData.length}</strong> produits au catalogue. Si
                    un rayon n&apos;est pas reconnu par son nom, le produit sera
                    importé sans rayon.
                  </p>
                </div>
              </div>
            )}
          </div>

          {step === "mapping" && (
            <SheetFooter className="flex-row gap-3 p-0">
              <Button
                variant="outline"
                onClick={reset}
                className="h-[46px] flex-1 rounded-[14px]"
              >
                Retour
              </Button>
              <Button
                disabled={!mapping.name}
                onClick={() => setStep("preview")}
                className="h-[46px] flex-[2] rounded-[14px] bg-[#FF6B35] hover:bg-[#e55a2b]"
              >
                Prévisualiser
              </Button>
            </SheetFooter>
          )}
          {step === "preview" && (
            <SheetFooter className="flex-row gap-3 p-0">
              <Button
                variant="outline"
                onClick={() => setStep("mapping")}
                className="h-[46px] flex-1 rounded-[14px]"
              >
                Retour
              </Button>
              <Button
                disabled={isImporting}
                onClick={handleImport}
                className="h-[46px] flex-[2] rounded-[14px] bg-[#FF6B35] hover:bg-[#e55a2b]"
              >
                {isImporting
                  ? "Importation..."
                  : `Confirmer l'import (${csvData.length})`}
              </Button>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};
