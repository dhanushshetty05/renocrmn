import React, { useState } from 'react';
import type { Lead } from '../types';
import { FileText, Sparkles } from 'lucide-react';
import { RenoletDatabase } from '../db';
import { QuotationCreator } from './QuotationCreator';

interface QuotationDashboardProps {
  leads: Lead[];
  onRefreshData: () => void;
  addToast: (type: 'success' | 'error' | 'info', title: string, desc: string) => void;
}

export const QuotationDashboard: React.FC<QuotationDashboardProps> = ({
  leads,
  onRefreshData,
  addToast
}) => {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Filters leads in Quotation Pending stage
  const pendingQueue = leads.filter(l => l.status === 'Quotation Pending' || l.status === 'Quotation Sent');

  const handleQuotationCreated = () => {
    setSelectedLead(null);
    onRefreshData();
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <FileText className="w-6 h-6 text-brand-blue-deep" />
          Quotation Creator Desk
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">Generate estimates from site dimensions and manage version catalogs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Pending Queue */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 h-fit">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 flex justify-between items-center">
            <span>Pending Quotation Tickets</span>
            <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full text-xs">
              {pendingQueue.length}
            </span>
          </h3>

          <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
            {pendingQueue.map(lead => {
              const ticket = RenoletDatabase.getMeasurements().find(m => m.leadId === lead.id);
              const quotes = RenoletDatabase.getQuotations().filter(q => q.leadId === lead.id);
              return (
                <div
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className={`border rounded-xl p-4 cursor-pointer transition-all ${selectedLead?.id === lead.id ? 'border-brand-blue-sky bg-blue-50/20' : 'border-slate-100 hover:bg-slate-50'}`}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-800 text-xs truncate max-w-[150px]">{lead.clientName}</h4>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${lead.status === 'Quotation Sent' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'}`}>
                      {lead.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{lead.serviceRequired}</p>
                  
                  {ticket && (
                    <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400 space-y-0.5">
                      <p>Dimensions: {ticket.measurements.length} Items cataloged</p>
                      <p>Measured: {new Date(ticket.submittedAt).toLocaleDateString()}</p>
                    </div>
                  )}

                  {quotes.length > 0 && (
                    <p className="text-[9px] text-brand-blue-deep font-semibold mt-2">
                      Has {quotes.length} versions generated
                    </p>
                  )}
                </div>
              );
            })}

            {pendingQueue.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">No quotation tickets pending.</p>
            )}
          </div>
        </div>

        {/* Right Side: Active Workspace */}
        <div className="lg:col-span-2">
          {selectedLead ? (
            <QuotationCreator
              lead={selectedLead}
              measurementTicket={RenoletDatabase.getMeasurements().find(m => m.leadId === selectedLead.id)}
              onQuotationCreated={handleQuotationCreated}
              addToast={addToast}
            />
          ) : (
            <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3 h-[400px]">
              <Sparkles className="w-10 h-10 text-slate-300" />
              <h4 className="font-bold text-slate-600 text-sm">No Active Ticket Selected</h4>
              <p className="text-xs text-slate-400 max-w-xs">
                Select a client ticket from the left panel to load site measurement details and construct the estimates.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
