import React from 'react';
import type { Lead, LeadStatus } from '../types';
import { User, MapPin, Clock } from 'lucide-react';

interface KanbanViewProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
}

interface Column {
  id: string;
  title: string;
  statuses: LeadStatus[];
  color: string;
}

export const KanbanView: React.FC<KanbanViewProps> = ({ leads, onSelectLead }) => {
  const columns: Column[] = [
    {
      id: 'ingestion',
      title: 'Ingestion & Sales',
      statuses: ['New', 'Assigned', 'Measurement Pending'],
      color: 'border-t-blue-500 bg-blue-50/20'
    },
    {
      id: 'quotation',
      title: 'Quotation Desk',
      statuses: ['Quotation Pending', 'Quotation Sent'],
      color: 'border-t-amber-500 bg-amber-50/20'
    },
    {
      id: 'finance',
      title: 'Accounts & Advance',
      statuses: ['Order Won', 'Order Lost', 'Advance Pending'],
      color: 'border-t-emerald-500 bg-emerald-50/20'
    },
    {
      id: 'purchase',
      title: 'Purchase & Vendor',
      statuses: ['Purchase Pending'],
      color: 'border-t-indigo-500 bg-indigo-50/20'
    },
    {
      id: 'production',
      title: 'Production Unit',
      statuses: ['Production Pending', 'In Production', 'Ready to Dispatch', 'Dispatched'],
      color: 'border-t-purple-500 bg-purple-50/20'
    },
    {
      id: 'installation',
      title: 'Installation & Closure',
      statuses: ['Installation Scheduled', 'Installation In Progress', 'Final Payment Pending', 'Feedback Unlocked', 'Closed'],
      color: 'border-t-pink-500 bg-pink-50/20'
    }
  ];

  const getBadgeStyle = (status: LeadStatus) => {
    const styles: Record<LeadStatus, string> = {
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
    return styles[status] || 'bg-slate-100 text-slate-800';
  };

  return (
    <div className="flex flex-row gap-4 overflow-x-auto pb-4 scrollbar-thin">
      {columns.map(col => {
        const colLeads = leads.filter(l => col.statuses.includes(l.status));
        return (
          <div
            key={col.id}
            className={`min-h-[500px] border-t-4 rounded-xl border border-slate-200 flex flex-col p-3 transition-colors min-w-[260px] max-w-[280px] flex-shrink-0 ${col.color}`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="font-semibold text-slate-800 text-sm truncate" title={col.title}>{col.title}</h3>
              <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full font-bold">
                {colLeads.length}
              </span>
            </div>

            {/* Column Body / Lead Cards */}
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto max-h-[600px] pr-1">
              {colLeads.map(lead => (
                <div
                  key={lead.id}
                  onClick={() => onSelectLead(lead)}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-brand-blue-sky cursor-pointer transition-all duration-200 space-y-3 relative group"
                >
                  {/* Lead ID & Ingestion Badge */}
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-bold tracking-wide uppercase">{lead.id}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getBadgeStyle(lead.status)}`}>
                      {lead.status}
                    </span>
                  </div>

                  {/* Name and Service */}
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm group-hover:text-brand-blue-sky transition-colors">
                      {lead.clientName}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">{lead.serviceRequired}</p>
                  </div>

                  {/* Icon details */}
                  <div className="space-y-1.5 pt-1 text-[11px] text-slate-500 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                      <span className="truncate">{lead.address}</span>
                    </div>
                    {lead.assignedSalesMember && (
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                        <span className="truncate">{lead.assignedSalesMember}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                      <span>Updated: {new Date(lead.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Order Value indicator if Won */}
                  {lead.handoffDetails && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>Order Value:</span>
                      <span className="text-emerald-600">₹{lead.handoffDetails.orderValue.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              ))}

              {colLeads.length === 0 && (
                <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-6 text-slate-400 text-xs text-center">
                  No tickets at this stage
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
