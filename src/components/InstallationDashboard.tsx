import React, { useState } from 'react';
import type { Lead } from '../types';
import { Wrench, CheckCircle, ShieldAlert, Sparkles } from 'lucide-react';
import { RenoletDatabase } from '../db';
import { FeedbackForm } from './FeedbackForm';

interface InstallationDashboardProps {
  leads: Lead[];
  onRefreshData: () => void;
  addToast: (type: 'success' | 'error' | 'info', title: string, desc: string) => void;
}

export const InstallationDashboard: React.FC<InstallationDashboardProps> = ({
  leads,
  onRefreshData,
  addToast
}) => {
  const [selectedLeadForFeedback, setSelectedLeadForFeedback] = useState<Lead | null>(null);
  
  // Site scheduling state
  const [selectedLeadForSchedule, setSelectedLeadForSchedule] = useState<Lead | null>(null);
  const [visitDate, setVisitDate] = useState('');
  const [installationNotes, setInstallationNotes] = useState('');

  // Save Schedule Site Visit
  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadForSchedule) return;

    const leadsList = RenoletDatabase.getLeads();
    const lead = leadsList.find(l => l.id === selectedLeadForSchedule.id);

    if (lead) {
      lead.status = 'Installation In Progress';
      lead.updatedAt = new Date().toISOString();
      if (lead.notes && installationNotes) {
        lead.notes += `\n[Installation Schedule]: Visit on ${visitDate}. Notes: ${installationNotes}`;
      } else if (installationNotes) {
        lead.notes = `[Installation Schedule]: Visit on ${visitDate}. Notes: ${installationNotes}`;
      }
      RenoletDatabase.saveLeads(leadsList);

      RenoletDatabase.addLog(
        selectedLeadForSchedule.id,
        'Installation',
        `Site visit scheduled for ${visitDate}`,
        `Installation instructions: ${installationNotes}`
      );

      addToast('success', 'Installation Active', `Site visit scheduled. Status updated to Installation In Progress.`);
      setSelectedLeadForSchedule(null);
      setVisitDate('');
      setInstallationNotes('');
      onRefreshData();
    }
  };

  // Complete installation and request balance payment
  const handleRequestFinalPayment = (leadId: string) => {
    RenoletDatabase.updateLeadStatus(
      leadId,
      'Final Payment Pending',
      'Installation',
      'Fitting completed successfully. Dispatching collection invoice to Accounts Department.'
    );
    addToast('success', 'Installation Done', 'Fitting verified. Final collection invoice sent to Accounts.');
    onRefreshData();
  };

  const handleFeedbackSubmitted = () => {
    setSelectedLeadForFeedback(null);
    onRefreshData();
  };

  // Filter queues
  const installationQueue = leads.filter(l => [
    'Installation Scheduled',
    'Installation In Progress',
    'Final Payment Pending',
    'Feedback Unlocked',
    'Closed'
  ].includes(l.status));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Wrench className="w-6 h-6 text-brand-blue-deep" />
          Onsite Fitting & Installation
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">Schedule onsite installation tasks, log status, and unlock customer reviews</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: Installation Queue */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 h-fit">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 flex justify-between items-center">
            <span>Fitting & Installation Jobs</span>
            <span className="bg-pink-100 text-pink-800 font-bold px-2.5 py-0.5 rounded-full text-xs">
              {installationQueue.length}
            </span>
          </h3>

          <div className="space-y-3.5 max-h-[550px] overflow-y-auto pr-1">
            {installationQueue.map(lead => (
              <div
                key={lead.id}
                className={`border rounded-xl p-4 transition-all ${
                  selectedLeadForFeedback?.id === lead.id ? 'border-brand-blue-sky bg-blue-50/20' : 'border-slate-100 hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-slate-800 text-xs truncate max-w-[150px]">{lead.clientName}</h4>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    lead.status === 'Closed' ? 'bg-slate-100 text-slate-800' :
                    lead.status === 'Feedback Unlocked' ? 'bg-lime-100 text-lime-800' :
                    lead.status === 'Final Payment Pending' ? 'bg-rose-100 text-rose-800' : 'bg-pink-50 text-pink-700'
                  }`}>
                    {lead.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">{lead.serviceRequired}</p>

                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                  {/* Actions depending on status */}
                  {lead.status === 'Installation Scheduled' && (
                    <button
                      onClick={() => setSelectedLeadForSchedule(lead)}
                      className="bg-brand-blue-deep hover:bg-brand-blue-dark text-white rounded-lg px-3 py-1.5 font-bold text-[10px] shadow-sm transition-colors w-full text-center"
                    >
                      Schedule Visit & Start
                    </button>
                  )}
                  {lead.status === 'Installation In Progress' && (
                    <button
                      onClick={() => handleRequestFinalPayment(lead.id)}
                      className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-3 py-1.5 font-bold text-[10px] shadow-sm transition-colors w-full text-center"
                    >
                      Complete & Ask Final Payment
                    </button>
                  )}
                  {lead.status === 'Final Payment Pending' && (
                    <div className="text-[10px] text-amber-700 font-bold bg-amber-50 p-2 rounded-lg w-full flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" /> Awaiting Accounts payment clearance
                    </div>
                  )}
                  {lead.status === 'Feedback Unlocked' && (
                    <button
                      onClick={() => setSelectedLeadForFeedback(lead)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-3 py-1.5 font-bold text-[10px] shadow-sm transition-colors w-full text-center"
                    >
                      Unlock Feedback Form
                    </button>
                  )}
                  {lead.status === 'Closed' && (
                    <div className="text-[10px] text-emerald-700 font-bold bg-emerald-50 p-2 rounded-lg w-full flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" /> Order Completed & Archived
                    </div>
                  )}
                </div>
              </div>
            ))}
            {installationQueue.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">No installation tickets active.</p>
            )}
          </div>
        </div>

        {/* Right Panel: Workspaces */}
        <div className="lg:col-span-2">
          {/* Option A: Feedback Form */}
          {selectedLeadForFeedback && (
            <FeedbackForm
              lead={selectedLeadForFeedback}
              onFeedbackSubmitted={handleFeedbackSubmitted}
              addToast={addToast}
            />
          )}

          {/* Option B: Scheduling Form */}
          {selectedLeadForSchedule && !selectedLeadForFeedback && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-base">Schedule Site Visit Appointment</h3>
                <p className="text-xs text-slate-500 mt-0.5">Assign date and dispatch instructions for Lead {selectedLeadForSchedule.id}</p>
              </div>

              <form onSubmit={handleSaveSchedule} className="space-y-4 text-xs text-slate-600">
                <div className="space-y-1">
                  <label className="font-bold">Site Visit Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold">Installation Team Instructions</label>
                  <textarea
                    value={installationNotes}
                    onChange={(e) => setInstallationNotes(e.target.value)}
                    placeholder="Specify delivery vehicle number, key contacts on-site, safety gear directives, etc..."
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedLeadForSchedule(null)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl py-2.5 font-semibold w-1/2 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-brand-blue-deep hover:bg-brand-blue-dark text-white rounded-xl py-2.5 font-semibold w-1/2 transition-colors shadow-md"
                  >
                    Schedule & Start Installation
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Option C: Default Idle Screen */}
          {!selectedLeadForFeedback && !selectedLeadForSchedule && (
            <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3 h-[400px]">
              <Sparkles className="w-10 h-10 text-slate-300" />
              <h4 className="font-bold text-slate-600 text-sm">No Active Ticket Loaded</h4>
              <p className="text-xs text-slate-400 max-w-xs">
                Select an installation job from the left panel to schedule a visit or launch the handover feedback form when payment clears.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
