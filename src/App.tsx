import { useState, useEffect } from 'react';
import type { Lead, Role, Service, VendorBill, ActivityLog, LeadStatus } from './types';
import { RenoletDatabase } from './db';
import { ToastContainer } from './components/Toast';
import type { ToastMessage } from './components/Toast';
import { DashboardOverview } from './components/DashboardOverview';
import { KanbanView } from './components/KanbanView';
import { AdminDashboard } from './components/AdminDashboard';
import { SalesDashboard } from './components/SalesDashboard';
import { QuotationDashboard } from './components/QuotationDashboard';
import { AccountsDashboard } from './components/AccountsDashboard';
import { PurchaseDashboard } from './components/PurchaseDashboard';
import { ProductionDashboard } from './components/ProductionDashboard';
import { InstallationDashboard } from './components/InstallationDashboard';
import { RenoletLogo } from './components/RenoletLogo';
import { GoogleLeadScraperView } from './components/GoogleLeadScraperView';
import {
  Shield,
  Ruler,
  FileText,
  CreditCard,
  Truck,
  Hammer,
  Wrench,
  Search,
  SlidersHorizontal,
  LayoutGrid,
  Table,
  BarChart3,
  History,
  Database,
  UserCheck,
  Terminal
} from 'lucide-react';
import './App.css';

function App() {
  const [activeRole, setActiveRole] = useState<Role>('Admin');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [vendorBills, setVendorBills] = useState<VendorBill[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Navigation View modes
  const [viewMode, setViewMode] = useState<'dashboard' | 'pipeline' | 'department' | 'logs' | 'services_config' | 'agents_config' | 'lead_scraper'>('dashboard');

  // Search & Filter state
  const [globalSearch, setGlobalSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Initialize DB on mount
  useEffect(() => {
    RenoletDatabase.init();
    refreshData();
  }, []);

  const refreshData = () => {
    setLeads(RenoletDatabase.getLeads());
    setServices(RenoletDatabase.getServices());
    setVendorBills(RenoletDatabase.getVendorBills());
    setLogs(RenoletDatabase.getLogs());
  };

  // Toast helper
  const addToast = (type: 'success' | 'error' | 'info', title: string, description: string) => {
    const newToast: ToastMessage = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      title,
      description
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Reset demo db
  const handleResetData = () => {
    RenoletDatabase.resetToSeed();
    refreshData();
    addToast('info', 'Database Reset', 'Simulated relational tables restored to initial seed state.');
  };

  // Global Search & status filtering logic
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.clientName.toLowerCase().includes(globalSearch.toLowerCase()) ||
      lead.id.toLowerCase().includes(globalSearch.toLowerCase()) ||
      lead.address.toLowerCase().includes(globalSearch.toLowerCase()) ||
      lead.serviceRequired.toLowerCase().includes(globalSearch.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getRoleIcon = (role: Role) => {
    const size = 18;
    switch (role) {
      case 'Admin': return <Shield size={size} />;
      case 'Sales': return <Ruler size={size} />;
      case 'Quotation': return <FileText size={size} />;
      case 'Accounts': return <CreditCard size={size} />;
      case 'Purchase': return <Truck size={size} />;
      case 'Production': return <Hammer size={size} />;
      case 'Installation': return <Wrench size={size} />;
    }
  };

  const getBadgeColor = (status: LeadStatus) => {
    const colors: Record<LeadStatus, string> = {
      'New': 'bg-blue-100 text-blue-800',
      'Assigned': 'bg-cyan-100 text-cyan-800',
      'Measurement Pending': 'bg-amber-100 text-amber-800',
      'Quotation Pending': 'bg-yellow-100 text-yellow-800',
      'Quotation Sent': 'bg-orange-100 text-orange-800',
      'Order Won': 'bg-emerald-100 text-emerald-800',
      'Order Lost': 'bg-rose-100 text-rose-800',
      'Advance Pending': 'bg-pink-100 text-pink-800',
      'Purchase Pending': 'bg-violet-100 text-violet-800',
      'Production Pending': 'bg-purple-100 text-purple-800',
      'In Production': 'bg-indigo-100 text-indigo-800',
      'Ready to Dispatch': 'bg-teal-100 text-teal-800',
      'Dispatched': 'bg-sky-100 text-sky-800',
      'Installation Scheduled': 'bg-fuchsia-100 text-fuchsia-800',
      'Installation In Progress': 'bg-violet-100 text-violet-800',
      'Final Payment Pending': 'bg-rose-100 text-rose-800',
      'Feedback Unlocked': 'bg-lime-100 text-lime-800',
      'Closed': 'bg-slate-100 text-slate-800'
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900 selection:bg-brand-blue-sky/30">
      {/* Top Banner / Role Switcher Header */}
      <header className="bg-[#0F172A] text-white px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-800 z-50">
        <div className="flex items-center">
          <RenoletLogo height={42} light={true} />
        </div>

        {/* Switcher Dropdown */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3.5 py-2 rounded-xl text-xs">
            <span className="text-slate-400 font-medium">Department Role:</span>
            <select
              value={activeRole}
              onChange={(e) => {
                const newRole = e.target.value as Role;
                setActiveRole(newRole);
                if (newRole !== 'Admin' && (viewMode === 'services_config' || viewMode === 'agents_config' || viewMode === 'lead_scraper')) {
                  setViewMode('dashboard');
                }
                addToast('info', 'Role Switched', `Now viewing Renolet CRM as department: ${newRole}`);
              }}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
            >
              <option value="Admin" className="bg-slate-800">Admin Desk</option>
              <option value="Sales" className="bg-slate-800">Sales Department</option>
              <option value="Quotation" className="bg-slate-800">Quotation Department</option>
              <option value="Accounts" className="bg-slate-800">Accounts Department</option>
              <option value="Purchase" className="bg-slate-800">Purchase Department</option>
              <option value="Production" className="bg-slate-800">Production Department</option>
              <option value="Installation" className="bg-slate-800">Installation Department</option>
            </select>
          </div>

          <button
            onClick={handleResetData}
            className="text-[11px] bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold py-2 px-3.5 rounded-xl border border-slate-700 hover:border-slate-650 transition-colors"
          >
            Reset Demo DB
          </button>
        </div>
      </header>

      {/* Navigation Layout */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left Sidebar */}
        <nav className="bg-slate-50 border-r border-slate-200 w-full md:w-64 p-5 flex flex-col gap-6 text-xs font-semibold text-slate-600">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-3 px-2">Navigation Views</p>
            <button
              onClick={() => setViewMode('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${viewMode === 'dashboard' ? 'bg-white shadow text-slate-900 border border-slate-200' : 'hover:bg-slate-100 text-slate-600'}`}
            >
              <BarChart3 size={16} className="text-slate-400" />
              <span>Dashboard Overview</span>
            </button>
            <button
              onClick={() => setViewMode('pipeline')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${viewMode === 'pipeline' ? 'bg-white shadow text-slate-900 border border-slate-200' : 'hover:bg-slate-100 text-slate-600'}`}
            >
              <LayoutGrid size={16} className="text-slate-400" />
              <span>Interactive Pipeline</span>
            </button>
            <button
              onClick={() => setViewMode('department')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${viewMode === 'department' ? 'bg-white shadow text-slate-900 border border-slate-200' : 'hover:bg-slate-100 text-slate-600'}`}
            >
              <div className="text-brand-blue-sky">{getRoleIcon(activeRole)}</div>
              <span>{activeRole} Workspace</span>
            </button>
            <button
              onClick={() => setViewMode('logs')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${viewMode === 'logs' ? 'bg-white shadow text-slate-900 border border-slate-200' : 'hover:bg-slate-100 text-slate-600'}`}
            >
              <History size={16} className="text-slate-400" />
              <span>Relational Audit Logs</span>
            </button>

            {activeRole === 'Admin' && (
              <>
                <button
                  onClick={() => setViewMode('services_config')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${viewMode === 'services_config' ? 'bg-white shadow text-slate-900 border border-slate-200' : 'hover:bg-slate-100 text-slate-600'}`}
                >
                  <Database size={16} className="text-slate-400" />
                  <span>Services Settings</span>
                </button>
                <button
                  onClick={() => setViewMode('agents_config')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${viewMode === 'agents_config' ? 'bg-white shadow text-slate-900 border border-slate-200' : 'hover:bg-slate-100 text-slate-600'}`}
                >
                  <UserCheck size={16} className="text-slate-400" />
                  <span>Agents Settings</span>
                </button>
                <button
                  onClick={() => setViewMode('lead_scraper')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${viewMode === 'lead_scraper' ? 'bg-white shadow text-slate-900 border border-slate-200' : 'hover:bg-slate-100 text-slate-600'}`}
                >
                  <Terminal size={16} className="text-slate-400" />
                  <span>Google Lead Scrapper</span>
                </button>
              </>
            )}
          </div>

          {/* Quick Info / Role Badge */}
          <div className="mt-auto border-t border-slate-200 pt-5 space-y-2">
            <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-3.5 space-y-1.5">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Logged In Department</span>
              <div className="flex items-center gap-2 text-slate-800 font-bold">
                <span className="text-brand-blue-deep">{getRoleIcon(activeRole)}</span>
                <span>{activeRole} Panel</span>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Panel Content */}
        <main className="flex-1 p-6 md:p-8 space-y-8 overflow-y-auto max-w-[1600px] w-full mx-auto">
          {/* Search, Filter & Quick view Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#F8FAFC] border border-slate-200 rounded-2xl p-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Global Search client name, ticket ID, site address..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-brand-blue-sky transition-colors"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto text-xs font-semibold">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">Filter Status:</span>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Show All Statuses</option>
                <option value="New">New / Ingestion</option>
                <option value="Measurement Pending">Measurement Pending</option>
                <option value="Quotation Pending">Quotation Pending</option>
                <option value="Quotation Sent">Quotation Sent</option>
                <option value="Advance Pending">Advance Pending</option>
                <option value="Purchase Pending">Purchase Pending</option>
                <option value="Production Pending">Production Pending</option>
                <option value="In Production">In Production</option>
                <option value="Ready to Dispatch">Ready to Dispatch</option>
                <option value="Installation Scheduled">Installation Scheduled</option>
                <option value="Installation In Progress">Installation In Progress</option>
                <option value="Final Payment Pending">Final Payment Pending</option>
                <option value="Feedback Unlocked">Feedback Unlocked</option>
                <option value="Closed">Lead Closed / Archived</option>
              </select>
            </div>
          </div>

          {/* Dynamic Content Views */}
          {viewMode === 'dashboard' && (
            <div className="space-y-6">
              <DashboardOverview leads={filteredLeads} vendorBills={vendorBills} />
              
              {/* Dynamic Data Table (Technical Requirement) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Table className="w-4.5 h-4.5 text-brand-blue-sky" />
                    Interactive Client Data Table
                  </h3>
                  <span className="text-xs text-slate-400 font-bold">Showing {filteredLeads.length} of {leads.length} rows</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="py-2.5">Lead ID</th>
                        <th className="py-2.5">Client Details</th>
                        <th className="py-2.5">Service Required</th>
                        <th className="py-2.5">Source</th>
                        <th className="py-2.5">Workflow Status</th>
                        <th className="py-2.5 text-right">Last Updated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredLeads.map(lead => (
                        <tr key={lead.id} className="hover:bg-slate-50/50">
                          <td className="py-3 font-mono font-bold text-slate-700">{lead.id}</td>
                          <td className="py-3">
                            <p className="font-bold text-slate-800">{lead.clientName}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{lead.mobile} | {lead.address}</p>
                          </td>
                          <td className="py-3 font-medium">{lead.serviceRequired}</td>
                          <td className="py-3">
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium text-[10px]">
                              {lead.source}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${getBadgeColor(lead.status)}`}>
                              {lead.status}
                            </span>
                          </td>
                          <td className="py-3 text-right font-medium text-slate-400">
                            {new Date(lead.updatedAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                      {filteredLeads.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            No records matching filter parameters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {viewMode === 'pipeline' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Interactive Kanban Pipeline</h3>
                <p className="text-xs text-slate-500 mt-0.5">Click any ticket card below to view details or proceed in the active workspace</p>
              </div>
              <KanbanView
                leads={filteredLeads}
                onSelectLead={(lead) => {
                  // Switch view to department view and select lead in department dashboard
                  setViewMode('department');
                  addToast('info', 'Ticket Selected', `Loading active workspace for client: ${lead.clientName}`);
                }}
              />
            </div>
          )}

          {viewMode === 'logs' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <History className="w-5 h-5 text-brand-blue-deep" />
                <h3 className="font-bold text-slate-800 text-sm">Renolet Enterprise Audit Trail</h3>
              </div>
              <p className="text-xs text-slate-500">Chronological history of lead movements, quotation versions, financial confirmations, and status actions:</p>
              <div className="space-y-3.5 max-h-[600px] overflow-y-auto pr-1">
                {logs.map((log) => (
                  <div key={log.id} className="border border-slate-100 rounded-xl p-4 hover:bg-slate-50/50 flex gap-4">
                    <div className="flex-shrink-0 flex flex-col items-center">
                      <span className="p-2 bg-slate-100 text-slate-700 rounded-lg">
                        {getRoleIcon(log.role)}
                      </span>
                      <div className="w-[1.5px] bg-slate-200 flex-1 mt-2"></div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-bold text-slate-850">{log.role} Department</span>
                        <span className="text-[10px] text-slate-400 font-mono">Lead: {log.leadId}</span>
                        <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-slate-800 font-semibold">{log.action}</p>
                      {log.notes && (
                        <p className="text-xs bg-slate-50 border border-slate-100 text-slate-500 rounded-lg p-2.5 mt-1.5 italic">
                          {log.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {logs.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-6">No workflow activities recorded yet.</p>
                )}
              </div>
            </div>
          )}

          {viewMode === 'services_config' && activeRole === 'Admin' && (
            <div className="animate-fade-in">
              <AdminDashboard
                mode="services"
                leads={leads}
                services={services}
                onRefreshData={refreshData}
                addToast={addToast}
              />
            </div>
          )}

          {viewMode === 'agents_config' && activeRole === 'Admin' && (
            <div className="animate-fade-in">
              <AdminDashboard
                mode="agents"
                leads={leads}
                services={services}
                onRefreshData={refreshData}
                addToast={addToast}
              />
            </div>
          )}

          {viewMode === 'lead_scraper' && activeRole === 'Admin' && (
            <div className="animate-fade-in">
              <GoogleLeadScraperView
                onRefreshData={refreshData}
                addToast={addToast}
              />
            </div>
          )}

          {viewMode === 'department' && (
            <div className="animate-fade-in">
              {activeRole === 'Admin' && (
                <AdminDashboard
                  mode="leads"
                  leads={leads}
                  services={services}
                  onRefreshData={refreshData}
                  addToast={addToast}
                />
              )}
              {activeRole === 'Sales' && (
                <SalesDashboard
                  leads={leads}
                  onRefreshData={refreshData}
                  addToast={addToast}
                />
              )}
              {activeRole === 'Quotation' && (
                <QuotationDashboard
                  leads={leads}
                  onRefreshData={refreshData}
                  addToast={addToast}
                />
              )}
              {activeRole === 'Accounts' && (
                <AccountsDashboard
                  leads={leads}
                  vendorBills={vendorBills}
                  onRefreshData={refreshData}
                  addToast={addToast}
                />
              )}
              {activeRole === 'Purchase' && (
                <PurchaseDashboard
                  leads={leads}
                  onRefreshData={refreshData}
                  addToast={addToast}
                />
              )}
              {activeRole === 'Production' && (
                <ProductionDashboard
                  leads={leads}
                  onRefreshData={refreshData}
                  addToast={addToast}
                />
              )}
              {activeRole === 'Installation' && (
                <InstallationDashboard
                  leads={leads}
                  onRefreshData={refreshData}
                  addToast={addToast}
                />
              )}
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-3.5 text-center text-xs text-slate-500 font-medium">
        Developed By <span className="text-slate-800 font-bold">Dhanush B Shetty</span> (
        <a 
          href="https://www.digimantraa.in" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-brand-blue-sky hover:text-brand-blue-deep font-semibold underline transition-colors"
        >
          www.digimantraa.in
        </a>)
      </footer>

      {/* Global Toasts rendering */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

export default App;
