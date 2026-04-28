import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Database, Download, Trash2, RefreshCw, Loader2 } from "lucide-react";
import { backupsService } from "../../shared/services/backups";

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = Number(bytes);
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatDateTime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch (_) {
    return iso;
  }
}

export default function BackupsPanel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [downloadingName, setDownloadingName] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await backupsService.list();
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Failed to load backups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await backupsService.generate();
      toast.success(`Backup created: ${res.filename}`);
      await refresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Backup failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (filename) => {
    setDownloadingName(filename);
    try {
      await backupsService.download(filename);
    } catch (err) {
      toast.error(err.message || "Download failed");
    } finally {
      setDownloadingName(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await backupsService.remove(pendingDelete);
      toast.success("Backup deleted");
      setPendingDelete(null);
      await refresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const lastBackup = items[0];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Backups
            </CardTitle>
            <CardDescription>
              Generate, download and manage full <code>mysqldump</code> snapshots of the database.
            </CardDescription>
            <p className="mt-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Last backup:</span>{" "}
              {lastBackup ? formatDateTime(lastBackup.createdAt) : "Never"}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={refresh} disabled={loading || generating}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline ml-2">Refresh</span>
            </Button>
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Generating…</>
              ) : (
                <>Generate Backup Now</>
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {loading && items.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Loading backups…
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center">
              <Database className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium">No backups yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Click <span className="font-medium">Generate Backup Now</span> to create your first snapshot.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Filename</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((b) => (
                    <TableRow key={b.filename}>
                      <TableCell className="font-mono text-xs sm:text-sm">{b.filename}</TableCell>
                      <TableCell>{formatBytes(b.sizeBytes)}</TableCell>
                      <TableCell>{formatDateTime(b.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(b.filename)}
                            disabled={downloadingName === b.filename}
                          >
                            {downloadingName === b.filename ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                            <span className="hidden sm:inline ml-2">Download</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPendingDelete(b.filename)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="hidden sm:inline ml-2">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => { if (!open && !deleting) setPendingDelete(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this backup?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-mono">{pendingDelete}</span>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleConfirmDelete(); }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
