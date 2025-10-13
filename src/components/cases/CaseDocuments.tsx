import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Trash2, Download, Upload, CheckCircle, AlertTriangle, FileText, 
  Plus, File, FileImage, FileSpreadsheet, Archive,
  FolderOpen, Clock
} from "lucide-react";

interface CaseDocumentsProps {
  caseId: string;
  clientId?: string;
}

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
  const [uploading, setUploading] = useState(false);
  const [docs, setDocs] = useState<any[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  
  // États pour l'ajout de fichier à un document existant
  const [showAddFileDialog, setShowAddFileDialog] = useState(false);
  const [selectedDocForFile, setSelectedDocForFile] = useState<any>(null);
  const [fileToAdd, setFileToAdd] = useState<File | null>(null);

  const accept = useMemo(
    () => ".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.zip,.rar,.txt,.xlsx,.xls,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*,text/*,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    []
  );

  // Catégories simplifiées
  const categories = [
    "CONTRAT", "FACTURE", "CORRESPONDANCE", "JUGEMENT", "EXPERTISE",
    "PIECE_IDENTITE", "ATTESTATION", "RAPPORT", "ORDONNANCE", "AUTRE"
  ];

  // Fonction pour obtenir l'icône du fichier
  const getFileIcon = (mimeType: string, fileName: string, hasFile: boolean) => {
    // Si pas de fichier, afficher l'icône d'alerte
    if (!hasFile) {
      return <span className="text-lg">❗</span>;
    }
    
    // Si fichier présent, afficher l'icône de succès + icône du type
    const typeIcon = (() => {
      if (mimeType?.includes('application/pdf')) return <FileText className="h-4 w-4 text-red-500" />;
      if (mimeType?.includes('image/')) return <FileImage className="h-4 w-4 text-blue-500" />;
      if (mimeType?.includes('spreadsheet') || fileName?.endsWith('.xlsx') || fileName?.endsWith('.xls')) 
        return <FileSpreadsheet className="h-4 w-4 text-green-500" />;
      if (fileName?.endsWith('.zip') || fileName?.endsWith('.rar')) 
        return <Archive className="h-4 w-4 text-orange-500" />;
      return <FileText className="h-4 w-4 text-gray-500" />;
    })();

    return (
      <div className="flex items-center gap-1">
        <span className="text-lg">✅</span>
        {typeIcon}
      </div>
    );
  };

  // Chargement des documents
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

  // Upload de document
  const handleUpload = async () => {
    if (!user) return;
    if (!title.trim()) {
      toast({ title: "Titre requis", description: "Veuillez saisir un titre pour le document.", variant: "destructive" });
      return;
    }

    try {
      setUploading(true);
      
      let filePath = null;
      let fileSize = 0;
      let mimeType = null;

      // Upload du fichier seulement s'il y en a un
      if (file) {
        const uid = typeof crypto?.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
        const path = `${user.id}/${caseId}/${category || 'general'}/${uid}-${sanitizedName}`;

        const { error: upErr } = await supabase.storage
          .from("case-documents")
          .upload(path, file, { contentType: file.type || undefined, upsert: false });
        
        if (upErr) throw upErr;
        
        filePath = path;
        fileSize = file.size;
        mimeType = file.type || null;
      }

      const payload = {
        user_id: user.id,
        legal_case_id: caseId,
        client_id: clientId ?? null,
        title: title.trim(),
        document_type: category || "Note",
        description: null,
        file_url: filePath,
        mime_type: mimeType,
        file_size: fileSize,
        is_confidential: false,
      } as const;

      const { error: insErr } = await supabase.from("documents").insert(payload as any);
      if (insErr) throw insErr;
      
      toast({ 
        title: "Document ajouté", 
        description: file ? "Le document avec fichier a été ajouté avec succès." : "La note a été ajoutée avec succès." 
      });
      
      // Refresh list
      const { data } = await supabase
        .from("documents")
        .select("*")
        .eq("legal_case_id", caseId)
        .order("created_at", { ascending: false });
      
      setDocs(data || []);
      
      // Reset form
      setFile(null);
      setTitle("");
      setCategory("");
      setShowUploadDialog(false);
      
    } catch (e: any) {
      console.error(e);
      toast({ title: "Échec du téléversement", description: e?.message ?? "Erreur inconnue", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  // Fonction pour ajouter un fichier à un document existant
  const handleAddFileToDocument = async () => {
    if (!fileToAdd || !selectedDocForFile) return;

    try {
      setUploading(true);
      
      const uid = typeof crypto?.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const sanitizedName = fileToAdd.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
      const path = `${user.id}/${caseId}/${selectedDocForFile.document_type}/${uid}-${sanitizedName}`;

      // Upload du fichier
      const { error: upErr } = await supabase.storage
        .from("case-documents")
        .upload(path, fileToAdd, { contentType: fileToAdd.type || undefined, upsert: false });
      
      if (upErr) throw upErr;

      // Mettre à jour le document avec les informations du fichier
      const { error: updateErr } = await supabase
        .from("documents")
        .update({
          file_url: path,
          mime_type: fileToAdd.type || null,
          file_size: fileToAdd.size,
        })
        .eq("id", selectedDocForFile.id);
      
      if (updateErr) throw updateErr;

      // Actualiser la liste
      const { data } = await supabase
        .from("documents")
        .select("*")
        .eq("legal_case_id", caseId)
        .order("created_at", { ascending: false });
      
      setDocs(data || []);
      
      // Réinitialiser
      setShowAddFileDialog(false);
      setSelectedDocForFile(null);
      setFileToAdd(null);
      
      toast({ 
        title: "Fichier ajouté", 
        description: "Le fichier a été attaché au document avec succès." 
      });
      
    } catch (error) {
      console.error(error);
      toast({ 
        title: "Erreur", 
        description: "Impossible d'ajouter le fichier", 
        variant: "destructive" 
      });
    } finally {
      setUploading(false);
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
    const confirmDelete = confirm(`Êtes-vous sûr de vouloir supprimer "${doc.title}" ?`);
    if (!confirmDelete) return;

    try {
      // Supprimer le fichier seulement s'il existe
      if (doc.file_url) {
        const path = doc.file_url as string;
        const { error: delFileErr } = await supabase.storage.from("case-documents").remove([path]);
        if (delFileErr) throw delFileErr;
      }

      // Supprimer l'enregistrement de la base de données
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
    <div className="space-y-4">
      {/* Bouton d'ajout simple en haut */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          Documents du dossier ({docs.length})
        </h3>
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Ajouter un document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Titre du document</Label>
                <Input 
                  id="title" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="Nom du document" 
                />
              </div>
              <div>
                <Label>Catégorie (optionnelle)</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une catégorie (optionnel)" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="file">Fichier (optionnel)</Label>
                <Input 
                  id="file" 
                  type="file" 
                  accept={accept} 
                  onChange={(e) => setFile(e.target.files?.[0] || null)} 
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Vous pouvez ajouter un document sans fichier (ex: note, mémo)
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                  Annuler
                </Button>
                <Button onClick={handleUpload} disabled={!title.trim() || uploading}>
                  {uploading ? "Upload..." : "Ajouter"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dialog pour ajouter un fichier à un document existant */}
      <Dialog open={showAddFileDialog} onOpenChange={setShowAddFileDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un fichier</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedDocForFile && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Document :</p>
                <p className="text-lg">{selectedDocForFile.title}</p>
                <p className="text-sm text-muted-foreground">
                  Catégorie : {selectedDocForFile.document_type}
                </p>
              </div>
            )}
            
            <div>
              <Label htmlFor="file-to-add">Sélectionner un fichier</Label>
              <Input 
                id="file-to-add" 
                type="file" 
                accept={accept} 
                onChange={(e) => setFileToAdd(e.target.files?.[0] || null)} 
              />
            </div>
            
            {fileToAdd && (
              <div className="p-3 border rounded-lg bg-green-50">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">{fileToAdd.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatBytes(fileToAdd.size)}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAddFileDialog(false);
                  setSelectedDocForFile(null);
                  setFileToAdd(null);
                }}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleAddFileToDocument} 
                disabled={!fileToAdd || uploading}
              >
                {uploading ? "Upload..." : "Ajouter le fichier"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Liste simple des documents */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Chargement des documents...</p>
              </div>
            </div>
          ) : docs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun document</h3>
              <p className="text-muted-foreground mb-4">
                Commencez par ajouter votre premier document au dossier
              </p>
              <Button onClick={() => setShowUploadDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un document
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Taille</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.map((doc) => (
                  <TableRow key={doc.id} className="hover:bg-muted/50">
                    <TableCell>
                      {getFileIcon(doc.mime_type, doc.title, !!doc.file_url)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{doc.title}</p>
                        {!doc.file_url && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            Note (sans fichier)
                          </Badge>
                        )}
                        {doc.is_confidential && (
                          <Badge variant="destructive" className="text-xs mt-1">
                            Confidentiel
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {doc.document_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {doc.file_url ? formatBytes(doc.file_size) : "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3" />
                        {new Date(doc.created_at).toLocaleDateString("fr-FR")}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        {doc.file_url ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDownload(doc.file_url)}
                            title="Télécharger"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              setSelectedDocForFile(doc);
                              setShowAddFileDialog(true);
                            }}
                            title="Ajouter un fichier"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-destructive hover:text-destructive" 
                          onClick={() => handleDelete(doc)}
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
