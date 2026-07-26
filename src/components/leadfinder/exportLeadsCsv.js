// Shared CSV exporter for Lead Finder leads (found + shortlisted).
export function exportLeadsCsv(leads, filenamePrefix = "leads") {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const header = ["Business", "Description", "Emails", "Phone", "Website", "Instagram", "Facebook", "Niche", "Area", "Status"];
  const rows = (leads || []).map((l) => [
    l.businessName,
    l.description,
    (l.emails || []).join("; "),
    l.phone,
    l.website,
    l.instagram,
    l.facebook,
    l.niche,
    l.area,
    l.contactStatus || "new",
  ].map(esc).join(","));
  const csv = [header.map(esc).join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}