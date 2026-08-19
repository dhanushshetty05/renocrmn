import React, { useState } from 'react';
import type { Lead, VendorBill } from '../types';
import { CreditCard, ShieldCheck, DollarSign, Landmark } from 'lucide-react';
import { RenoletDatabase } from '../db';

interface AccountsDashboardProps {
  leads: Lead[];
  vendorBills: VendorBill[];
  onRefreshData: () => void;
  addToast: (type: 'success' | 'error' | 'info', title: string, desc: string) => void;
}

export const AccountsDashboard: React.FC<AccountsDashboardProps> = ({
  leads,
  vendorBills,
  onRefreshData,
  addToast
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'advance' | 'vendor' | 'final'>('advance');

  // Modal forms
  const [selectedLeadForPayment, setSelectedLeadForPayment] = useState<Lead | null>(null);
  const [paymentExpectedDate, setPaymentExpectedDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'Pending' | 'Partial' | 'Received'>('Received');
  const [amountReceived, setAmountReceived] = useState<number>(0);

  // Confirm Deposit/Advance
  const handleConfirmAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadForPayment) return;

    const leadsList = RenoletDatabase.getLeads();
    const lead = leadsList.find(l => l.id === selectedLeadForPayment.id);

    if (lead) {
      const isFull = paymentStatus === 'Received';
      
      lead.advancePaymentDetails = {
        paymentExpectedDate,
        followUpDateTime: followUpTime,
        paymentNotes,
        paymentStatus,
        amountReceived
      };

      if (isFull) {
        // Complete Advance payment -> Moves to Purchase Pending
        lead.status = 'Purchase Pending';
        RenoletDatabase.addLog(
          lead.id,
          'Accounts',
          `Advance Payment Confirmed (₹${amountReceived.toLocaleString('en-IN')}). Final measurements verified.`,
          `Notes: ${paymentNotes}`
        );
        addToast('success', 'Advance Verified', `Payment received! Lead ${lead.id} forwarded to Purchase Department.`);
      } else {
        RenoletDatabase.addLog(
          lead.id,
          'Accounts',
          `Partial Advance Received (₹${amountReceived.toLocaleString('en-IN')}). Pending balance details.`,
          `Notes: ${paymentNotes}`
        );
        addToast('info', 'Partial Deposit Recorded', `Partial advance received. Lead remains in Advance queue.`);
      }

      lead.updatedAt = new Date().toISOString();
      RenoletDatabase.saveLeads(leadsList);
      setSelectedLeadForPayment(null);
      onRefreshData();
    }
  };

  // Pay Vendor Bill
  const handlePayVendorBill = (billId: string) => {
    const bills = RenoletDatabase.getVendorBills();
    const bill = bills.find(b => b.id === billId);

    if (bill) {
      bill.status = 'Paid';
      bill.paidAt = new Date().toISOString();
      RenoletDatabase.saveVendorBills(bills);

      // Check if all bills for this lead are Paid. If yes, move lead to Production Pending.
      const leadBills = bills.filter(b => b.leadId === bill.leadId);
      const allPaid = leadBills.every(b => b.status === 'Paid');

      if (allPaid) {
        RenoletDatabase.updateLeadStatus(
          bill.leadId,
          'Production Pending',
          'Accounts',
          `Vendor bill ${billId} paid (₹${bill.amount.toLocaleString('en-IN')}). All vendor materials paid. Order released to Production.`
        );
        addToast('success', 'Vendor Bill Paid & Released', `Vendor payment cleared. Order moved to Production Department.`);
      } else {
        RenoletDatabase.addLog(
          bill.leadId,
          'Accounts',
          `Paid Vendor Bill ${billId} (₹${bill.amount.toLocaleString('en-IN')}). Awaiting other bills.`
        );
        addToast('success', 'Vendor Bill Paid', `Paid ₹${bill.amount.toLocaleString('en-IN')} to vendor.`);
      }
      onRefreshData();
    }
  };

  // Confirm Final Balance
  const handleConfirmFinalPayment = (leadId: string, balanceAmt: number) => {
    const leadsList = RenoletDatabase.getLeads();
    const lead = leadsList.find(l => l.id === leadId);

    if (lead) {
      lead.status = 'Feedback Unlocked'; // Moves to feedback unlocked
      lead.finalPaymentDetails = {
        paymentExpectedDate: new Date().toISOString().split('T')[0],
        followUpDateTime: new Date().toISOString(),
        paymentNotes: 'Final balance payment collected in full.',
        paymentStatus: 'Received',
        amountReceived: balanceAmt
      };
      lead.updatedAt = new Date().toISOString();
      RenoletDatabase.saveLeads(leadsList);

      RenoletDatabase.addLog(
        leadId,
        'Accounts',
        `Final balance collected: ₹${balanceAmt.toLocaleString('en-IN')}. Handover Feedback Form unlocked.`
      );

      addToast('success', 'Final Payment Received', 'Remaining balance paid. Customer feedback unlocked.');
      onRefreshData();
    }
  };

  // Queues
  const advanceQueue = leads.filter(l => l.status === 'Advance Pending');
  const finalPaymentQueue = leads.filter(l => l.status === 'Final Payment Pending');

  return (
    <div className="space-y-8">
      {/* Tab Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-brand-blue-deep" />
            Accounts & Billing Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Clear client deposits, handle vendor billing invoices, and collect final project balances</p>
        </div>

        {/* Sub-tab selection */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveSubTab('advance')}
            className={`px-4 py-2 rounded-lg transition-all ${activeSubTab === 'advance' ? 'bg-white shadow text-slate-900' : 'hover:text-slate-900'}`}
          >
            Client Advances ({advanceQueue.length})
          </button>
          <button
            onClick={() => setActiveSubTab('vendor')}
            className={`px-4 py-2 rounded-lg transition-all ${activeSubTab === 'vendor' ? 'bg-white shadow text-slate-900' : 'hover:text-slate-900'}`}
          >
            Vendor Invoices ({vendorBills.filter(b => b.status !== 'Paid').length})
          </button>
          <button
            onClick={() => setActiveSubTab('final')}
            className={`px-4 py-2 rounded-lg transition-all ${activeSubTab === 'final' ? 'bg-white shadow text-slate-900' : 'hover:text-slate-900'}`}
          >
            Final Balances ({finalPaymentQueue.length})
          </button>
        </div>
      </div>

      {activeSubTab === 'advance' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            Awaiting Advance Deposit Collections
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-2.5">Client Lead</th>
                  <th className="py-2.5">Service</th>
                  <th className="py-2.5">Order Value</th>
                  <th className="py-2.5">Advance Target</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {advanceQueue.map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-50/50">
                    <td className="py-3">
                      <p className="font-bold text-slate-800">{lead.clientName}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{lead.id} | {lead.handoffDetails?.siteLocation}</p>
                    </td>
                    <td className="py-3 font-medium text-slate-600">{lead.serviceRequired}</td>
                    <td className="py-3 font-semibold text-slate-700">₹{lead.handoffDetails?.orderValue.toLocaleString('en-IN')}</td>
                    <td className="py-3 font-bold text-emerald-600">₹{lead.handoffDetails?.advanceAmount.toLocaleString('en-IN')}</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedLeadForPayment(lead);
                          setAmountReceived(lead.handoffDetails?.advanceAmount || 0);
                          setPaymentExpectedDate(lead.advancePaymentDetails?.paymentExpectedDate || '');
                        }}
                        className="bg-brand-blue-deep hover:bg-brand-blue-dark text-white rounded-lg px-3 py-1.5 font-bold text-[10px] transition-colors shadow-sm inline-flex items-center gap-1"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" /> Confirm Advance
                      </button>
                    </td>
                  </tr>
                ))}
                {advanceQueue.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      No orders awaiting advance payment collection.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'vendor' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
            <Landmark className="w-4 h-4 text-brand-blue-sky" />
            Vendor Billing Clearance Queue
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-2.5">Invoice ID</th>
                  <th className="py-2.5">Vendor Name</th>
                  <th className="py-2.5">Client Ref</th>
                  <th className="py-2.5">Bill Amount</th>
                  <th className="py-2.5">Invoice Status</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vendorBills.map(bill => (
                  <tr key={bill.id} className="hover:bg-slate-50/50">
                    <td className="py-3 font-mono font-bold text-slate-700">{bill.id}</td>
                    <td className="py-3 font-semibold text-slate-800">{bill.vendorName}</td>
                    <td className="py-3 text-slate-500">Lead: {bill.leadId}</td>
                    <td className="py-3 font-bold text-slate-700">₹{bill.amount.toLocaleString('en-IN')}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${bill.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {bill.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {bill.status !== 'Paid' ? (
                        <button
                          onClick={() => handlePayVendorBill(bill.id)}
                          className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-3 py-1.5 font-bold text-[10px] transition-colors shadow-sm"
                        >
                          Approve & Pay Bill
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">Cleared on {bill.paidAt ? new Date(bill.paidAt).toLocaleDateString() : 'N/A'}</span>
                      )}
                    </td>
                  </tr>
                ))}
                {vendorBills.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      No vendor invoices registered.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'final' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            Final Remaining Balance Collections
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-2.5">Client Lead</th>
                  <th className="py-2.5">Required Service</th>
                  <th className="py-2.5">Order Value</th>
                  <th className="py-2.5">Advance Collected</th>
                  <th className="py-2.5">Remaining Balance</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {finalPaymentQueue.map(lead => {
                  const val = lead.handoffDetails?.orderValue || 0;
                  const adv = lead.handoffDetails?.advanceAmount || 0;
                  const balance = val - adv;
                  return (
                    <tr key={lead.id} className="hover:bg-slate-50/50">
                      <td className="py-3">
                        <p className="font-bold text-slate-800">{lead.clientName}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{lead.id} | {lead.handoffDetails?.siteLocation}</p>
                      </td>
                      <td className="py-3 text-slate-600">{lead.serviceRequired}</td>
                      <td className="py-3 font-semibold text-slate-700">₹{val.toLocaleString('en-IN')}</td>
                      <td className="py-3 font-semibold text-slate-500">₹{adv.toLocaleString('en-IN')}</td>
                      <td className="py-3 font-bold text-rose-600">₹{balance.toLocaleString('en-IN')}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleConfirmFinalPayment(lead.id, balance)}
                          className="bg-brand-blue-deep hover:bg-brand-blue-dark text-white rounded-lg px-3 py-1.5 font-bold text-[10px] transition-colors shadow-sm inline-flex items-center gap-1"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" /> Confirm Clearance
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {finalPaymentQueue.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      No jobs awaiting final payment settlement.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirm Advance Modal */}
      {selectedLeadForPayment && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-800 text-sm">Clear Advance Payment: {selectedLeadForPayment.clientName}</h4>
              <button onClick={() => setSelectedLeadForPayment(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleConfirmAdvance} className="space-y-4 text-xs text-slate-600">
              <div>
                <p className="text-[11px] text-slate-500">Target Advance Value Required:</p>
                <p className="text-slate-950 font-extrabold text-sm mt-0.5">₹{selectedLeadForPayment.handoffDetails?.advanceAmount.toLocaleString('en-IN')}</p>
              </div>

              <div className="space-y-1">
                <label>Amount Actually Received (₹)</label>
                <input
                  type="number"
                  required
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold text-emerald-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label>Payment Receipt Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none"
                >
                  <option value="Received">Received in Full</option>
                  <option value="Partial">Partial Advance Clearance</option>
                  <option value="Pending">Awaiting Pending Clearance</option>
                </select>
              </div>

              <div className="space-y-1">
                <label>Payment Expected Date (For Pending/Partial)</label>
                <input
                  type="date"
                  value={paymentExpectedDate}
                  onChange={(e) => setPaymentExpectedDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label>Payment Callback Follow Up Time</label>
                <input
                  type="datetime-local"
                  value={followUpTime}
                  onChange={(e) => setFollowUpTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label>Verification Remarks / Payment notes</label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Cleared via HDFC Bank NEFT Trans ID: 198273"
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedLeadForPayment(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl py-2.5 font-semibold w-1/2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-brand-blue-deep hover:bg-brand-blue-dark text-white rounded-xl py-2.5 font-semibold w-1/2 transition-colors shadow-md"
                >
                  Confirm Advance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
