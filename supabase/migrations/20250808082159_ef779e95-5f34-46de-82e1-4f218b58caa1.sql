-- Création des tables pour le système de gestion juridique (ordre corrigé)

-- Table pour les clients (créée en premier car référencée par d'autres tables)
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_type TEXT NOT NULL DEFAULT 'Particulier', -- Particulier, Entreprise
  first_name TEXT,
  last_name TEXT,
  company_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'France',
  registration_number TEXT, -- SIRET pour entreprises
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT clients_name_check CHECK (
    (client_type = 'Particulier' AND first_name IS NOT NULL AND last_name IS NOT NULL) OR
    (client_type = 'Entreprise' AND company_name IS NOT NULL)
  )
);

-- Table pour les dossiers juridiques
CREATE TABLE public.legal_cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  case_type TEXT NOT NULL, -- Civil, Pénal, Commercial, etc.
  status TEXT NOT NULL DEFAULT 'Ouvert', -- Ouvert, En cours, Fermé, Suspendu
  priority TEXT NOT NULL DEFAULT 'Normale', -- Urgente, Haute, Normale, Basse
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  client_id UUID REFERENCES public.clients(id),
  opposing_party TEXT,
  court_name TEXT,
  estimated_value DECIMAL(12,2),
  actual_value DECIMAL(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table pour les tâches et échéances
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  legal_case_id UUID REFERENCES public.legal_cases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL DEFAULT 'Général', -- Audience, Échéance, Rendez-vous, Document, etc.
  status TEXT NOT NULL DEFAULT 'À faire', -- À faire, En cours, Terminé, Annulé
  priority TEXT NOT NULL DEFAULT 'Normale',
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  assigned_to UUID REFERENCES auth.users(id),
  reminder_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table pour les documents
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  legal_case_id UUID REFERENCES public.legal_cases(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  document_type TEXT NOT NULL DEFAULT 'Autre', -- Contrat, Procès-verbal, Correspondance, Pièce, etc.
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  is_confidential BOOLEAN DEFAULT false,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table pour les rendez-vous
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  legal_case_id UUID REFERENCES public.legal_cases(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  appointment_type TEXT NOT NULL DEFAULT 'Consultation', -- Consultation, Audience, Négociation, etc.
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'Programmé', -- Programmé, Confirmé, Terminé, Annulé
  reminder_sent BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT appointments_datetime_check CHECK (end_datetime > start_datetime)
);

-- Table pour les factures
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  legal_case_id UUID REFERENCES public.legal_cases(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'Brouillon', -- Brouillon, Envoyée, Payée, En retard, Annulée
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 20.00, -- TVA en pourcentage
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_method TEXT, -- Virement, Chèque, Espèces, Carte
  payment_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table pour les lignes de facture
CREATE TABLE public.invoice_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table pour les communications
CREATE TABLE public.communications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  legal_case_id UUID REFERENCES public.legal_cases(id) ON DELETE SET NULL,
  communication_type TEXT NOT NULL DEFAULT 'Email', -- Email, SMS, Téléphone, Courrier, Rencontre
  direction TEXT NOT NULL, -- Entrant, Sortant
  subject TEXT,
  content TEXT,
  contact_person TEXT,
  communication_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Activer Row Level Security sur toutes les tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour clients
CREATE POLICY "Users can view their own clients" ON public.clients
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own clients" ON public.clients
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own clients" ON public.clients
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own clients" ON public.clients
  FOR DELETE USING (auth.uid() = user_id);

-- Politiques RLS pour legal_cases
CREATE POLICY "Users can view their own cases" ON public.legal_cases
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own cases" ON public.legal_cases
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cases" ON public.legal_cases
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own cases" ON public.legal_cases
  FOR DELETE USING (auth.uid() = user_id);

-- Politiques RLS pour tasks
CREATE POLICY "Users can view their own tasks" ON public.tasks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own tasks" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tasks" ON public.tasks
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tasks" ON public.tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Politiques RLS pour documents
CREATE POLICY "Users can view their own documents" ON public.documents
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own documents" ON public.documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own documents" ON public.documents
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own documents" ON public.documents
  FOR DELETE USING (auth.uid() = user_id);

-- Politiques RLS pour appointments
CREATE POLICY "Users can view their own appointments" ON public.appointments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own appointments" ON public.appointments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own appointments" ON public.appointments
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own appointments" ON public.appointments
  FOR DELETE USING (auth.uid() = user_id);

-- Politiques RLS pour invoices
CREATE POLICY "Users can view their own invoices" ON public.invoices
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own invoices" ON public.invoices
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own invoices" ON public.invoices
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own invoices" ON public.invoices
  FOR DELETE USING (auth.uid() = user_id);

-- Politiques RLS pour invoice_lines (basées sur l'appartenance de la facture)
CREATE POLICY "Users can view their own invoice lines" ON public.invoice_lines
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE invoices.id = invoice_lines.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can create invoice lines for their invoices" ON public.invoice_lines
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE invoices.id = invoice_lines.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update their own invoice lines" ON public.invoice_lines
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE invoices.id = invoice_lines.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete their own invoice lines" ON public.invoice_lines
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE invoices.id = invoice_lines.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  );

-- Politiques RLS pour communications
CREATE POLICY "Users can view their own communications" ON public.communications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own communications" ON public.communications
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own communications" ON public.communications
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own communications" ON public.communications
  FOR DELETE USING (auth.uid() = user_id);

-- Triggers pour updated_at
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_legal_cases_updated_at
  BEFORE UPDATE ON public.legal_cases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_communications_updated_at
  BEFORE UPDATE ON public.communications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index pour les performances
CREATE INDEX idx_clients_user_id ON public.clients(user_id);
CREATE INDEX idx_clients_email ON public.clients(email);

CREATE INDEX idx_legal_cases_user_id ON public.legal_cases(user_id);
CREATE INDEX idx_legal_cases_status ON public.legal_cases(status);
CREATE INDEX idx_legal_cases_client_id ON public.legal_cases(client_id);

CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_legal_case_id ON public.tasks(legal_case_id);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX idx_tasks_status ON public.tasks(status);

CREATE INDEX idx_documents_user_id ON public.documents(user_id);
CREATE INDEX idx_documents_legal_case_id ON public.documents(legal_case_id);

CREATE INDEX idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX idx_appointments_start_datetime ON public.appointments(start_datetime);

CREATE INDEX idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);

CREATE INDEX idx_communications_user_id ON public.communications(user_id);
CREATE INDEX idx_communications_client_id ON public.communications(client_id);