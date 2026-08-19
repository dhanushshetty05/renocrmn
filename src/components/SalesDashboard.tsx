import React, { useState } from 'react';
import type { Lead, MeasurementTicket, MeasurementLineItem } from '../types';
import { Phone, Calendar, Ruler, Award, Plus, Trash2, ArrowRight } from 'lucide-react';
import { RenoletDatabase } from '../db';

interface SalesDashboardProps {
  leads: Lead[];
  onRefreshData: () => void;
  addToast: (type: 'success' | 'error' | 'info', title: string, desc: string) => void;
}

export const SalesDashboard: React.FC<SalesDashboardProps> = ({
  leads,
  onRefreshData,
  addToast
}) => {
  // Measurement modal state
  const [selectedLeadForMeasurement, setSelectedLeadForMeasurement] = useState<Lead | null>(null);
  const [meetingNotes, setMeetingNotes] = useState('');
  const [measurements, setMeasurements] = useState<MeasurementLineItem[]>([
    { id: 'M-INIT', productType: 'Casement Window', width: 1200, height: 1200, qty: 1, openingStyle: 'Outward Open', meshRequired: false }
  ]);

  // Follow up modal state
  const [selectedLeadForFollowUp, setSelectedLeadForFollowUp] = useState<Lead | null>(null);
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [nextCallTime, setNextCallTime] = useState('');
  const [orderOutcome, setOrderOutcome] = useState<'WON' | 'LOST' | null>(null);

  // Handoff form fields
  const [handoffMeasurements, setHandoffMeasurements] = useState('');
  const [orderValue, setOrderValue] = useState<number>(0);
  const [advanceAmount, setAdvanceAmount] = useState<number>(0);
  const [targetDispatchDate, setTargetDispatchDate] = useState('');
  const [siteLocation, setSiteLocation] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [dispatchAddress, setDispatchAddress] = useState('');

  // Add line item in measurements
  const handleAddMeasurementItem = () => {
    const newItem: MeasurementLineItem = {
      id: `M-LI-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
      productType: 'Casement Window',
      width: 1000,
      height: 1000,
      qty: 1,
      openingStyle: 'Standard',
      meshRequired: false
    };
    setMeasurements([...measurements, newItem]);
  };

  const handleRemoveMeasurementItem = (id: string) => {
    setMeasurements(measurements.filter(item => item.id !== id));
  };

  const handleUpdateMeasurementItem = (id: string, field: keyof MeasurementLineItem, value: any) => {
    setMeasurements(measurements.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  // Submit Measurement ticket
  const handleSubmitMeasurements = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadForMeasurement) return;

    if (measurements.length === 0) {
      addToast('error', 'Measurements Missing', 'Please add at least one measurement detail.');
      return;
    }

    const ticket: MeasurementTicket = {
      id: `M-${selectedLeadForMeasurement.id.replace('L-', '')}`,
      leadId: selectedLeadForMeasurement.id,
      meetingNotes,
      measurements,
      submittedAt: new Date().toISOString(),
      submittedBy: 'John Doe (Sales)'
    };

    // Save Measurement ticket
    const currentTickets = RenoletDatabase.getMeasurements();
    currentTickets.push(ticket);
    RenoletDatabase.saveMeasurements(currentTickets);

    // Update status to Quotation Pending
    RenoletDatabase.updateLeadStatus(
      selectedLeadForMeasurement.id,
      'Quotation Pending',
      'Sales',
      'Site measurements and style configuration sent to Quotation Department.'
    );

    addToast('success', 'Measurements Dispatched', 'Site measurement sheet sent to Quotation Department.');
    
    // Reset Form
    setSelectedLeadForMeasurement(null);
    setMeetingNotes('');
    setMeasurements([{ id: 'M-INIT', productType: 'Casement Window', width: 1200, height: 1200, qty: 1, openingStyle: 'Outward Open', meshRequired: false }]);
    onRefreshData();
  };

  // Prepopulate handoff fields when outcome becomes WON
  const handleSetOutcomeWon = () => {
    setOrderOutcome('WON');
    if (selectedLeadForFollowUp) {
      // Find measurements for this lead to prepopulate
      const ticket = RenoletDatabase.getMeasurements().find(m => m.leadId === selectedLeadForFollowUp.id);
      if (ticket) {
        const text = ticket.measurements.map(m => `${m.qty}x ${m.productType} (${m.width}x${m.height}mm) - ${m.openingStyle}`).join(', ');
        setHandoffMeasurements(text);
      }
      setBillingAddress(selectedLeadForFollowUp.address);
      setDispatchAddress(selectedLeadForFollowUp.address);
      setSiteLocation(selectedLeadForFollowUp.address);
    }
  };

  // Process Follow Up submission
  const handleSubmitFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadForFollowUp) return;

    const leadsList = RenoletDatabase.getLeads();
    const lead = leadsList.find(l => l.id === selectedLeadForFollowUp.id);

    if (lead) {
      if (orderOutcome === 'WON') {
        if (orderValue <= 0 || advanceAmount <= 0 || !targetDispatchDate) {
          addToast('error', 'Validation Error', 'Please complete order value, advance amount, and dispatch target.');
          return;
        }

        // Fill Handoff
        lead.handoffDetails = {
          finalMeasurements: handoffMeasurements,
          orderValue,
          advanceAmount,
          targetDispatchDate,
          siteLocation,
          billingAddress,
          dispatchAddress
        };
        lead.status = 'Advance Pending'; // Route to Accounts

        // Initialize Accounts advance logs
        lead.advancePaymentDetails = {
          paymentExpectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          followUpDateTime: new Date().toISOString(),
          paymentNotes: 'Awaiting first stage advance payment confirmation.',
          paymentStatus: 'Pending',
          amountReceived: 0
        };

        RenoletDatabase.addLog(
          lead.id,
          'Sales',
          'Logged ORDER WON outcome. Submitted handoff details to Accounts.',
          `Value: ₹${orderValue.toLocaleString('en-IN')}, Advance Expected: ₹${advanceAmount.toLocaleString('en-IN')}`
        );

        addToast('success', 'Order Won!', `Lead ${lead.id} routed to Accounts for Advance Payment clearance.`);
      } else if (orderOutcome === 'LOST') {
        lead.status = 'Order Lost';
        RenoletDatabase.addLog(lead.id, 'Sales', 'Logged ORDER LOST outcome', followUpNotes);
        addToast('info', 'Order Lost Saved', `Lead ${lead.id} marked as Order Lost.`);
      } else {
        // Just log notes
        RenoletDatabase.addLog(
          lead.id,
          'Sales',
          'Follow-up callback notes logged',
          `Notes: ${followUpNotes} | Next Call: ${nextCallTime}`
        );
        addToast('success', 'Follow-up Logged', 'Callback schedule updated.');
      }

      lead.updatedAt = new Date().toISOString();
      if (lead.notes && followUpNotes) {
        lead.notes += `\n[Follow Up Log]: ${followUpNotes}`;
      } else if (followUpNotes) {
        lead.notes = `[Follow Up Log]: ${followUpNotes}`;
      }
      RenoletDatabase.saveLeads(leadsList);

      // Reset
      setSelectedLeadForFollowUp(null);
      setOrderOutcome(null);
      setFollowUpNotes('');
      setNextCallTime('');
      setOrderValue(0);
      setAdvanceAmount(0);
      onRefreshData();
    }
  };

  // Filter queues
  const measurementQueue = leads.filter(l => l.status === 'Measurement Pending');
  const followUpQueue = leads.filter(l => l.status === 'Quotation Sent');

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Ruler className="w-6 h-6 text-brand-blue-deep" />
          Sales & Meetings Queue
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">Submit site dimension sheets and follow up client proposals to finalize handoffs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Measurements Pending Queue */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center justify-between border-b border-slate-100 pb-3">
            <span>Awaiting Site Measurements</span>
            <span className="bg-blue-50 text-brand-blue-deep font-bold px-2 py-0.5 rounded-full text-xs">{measurementQueue.length}</span>
          </h3>

          <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
            {measurementQueue.map(lead => (
              <div key={lead.id} className="border border-slate-100 rounded-xl p-4 hover:bg-slate-50/50 hover:border-slate-200 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <p className="font-bold text-slate-800 text-sm">{lead.clientName}</p>
                  <p className="text-xs text-slate-500">{lead.serviceRequired}</p>
                  <div className="flex gap-2 text-[10px] text-slate-400 font-medium">
                    <span>ID: {lead.id}</span>
                    <span>•</span>
                    <span>Address: {lead.address}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLeadForMeasurement(lead)}
                  className="bg-brand-blue-deep hover:bg-brand-blue-dark text-white rounded-lg px-3 py-2 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors w-full sm:w-auto justify-center"
                >
                  <Ruler className="w-4 h-4" /> Enter Measurements
                </button>
              </div>
            ))}
            {measurementQueue.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">No pending site measurement tasks.</p>
            )}
          </div>
        </div>

        {/* Follow Up & Closure Queue */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center justify-between border-b border-slate-100 pb-3">
            <span>Proposals Follow-up Queue</span>
            <span className="bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded-full text-xs">{followUpQueue.length}</span>
          </h3>

          <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
            {followUpQueue.map(lead => {
              // Load latest quotation price if available
              const quotes = RenoletDatabase.getQuotations().filter(q => q.leadId === lead.id);
              const latestQuote = quotes.sort((a, b) => b.version - a.version)[0];
              return (
                <div key={lead.id} className="border border-slate-100 rounded-xl p-4 hover:bg-slate-50/50 hover:border-slate-200 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-800 text-sm">{lead.clientName}</p>
                      {latestQuote && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                          v{latestQuote.version} Sent
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{lead.serviceRequired}</p>
                    <div className="flex gap-2 text-[10px] text-slate-400 font-medium">
                      {latestQuote && <span className="text-brand-blue-deep font-bold">Val: ₹{latestQuote.grandTotal.toLocaleString('en-IN')}</span>}
                      <span>•</span>
                      <span>Callback due</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedLeadForFollowUp(lead);
                      if (latestQuote) {
                        setOrderValue(latestQuote.grandTotal);
                        setAdvanceAmount(Math.round(latestQuote.grandTotal * 0.5)); // default 50% advance recommendation
                      }
                    }}
                    className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-3 py-2 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors w-full sm:w-auto justify-center"
                  >
                    <Phone className="w-4 h-4" /> Follow Up
                  </button>
                </div>
              );
            })}
            {followUpQueue.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">No proposals awaiting client follow-up decision.</p>
            )}
          </div>
        </div>
      </div>

      {/* Enter Measurements Sheet Modal */}
      {selectedLeadForMeasurement && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-3xl w-full p-6 shadow-2xl space-y-4 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Ruler className="w-4 h-4 text-brand-blue-sky" />
                Record Dimensions: {selectedLeadForMeasurement.clientName}
              </h4>
              <button onClick={() => setSelectedLeadForMeasurement(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmitMeasurements} className="space-y-5 text-xs text-slate-600">
              {/* Meeting Notes */}
              <div className="space-y-1">
                <label className="font-bold">Meeting Notes / Customer Specifications</label>
                <textarea
                  value={meetingNotes}
                  onChange={(e) => setMeetingNotes(e.target.value)}
                  placeholder="Specify preferences: handle type, locking system, threshold clearance details..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-brand-blue-sky"
                  required
                />
              </div>

              {/* Items Grid */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700">Line Items Measurements</span>
                  <button
                    type="button"
                    onClick={handleAddMeasurementItem}
                    className="text-brand-blue-deep hover:text-brand-blue-sky font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Window/Door Row
                  </button>
                </div>

                <div className="space-y-2">
                  {measurements.map((item) => (
                    <div key={item.id} className="flex flex-wrap gap-2.5 items-end bg-slate-50 p-3 rounded-xl border border-slate-150 relative">
                      <div className="w-[140px] space-y-1">
                        <label>Product Type</label>
                        <select
                          value={item.productType}
                          onChange={(e) => handleUpdateMeasurementItem(item.id, 'productType', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-1.5"
                        >
                          <option value="Casement Window">Casement Window</option>
                          <option value="Sliding Window">Sliding Window</option>
                          <option value="Awning Window">Awning Window</option>
                          <option value="Bi-Fold Door">Bi-Fold Door</option>
                          <option value="French Door">French Door</option>
                          <option value="Sliding Door">Sliding Door</option>
                          <option value="Fixed Window">Fixed Window</option>
                        </select>
                      </div>

                      <div className="w-[80px] space-y-1">
                        <label>Width (mm)</label>
                        <input
                          type="number"
                          required
                          value={item.width}
                          onChange={(e) => handleUpdateMeasurementItem(item.id, 'width', parseInt(e.target.value) || 0)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-1.5"
                        />
                      </div>

                      <div className="w-[80px] space-y-1">
                        <label>Height (mm)</label>
                        <input
                          type="number"
                          required
                          value={item.height}
                          onChange={(e) => handleUpdateMeasurementItem(item.id, 'height', parseInt(e.target.value) || 0)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-1.5"
                        />
                      </div>

                      <div className="w-[60px] space-y-1">
                        <label>Qty</label>
                        <input
                          type="number"
                          required
                          value={item.qty}
                          onChange={(e) => handleUpdateMeasurementItem(item.id, 'qty', parseInt(e.target.value) || 0)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-1.5"
                        />
                      </div>

                      <div className="w-[120px] space-y-1">
                        <label>Opening Style</label>
                        <input
                          type="text"
                          value={item.openingStyle}
                          onChange={(e) => handleUpdateMeasurementItem(item.id, 'openingStyle', e.target.value)}
                          placeholder="e.g. Left Open / Top Hung"
                          className="w-full bg-white border border-slate-200 rounded-lg p-1.5"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 h-9 mb-1">
                        <input
                          type="checkbox"
                          id={`mesh-${item.id}`}
                          checked={item.meshRequired}
                          onChange={(e) => handleUpdateMeasurementItem(item.id, 'meshRequired', e.target.checked)}
                          className="rounded text-brand-blue-deep focus:ring-brand-blue-sky w-4 h-4"
                        />
                        <label htmlFor={`mesh-${item.id}`} className="font-semibold text-slate-600">Mesh?</label>
                      </div>

                      {measurements.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMeasurementItem(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 mb-0.5 ml-auto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit triggers measurements sending to Quotation */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedLeadForMeasurement(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl py-3 font-semibold w-1/2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-brand-blue-deep hover:bg-brand-blue-dark text-white rounded-xl py-3 font-semibold w-1/2 transition-colors shadow-md flex items-center justify-center gap-1.5"
                >
                  Send Measurements to Quotation <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Follow Up & Handoff Sheet Modal */}
      {selectedLeadForFollowUp && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-blue-sky" />
                Follow-up Callback Log: {selectedLeadForFollowUp.clientName}
              </h4>
              <button onClick={() => setSelectedLeadForFollowUp(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmitFollowUp} className="space-y-4 text-xs text-slate-600">
              {/* Log Notes */}
              <div className="space-y-1">
                <label className="font-bold">Follow-up Call Notes</label>
                <textarea
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  placeholder="Summarize client feedback, requested revisions, or negotiations..."
                  rows={2.5}
                  required={orderOutcome !== 'WON'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-brand-blue-sky"
                />
              </div>

              {/* Outcome options */}
              <div className="space-y-2">
                <label className="font-bold block">Status Toggle Outcome</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSetOutcomeWon}
                    className={`flex-1 py-3 px-4 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all ${orderOutcome === 'WON' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'}`}
                  >
                    <Award className="w-4 h-4 text-emerald-600" /> Order Won
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderOutcome('LOST')}
                    className={`flex-1 py-3 px-4 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all ${orderOutcome === 'LOST' ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'}`}
                  >
                    Order Lost
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderOutcome(null)}
                    className={`py-3 px-4 rounded-xl border font-bold transition-all ${orderOutcome === null ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-500'}`}
                  >
                    Keep In Pipeline
                  </button>
                </div>
              </div>

              {/* Keep In Pipeline Call Date */}
              {orderOutcome === null && (
                <div className="space-y-1 animate-fade-in">
                  <label className="font-bold flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" /> Schedule Next Call</label>
                  <input
                    type="datetime-local"
                    value={nextCallTime}
                    onChange={(e) => setNextCallTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-brand-blue-sky"
                  />
                </div>
              )}

              {/* Order Won Handoff prompt details */}
              {orderOutcome === 'WON' && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3.5 animate-slide-up">
                  <h5 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider border-b border-slate-150 pb-1.5 text-brand-blue-deep">
                    Critical Handoff Details
                  </h5>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-500">Order Value (₹) *</label>
                      <input
                        type="number"
                        required
                        value={orderValue}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setOrderValue(val);
                          setAdvanceAmount(Math.round(val * 0.5)); // auto compute 50%
                        }}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-brand-blue-sky font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-500">Advance Collection Amount Required (₹) *</label>
                      <input
                        type="number"
                        required
                        value={advanceAmount}
                        onChange={(e) => setAdvanceAmount(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-brand-blue-sky font-bold text-emerald-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-500">Target Dispatch Date *</label>
                      <input
                        type="date"
                        required
                        value={targetDispatchDate}
                        onChange={(e) => setTargetDispatchDate(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-brand-blue-sky"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-500">Site Location / Landmark</label>
                      <input
                        type="text"
                        required
                        value={siteLocation}
                        onChange={(e) => setSiteLocation(e.target.value)}
                        placeholder="e.g. Near HSR Metro Pillar 42"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-brand-blue-sky"
                      />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="font-bold text-slate-500">Final Measurement Summary *</label>
                      <textarea
                        required
                        value={handoffMeasurements}
                        onChange={(e) => setHandoffMeasurements(e.target.value)}
                        rows={2}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-brand-blue-sky font-semibold"
                      />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="font-bold text-slate-500">Billing Address *</label>
                      <input
                        type="text"
                        required
                        value={billingAddress}
                        onChange={(e) => setBillingAddress(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-brand-blue-sky"
                      />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="font-bold text-slate-500">Dispatch Address *</label>
                      <input
                        type="text"
                        required
                        value={dispatchAddress}
                        onChange={(e) => setDispatchAddress(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-brand-blue-sky"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedLeadForFollowUp(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl py-3 font-semibold w-1/2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-brand-blue-deep hover:bg-brand-blue-dark text-white rounded-xl py-3 font-semibold w-1/2 transition-colors shadow-md"
                >
                  Save & Submit Follow-up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
