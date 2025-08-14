import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, Download, Upload, CheckCircle, AlertTriangle, FileText } from "lucide-react";

interface CaseDocumentsProps {
  caseId: string;
  clientId?: string;
}

const CATEGORIES = [
  "Contrats",
  "Pièces",
  "Courriers",
  "Preuves",
  "Plaidoiries",
  "Autres",
] as const;

const formatBytes = (bytes?: number) => {
  if (!bytes && bytes !== 0) return "-";
  const sizes = ["o", "Ko", "Mo", "Go", "To"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

const CaseDocuments: React.FC<CaseDocumentsProps> = ({ caseId, clientId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<any[]>([]);
  const [showRequiredDocs, setShowRequiredDocs] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Autres");

  const accept = useMemo(
    () => ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    []
  );

  const missingCategories = useMemo(() => {
    const existingCategories = docs.map(d => d.document_type);
    return CATEGORIES.filter(cat => !existingCategories.includes(cat));
  }, [docs]);

  const handleStartUpload = () => {
    setShowRequiredDocs(true);
    setConfirmed(false);
  };

  const handleConfirmUpload = () => {
    setConfirmed(true);
    setShowRequiredDocs(false);
  };

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const { data, error } = await supabase
          .from("documents")
          .select("*")
          .eq("legal_case_id", caseId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        setDocs(data || []);
      } catch (e) {
        console.error(e);
        toast({ title: "Erreur", description: "Chargement des documents impossible", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, [caseId, toast]);

  const handleUpload = async () => {
    if (!user) return;
    if (!file) {
      toast({ title: "Fichier requis", description: "Sélectionnez un fichier à téléverser.", variant: "destructive" });
      return;
    }

    try {
      const safeTitle = title?.trim() || file.name;
      const uid = typeof crypto?.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
      const path = `${user.id}/${caseId}/${category}/${uid}-${sanitizedName}`;

      const { error: upErr } = await supabase.storage
        .from("case-documents")
        .upload(path, file, { contentType: file.type || undefined, upsert: false });
      if (upErr) throw upErr;

      const payload = {
        user_id: user.id,
        legal_case_id: caseId,
        client_id: clientId ?? null,
        title: safeTitle,
        document_type: category as string,
        description: null,
        file_url: path,
        mime_type: file.type || null,
        file_size: file.size,
        is_confidential: true,
      } as const;

      const { error: insErr } = await supabase.from("documents").insert(payload as any);
      if (insErr) throw insErr;

      toast({ title: "Téléversement réussi", description: "Le document a été ajouté." });
      // refresh list
      const { data } = await supabase
        .from("documents")
        .select("*")
        .eq("legal_case_id", caseId)
        .order("created_at", { ascending: false });
      setDocs(data || []);
      setFile(null);
      setTitle("");
      setCategory("Autres");
    } catch (e: any) {
      console.error(e);
      toast({ title: "Échec du téléversement", description: e?.message ?? "Erreur inconnue", variant: "destructive" });
    }
  };

  const handleDownload = async (path: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("case-documents")
        .createSignedUrl(path, 60);
      if (error) throw error;
      if (data?.signedUrl) window.open(data.signedUrl, "_blank");
    } catch (e: any) {
      console.error(e);
      toast({ title: "Téléchargement impossible", description: e?.message ?? "Erreur inconnue", variant: "destructive" });
    }
  };

  const handleDelete = async (doc: any) => {
    try {
      const path = doc.file_url as string;
      const { error: delFileErr } = await supabase.storage.from("case-documents").remove([path]);
      if (delFileErr) throw delFileErr;

      const { error: delRowErr } = await supabase.from("documents").delete().eq("id", doc.id);
      if (delRowErr) throw delRowErr;

      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
      toast({ title: "Supprimé", description: "Le document a été supprimé." });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Suppression impossible", description: e?.message ?? "Erreur inconnue", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Ajouter un document</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!confirmed ? (
            <div className="space-y-4">
              <Dialog open={showRequiredDocs} onOpenChange={setShowRequiredDocs}>
                <DialogTrigger asChild>
                  <Button onClick={handleStartUpload} className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    Commencer le téléversement
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Documents requis pour ce dossier</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                      {CATEGORIES.map((cat) => {
                        const hasDoc = docs.some(d => d.document_type === cat);
                        return (
                          <div key={cat} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              {hasDoc ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                              )}
                              <span className="font-medium">{cat}</span>
                            </div>
                            <Badge variant={hasDoc ? "default" : "secondary"}>
                              {hasDoc ? "Présent" : "Manquant"}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                    
                    {missingCategories.length > 0 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>{missingCategories.length} document(s) manquant(s) :</strong> {missingCategories.join(", ")}. 
                          Vous pouvez les ajouter maintenant ou plus tard.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowRequiredDocs(false)}>
                        Annuler
                      </Button>
                      <Button onClick={handleConfirmUpload}>
                        Continuer le téléversement
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="title">Titre</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre du document" />
                </div>
                <div>
                  <Label>Catégorie</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as (typeof CATEGORIES)[number])}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="file">Fichier (PDF/DOC/DOCX)</Label>
                  <Input id="file" type="file" accept={accept} onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setConfirmed(false)}>
                  Retour
                </Button>
                <Button onClick={handleUpload} disabled={!file || !user}>
                  <Upload className="h-4 w-4 mr-2" />Téléverser
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Documents du dossier</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-muted-foreground">Chargement…</div>
          ) : docs.length === 0 ? (
            <div className="text-muted-foreground">Aucun document pour ce dossier.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Taille</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{d.document_type}</Badge>
                    </TableCell>
                    <TableCell>{formatBytes(d.file_size)}</TableCell>
                    <TableCell>{new Date(d.created_at).toLocaleString("fr-FR")}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleDownload(d.file_url)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDelete(d)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CaseDocuments;
