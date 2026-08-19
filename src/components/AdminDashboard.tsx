import React, { useState, useEffect } from 'react';
import type { Lead, Service, Agent, ServiceSubmenu, ServiceSubmenuOption } from '../types';
import { Plus, Trash2, Edit3, UserCheck, Shield, Database, Sparkles } from 'lucide-react';
import { RenoletDatabase, DEFAULT_SUBMENUS } from '../db';

interface AdminDashboardProps {
  leads: Lead[];
  services: Service[];
  onRefreshData: () => void;
  addToast: (type: 'success' | 'error' | 'info', title: string, desc: string) => void;
  mode?: 'leads' | 'services' | 'agents' | 'all';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  leads,
  services,
  onRefreshData,
  addToast,
  mode = 'all'
}) => {
  // Service Master Settings state
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceFormName, setServiceFormName] = useState('');
  const [serviceFormCategory, setServiceFormCategory] = useState<'uPVC' | 'Aluminium' | 'Insect Mesh' | 'Other'>('uPVC');
  const [serviceFormDesc, setServiceFormDesc] = useState('');
  const [serviceFormPrice, setServiceFormPrice] = useState('');

  // Form submenus and inline options manager state
  const [formSubmenus, setFormSubmenus] = useState<ServiceSubmenu[]>([]);
  const [selectedSubmenuId, setSelectedSubmenuId] = useState<string>('');
  const [editingOptId, setEditingOptId] = useState<string | null>(null);
  const [showAddSubmenuInput, setShowAddSubmenuInput] = useState(false);
  const [newSubmenuFormName, setNewSubmenuFormName] = useState('');

  // Agent Master Settings state
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [agentFormName, setAgentFormName] = useState('');
  const [agentFormRole, setAgentFormRole] = useState('Sales Executive');
  const [agentFormEmail, setAgentFormEmail] = useState('');

  // Lead addition manual state
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [leadFormName, setLeadFormName] = useState('');
  const [leadFormMobile, setLeadFormMobile] = useState('');
  const [leadFormEmail, setLeadFormEmail] = useState('');
  const [leadFormAddress, setLeadFormAddress] = useState('');
  const [leadFormSource, setLeadFormSource] = useState<'Web Scrape' | 'Manual Add' | 'Social Media' | 'Website' | 'WhatsApp' | 'Call'>('Manual Add');
  const [leadFormService, setLeadFormService] = useState(services[0]?.name || 'uPVC Windows (Casement)');
  const [leadFormNotes, setLeadFormNotes] = useState('');

  // Assign lead state
  const [selectedLeadForAssign, setSelectedLeadForAssign] = useState<Lead | null>(null);
  const [assigneeName, setAssigneeName] = useState('John Doe (Sales)');
  const [meetingDate, setMeetingDate] = useState('');

  // Initialize formSubmenus with DEFAULT_SUBMENUS by default when form is in create mode
  useEffect(() => {
    if (!editingServiceId) {
      const defaultCopy = JSON.parse(JSON.stringify(DEFAULT_SUBMENUS));
      setFormSubmenus(defaultCopy);
      setSelectedSubmenuId(defaultCopy[0]?.id || '');
    }
  }, [editingServiceId]);

  // Automatically select first available agent as default when assignment opens
  useEffect(() => {
    if (selectedLeadForAssign) {
      const activeAgents = RenoletDatabase.getAgents();
      if (activeAgents.length > 0) {
        setAssigneeName(activeAgents[0].name);
      }
    }
  }, [selectedLeadForAssign]);

  // Add/Edit Service CRUD
  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceFormName.trim()) return;

    const currentServices = RenoletDatabase.getServices();
    const priceVal = parseFloat(serviceFormPrice) || 0;

    if (editingServiceId) {
      // Edit
      const updated = currentServices.map(s => {
        if (s.id === editingServiceId) {
          return {
            ...s,
            name: serviceFormName,
            category: serviceFormCategory,
            description: serviceFormDesc,
            basePrice: priceVal,
            submenus: formSubmenus
          };
        }
        return s;
      });
      RenoletDatabase.saveServices(updated);
      addToast('success', 'Service Updated', `Service "${serviceFormName}" updated successfully.`);
      setEditingServiceId(null);
    } else {
      // Create new with options packages
      const newService: Service = {
        id: `S-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        name: serviceFormName,
        category: serviceFormCategory,
        description: serviceFormDesc,
        basePrice: priceVal,
        submenus: formSubmenus,
        isActive: true
      };
      currentServices.push(newService);
      RenoletDatabase.saveServices(currentServices);
      addToast('success', 'Service Added', `Service "${serviceFormName}" added to Master Config with configured submenus.`);
    }

    // Reset Form
    setServiceFormName('');
    setServiceFormDesc('');
    setServiceFormPrice('');
    const defaultCopy = JSON.parse(JSON.stringify(DEFAULT_SUBMENUS));
    setFormSubmenus(defaultCopy);
    setSelectedSubmenuId(defaultCopy[0]?.id || '');
    onRefreshData();
  };

  const handleEditServiceClick = (svc: Service) => {
    setEditingServiceId(svc.id);
    setServiceFormName(svc.name);
    setServiceFormCategory(svc.category);
    setServiceFormDesc(svc.description);
    setServiceFormPrice(svc.basePrice?.toString() || '0');
    
    // Load existing submenus or fall back to DEFAULT_SUBMENUS
    const subList = svc.submenus && svc.submenus.length > 0
      ? JSON.parse(JSON.stringify(svc.submenus))
      : JSON.parse(JSON.stringify(DEFAULT_SUBMENUS));
    setFormSubmenus(subList);
    setSelectedSubmenuId(subList[0]?.id || '');
  };

  const handleDeleteService = (id: string, name: string) => {
    const currentServices = RenoletDatabase.getServices();
    const updated = currentServices.filter(s => s.id !== id);
    RenoletDatabase.saveServices(updated);
    addToast('info', 'Service Deleted', `Service "${name}" removed from Master Settings.`);
    onRefreshData();
  };

  // Add/Edit Agent CRUD
  const handleSaveAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentFormName.trim()) return;

    const currentAgents = RenoletDatabase.getAgents();
    if (editingAgentId) {
      // Edit
      const updated = currentAgents.map(a => {
        if (a.id === editingAgentId) {
          return { ...a, name: agentFormName, role: agentFormRole, email: agentFormEmail };
        }
        return a;
      });
      RenoletDatabase.saveAgents(updated);
      addToast('success', 'Agent Updated', `Agent "${agentFormName}" details updated.`);
      setEditingAgentId(null);
    } else {
      // Create new
      const newAgent: Agent = {
        id: `A-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        name: agentFormName,
        role: agentFormRole,
        email: agentFormEmail || `${agentFormName.toLowerCase().replace(' ', '')}@renolet.com`,
        isActive: true
      };
      currentAgents.push(newAgent);
      RenoletDatabase.saveAgents(currentAgents);
      addToast('success', 'Agent Registered', `Agent "${agentFormName}" registered successfully.`);
    }

    // Reset Form
    setAgentFormName('');
    setAgentFormRole('Sales Executive');
    setAgentFormEmail('');
    onRefreshData();
  };

  const handleEditAgentClick = (agent: Agent) => {
    setEditingAgentId(agent.id);
    setAgentFormName(agent.name);
    setAgentFormRole(agent.role);
    setAgentFormEmail(agent.email);
  };

  const handleDeleteAgent = (id: string, name: string) => {
    const currentAgents = RenoletDatabase.getAgents();
    const updated = currentAgents.filter(a => a.id !== id);
    RenoletDatabase.saveAgents(updated);
    addToast('info', 'Agent Deleted', `Agent "${name}" removed from registry.`);
    onRefreshData();
  };

  // Lead Manual Add
  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadFormName.trim() || !leadFormMobile.trim()) {
      addToast('error', 'Fields Missing', 'Client Name and Contact Number are required.');
      return;
    }

    const currentLeads = RenoletDatabase.getLeads();
    const newLead: Lead = {
      id: `L-${Math.floor(1000 + Math.random() * 9000)}`,
      clientName: leadFormName,
      mobile: leadFormMobile,
      email: leadFormEmail || `${leadFormName.toLowerCase().replace(' ', '')}@mail.com`,
      address: leadFormAddress,
      source: leadFormSource,
      serviceRequired: leadFormService,
      status: 'New',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: leadFormNotes
    };

    currentLeads.push(newLead);
    RenoletDatabase.saveLeads(currentLeads);
    RenoletDatabase.addLog(newLead.id, 'Admin', `Lead ingested manually from source: ${leadFormSource}`);

    addToast('success', 'Lead Created', `Lead for "${leadFormName}" created in New status.`);
    setShowAddLeadModal(false);

    // Reset Form
    setLeadFormName('');
    setLeadFormMobile('');
    setLeadFormEmail('');
    setLeadFormAddress('');
    setLeadFormNotes('');
    onRefreshData();
  };

  // Simulated Lead Ingestion (WhatsApp, Web Scrape, Website etc)
  const handleSimulatedIngest = (source: 'Web Scrape' | 'Social Media' | 'Website' | 'WhatsApp' | 'Call') => {
    const mockNames = ['Rohit Sharma', 'Priya Patel', 'David Dhawan', 'Meera Nair', 'Sanjay Dutt', 'Jennifer Lopez'];
    const mockAddresses = ['Flat 503, Tulip Crest, Bandra, Mumbai', 'Villa 9, Omaxe Green, New Delhi', 'House 22, Lane 3, Banjara Hills, Hyderabad', 'Block B, Sector 4, Salt Lake, Kolkata'];
    const mockMobiles = ['+91 99000-88800', '+91 97777-66655', '+91 98888-33322', '+91 94444-11100'];

    const randomName = mockNames[Math.floor(Math.random() * mockNames.length)];
    const randomAddress = mockAddresses[Math.floor(Math.random() * mockAddresses.length)];
    const randomMobile = mockMobiles[Math.floor(Math.random() * mockMobiles.length)];
    const randomService = services[Math.floor(Math.random() * services.length)]?.name || 'uPVC Windows (Casement)';

    const currentLeads = RenoletDatabase.getLeads();
    const newLead: Lead = {
      id: `L-${Math.floor(1000 + Math.random() * 9000)}`,
      clientName: randomName,
      mobile: randomMobile,
      email: `${randomName.toLowerCase().replace(' ', '.')}@demo.in`,
      address: randomAddress,
      source,
      serviceRequired: randomService,
      status: 'New',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: `Auto-ingested via Simulated ${source} API link.`
    };

    currentLeads.push(newLead);
    RenoletDatabase.saveLeads(currentLeads);
    RenoletDatabase.addLog(newLead.id, 'Admin', `Lead auto-ingested via simulated ${source}`);

    addToast('success', `Lead Ingested (${source})`, `New lead "${randomName}" generated automatically.`);
    onRefreshData();
  };

  // Assign Team member
  const handleAssignLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadForAssign) return;

    const leadsList = RenoletDatabase.getLeads();
    const lead = leadsList.find(l => l.id === selectedLeadForAssign.id);
    if (lead) {
      lead.assignedSalesMember = assigneeName;
      lead.status = 'Measurement Pending'; // Sets status to measurement pending
      lead.updatedAt = new Date().toISOString();
      RenoletDatabase.saveLeads(leadsList);
      RenoletDatabase.addLog(
        selectedLeadForAssign.id,
        'Admin',
        `Assigned meeting and lead to ${assigneeName}`,
        meetingDate ? `Site Measurement Visit Scheduled: ${meetingDate}` : undefined
      );

      addToast('success', 'Lead Assigned', `Lead ${lead.id} assigned to ${assigneeName}. Status changed to Measurement Pending.`);
      setSelectedLeadForAssign(null);
      setMeetingDate('');
      onRefreshData();
    }
  };



  const renderServicesCard = () => (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-6">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <Database className="w-5 h-5 text-brand-blue-sky" />
        <h3 className="font-bold text-slate-800 text-sm">Services Settings (Master Config)</h3>
      </div>

      <form onSubmit={handleSaveService} className="space-y-3.5 text-xs text-slate-600">
        <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
          {editingServiceId ? 'Edit Service' : 'Add New Service'}
        </h4>
        <div className="space-y-1">
          <label>Service / Product Name</label>
          <input
            type="text"
            required
            value={serviceFormName}
            onChange={(e) => setServiceFormName(e.target.value)}
            placeholder="e.g. uPVC Sliding Door"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-brand-blue-sky"
          />
        </div>
        <div className="space-y-1">
          <label>Category Group</label>
          <select
            value={serviceFormCategory}
            onChange={(e) => setServiceFormCategory(e.target.value as any)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-brand-blue-sky"
          >
            <option value="uPVC">uPVC Windows & Doors</option>
            <option value="Aluminium">Aluminium Windows</option>
            <option value="Insect Mesh">Insect Mesh Systems</option>
            <option value="Other">Other Accessories</option>
          </select>
        </div>
        <div className="space-y-1">
          <label>Base Price (₹ per unit/sqm)</label>
          <input
            type="number"
            required
            value={serviceFormPrice}
            onChange={(e) => setServiceFormPrice(e.target.value)}
            placeholder="e.g. 15000"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-brand-blue-sky"
          />
        </div>
        <div className="space-y-1">
          <label>Brief Description</label>
          <textarea
            value={serviceFormDesc}
            onChange={(e) => setServiceFormDesc(e.target.value)}
            placeholder="Brief description for sales handouts..."
            rows={2}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-brand-blue-sky"
          />
        </div>

        {/* Manage Submenu Options Dropdown & Inline Options */}
        <div className="space-y-3.5 border-t border-slate-100 pt-3.5">
          <div className="flex justify-between items-center">
            <label className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
              Configure Product Options (Submenus)
            </label>
            
            {/* Add Submenu Button */}
            {!showAddSubmenuInput && (
              <button
                type="button"
                onClick={() => setShowAddSubmenuInput(true)}
                className="text-brand-blue-sky hover:text-brand-blue-deep font-semibold text-[10px] flex items-center gap-0.5"
              >
                + Add New Submenu
              </button>
            )}
          </div>

          {/* Add Submenu Input Box */}
          {showAddSubmenuInput && (
            <div className="flex gap-1.5 items-end bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div className="flex-1 space-y-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase block">New Submenu Name</label>
                <input
                  type="text"
                  value={newSubmenuFormName}
                  onChange={(e) => setNewSubmenuFormName(e.target.value)}
                  placeholder="e.g. Profile Color"
                  className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (newSubmenuFormName.trim()) {
                    const newSub: ServiceSubmenu = {
                      id: `SUB-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
                      name: newSubmenuFormName,
                      options: []
                    };
                    const updated = [...formSubmenus, newSub];
                    setFormSubmenus(updated);
                    setSelectedSubmenuId(newSub.id);
                    setNewSubmenuFormName('');
                    setShowAddSubmenuInput(false);
                    addToast('success', 'Submenu Added', `Submenu "${newSubmenuFormName}" added. Add options below.`);
                  }
                }}
                className="bg-brand-blue-sky hover:bg-brand-blue-deep text-white rounded px-3 py-1 font-bold text-xs"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setShowAddSubmenuInput(false)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 rounded px-2 py-1 text-xs"
              >
                ✕
              </button>
            </div>
          )}

          {/* Submenu Dropdown Selector */}
          <div className="flex gap-2">
            <select
              value={selectedSubmenuId}
              onChange={(e) => setSelectedSubmenuId(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-brand-blue-sky font-semibold text-slate-700 text-xs"
            >
              {formSubmenus.length === 0 ? (
                <option value="">No submenus configured</option>
              ) : (
                formSubmenus.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} Options ({sub.options?.length || 0})
                  </option>
                ))
              )}
            </select>
            
            {/* Delete current Submenu */}
            {selectedSubmenuId && (
              <button
                type="button"
                onClick={() => {
                  const sub = formSubmenus.find(s => s.id === selectedSubmenuId);
                  if (sub) {
                    const updated = formSubmenus.filter(s => s.id !== selectedSubmenuId);
                    setFormSubmenus(updated);
                    setSelectedSubmenuId(updated[0]?.id || '');
                    addToast('info', 'Submenu Removed', `Submenu "${sub.name}" removed from service template.`);
                  }
                }}
                className="text-rose-500 hover:bg-rose-50 border border-rose-200 rounded-lg px-2 py-1 text-xs font-semibold flex items-center justify-center"
                title="Delete this submenu template"
              >
                ✕ Remove
              </button>
            )}
          </div>

          {/* Options list inside selected Submenu */}
          {selectedSubmenuId && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-3">
              {(() => {
                const sub = formSubmenus.find(s => s.id === selectedSubmenuId);
                if (!sub) return null;
                
                return (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-700 uppercase tracking-wider text-[9px]">
                        Options under {sub.name}
                      </span>
                    </div>

                    {/* Options list */}
                    {(!sub.options || sub.options.length === 0) ? (
                      <p className="text-[10px] text-slate-450 italic py-1">No options added yet. Add one below.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                        {sub.options.map((opt) => (
                          <div key={opt.id} className="flex justify-between items-center p-2 rounded bg-white border border-slate-100 text-[10px]">
                            {editingOptId === opt.id ? (
                              <div className="flex gap-1.5 w-full items-center text-xs">
                                <input
                                  type="text"
                                  id={`editOptName-${opt.id}`}
                                  required
                                  defaultValue={opt.name}
                                  className="w-1/2 bg-white border border-slate-200 rounded px-2 py-1 text-[10px] font-bold text-slate-800 focus:outline-none focus:border-brand-blue-sky"
                                />
                                <input
                                  type="number"
                                  id={`editOptPrice-${opt.id}`}
                                  required
                                  defaultValue={opt.price}
                                  className="w-1/4 bg-white border border-slate-200 rounded px-2 py-1 text-[10px] text-slate-700 focus:outline-none focus:border-brand-blue-sky"
                                />
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    const nameEl = document.getElementById(`editOptName-${opt.id}`) as HTMLInputElement;
                                    const priceEl = document.getElementById(`editOptPrice-${opt.id}`) as HTMLInputElement;
                                    if (nameEl && nameEl.value.trim()) {
                                      const updatedSubmenus = formSubmenus.map(s => {
                                        if (s.id === selectedSubmenuId) {
                                          return {
                                            ...s,
                                            options: s.options.map(o => o.id === opt.id ? { ...o, name: nameEl.value, price: parseFloat(priceEl.value) || 0 } : o)
                                          };
                                        }
                                        return s;
                                      });
                                      setFormSubmenus(updatedSubmenus);
                                      setEditingOptId(null);
                                      addToast('success', 'Option Updated', 'Option details updated.');
                                    }
                                  }}
                                  className="text-emerald-600 font-bold text-[10px] hover:text-emerald-800"
                                >
                                  [OK]
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => setEditingOptId(null)} 
                                  className="text-slate-400 font-bold text-[10px] hover:text-slate-650"
                                >
                                  [X]
                                </button>
                              </div>
                            ) : (
                              <>
                                <div>
                                  <span className="font-semibold text-slate-800">{opt.name}</span>
                                  <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1 rounded ml-1.5 font-bold">
                                    +₹{opt.price.toLocaleString('en-IN')}
                                  </span>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setEditingOptId(opt.id)}
                                    className="text-slate-400 hover:text-slate-700 text-[10px] font-semibold"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updatedSubmenus = formSubmenus.map(s => {
                                        if (s.id === selectedSubmenuId) {
                                          return {
                                            ...s,
                                            options: s.options.filter(o => o.id !== opt.id)
                                          };
                                        }
                                        return s;
                                      });
                                      setFormSubmenus(updatedSubmenus);
                                      addToast('info', 'Option Removed', `Removed "${opt.name}" option.`);
                                    }}
                                    className="text-rose-500 hover:text-rose-700"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Inline Add Option Form */}
                    <div className="pt-2 border-t border-slate-200 flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Option (e.g. 2.5 Track)"
                        id={`formOptName-${selectedSubmenuId}`}
                        className="bg-white border border-slate-200 rounded p-1.5 flex-1 focus:outline-none text-[10px]"
                      />
                      <input
                        type="number"
                        placeholder="Price (₹)"
                        id={`formOptPrice-${selectedSubmenuId}`}
                        className="bg-white border border-slate-200 rounded p-1.5 w-[70px] focus:outline-none text-[10px]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const nameEl = document.getElementById(`formOptName-${selectedSubmenuId}`) as HTMLInputElement;
                          const priceEl = document.getElementById(`formOptPrice-${selectedSubmenuId}`) as HTMLInputElement;
                          if (nameEl && nameEl.value.trim()) {
                            const newOpt: ServiceSubmenuOption = {
                              id: `OPT-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
                              name: nameEl.value,
                              price: parseFloat(priceEl.value) || 0
                            };
                            
                            const updatedSubmenus = formSubmenus.map(s => {
                              if (s.id === selectedSubmenuId) {
                                return {
                                  ...s,
                                  options: [...s.options, newOpt]
                                };
                              }
                              return s;
                            });
                            setFormSubmenus(updatedSubmenus);
                            nameEl.value = '';
                            priceEl.value = '';
                            addToast('success', 'Option Added', `Added "${newOpt.name}" to option template.`);
                          }
                        }}
                        className="bg-brand-blue-sky hover:bg-brand-blue-deep text-white rounded px-2.5 py-1.5 font-bold text-[10px]"
                      >
                        + Add
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>

        <div className="pt-2 flex gap-2">
          <button
            type="submit"
            className="bg-brand-blue-deep hover:bg-brand-blue-dark text-white rounded-lg px-4 py-2 font-bold w-full shadow-sm transition-colors"
          >
            {editingServiceId ? 'Update Service' : 'Add to Catalog'}
          </button>
          {editingServiceId && (
            <button
              type="button"
              onClick={() => {
                setEditingServiceId(null);
                setServiceFormName('');
                setServiceFormDesc('');
                setServiceFormPrice('');
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg px-3 py-2 font-bold transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Active Services Listing */}
      <div className="space-y-2 pt-2 border-t border-slate-100 max-h-[350px] overflow-y-auto pr-1">
        <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Catalog Settings</h4>
        {services.map(svc => (
          <div key={svc.id} className="flex justify-between items-start p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 text-xs">
            <div className="max-w-[80%]">
              <p className="font-semibold text-slate-800">{svc.name}</p>
              <div className="flex gap-1.5 items-center mt-1">
                <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                  {svc.category}
                </span>
                <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-extrabold">
                  ₹{svc.basePrice?.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
            <div className="flex gap-1.5 items-center">
              <button
                onClick={() => handleEditServiceClick(svc)}
                className="text-slate-400 hover:text-slate-700 p-1"
                title="Edit Service"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDeleteService(svc.id, svc.name)}
                className="text-slate-400 hover:text-rose-600 p-1"
                title="Delete Service"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAgentsCard = () => (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-6">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <UserCheck className="w-5 h-5 text-brand-blue-sky" />
        <h3 className="font-bold text-slate-800 text-sm">Agents Settings (Master Config)</h3>
      </div>

      <form onSubmit={handleSaveAgent} className="space-y-3.5 text-xs text-slate-600">
        <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
          {editingAgentId ? 'Edit Agent' : 'Register New Agent'}
        </h4>
        <div className="space-y-1">
          <label>Agent Name</label>
          <input
            type="text"
            required
            value={agentFormName}
            onChange={(e) => setAgentFormName(e.target.value)}
            placeholder="e.g. Amit Kumar"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-brand-blue-sky"
          />
        </div>
        <div className="space-y-1">
          <label>Designation / Role</label>
          <input
            type="text"
            required
            value={agentFormRole}
            onChange={(e) => setAgentFormRole(e.target.value)}
            placeholder="e.g. Sales Executive"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-brand-blue-sky"
          />
        </div>
        <div className="space-y-1">
          <label>Email Address</label>
          <input
            type="email"
            value={agentFormEmail}
            onChange={(e) => setAgentFormEmail(e.target.value)}
            placeholder="e.g. amit@renolet.com"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-brand-blue-sky"
          />
        </div>
        <div className="pt-2 flex gap-2">
          <button
            type="submit"
            className="bg-brand-blue-deep hover:bg-brand-blue-dark text-white rounded-lg px-4 py-2 font-bold w-full shadow-sm transition-colors"
          >
            {editingAgentId ? 'Update Agent' : 'Register Agent'}
          </button>
          {editingAgentId && (
            <button
              type="button"
              onClick={() => {
                setEditingAgentId(null);
                setAgentFormName('');
                setAgentFormRole('Sales Executive');
                setAgentFormEmail('');
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg px-3 py-2 font-bold transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Active Agents Listing */}
      <div className="space-y-2 pt-2 border-t border-slate-100 max-h-[350px] overflow-y-auto pr-1">
        <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Registered Team</h4>
        {RenoletDatabase.getAgents().map(agent => (
          <div key={agent.id} className="flex justify-between items-start p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 text-xs">
            <div className="max-w-[80%]">
              <p className="font-semibold text-slate-800">{agent.name}</p>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">{agent.email}</p>
              <span className="text-[9px] bg-blue-50 text-brand-blue-deep px-2 py-0.5 rounded-full font-bold inline-block mt-1">
                {agent.role}
              </span>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => handleEditAgentClick(agent)}
                className="text-slate-400 hover:text-slate-700 p-1"
                title="Edit Agent"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDeleteAgent(agent.id, agent.name)}
                className="text-slate-400 hover:text-rose-600 p-1"
                title="Delete Agent"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (mode === 'services') {
    return (
      <div className="space-y-6 max-w-4xl animate-fade-in">
        <div>
          <h2 className="text-xl font-bold text-slate-850 flex items-center gap-2">
            <Database className="w-6 h-6 text-brand-blue-deep" />
            Services Settings (Master Config)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Configure, edit, and maintain standard window & door systems catalog rates</p>
        </div>
        {renderServicesCard()}
      </div>
    );
  }

  if (mode === 'agents') {
    return (
      <div className="space-y-6 max-w-4xl animate-fade-in">
        <div>
          <h2 className="text-xl font-bold text-slate-850 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-brand-blue-deep" />
            Agents Settings (Master Config)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Register, update, and manage designated sales agents and team designations</p>
        </div>
        {renderAgentsCard()}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top action layout */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Shield className="w-6 h-6 text-brand-blue-deep" />
            {mode === 'leads' ? 'Admin Operations Desk (Lead Distribution Queue)' : 'Admin Operations Panel'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {mode === 'leads'
              ? 'Manage lead ingestion feeds, allocate meetings, and dispatch field sales executives.'
              : 'Control lead ingestion API feeds, service pricing sheets, and sales assignments'}
          </p>
        </div>
        <button
          onClick={() => setShowAddLeadModal(true)}
          className="flex items-center gap-2 bg-brand-blue-deep hover:bg-brand-blue-dark text-white rounded-xl px-4 py-2.5 text-xs font-semibold shadow-md transition-all"
        >
          <Plus className="w-4 h-4" /> Add Lead Manually
        </button>
      </div>

      {/* Simulated Lead Ingestion Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h3 className="font-bold text-slate-800 text-sm">Simulated Lead Ingestion Feeds</h3>
        </div>
        <p className="text-xs text-slate-500">Trigger API imports to simulate live integrations with third party platforms:</p>
        <div className="flex flex-wrap gap-2.5">
          {(['Web Scrape', 'Website', 'WhatsApp', 'Call', 'Social Media'] as const).map(source => (
            <button
              key={source}
              onClick={() => handleSimulatedIngest(source)}
              className="bg-white border border-slate-200 hover:border-brand-blue-sky hover:text-brand-blue-sky text-slate-700 font-semibold px-4 py-2 rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>Import from</span>
              <strong className="text-slate-900 hover:text-brand-blue-sky">{source}</strong>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Services & Agents Settings */}
        {mode === 'all' && (
          <div className="space-y-6">
            {renderServicesCard()}
            {renderAgentsCard()}
          </div>
        )}

        {/* Lead Table and Assignee workflow */}
        <div className={`bg-white border border-slate-200 rounded-2xl p-5 space-y-4 ${mode === 'leads' ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3">Unassigned Lead Queue</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-2.5">Lead Details</th>
                  <th className="py-2.5">Source</th>
                  <th className="py-2.5">Required Service</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.filter(l => l.status === 'New').map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-50/50">
                    <td className="py-3">
                      <p className="font-bold text-slate-800">{lead.clientName}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{lead.mobile} | {lead.address}</p>
                    </td>
                    <td className="py-3">
                      <span className="bg-blue-50 text-blue-700 font-semibold px-2.5 py-1 rounded-full text-[10px]">
                        {lead.source}
                      </span>
                    </td>
                    <td className="py-3 font-medium text-slate-700">{lead.serviceRequired}</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => setSelectedLeadForAssign(lead)}
                        className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-3 py-1.5 font-bold flex items-center gap-1.5 text-[10px] ml-auto transition-colors shadow-sm"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Assign Agent
                      </button>
                    </td>
                  </tr>
                ))}
                {leads.filter(l => l.status === 'New').length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      No new unassigned leads in the queue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>


      {/* Manual Add Lead Overlay */}
      {showAddLeadModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-800 text-sm">Add Client Lead Manually</h4>
              <button onClick={() => setShowAddLeadModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateLead} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
              <div className="space-y-1">
                <label>Client Full Name *</label>
                <input
                  type="text"
                  required
                  value={leadFormName}
                  onChange={(e) => setLeadFormName(e.target.value)}
                  placeholder="e.g. Amitabh Bachchan"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-brand-blue-sky"
                />
              </div>

              <div className="space-y-1">
                <label>Contact Phone Number *</label>
                <input
                  type="text"
                  required
                  value={leadFormMobile}
                  onChange={(e) => setLeadFormMobile(e.target.value)}
                  placeholder="e.g. +91 99887-76655"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-brand-blue-sky"
                />
              </div>

              <div className="space-y-1">
                <label>Client Email Address</label>
                <input
                  type="email"
                  value={leadFormEmail}
                  onChange={(e) => setLeadFormEmail(e.target.value)}
                  placeholder="e.g. amitabh@bachchan.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-brand-blue-sky"
                />
              </div>

              <div className="space-y-1">
                <label>Lead Source Feed</label>
                <select
                  value={leadFormSource}
                  onChange={(e) => setLeadFormSource(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-brand-blue-sky"
                >
                  <option value="Manual Add">Manual Add</option>
                  <option value="Website">Website Form</option>
                  <option value="Social Media">Social Media Advert</option>
                  <option value="WhatsApp">WhatsApp Inquiry</option>
                  <option value="Call">Phone Call</option>
                </select>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label>Required Service Catalog Option</label>
                <select
                  value={leadFormService}
                  onChange={(e) => setLeadFormService(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-brand-blue-sky"
                >
                  {services.map(svc => (
                    <option key={svc.id} value={svc.name}>{svc.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label>Site Delivery Address</label>
                <input
                  type="text"
                  value={leadFormAddress}
                  onChange={(e) => setLeadFormAddress(e.target.value)}
                  placeholder="e.g. Juhu Bungalow Road, Juhu, Mumbai"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-brand-blue-sky"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label>Additional Notes / Requirement details</label>
                <textarea
                  value={leadFormNotes}
                  onChange={(e) => setLeadFormNotes(e.target.value)}
                  placeholder="Any details concerning opening size, frame colors, mesh types, etc..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-brand-blue-sky"
                />
              </div>

              <div className="pt-2 md:col-span-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddLeadModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl py-3 font-semibold w-1/2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-brand-blue-deep hover:bg-brand-blue-dark text-white rounded-xl py-3 font-semibold w-1/2 transition-colors shadow-md"
                >
                  Create Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assignee Meeting Modal */}
      {selectedLeadForAssign && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-800 text-sm">Assign Lead & Schedule Site Meeting</h4>
              <button onClick={() => setSelectedLeadForAssign(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleAssignLead} className="space-y-4 text-xs text-slate-600">
              <div>
                <p className="font-medium text-slate-700">Lead Client:</p>
                <p className="text-slate-900 font-bold mt-0.5">{selectedLeadForAssign.clientName} ({selectedLeadForAssign.serviceRequired})</p>
              </div>

              <div className="space-y-1">
                <label>Select Sales Agent</label>
                <select
                  value={assigneeName}
                  onChange={(e) => setAssigneeName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-brand-blue-sky font-semibold text-slate-700"
                >
                  {RenoletDatabase.getAgents().map(agent => (
                    <option key={agent.id} value={`${agent.name} (${agent.role})`}>
                      {agent.name} ({agent.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label>Site Visit Date & Time (Optional)</label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-brand-blue-sky"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedLeadForAssign(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl py-2.5 font-semibold w-1/2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-brand-blue-deep hover:bg-brand-blue-dark text-white rounded-xl py-2.5 font-semibold w-1/2 transition-colors shadow-md"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
