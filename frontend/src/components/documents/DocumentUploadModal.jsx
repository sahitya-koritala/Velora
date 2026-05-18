import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Plus, X } from "lucide-react";
import { apiClient } from "@/Api/apiClient";
import { useToast } from "@/components/ui/use-toast";

const TEXT_EXTENSIONS = [".txt", ".md", ".csv", ".json", ".html", ".xml"];

async function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result || "");
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsText(file);
  });
}

export default function DocumentUploadModal({ open, onOpenChange, onDocumentCreated }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    source: "",
    category: "general",
    access_level: "public",
    tags: [],
  });
  const [tagInput, setTagInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);

  const resetForm = () => {
    setFormData({ title: "", content: "", source: "", category: "general", access_level: "public", tags: [] });
    setFile(null);
    setTagInput("");
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput("");
    }
  };

  const removeTag = (tag) => {
    setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) });
  };

  const handleFileUpload = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);

    const baseTitle = f.name.replace(/\.[^/.]+$/, "");
    let fileContent = "";

    const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
    if (TEXT_EXTENSIONS.includes(ext) || f.type.startsWith("text/")) {
      try {
        fileContent = await readFileAsText(f);
      } catch {
        toast({ variant: "destructive", title: "Could not read file", description: "Paste content manually or use a text file." });
      }
    } else {
      fileContent = `[Uploaded file: ${f.name}]\nAdd detailed content in the text area for better search results.`;
    }

    setFormData((prev) => ({
      ...prev,
      title: prev.title || baseTitle,
      source: prev.source || f.name,
      content: prev.content || fileContent,
    }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!formData.title?.trim()) {
      toast({ variant: "destructive", title: "Title required", description: "Please enter a document title." });
      return;
    }

    setUploading(true);
    try {
      const content = (formData.content || formData.title).trim();
      const doc = await apiClient.entities.SearchDocument.create({
        ...formData,
        content,
      });

      onDocumentCreated?.(doc);
      onOpenChange(false);
      resetForm();
      toast({ title: "Success", description: `"${doc.title}" was saved to MongoDB.` });
    } catch (err) {
      console.error("Document creation failed:", err);
      toast({
        variant: "destructive",
        title: "Error saving document",
        description: err.message || "Could not reach the server. Is the backend running on port 5000?",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent
        className="sm:max-w-lg bg-white border-divider text-primary-dark shadow-xl"
        onCloseClick={() => onOpenChange(false)}
        onEscapeKeyDown={() => onOpenChange(false)}
        onPointerDownOutside={() => onOpenChange(false)}
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-600" />
              Add Document
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Upload File (optional)</Label>
              <div className="mt-1.5 border-2 border-dashed border-slate-200 rounded-xl p-4 text-center">
                {file ? (
                  <div className="flex items-center gap-2 justify-center">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm text-slate-600">{file.name}</span>
                    <button type="button" onClick={() => setFile(null)}><X className="w-3 h-3 text-slate-400" /></button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                    <p className="text-xs text-slate-500">Click to upload .txt, .md, .csv, .json</p>
                    <input type="file" className="hidden" onChange={handleFileUpload} accept=".txt,.pdf,.csv,.json,.md" />
                  </label>
                )}
              </div>
            </div>

            <div>
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Document title"
                className="mt-1.5 border-divider bg-slate-50"
                required
              />
            </div>

            <div>
              <Label>Content</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Paste document content or upload a text file..."
                className="mt-1.5 h-28 border-divider bg-slate-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger className="mt-1.5 bg-slate-50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["technical", "business", "legal", "research", "operations", "general"].map((c) => (
                      <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Access Level</Label>
                <Select value={formData.access_level} onValueChange={(v) => setFormData({ ...formData, access_level: v })}>
                  <SelectTrigger className="mt-1.5 bg-slate-50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["public", "team", "restricted", "confidential"].map((a) => (
                      <SelectItem key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Tags</Label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  placeholder="Add tag..."
                  className="flex-1 bg-slate-50"
                />
                <Button type="button" variant="outline" size="icon" onClick={addTag}><Plus className="w-4 h-4" /></Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {formData.tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-xs">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)}><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!formData.title?.trim() || uploading} className="bg-[#10B981] hover:bg-[#059669] text-white">
              {uploading ? "Saving..." : "Add Document"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
