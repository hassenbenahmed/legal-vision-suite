import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Eye } from "lucide-react";

interface ClientOption {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  company_name?: string | null;
  client_type: string;
}

interface LegalCaseOption {
  id: string;
  title: string;
  case_number: string;
}

export interface InvoiceFormData {
  id?: string;
  invoice_number: string;
  status: string;
  issue_date?: string | null;
  due_date?: string | null;
  subtotal?: number | null;
  tax_rate?: number | null;
  tax_amount?: number | null;
  total_amount?: number | null;
  paid_amount?: number | null;
  payment_method?: string | null;
  payment_date?: string | null;
  notes?: string | null;
  client_id: string;
  legal_case_id?: string | null;
}

interface InvoiceDialogProps {
  invoice?: InvoiceFormData;
  onSuccess: () => void;
  trigger?: React.ReactNode;
  mode?: "create" | "edit" | "view";
}

interface InvoiceInternalFormState {
  invoice_number: string;
  client_id: string;
  legal_case_id: string;
  status: string;
  issue_date: string;
  due_date: string;
  subtotal: string;
  tax_rate: string;
  paid_amount: string;
  payment_method: string;
  payment_date: string;
  notes: string;
}

const initialFormState: InvoiceInternalFormState = {
  invoice_number: "",
  client_id: "none",
  legal_case_id: "none",
  status: "Brouillon",
  issue_date: "",
  due_date: "",
  subtotal: "0",
  tax_rate: "20",
  paid_amount: "0",
  payment_method: "",
  payment_date: "",
  notes: "",
};

const toDateInputValue = (value?: string | null) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value.split("T")[0] ?? "";
  }
  return parsed.toISOString().split("T")[0];
};

const getClientLabel = (client: ClientOption) => {
  if (client.client_type === "Entreprise") {
    return client.company_name || "Entreprise";
  }
  const fullName = `${client.first_name ?? ""} ${client.last_name ?? ""}`.trim();
  return fullName || "Client";
};

const InvoiceDialog: React.FC<InvoiceDialogProps> = ({ invoice, onSuccess, trigger, mode }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [legalCases, setLegalCases] = useState<LegalCaseOption[]>([]);
  const [formData, setFormData] = useState<InvoiceInternalFormState>(initialFormState);

  const dialogMode: "create" | "edit" | "view" = invoice ? mode ?? "edit" : "create";
  const isReadOnly = dialogMode === "view";

  useEffect(() => {
    if (open && user) {
      fetchSupportingData();
    }
  }, [open, user]);

  useEffect(() => {
    if (open) {
      if (invoice) {
        setFormData({
          invoice_number: invoice.invoice_number ?? "",
          client_id: invoice.client_id ?? "none",
          legal_case_id: invoice.legal_case_id ?? "none",
          status: invoice.status ?? "Brouillon",
          issue_date: toDateInputValue(invoice.issue_date),
          due_date: toDateInputValue(invoice.due_date),
          subtotal: typeof invoice.subtotal === "number" ? invoice.subtotal.toString() : "0",
          tax_rate: typeof invoice.tax_rate === "number" ? invoice.tax_rate.toString() : "20",
          paid_amount: typeof invoice.paid_amount === "number" ? invoice.paid_amount.toString() : "0",
          payment_method: invoice.payment_method ?? "",
          payment_date: toDateInputValue(invoice.payment_date),
          notes: invoice.notes ?? "",
        });
      } else {
        setFormData(initialFormState);
      }
    }
  }, [open, invoice]);

  const fetchSupportingData = async () => {
    if (!user) return;
    try {
      const [{ data: clientsData, error: clientsError }, { data: legalCasesData, error: casesError }] = await Promise.all([
        supabase
          .from("clients")
          .select("id, first_name, last_name, company_name, client_type")
          .eq("user_id", user.id)
          .order("company_name"),
        supabase
          .from("legal_cases")
          .select("id, title, case_number")
          .eq("user_id", user.id)
          .order("title"),
      ]);

      if (clientsError) throw clientsError;
      if (casesError) throw casesError;

      setClients(clientsData ?? []);
      setLegalCases(legalCasesData ?? []);
    } catch (error) {
      console.error("Erreur lors du chargement des données de facturation:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les clients ou dossiers",
        variant: "destructive",
      });
    }
  };

  const calculatedValues = useMemo(() => {
    const subtotalNum = parseFloat(formData.subtotal || "0");
    const taxRateNum = parseFloat(formData.tax_rate || "0");
    const taxAmount = subtotalNum * (taxRateNum / 100);
    const totalAmount = subtotalNum + taxAmount;
    const paidAmount = parseFloat(formData.paid_amount || "0");

    return {
      subtotal: Number.isFinite(subtotalNum) ? subtotalNum : 0,
      taxRate: Number.isFinite(taxRateNum) ? taxRateNum : 0,
      taxAmount: Number.isFinite(taxAmount) ? taxAmount : 0,
      totalAmount: Number.isFinite(totalAmount) ? totalAmount : 0,
      paidAmount: Number.isFinite(paidAmount) ? paidAmount : 0,
    };
  }, [formData.subtotal, formData.tax_rate, formData.paid_amount]);

  const resetAndClose = () => {
    setFormData(initialFormState);
    setOpen(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || isReadOnly) return;

    if (formData.client_id === "none") {
      toast({
        title: "Client requis",
        description: "Veuillez sélectionner un client pour la facture",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        invoice_number: formData.invoice_number.trim(),
        status: formData.status,
        issue_date: formData.issue_date || null,
        due_date: formData.due_date || null,
        subtotal: calculatedValues.subtotal,
        tax_rate: calculatedValues.taxRate,
        tax_amount: calculatedValues.taxAmount,
        total_amount: calculatedValues.totalAmount,
        paid_amount: calculatedValues.paidAmount,
        payment_method: formData.payment_method.trim() || null,
        payment_date: formData.payment_date || null,
        notes: formData.notes.trim() || null,
        client_id: formData.client_id,
        legal_case_id: formData.legal_case_id === "none" ? null : formData.legal_case_id,
        updated_at: new Date().toISOString(),
      };

      let error;
      if (invoice?.id) {
        ({ error } = await supabase
          .from("invoices")
          .update(payload)
          .eq("id", invoice.id)
          .eq("user_id", user.id));
      } else {
        const insertPayload = {
          ...payload,
          user_id: user.id,
          created_at: new Date().toISOString(),
        };
        ({ error } = await supabase.from("invoices").insert([insertPayload]));
      }

      if (error) throw error;

      toast({
        title: invoice?.id ? "Facture mise à jour" : "Facture créée",
        description: invoice?.id
          ? "Les informations de la facture ont été mises à jour avec succès"
          : "La facture a été créée avec succès",
      });

      resetAndClose();
      onSuccess();
    } catch (err) {
      console.error("Erreur lors de l'enregistrement de la facture:", err);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer la facture",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const defaultTrigger = (
    <Button>
      {dialogMode === "create" ? <Plus className="h-4 w-4 mr-2" /> : dialogMode === "edit" ? <Edit className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
      {dialogMode === "create" ? "Nouvelle Facture" : dialogMode === "edit" ? "Modifier" : "Voir"}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
  <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {dialogMode === "create" && "Créer une facture"}
            {dialogMode === "edit" && "Modifier la facture"}
            {dialogMode === "view" && "Détails de la facture"}
          </DialogTitle>
          <DialogDescription>
            {dialogMode === "view"
              ? "Consultez les détails complets de la facture"
              : "Renseignez les informations de facturation"
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoice_number">Numéro de facture *</Label>
              <Input
                id="invoice_number"
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                placeholder="FACT-2025-001"
                required
                disabled={isReadOnly}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Brouillon">Brouillon</SelectItem>
                  <SelectItem value="Envoyée">Envoyée</SelectItem>
                  <SelectItem value="Payée">Payée</SelectItem>
                  <SelectItem value="En retard">En retard</SelectItem>
                  <SelectItem value="Annulée">Annulée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_id">Client *</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" disabled>
                    Sélectionner un client
                  </SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {getClientLabel(client)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="legal_case_id">Dossier juridique</Label>
              <Select
                value={formData.legal_case_id}
                onValueChange={(value) => setFormData({ ...formData, legal_case_id: value })}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Aucun dossier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun dossier</SelectItem>
                  {legalCases.map((legalCase) => (
                    <SelectItem key={legalCase.id} value={legalCase.id}>
                      {legalCase.title} (#{legalCase.case_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="issue_date">Date d'émission</Label>
              <Input
                id="issue_date"
                type="date"
                value={formData.issue_date}
                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                disabled={isReadOnly}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Date d'échéance</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                disabled={isReadOnly}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtotal">Sous-total (€)</Label>
              <Input
                id="subtotal"
                type="number"
                step="0.01"
                value={formData.subtotal}
                onChange={(e) => setFormData({ ...formData, subtotal: e.target.value })}
                disabled={isReadOnly}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax_rate">TVA (%)</Label>
              <Input
                id="tax_rate"
                type="number"
                step="0.01"
                value={formData.tax_rate}
                onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                disabled={isReadOnly}
              />
            </div>

            <div className="space-y-2">
              <Label>Montant TVA calculé (€)</Label>
              <Input value={calculatedValues.taxAmount.toFixed(2)} readOnly disabled />
            </div>

            <div className="space-y-2">
              <Label>Montant total (€)</Label>
              <Input value={calculatedValues.totalAmount.toFixed(2)} readOnly disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paid_amount">Montant payé (€)</Label>
              <Input
                id="paid_amount"
                type="number"
                step="0.01"
                value={formData.paid_amount}
                onChange={(e) => setFormData({ ...formData, paid_amount: e.target.value })}
                disabled={isReadOnly}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method">Mode de paiement</Label>
              <Input
                id="payment_method"
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                placeholder="Virement, Carte, Chèque..."
                disabled={isReadOnly}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_date">Date de paiement</Label>
              <Input
                id="payment_date"
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                disabled={isReadOnly}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Ajoutez des notes supplémentaires (optionnel)"
              disabled={isReadOnly}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={resetAndClose}>
              {dialogMode === "view" ? "Fermer" : "Annuler"}
            </Button>
            {!isReadOnly && (
              <Button type="submit" disabled={loading}>
                {loading ? "Sauvegarde..." : invoice?.id ? "Mettre à jour" : "Créer"}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceDialog;
