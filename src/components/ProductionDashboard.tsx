import React from 'react';
import type { Lead, LeadStatus } from '../types';
import { Hammer, Clock } from 'lucide-react';
import { RenoletDatabase } from '../db';

interface ProductionDashboardProps {
  leads: Lead[];
  onRefreshData: () => void;
  addToast: (type: 'success' | 'error' | 'info', title: string, desc: string) => void;
}

export const ProductionDashboard: React.FC<ProductionDashboardProps> = ({
  leads,
  onRefreshData,
  addToast
}) => {
  // Filter active production queue
  const productionQueue = leads.filter(l => [
    'Production Pending',
    'In Production',
    'Ready to Dispatch',
    'Dispatched'
  ].includes(l.status));

  const handleUpdateStatus = (leadId: string, value: string) => {
    let nextStatus: LeadStatus = 'In Production';
    let msg = '';

    if (value === 'Working') {
      nextStatus = 'In Production';
      msg = 'Order is now on the workshop assembly line.';
    } else if (value === 'Hold') {
      nextStatus = 'Production Pending'; // or we keep custom hold states, let's log hold notes
      msg = 'Order assembly suspended.';
    } else if (value === 'Finished' || value === 'Ready To Dispatch') {
      nextStatus = 'Ready to Dispatch';
      msg = 'Product quality checks finished. Ready to load onto transport.';
    } else if (value === 'Dispatched') {
      nextStatus = 'Installation Scheduled'; // Automatically moves to Installation
      msg = 'Products dispatched to client site. Transferred to Installation Department.';
    }

    RenoletDatabase.updateLeadStatus(leadId, nextStatus, 'Production', msg);
    addToast(
      value === 'Dispatched' ? 'success' : 'info',
      `Production: ${value}`,
      `Lead ${leadId} status set to: ${nextStatus}.`
    );
    onRefreshData();
  };

  const getActiveDropdownVal = (status: LeadStatus): string => {
    if (status === 'Production Pending') return 'Hold';
    if (status === 'In Production') return 'Working';
    if (status === 'Ready to Dispatch') return 'Ready To Dispatch';
    if (status === 'Dispatched' || status === 'Installation Scheduled') return 'Dispatched';
    return 'Working';
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Hammer className="w-6 h-6 text-brand-blue-deep" />
          Manufacturing & Production Queue
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">Track window and door assembly processes on the shop floor and dispatch finished items</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 flex justify-between items-center">
          <span>Active Workshop Queue</span>
          <span className="bg-purple-100 text-purple-800 font-bold px-2.5 py-0.5 rounded-full text-xs">
            {productionQueue.length}
          </span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-2.5">Order Ref</th>
                <th className="py-2.5">Client Details</th>
                <th className="py-2.5">Fabrication Specs</th>
                <th className="py-2.5">Schedule Target</th>
                <th className="py-2.5">Assembly Status</th>
                <th className="py-2.5 text-right">Progress Toggles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productionQueue.map(lead => (
                <tr key={lead.id} className="hover:bg-slate-50/50">
                  <td className="py-3 font-mono font-bold text-slate-700">{lead.id}</td>
                  <td className="py-3">
                    <p className="font-bold text-slate-800">{lead.clientName}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{lead.handoffDetails?.siteLocation}</p>
                  </td>
                  <td className="py-3">
                    <p className="font-medium text-slate-700">{lead.serviceRequired}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[200px]" title={lead.handoffDetails?.finalMeasurements}>
                      {lead.handoffDetails?.finalMeasurements}
                    </p>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-1 text-slate-500 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{lead.handoffDetails?.targetDispatchDate}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={`px-2.5 py-1 rounded-full font-bold text-[9px] ${
                      lead.status === 'Ready to Dispatch' ? 'bg-emerald-50 text-emerald-700' :
                      lead.status === 'In Production' ? 'bg-indigo-50 text-indigo-700' :
                      lead.status === 'Production Pending' ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-700'
                    }`}>
                      {lead.status === 'Production Pending' ? 'Awaiting Startup' : lead.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <select
                      value={getActiveDropdownVal(lead.status)}
                      onChange={(e) => handleUpdateStatus(lead.id, e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-[11px] focus:outline-none focus:border-brand-blue-sky"
                    >
                      <option value="Hold">Hold / Suspend</option>
                      <option value="Working">Working (In Fabrication)</option>
                      <option value="Ready To Dispatch">Ready To Dispatch</option>
                      <option value="Dispatched">Dispatched (Offsite Handover)</option>
                    </select>
                  </td>
                </tr>
              ))}
              {productionQueue.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    No orders currently assigned to the shop fabrication queue.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
