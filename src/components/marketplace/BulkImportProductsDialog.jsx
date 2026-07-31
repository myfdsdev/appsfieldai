import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UploadCloud, Download, FileSpreadsheet, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

// Columns the importer understands. Only "softwareName" is required — everything
// else is optional and left to its default when the cell is empty.
const COLUMNS = [
  "softwareName",
  "shortDescription",
  "fullDescription",
  "category",
  "price",
  "discountPrice",
  "pricingType",
  "dealType",
  "sharePrice",
  "totalShares",
  "monthlyRevenue",
  "growthRate",
  "features",
  "tags",
  "logo",
  "demoVideoUrl",
];

const SAMPLE_ROWS = [
  {
    softwareName: "TaskFlow CRM",
    shortDescription: "Simple CRM for small teams",
    fullDescription: "A lightweight CRM to track leads, deals and follow-ups.",
    category: "CRM",
    price: "199",
    discountPrice: "99",
    pricingType: "lifetime_deal",
    dealType: "single_purchase",
    sharePrice: "",
    totalShares: "",
    monthlyRevenue: "1200",
    growthRate: "8",
    features: "Lead tracking|Email reminders|Reports",
    tags: "crm|sales",
    logo: "",
    demoVideoUrl: "",
  },
  {
    softwareName: "InvoiceGen",
    shortDescription: "Automated invoicing tool",
    fullDescription: "",
    category: "Finance",
    price: "149",
    discountPrice: "",
    pricingType: "",
    dealType: "",
    sharePrice: "",
    totalShares: "",
    monthlyRevenue: "",
    growthRate: "",
    features: "PDF invoices|Recurring billing",
    tags: "",
    logo: "",
    demoVideoUrl: "",
  },
];

// Minimal CSV parser that supports quoted fields and commas inside quotes.
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field); field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some(v => v.trim() !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); if (row.some(v => v.trim() !== "")) rows.push(row); }
  return rows;
}

const csvEscape = (v) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const num = (v) => {
  const n = parseFloat(String(v).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : undefined;
};
const list = (v) => String(v || "").split("|").map(s => s.trim()).filter(Boolean);

export default function BulkImportProductsDialog({ open, onClose, marketplaceId }) {
  const queryClient = useQueryClient();
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState([]); // parsed records ready to create

  const downloadSample = () => {
    const header = COLUMNS.join(",");
    const lines = SAMPLE_ROWS.map(r => COLUMNS.map(c => csvEscape(r[c])).join(","));
    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "product-import-sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setFileName(file.name);
    const text = await file.text();
    const rows = parseCSV(text);
    if (rows.length < 2) {
      toast.error("The file has no product rows.");
      setPreview([]);
      return;
    }
    const headers = rows[0].map(h => h.trim());
    const records = [];
    for (let r = 1; r < rows.length; r++) {
      const get = (col) => {
        const idx = headers.indexOf(col);
        return idx === -1 ? "" : (rows[r][idx] ?? "").trim();
      };
      const name = get("softwareName");
      if (!name) continue;
      // Only include fields that were actually provided.
      const rec = { marketplaceId, softwareName: name, status: "active", dealStatus: "live" };
      const sd = get("shortDescription"); if (sd) rec.shortDescription = sd;
      const fd = get("fullDescription"); if (fd) rec.fullDescription = fd;
      const cat = get("category"); if (cat) rec.category = cat;
      const price = num(get("price")); if (price !== undefined) rec.price = price;
      const dp = num(get("discountPrice")); if (dp !== undefined) rec.discountPrice = dp;
      const pt = get("pricingType"); if (pt) rec.pricingType = pt;
      const dt = get("dealType"); if (dt) rec.dealType = dt;
      const sp = num(get("sharePrice")); if (sp !== undefined) rec.sharePrice = sp;
      const ts = num(get("totalShares")); if (ts !== undefined) rec.totalShares = ts;
      const mr = num(get("monthlyRevenue")); if (mr !== undefined) rec.monthlyRevenue = mr;
      const gr = num(get("growthRate")); if (gr !== undefined) rec.growthRate = gr;
      const feats = list(get("features")); if (feats.length) rec.features = feats;
      const tags = list(get("tags")); if (tags.length) rec.tags = tags;
      const logo = get("logo"); if (logo) rec.logo = logo;
      const dv = get("demoVideoUrl"); if (dv) rec.demoVideoUrl = dv;
      records.push(rec);
    }
    if (!records.length) {
      toast.error("No valid rows found. Each product needs a softwareName.");
      setPreview([]);
      return;
    }
    setPreview(records);
    toast.success(`${records.length} product${records.length === 1 ? "" : "s"} ready to import.`);
  };

  const handleImport = async () => {
    if (!preview.length) return;
    setImporting(true);
    try {
      await base44.entities.SaaSListing.bulkCreate(preview);
      queryClient.invalidateQueries({ queryKey: ["softwareListings", marketplaceId] });
      toast.success(`${preview.length} product${preview.length === 1 ? "" : "s"} imported.`);
      setPreview([]);
      setFileName("");
      onClose();
    } catch (err) {
      toast.error("Could not import products.");
    }
    setImporting(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-orange-400" /> Bulk Import Products
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload a CSV to add many products at once. Only <span className="font-medium text-foreground">Software Name</span> is
            required — leave any other column blank and it uses a default you can edit later.
          </p>

          <Button variant="outline" onClick={downloadSample} className="w-full rounded-xl border-orange-500/30 text-orange-400 hover:bg-orange-500/10">
            <Download className="w-4 h-4 mr-2" /> Download Sample File
          </Button>

          <label className="block cursor-pointer">
            <input type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
            <div className="rounded-xl border-2 border-dashed border-border/50 hover:border-orange-500/40 transition-colors p-6 text-center">
              <UploadCloud className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">{fileName || "Click to upload your CSV"}</p>
              <p className="text-xs text-muted-foreground mt-1">.csv file exported from Excel / Google Sheets</p>
            </div>
          </label>

          {preview.length > 0 && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
              <p className="text-xs font-medium text-emerald-500 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> {preview.length} product{preview.length === 1 ? "" : "s"} ready
              </p>
              <ul className="mt-2 max-h-32 overflow-y-auto text-xs text-muted-foreground space-y-0.5">
                {preview.slice(0, 20).map((p, i) => <li key={i} className="truncate">• {p.softwareName}</li>)}
                {preview.length > 20 && <li>…and {preview.length - 20} more</li>}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={handleImport} disabled={!preview.length || importing}
              className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 rounded-xl">
              {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-2" />}
              Import {preview.length || ""} Product{preview.length === 1 ? "" : "s"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}