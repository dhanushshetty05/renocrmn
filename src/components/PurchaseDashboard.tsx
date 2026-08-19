import React, { useState } from 'react';
import type { Lead, BOM, BOMItem, VendorBill } from '../types';
import { Truck, ShieldCheck, AlertTriangle, Plus } from 'lucide-react';
import { RenoletDatabase } from '../db';

interface PurchaseDashboardProps {
  leads: Lead[];
  onRefreshData: () => void;
  addToast: (type: 'success' | 'error' | 'info', title: string, desc: string) => void;
}

export const PurchaseDashboard: React.FC<PurchaseDashboardProps> = ({
  leads,
  onRefreshData,
  addToast
}) => {
  const [selectedLeadForBOM, setSelectedLeadForBOM] = useState<Lead | null>(null);
  
  // BOM creator state
  const [bomItems, setBomItems] = useState<BOMItem[]>([
    { id: 'B-LI-1', materialName: 'uPVC Profile Section - White (m)', qty: 25, unit: 'meters' },
    { id: 'B-LI-2', materialName: 'DGU 6mm Glass Panel (pcs)', qty: 4, unit: 'pieces' }
  ]);
  const [selectedVendorId, setSelectedVendorId] = useState('V1');
  const [quotedPrice, setQuotedPrice] = useState<number>(0);

  // Mask client mobile number: e.g., +91 98444-55566 -> +91 XXXXX-XX566
  const maskMobileNumber = (mobile: string): string => {
    // If mobile matches typical format +91 98444-55566 or just numbers
    const clean = mobile.replace(/\s+/g, '');
    if (clean.length > 5) {
      const suffix = clean.slice(-3); // get last 3 digits
      const prefix = clean.startsWith('+91') ? '+91' : '';
      return `${prefix} XXXXX-XX${suffix}`;
    }
    return 'XXXXX-XX-XXX';
  };

  const handleAddBOMItem = () => {
    const newItem: BOMItem = {
      id: `B-LI-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
      materialName: 'Window Hardware Fitting Set',
      qty: 1,
      unit: 'sets'
    };
    setBomItems([...bomItems, newItem]);
  };

  const handleRemoveBOMItem = (id: string) => {
    setBomItems(bomItems.filter(item => item.id !== id));
  };

  const handleUpdateBOMItem = (id: string, field: keyof BOMItem, value: any) => {
    setBomItems(bomItems.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleSubmitBOM = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadForBOM) return;

    if (quotedPrice <= 0) {
      addToast('error', 'Pricing Error', 'Please input a valid vendor quoted price.');
      return;
    }

    const bom: BOM = {
      id: `BOM-${selectedLeadForBOM.id.replace('L-', '')}`,
      leadId: selectedLeadForBOM.id,
      items: bomItems,
      assignedVendorId: selectedVendorId,
      vendorQuotedPrice: quotedPrice,
      generatedAt: new Date().toISOString()
    };

    // Save BOM
    const currentBOMs = RenoletDatabase.getBOMs();
    currentBOMs.push(bom);
    RenoletDatabase.saveBOMs(currentBOMs);

    // Create Vendor Bill for Accounts to pay
    const vendors = RenoletDatabase.getVendors();
    const vendor = vendors.find(v => v.id === selectedVendorId);
    const vendorName = vendor ? vendor.name : 'Selected Supplier';

    const bill: VendorBill = {
      id: `VB-NEW-${selectedLeadForBOM.id.replace('L-', '')}-${Math.floor(100 + Math.random() * 905)}`,
      bomId: bom.id,
      leadId: selectedLeadForBOM.id,
      vendorName,
      amount: quotedPrice,
      status: 'Due',
      raisedAt: new Date().toISOString()
    };

    const currentBills = RenoletDatabase.getVendorBills();
    currentBills.push(bill);
    RenoletDatabase.saveVendorBills(currentBills);

    // Update lead status to Purchase Pending -> Vendor Billing stage or wait
    RenoletDatabase.addLog(
      selectedLeadForBOM.id,
      'Purchase',
      `BOM generated and assigned to Vendor: ${vendorName} for ₹${quotedPrice.toLocaleString('en-IN')}`,
      `BOM items: ${bomItems.length} categories listed. Sent bill to Accounts for payment.`
    );

    addToast('success', 'BOM Dispatched', `Material sheet submitted. Bill raised to Accounts for vendor payment.`);
    setSelectedLeadForBOM(null);
    setBomItems([
      { id: 'B-LI-1', materialName: 'uPVC Profile Section - White (m)', qty: 25, unit: 'meters' },
      { id: 'B-LI-2', materialName: 'DGU 6mm Glass Panel (pcs)', qty: 4, unit: 'pieces' }
    ]);
    setQuotedPrice(0);
    onRefreshData();
  };

  const purchaseQueue = leads.filter(l => l.status === 'Purchase Pending');
  const vendorsList = RenoletDatabase.getVendors();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Truck className="w-6 h-6 text-brand-blue-deep" />
          Purchase & Vendor Assignment
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">Procure raw profiles, assign to registered vendors, and raise billing clearance tickets</p>
      </div>

      {/* Security alert indicator */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-800 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">PII Security Protocol Active:</span> Customer mobile contact credentials are automatically masked for all Purchase users to secure client data confidentiality.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Pending Queue */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 h-fit">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 flex justify-between items-center">
            <span>Material Requirements Queue</span>
            <span className="bg-blue-100 text-brand-blue-deep font-bold px-2.5 py-0.5 rounded-full text-xs">
              {purchaseQueue.length}
            </span>
          </h3>

          <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
            {purchaseQueue.map(lead => (
              <div
                key={lead.id}
                onClick={() => {
                  setSelectedLeadForBOM(lead);
                  // Prefill BOM based on lead service
                  if (lead.handoffDetails) {
                    setBomItems([
                      { id: 'B-1', materialName: `${lead.serviceRequired} Profile Extrusions (m)`, qty: 30, unit: 'meters' },
                      { id: 'B-2', materialName: `Fitting Accessories Pack (Locks, Hinges)`, qty: 1, unit: 'sets' },
                      { id: 'B-3', materialName: `Glass Panes (Double Glazing Units)`, qty: 6, unit: 'pieces' }
                    ]);
                  }
                }}
                className={`border rounded-xl p-4 cursor-pointer transition-all ${selectedLeadForBOM?.id === lead.id ? 'border-brand-blue-sky bg-blue-50/20' : 'border-slate-100 hover:bg-slate-50'}`}
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-slate-800 text-xs truncate max-w-[150px]">{lead.clientName}</h4>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700">
                    Awaiting BOM
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">{lead.serviceRequired}</p>

                <div className="mt-3 pt-3 border-t border-slate-100 text-[10px] text-slate-400 space-y-1">
                  <div className="flex items-center justify-between text-slate-500 font-medium">
                    <span>Contact (Masked):</span>
                    <span className="font-bold text-indigo-700 font-mono">{maskMobileNumber(lead.mobile)}</span>
                  </div>
                  <p>Target Date: {lead.handoffDetails?.targetDispatchDate}</p>
                </div>
              </div>
            ))}

            {purchaseQueue.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">No raw material tickets pending BOM.</p>
            )}
          </div>
        </div>

        {/* Right Side: Active Workspace */}
        <div className="lg:col-span-2">
          {selectedLeadForBOM ? (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
                <h3 className="font-bold text-slate-800 text-base">Generate Bill of Materials (BOM)</h3>
                <p className="text-xs text-slate-500 mt-0.5">Define material requirements and select supplier for Lead {selectedLeadForBOM.id}</p>
              </div>

              <form onSubmit={handleSubmitBOM} className="p-6 space-y-5 text-xs text-slate-600">
                {/* Client Details (Security Masking visible) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-150">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">CLIENT NAME</span>
                    <span className="font-bold text-slate-800 text-sm">{selectedLeadForBOM.clientName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">MOBILE CONTACT (SECURED MASKING)</span>
                    <span className="font-mono text-sm font-bold text-rose-600">{maskMobileNumber(selectedLeadForBOM.mobile)}</span>
                  </div>
                  <div className="sm:col-span-2 border-t border-slate-200 pt-2">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">FINAL HANDOFF DIMENSIONS</span>
                    <span className="font-semibold text-slate-700">{selectedLeadForBOM.handoffDetails?.finalMeasurements}</span>
                  </div>
                </div>

                {/* Vendor selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold">Select Vendor / Supplier</label>
                    <select
                      value={selectedVendorId}
                      onChange={(e) => setSelectedVendorId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-brand-blue-sky font-medium text-slate-700"
                    >
                      {vendorsList.map(v => (
                        <option key={v.id} value={v.id}>{v.name} ({v.category})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Vendor Quoted Price (₹) *</label>
                    <input
                      type="number"
                      required
                      value={quotedPrice}
                      onChange={(e) => setQuotedPrice(parseFloat(e.target.value) || 0)}
                      placeholder="e.g. 18500"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-brand-blue-sky font-bold text-slate-800"
                    />
                  </div>
                </div>

                {/* BOM Items Table */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-700">BOM Line Items</span>
                    <button
                      type="button"
                      onClick={handleAddBOMItem}
                      className="text-brand-blue-deep hover:text-brand-blue-sky font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Material Row
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {bomItems.map((item) => (
                      <div key={item.id} className="flex gap-3 items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <input
                          type="text"
                          required
                          value={item.materialName}
                          onChange={(e) => handleUpdateBOMItem(item.id, 'materialName', e.target.value)}
                          placeholder="e.g. uPVC Casement profiles White"
                          className="w-3/4 bg-white border border-slate-200 rounded px-2 py-1 text-slate-800"
                        />
                        <input
                          type="number"
                          required
                          value={item.qty}
                          onChange={(e) => handleUpdateBOMItem(item.id, 'qty', parseInt(e.target.value) || 0)}
                          placeholder="Qty"
                          className="w-1/4 bg-white border border-slate-200 rounded px-2 py-1 font-bold text-center text-slate-800"
                        />
                        {bomItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveBOMItem(item.id)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submission triggers Vendor Bill creation */}
                <div className="pt-4 border-t border-slate-100 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedLeadForBOM(null)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl py-3 font-semibold w-1/2 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-brand-blue-deep hover:bg-brand-blue-dark text-white rounded-xl py-3 font-semibold w-1/2 transition-colors shadow-md flex items-center justify-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Submit BOM to Accounts
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3 h-[400px]">
              <Truck className="w-10 h-10 text-slate-300" />
              <h4 className="font-bold text-slate-600 text-sm">No Material Ticket Selected</h4>
              <p className="text-xs text-slate-400 max-w-xs">
                Select a client requirement from the left queue to verify measurements, assign to suppliers, and estimate material costs.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
