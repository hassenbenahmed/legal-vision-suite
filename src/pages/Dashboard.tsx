import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Clock,
  DollarSign,
  Euro,
  FileText,
  Filter,
  ListChecks,
  LogOut,
  Plus,
  Receipt,
  RefreshCw,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

type CaseSummary = Pick<Tables<"legal_cases">, "id" | "title" | "status" | "case_number" | "priority" | "updated_at" | "client_id">;
type AppointmentSummary = Pick<Tables<"appointments">, "id" | "title" | "appointment_type" | "status" | "start_datetime" | "client_id">;
type InvoiceSummary = Pick<Tables<"invoices">, "id" | "invoice_number" | "status" | "total_amount" | "due_date" | "client_id" | "paid_amount">;
type TaskSummary = Pick<Tables<"tasks">, "id" | "title" | "due_date" | "priority" | "status" | "legal_case_id">;
type ClientSummary = Pick<Tables<"clients">, "id" | "first_name" | "last_name" | "company_name" | "client_type">;

type DashboardStats = {
  activeCases: number;
  totalClients: number;
  openTasks: number;
  revenueThisMonth: number;
  expectedRevenueThisMonth: number;
  overdueInvoices: number;
  upcomingAppointments: number;
  collectionRate: number;
};

const formatDate = (value?: string | null, withTime = false) => {
  if (!value) return "Non défini";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Non défini";

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    ...(withTime && { timeStyle: "short" }),
  }).format(date);
};

const formatTime = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(date);
};

const getCaseStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  const normalized = status.toLowerCase();
  if (["fermé", "clôturé", "terminé"].some((value) => normalized.includes(value))) {
    return "secondary";
  }
  if (["en retard", "litige"].some((value) => normalized.includes(value))) {
    return "destructive";
  }
  return "default";
};

const getPriorityVariant = (priority: string | null | undefined): "default" | "secondary" | "destructive" | "outline" => {
  if (!priority) return "outline";
  const normalized = priority.toLowerCase();
  if (["critique", "haute", "élev"].some((value) => normalized.includes(value))) {
    return "destructive";
  }
  if (["moyenne", "normal"].some((value) => normalized.includes(value))) {
    return "default";
  }
  if (["faible", "basse"].some((value) => normalized.includes(value))) {
    return "secondary";
  }
  return "outline";
};

const getTaskStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  const normalized = status.toLowerCase();
  if (["terminé", "compl"].some((value) => normalized.includes(value))) {
    return "secondary";
  }
  if (["retard", "bloqué"].some((value) => normalized.includes(value))) {
    return "destructive";
  }
  if (["en cours", "ouvert"].some((value) => normalized.includes(value))) {
    return "default";
  }
  return "outline";
};

const getInvoiceStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  const normalized = status.toLowerCase();
  if (normalized.includes("pay")) return "default";
  if (normalized.includes("retard")) return "destructive";
  if (normalized.includes("envoy")) return "secondary";
  return "outline";
};

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    activeCases: 0,
    totalClients: 0,
    openTasks: 0,
    revenueThisMonth: 0,
    expectedRevenueThisMonth: 0,
    overdueInvoices: 0,
    upcomingAppointments: 0,
    collectionRate: 0,
  });
  const [recentCases, setRecentCases] = useState<CaseSummary[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<AppointmentSummary[]>([]);
  const [priorityTasks, setPriorityTasks] = useState<TaskSummary[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<InvoiceSummary[]>([]);
  const [clientsLookup, setClientsLookup] = useState<Record<string, ClientSummary>>({});
  const [casesLookup, setCasesLookup] = useState<Record<string, string>>({});

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }),
    []
  );
  const numberFormatter = useMemo(() => new Intl.NumberFormat("fr-FR"), []);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    const fetchDashboardData = async () => {
      setLoading(true);
      setErrorMessage(null);

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const nextWeek = new Date(now);
      nextWeek.setDate(now.getDate() + 7);

      try {
        const [
          casesRes,
          clientsRes,
          tasksRes,
          appointmentsRes,
          invoicesThisMonthRes,
          recentInvoicesRes,
          overdueInvoicesRes,
        ] = await Promise.all([
          supabase
            .from("legal_cases")
            .select("id, title, status, case_number, priority, updated_at, client_id", { count: "exact" })
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false })
            .limit(200),
          supabase
            .from("clients")
            .select("id, first_name, last_name, company_name, client_type", { count: "exact" })
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false })
            .limit(200),
          supabase
            .from("tasks")
            .select("id, title, due_date, priority, status, legal_case_id", { count: "exact" })
            .eq("user_id", user.id)
            .not("status", "eq", "Terminé")
            .order("due_date", { ascending: true })
            .limit(10),
          supabase
            .from("appointments")
            .select("id, title, appointment_type, status, start_datetime, client_id")
            .eq("user_id", user.id)
            .gte("start_datetime", now.toISOString())
            .lte("start_datetime", nextWeek.toISOString())
            .order("start_datetime", { ascending: true })
            .limit(8),
          supabase
            .from("invoices")
            .select("total_amount, paid_amount, status, issue_date", { count: "exact" })
            .eq("user_id", user.id)
            .gte("issue_date", startOfMonth.toISOString()),
          supabase
            .from("invoices")
            .select("id, invoice_number, status, total_amount, due_date, client_id, paid_amount")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(8),
          supabase
            .from("invoices")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .lt("due_date", now.toISOString())
            .not("status", "eq", "Payée"),
        ]);

        if (!isMounted) return;

        if (casesRes.error) throw casesRes.error;
        if (clientsRes.error) throw clientsRes.error;
        if (tasksRes.error) throw tasksRes.error;
        if (appointmentsRes.error) throw appointmentsRes.error;
        if (invoicesThisMonthRes.error) throw invoicesThisMonthRes.error;
        if (recentInvoicesRes.error) throw recentInvoicesRes.error;
        if (overdueInvoicesRes.error) throw overdueInvoicesRes.error;

        const casesData = casesRes.data ?? [];
        const clientsData = clientsRes.data ?? [];
        const tasksData = tasksRes.data ?? [];
        const appointmentsData = appointmentsRes.data ?? [];
        const invoicesThisMonthData = invoicesThisMonthRes.data ?? [];
        const recentInvoicesData = recentInvoicesRes.data ?? [];

        const expectedRevenue = invoicesThisMonthData.reduce((total, invoice) => total + (invoice.total_amount ?? 0), 0);
        const collectedRevenue = invoicesThisMonthData.reduce((total, invoice) => {
          if (invoice.status?.toLowerCase().includes("pay")) {
            return total + (invoice.paid_amount ?? invoice.total_amount ?? 0);
          }
          if (invoice.paid_amount && invoice.paid_amount > 0) {
            return total + invoice.paid_amount;
          }
          return total;
        }, 0);
        const collectionRate = expectedRevenue > 0 ? Math.min(100, Math.round((collectedRevenue / expectedRevenue) * 100)) : 0;

        setStats({
          activeCases: casesRes.count ?? casesData.length,
          totalClients: clientsRes.count ?? clientsData.length,
          openTasks: tasksRes.count ?? tasksData.length,
          revenueThisMonth: collectedRevenue,
          expectedRevenueThisMonth: expectedRevenue,
          overdueInvoices: overdueInvoicesRes.count ?? 0,
          upcomingAppointments: appointmentsData.length,
          collectionRate,
        });

        setRecentCases(casesData.slice(0, 6));
        setPriorityTasks(tasksData.slice(0, 6));
        setUpcomingAppointments(appointmentsData);
        setRecentInvoices(recentInvoicesData);

        const clientsMap = clientsData.reduce<Record<string, ClientSummary>>((acc, client) => {
          acc[client.id] = client;
          return acc;
        }, {});
        setClientsLookup(clientsMap);

        const casesMap = casesData.reduce<Record<string, string>>((acc, legalCase) => {
          acc[legalCase.id] = legalCase.title;
          return acc;
        }, {});
        setCasesLookup(casesMap);
      } catch (error) {
        console.error("Erreur lors du chargement du tableau de bord:", error);
        if (!isMounted) return;
        setErrorMessage("Impossible de charger toutes les données du tableau de bord.");
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de la récupération des indicateurs.",
          variant: "destructive",
        });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, [toast, user]);

  const resolveClientName = (clientId?: string | null) => {
    if (!clientId) return "Client non assigné";
    const client = clientsLookup[clientId];
    if (!client) return "Client non assigné";
    if (client.client_type === "Entreprise") {
      return client.company_name || "Entreprise";
    }
    const fullName = `${client.first_name ?? ""} ${client.last_name ?? ""}`.trim();
    return fullName || "Client particulier";
  };

  const resolveCaseTitle = (caseId?: string | null) => {
    if (!caseId) return "Sans dossier";
    return casesLookup[caseId] || "Dossier associé";
  };

  const renderListSkeleton = (rows = 4) => (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="rounded-lg border p-4">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="mt-2 h-3 w-1/2" />
        </div>
      ))}
    </div>
  );

  const statCards: Array<{
    key: "cases" | "clients" | "tasks" | "revenue";
    title: string;
    description: string;
    icon: React.ElementType;
  }> = [
    {
      key: "cases",
      title: "Dossiers actifs",
      description: "Cas suivis actuellement",
      icon: Briefcase,
    },
    {
      key: "clients",
      title: "Clients",
      description: "Base clients consolidée",
      icon: Users,
    },
    {
      key: "tasks",
      title: "Tâches à suivre",
      description: "Actions en cours",
      icon: ListChecks,
    },
    {
      key: "revenue",
      title: "Revenus encaissés",
      description: "Montant reçu ce mois-ci",
      icon: Euro,
    },
  ];

  // === FONCTION DE DÉCONNEXION ===
  // Gère la déconnexion avec notification de confirmation
  const handleSignOut = async () => {
    await signOut();           // Appel de la fonction de déconnexion
    toast({                    // Notification de confirmation
      title: "Déconnexion réussie",
      description: "À bientôt sur JurisCloud!",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Enhanced Header Section */}
      <div className="bg-background/95 backdrop-blur-sm border-b border-border/50 sticky top-16 z-40">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  Tableau de bord
                </h1>
                <p className="text-muted-foreground font-medium">
                  Vue d'ensemble complète de votre activité juridique
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Activity className="h-4 w-4" />
                <span>Données en temps réel</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Dernière mise à jour: maintenant</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">

        {/* Enhanced KPI Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;

            const value = (() => {
              switch (card.key) {
                case "cases":
                  return numberFormatter.format(stats.activeCases);
                case "clients":
                  return numberFormatter.format(stats.totalClients);
                case "tasks":
                  return numberFormatter.format(stats.openTasks);
                case "revenue":
                  return currencyFormatter.format(stats.revenueThisMonth);
                default:
                  return "-";
              }
            })();

            const getGradientColors = (key: string) => {
              switch (key) {
                case "cases":
                  return "from-blue-500/10 to-cyan-500/10 border-blue-200/50";
                case "clients":
                  return "from-green-500/10 to-emerald-500/10 border-green-200/50";
                case "tasks":
                  return "from-orange-500/10 to-amber-500/10 border-orange-200/50";
                case "revenue":
                  return "from-purple-500/10 to-pink-500/10 border-purple-200/50";
                default:
                  return "from-gray-500/10 to-slate-500/10 border-gray-200/50";
              }
            };

            const getIconColors = (key: string) => {
              switch (key) {
                case "cases":
                  return "text-blue-600 bg-blue-500/10 ring-blue-500/20";
                case "clients":
                  return "text-green-600 bg-green-500/10 ring-green-500/20";
                case "tasks":
                  return "text-orange-600 bg-orange-500/10 ring-orange-500/20";
                case "revenue":
                  return "text-purple-600 bg-purple-500/10 ring-purple-500/20";
                default:
                  return "text-gray-600 bg-gray-500/10 ring-gray-500/20";
              }
            };

            return (
              <Card 
                key={card.key} 
                className={`relative overflow-hidden bg-gradient-to-br ${getGradientColors(card.key)} border-2 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-semibold text-foreground">
                      {card.title}
                    </CardTitle>
                    <CardDescription className="text-xs font-medium">
                      {card.description}
                    </CardDescription>
                  </div>
                  <div className={`p-3 rounded-xl ring-1 ${getIconColors(card.key)}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loading ? (
                    <Skeleton className="h-10 w-28" />
                  ) : (
                    <div className="space-y-1">
                      <p className="text-3xl font-bold tracking-tight text-foreground">
                        {value}
                      </p>
                      {card.key === "revenue" && stats.expectedRevenueThisMonth > 0 && (
                        <div className="flex items-center gap-2 text-xs">
                          {stats.collectionRate >= 80 ? (
                            <TrendingUp className="h-3 w-3 text-green-600" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-600" />
                          )}
                          <span className={stats.collectionRate >= 80 ? "text-green-600" : "text-red-600"}>
                            {stats.collectionRate}% de l'objectif
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {card.key === "revenue" && !loading && stats.expectedRevenueThisMonth > 0 && (
                    <div className="space-y-2 pt-2 border-t border-border/50">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Objectif mensuel</span>
                        <span className="font-semibold">
                          {currencyFormatter.format(stats.expectedRevenueThisMonth)}
                        </span>
                      </div>
                      <Progress 
                        value={stats.collectionRate} 
                        className="h-2 bg-background/50" 
                      />
                    </div>
                  )}

                  {card.key === "tasks" && !loading && stats.openTasks > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/50">
                      <Target className="h-3 w-3" />
                      <span>Actions en attente</span>
                    </div>
                  )}

                  {card.key === "cases" && !loading && stats.activeCases > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/50">
                      <Activity className="h-3 w-3" />
                      <span>Dossiers en cours</span>
                    </div>
                  )}

                  {card.key === "clients" && !loading && stats.totalClients > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/50">
                      <Star className="h-3 w-3" />
                      <span>Base clients active</span>
                    </div>
                  )}
                </CardContent>
                
                {/* Subtle accent line */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${
                  card.key === "cases" ? "from-blue-500 to-cyan-500" :
                  card.key === "clients" ? "from-green-500 to-emerald-500" :
                  card.key === "tasks" ? "from-orange-500 to-amber-500" :
                  card.key === "revenue" ? "from-purple-500 to-pink-500" :
                  "from-gray-500 to-slate-500"
                }`} />
              </Card>
            );
          })}
        </div>

        {/* Alert Section */}
        {errorMessage && (
          <Alert variant="destructive" className="border-destructive/60 bg-destructive/5">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erreur de synchronisation</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Quick Alerts & Notifications */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.overdueInvoices > 0 && (
              <Alert className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800 dark:text-amber-200">
                  Factures en retard
                </AlertTitle>
                <AlertDescription className="text-amber-700 dark:text-amber-300">
                  {stats.overdueInvoices} facture(s) à relancer urgentemente
                </AlertDescription>
              </Alert>
            )}
            
            {stats.upcomingAppointments > 0 && (
              <Alert className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                <CalendarClock className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800 dark:text-blue-200">
                  Rendez-vous à venir
                </AlertTitle>
                <AlertDescription className="text-blue-700 dark:text-blue-300">
                  {stats.upcomingAppointments} RDV planifiés cette semaine
                </AlertDescription>
              </Alert>
            )}
            
            {stats.openTasks > 5 && (
              <Alert className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
                <Zap className="h-4 w-4 text-orange-600" />
                <AlertTitle className="text-orange-800 dark:text-orange-200">
                  Charge de travail élevée
                </AlertTitle>
                <AlertDescription className="text-orange-700 dark:text-orange-300">
                  {stats.openTasks} tâches actives nécessitent votre attention
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Dossiers récents</CardTitle>
              <CardDescription>Vos derniers dossiers mis à jour</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-2">
              <Link to="/cases">
                Voir tous
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              renderListSkeleton(4)
            ) : recentCases.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun dossier récemment mis à jour.</p>
            ) : (
              <div className="space-y-4">
                {recentCases.map((legalCase) => (
                  <div
                    key={legalCase.id}
                    className="flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="text-base font-semibold text-foreground">{legalCase.title}</p>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span>#{legalCase.case_number}</span>
                        <span>Client : {resolveClientName(legalCase.client_id)}</span>
                        <span>Mis à jour : {formatDate(legalCase.updated_at)}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={getCaseStatusVariant(legalCase.status)}>{legalCase.status}</Badge>
                      <Badge variant={getPriorityVariant(legalCase.priority)} className="uppercase tracking-wide">
                        {legalCase.priority || "Priorité"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50/50 to-green-50/50 dark:from-emerald-950/20 dark:to-green-950/20 border-emerald-200/50">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-emerald-800 dark:text-emerald-200">
                    Performance financière
                  </CardTitle>
                  <CardDescription className="text-emerald-600 dark:text-emerald-400">
                    Analyse détaillée de vos revenus
                  </CardDescription>
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link to="/invoices">
                  <Receipt className="h-4 w-4" />
                  Gérer
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Revenue Overview */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 p-4 rounded-lg bg-background/50 border border-emerald-200/30">
                    <p className="text-sm font-medium text-muted-foreground">Revenus encaissés</p>
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                      {currencyFormatter.format(stats.revenueThisMonth)}
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      <TrendingUp className="h-3 w-3 text-emerald-600" />
                      <span className="text-emerald-600">Ce mois-ci</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 p-4 rounded-lg bg-background/50 border border-blue-200/30">
                    <p className="text-sm font-medium text-muted-foreground">Objectif mensuel</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {currencyFormatter.format(stats.expectedRevenueThisMonth)}
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      <Target className="h-3 w-3 text-blue-600" />
                      <span className="text-blue-600">Facturé total</span>
                    </div>
                  </div>
                </div>

                {/* Progress Indicator */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Taux de recouvrement</span>
                    <span className="text-sm font-bold text-foreground">
                      {stats.collectionRate}%
                    </span>
                  </div>
                  <Progress 
                    value={stats.collectionRate} 
                    className="h-3 bg-muted"
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Warning Section */}
                {stats.overdueInvoices > 0 && (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                        Action requise
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        {stats.overdueInvoices} facture(s) en retard nécessitent un suivi
                      </p>
                      <Button asChild variant="outline" size="sm" className="mt-2 gap-2">
                        <Link to="/invoices?filter=overdue">
                          <Receipt className="h-3 w-3" />
                          Voir les retards
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Agenda à 7 jours</CardTitle>
              <CardDescription>Vos rendez-vous prioritaires</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-2">
              <Link to="/appointments">
                Gérer l'agenda
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              renderListSkeleton(4)
            ) : upcomingAppointments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun rendez-vous planifié sur la période.</p>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex flex-col gap-3 rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{appointment.title}</p>
                        <p className="text-xs text-muted-foreground">{resolveClientName(appointment.client_id)}</p>
                      </div>
                      <Badge variant="outline">{appointment.appointment_type}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        <CheckCircle2 className="mr-1 inline h-3 w-3" />
                        {formatDate(appointment.start_datetime)}
                      </span>
                      <span>
                        <CalendarClock className="mr-1 inline h-3 w-3" />
                        {formatTime(appointment.start_datetime)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-1">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Priorités opérationnelles</CardTitle>
              <CardDescription>Vos tâches critiques à traiter</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-2">
              <Link to="/tasks">
                Ouvrir les tâches
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              renderListSkeleton(4)
            ) : priorityTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Vous n'avez aucune tâche active pour le moment.</p>
            ) : (
              <div className="space-y-4">
                {priorityTasks.map((task) => {
                  const overdue = task.due_date ? new Date(task.due_date) < new Date() && !task.status.toLowerCase().includes("termin") : false;
                  return (
                    <div key={task.id} className="flex flex-col gap-3 rounded-lg border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-foreground">{task.title}</p>
                          <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                            <span>Dossier : {resolveCaseTitle(task.legal_case_id)}</span>
                            <span>Échéance : {formatDate(task.due_date)}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={getPriorityVariant(task.priority)}>{task.priority || "Priorité"}</Badge>
                          <Badge variant={overdue ? "destructive" : getTaskStatusVariant(task.status)}>
                            {overdue ? "En retard" : task.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-1">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Factures récentes</CardTitle>
              <CardDescription>Suivi de la facturation en temps réel</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-2">
              <Link to="/invoices">
                Toutes les factures
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              renderListSkeleton(4)
            ) : recentInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune facture enregistrée pour le moment.</p>
            ) : (
              <div className="space-y-4">
                {recentInvoices.map((invoice) => {
                  const overdue = invoice.due_date ? new Date(invoice.due_date) < new Date() && !invoice.status.toLowerCase().includes("pay") : false;
                  return (
                    <div key={invoice.id} className="flex flex-col gap-3 rounded-lg border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-foreground">#{invoice.invoice_number}</p>
                          <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                            <span>Client : {resolveClientName(invoice.client_id)}</span>
                            <span>Échéance : {formatDate(invoice.due_date)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground">
                            {currencyFormatter.format(invoice.total_amount ?? 0)}
                          </p>
                          <Badge variant={overdue ? "destructive" : getInvoiceStatusVariant(invoice.status)}>
                            {overdue ? "En retard" : invoice.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
};

export default Dashboard;