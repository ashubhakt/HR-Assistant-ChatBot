import { useEffect, useRef, useState, FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { KbDocument, deleteDocument, listDocuments, uploadDocument } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

export function AdminScreen() {
  const [docs, setDocs] = useState<KbDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      setDocs(await listDocuments());
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please select a PDF file");
      return;
    }
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Only PDF files are allowed");
      return;
    }
    setUploading(true);
    try {
      const msg = await uploadDocument(file);
      toast.success(msg || "Uploaded");
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      await refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    try {
      const msg = await deleteDocument(docId);
      toast.success(msg || "Deleted");
      setDocs((prev) => prev.filter((d) => d.docId !== docId));
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="mx-auto max-w-5xl p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Knowledge Base</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload PDF documents that the HR assistant can reference.
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to chat
          </Link>
        </div>

      <form
        onSubmit={handleUpload}
        className="mb-8 flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            PDF file
          </label>
          <Input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            disabled={uploading}
          />
        </div>
        <Button type="submit" disabled={uploading || !file} className="gap-2">
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          Upload
        </Button>
      </form>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File name</TableHead>
              <TableHead>Doc ID</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead className="w-20 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </TableCell>
              </TableRow>
            ) : docs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                  No documents uploaded yet.
                </TableCell>
              </TableRow>
            ) : (
              docs.map((d) => (
                <TableRow key={d.docId}>
                  <TableCell className="font-medium">
                    <span className="inline-flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {d.fileName}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {d.docId}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(d.uploadedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(d.docId)}
                      aria-label="Delete document"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </div>
    </div>
  );
}

function formatDate(value: string): string {
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleString();
}
