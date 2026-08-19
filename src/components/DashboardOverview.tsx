import React from 'react';
import type { Lead, VendorBill } from '../types';
import { TrendingUp, Award, Layers, Users, DollarSign, Wrench } from 'lucide-react';

interface DashboardOverviewProps {
  leads: Lead[];
  vendorBills: VendorBill[];
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ leads, vendorBills }) => {
  // Compute analytics
  const totalLeads = leads.length;
  const wonLeads = leads.filter(l => l.status === 'Closed' || l.handoffDetails);
  const totalSales = wonLeads.reduce((acc, curr) => acc + (curr.handoffDetails?.orderValue || 0), 0);
  const totalAdvance = wonLeads.reduce((acc, curr) => acc + (curr.handoffDetails?.advanceAmount || 0), 0);
  const conversionRate = totalLeads > 0 ? Math.round((wonLeads.length / totalLeads) * 100) : 0;
  
  const inProduction = leads.filter(l => l.status === 'In Production' || l.status === 'Ready to Dispatch').length;
  const inInstallation = leads.filter(l => l.status === 'Installation Scheduled' || l.status === 'Installation In Progress').length;
  
  const totalVendorPaid = vendorBills.filter(b => b.status === 'Paid').reduce((acc, curr) => acc + curr.amount, 0);

  // Group by status
  const statusCounts: Record<string, number> = {};
  leads.forEach(l => {
    statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
  });

  // Service demand count
  const serviceCounts: Record<string, number> = {};
  leads.forEach(l => {
    serviceCounts[l.serviceRequired] = (serviceCounts[l.serviceRequired] || 0) + 1;
  });

  // Source count
  const sourceCounts: Record<string, number> = {};
  leads.forEach(l => {
    sourceCounts[l.source] = (sourceCounts[l.source] || 0) + 1;
  });

  const sources = Object.entries(sourceCounts).map(([source, count]) => ({ source, count }));
  const services = Object.entries(serviceCounts)
    .map(([service, count]) => ({ service, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#F8FAFC] border border-slate-100 rounded-2xl p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-blue-100 text-blue-800 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Sales (Won Orders)</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">₹{totalSales.toLocaleString('en-IN')}</h3>
            <p className="text-xs text-emerald-600 font-medium mt-1">₹{totalAdvance.toLocaleString('en-IN')} Advance Coll.</p>
          </div>
        </div>

        <div className="bg-[#F8FAFC] border border-slate-100 rounded-2xl p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Lead Conversion Rate</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{conversionRate}%</h3>
            <p className="text-xs text-slate-600 mt-1">{wonLeads.length} of {totalLeads} leads converted</p>
          </div>
        </div>

        <div className="bg-[#F8FAFC] border border-slate-100 rounded-2xl p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-amber-100 text-amber-800 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">In Production Pipeline</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{inProduction} Orders</h3>
            <p className="text-xs text-amber-700 font-medium mt-1">₹{totalVendorPaid.toLocaleString('en-IN')} Vendor Cost</p>
          </div>
        </div>

        <div className="bg-[#F8FAFC] border border-slate-100 rounded-2xl p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-violet-100 text-violet-800 rounded-xl">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Active Installations</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{inInstallation} Sites</h3>
            <p className="text-xs text-violet-700 mt-1">Ongoing site deployment</p>
          </div>
        </div>
      </div>

      {/* Main Charts & Ingestion Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Service Popularity Chart (SVG Custom Bar Chart) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <Award className="w-5 h-5 text-brand-blue-deep" />
              Most Popular Services Required
            </h3>
            <span className="text-xs text-slate-400">Top Categories</span>
          </div>

          <div className="space-y-4 pt-2">
            {services.map((svc, i) => {
              const pct = totalLeads > 0 ? (svc.count / totalLeads) * 100 : 0;
              const barColors = ['bg-brand-blue-deep', 'bg-brand-blue-sky', 'bg-indigo-500', 'bg-violet-400'];
              return (
                <div key={svc.service} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-700 truncate max-w-xs">{svc.service}</span>
                    <span className="text-slate-500 font-bold">{svc.count} Leads ({Math.round(pct)}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColors[i % barColors.length]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {services.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">No service request data yet.</p>
            )}
          </div>
        </div>

        {/* Lead Source Distribution */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-blue-sky" />
            Lead Source Breakdown
          </h3>

          <div className="flex flex-col justify-center h-full space-y-3 pt-2">
            {sources.map((src) => {
              const srcColors: Record<string, string> = {
                'Web Scrape': 'bg-amber-400 text-amber-900',
                'Manual Add': 'bg-blue-400 text-blue-900',
                'Social Media': 'bg-pink-400 text-pink-900',
                'Website': 'bg-emerald-400 text-emerald-900',
                'WhatsApp': 'bg-teal-400 text-teal-900',
                'Call': 'bg-indigo-400 text-indigo-900'
              };
              const bg = srcColors[src.source] || 'bg-slate-400 text-slate-900';
              return (
                <div key={src.source} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${bg.split(' ')[0]}`} />
                    <span className="font-medium text-slate-700">{src.source}</span>
                  </div>
                  <span className="font-semibold text-slate-500">{src.count} leads</span>
                </div>
              );
            })}
            {sources.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">No ingestion source data yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
