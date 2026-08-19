import React, { useState, useEffect } from 'react';
import type { Lead, MeasurementTicket, Quotation, QuotationLineItem } from '../types';
import { Plus, Trash2, Save, Send, Eye, ShieldCheck, Mail, Share2 } from 'lucide-react';
import { RenoletDatabase } from '../db';
import { RenoletLogo } from './RenoletLogo';

interface QuotationCreatorProps {
  lead: Lead;
  measurementTicket?: MeasurementTicket;
  onQuotationCreated: (quote: Quotation) => void;
  addToast: (type: 'success' | 'error' | 'info', title: string, desc: string) => void;
}

export const QuotationCreator: React.FC<QuotationCreatorProps> = ({
  lead,
  measurementTicket,
  onQuotationCreated,
  addToast
}) => {
  const [lineItems, setLineItems] = useState<QuotationLineItem[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [history, setHistory] = useState<Quotation[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'create' | 'preview' | 'history'>('create');
  
  // Sharing dialog states
  const [sharingMethod, setSharingMethod] = useState<'whatsapp' | 'email' | null>(null);

  // Load existing quotations and populate from measurement ticket if no quotes exist
  useEffect(() => {
    const allQuotes = RenoletDatabase.getQuotations().filter(q => q.leadId === lead.id);
    setHistory(allQuotes.sort((a, b) => b.version - a.version));

    if (allQuotes.length > 0) {
      // Load newest version by default
      const latest = allQuotes.sort((a, b) => b.version - a.version)[0];
      setLineItems(latest.lineItems);
      setNotes(latest.notes || '');
      setSelectedVersion(latest.version);
    } else if (measurementTicket) {
      // Prepopulate from measurements and fetch default base price from settings db
      const services = RenoletDatabase.getServices();
      const matchedSvc = services.find(s => s.name === lead.serviceRequired);
      
      let defaultPrice = matchedSvc ? matchedSvc.basePrice : 15000;
      const initialOptions: Record<string, string> = {};
      
      if (matchedSvc && matchedSvc.submenus && matchedSvc.submenus.length > 0) {
        matchedSvc.submenus.forEach(submenu => {
          const firstOpt = submenu.options[0];
          if (firstOpt) {
            initialOptions[submenu.id] = firstOpt.name;
            defaultPrice += firstOpt.price;
          }
        });
      }

      const initialItems = measurementTicket.measurements.map((m, index) => ({
        id: `LI-${index + 1}-${Math.random().toString(36).substring(2, 5)}`,
        description: `${lead.serviceRequired} (${m.openingStyle || 'Standard'})`,
        width: m.width,
        height: m.height,
        qty: m.qty,
        unitPrice: defaultPrice,
        taxRate: 18,
        glassType: '6mm Single Toughened',
        frameType: 'Premium White Profile',
        selectedOptions: { ...initialOptions }
      }));
      setLineItems(initialItems);
      setNotes('Based on site measurements submitted by sales.');
    }
  }, [lead, measurementTicket]);

  const handleAddItem = () => {
    const services = RenoletDatabase.getServices();
    const matchedSvc = services.find(s => s.name === lead.serviceRequired);
    
    let defaultPrice = matchedSvc ? matchedSvc.basePrice : 12000;
    const initialOptions: Record<string, string> = {};
    
    if (matchedSvc && matchedSvc.submenus && matchedSvc.submenus.length > 0) {
      matchedSvc.submenus.forEach(submenu => {
        const firstOpt = submenu.options[0];
        if (firstOpt) {
          initialOptions[submenu.id] = firstOpt.name;
          defaultPrice += firstOpt.price;
        }
      });
    }

    const newItem: QuotationLineItem = {
      id: `LI-NEW-${Math.random().toString(36).substring(2, 5)}`,
      description: lead.serviceRequired,
      width: 1000,
      height: 1000,
      qty: 1,
      unitPrice: defaultPrice,
      taxRate: 18,
      glassType: '5mm Clear',
      frameType: 'Classic White',
      selectedOptions: initialOptions
    };
    setLineItems([...lineItems, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const handleUpdateItem = (id: string, field: keyof QuotationLineItem, value: any) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        return updated;
      }
      return item;
    }));
  };

  // Calculations
  const calculateTotals = (items: QuotationLineItem[]) => {
    const subTotal = items.reduce((acc, curr) => acc + (curr.unitPrice * curr.qty), 0);
    const taxAmount = items.reduce((acc, curr) => acc + ((curr.unitPrice * curr.qty) * (curr.taxRate / 100)), 0);
    const grandTotal = subTotal + taxAmount;
    return { subTotal, taxAmount, grandTotal };
  };

  const { subTotal, taxAmount, grandTotal } = calculateTotals(lineItems);

  // Save/Revise
  const handleSaveQuotation = () => {
    if (lineItems.length === 0) {
      addToast('error', 'Empty Quotation', 'Please add at least one line item.');
      return;
    }

    const currentQuotes = RenoletDatabase.getQuotations().filter(q => q.leadId === lead.id);
    const nextVersion = currentQuotes.length + 1;

    const newQuotation: Quotation = {
      id: `Q-${lead.id.replace('L-', '')}-${nextVersion}`,
      leadId: lead.id,
      version: nextVersion,
      lineItems,
      subTotal,
      taxAmount,
      grandTotal,
      notes,
      createdAt: new Date().toISOString(),
      createdBy: 'Quotation Desk Agent'
    };

    const allQuotes = RenoletDatabase.getQuotations();
    allQuotes.push(newQuotation);
    RenoletDatabase.saveQuotations(allQuotes);

    // Update lead status to Quotation Sent
    RenoletDatabase.updateLeadStatus(lead.id, 'Quotation Sent', 'Quotation', `Created and dispatched Quotation Version ${nextVersion}`);

    // Update local state
    const updatedHistory = [newQuotation, ...history];
    setHistory(updatedHistory);
    setSelectedVersion(nextVersion);
    addToast('success', 'Quotation Saved', `Quotation Version ${nextVersion} saved and sent to follow-up.`);
    onQuotationCreated(newQuotation);
    setActiveTab('preview');
  };

  // Switch versions in history
  const handleViewVersion = (version: number) => {
    const selected = history.find(q => q.version === version);
    if (selected) {
      setLineItems(selected.lineItems);
      setNotes(selected.notes || '');
      setSelectedVersion(version);
      setActiveTab('preview');
      addToast('info', 'Version Loaded', `Viewing version ${version} details.`);
    }
  };

  // Sharing content generators
  const getShareText = () => {
    return `*RENOLET WINDOW & DOOR SYSTEMS*\n` +
      `----------------------------------------\n` +
      `Quotation Proposal for: *${lead.clientName}*\n` +
      `Quote ID: Q-${lead.id.replace('L-', '')}-v${selectedVersion || 1}\n` +
      `Items Details:\n` +
      lineItems.map(li => ` - ${li.description} (${li.width}x${li.height}mm): ${li.qty} units @ ₹${li.unitPrice}`).join('\n') + '\n' +
      `----------------------------------------\n` +
      `Subtotal: ₹${subTotal.toLocaleString('en-IN')}\n` +
      `GST (18%): ₹${taxAmount.toLocaleString('en-IN')}\n` +
      `*Grand Total: ₹${grandTotal.toLocaleString('en-IN')}*\n` +
      `----------------------------------------\n` +
      `Thank you for choosing Renolet!`;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Header bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-800 text-base">Quotation Creator & Version Manager</h3>
          <p className="text-xs text-slate-500 mt-0.5">Prepare estimates with automated tax & version controls</p>
        </div>
        <div className="flex bg-slate-200 p-0.5 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-3 py-1.5 rounded-md transition-all ${activeTab === 'create' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Edit Items
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 rounded-md transition-all ${activeTab === 'preview' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
          >
            PDF Preview
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-md transition-all ${activeTab === 'history' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Revision History ({history.length})
          </button>
        </div>
      </div>

      {activeTab === 'create' && (
        <div className="p-6 space-y-6">
          {/* Main items grid */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-2">Description</th>
                  <th className="py-3 px-2 w-[100px]">Width (mm)</th>
                  <th className="py-3 px-2 w-[100px]">Height (mm)</th>
                  <th className="py-3 px-2 w-[90px]">Qty</th>
                  <th className="py-3 px-2 w-[140px]">Unit Price (₹)</th>
                  <th className="py-3 px-2">Glass/Frame Options</th>
                  <th className="py-3 px-2 w-[50px] text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {lineItems.map((item) => {
                  const services = RenoletDatabase.getServices();
                  const matchedSvc = services.find(s => s.name === lead.serviceRequired);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-blue-sky text-xs font-medium text-slate-800"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <input
                          type="number"
                          value={item.width}
                          onChange={(e) => handleUpdateItem(item.id, 'width', parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-blue-sky text-xs"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <input
                          type="number"
                          value={item.height}
                          onChange={(e) => handleUpdateItem(item.id, 'height', parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-blue-sky text-xs"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <input
                          type="number"
                          value={item.qty}
                          onChange={(e) => handleUpdateItem(item.id, 'qty', parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-blue-sky text-xs font-bold"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleUpdateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-blue-sky text-xs"
                        />
                      </td>
                      <td className="py-3 px-2">
                        {matchedSvc && matchedSvc.submenus && matchedSvc.submenus.length > 0 ? (
                          <div className="grid grid-cols-2 gap-1.5 min-w-[280px]">
                            {matchedSvc.submenus.map((submenu) => {
                              const currentValue = item.selectedOptions?.[submenu.id] || submenu.options[0]?.name || '';
                              return (
                                <div key={submenu.id} className="flex flex-col gap-0.5">
                                  <span className="text-[9px] text-slate-400 font-bold uppercase">{submenu.name}</span>
                                  <select
                                    value={currentValue}
                                    onChange={(e) => {
                                      const selectedVal = e.target.value;
                                      const updatedSelectedOptions = {
                                        ...(item.selectedOptions || {}),
                                        [submenu.id]: selectedVal
                                      };
                                      
                                      // Recalculate unit price
                                      let newUnitPrice = matchedSvc.basePrice;
                                      matchedSvc.submenus!.forEach(s => {
                                        const selName = s.id === submenu.id ? selectedVal : (item.selectedOptions?.[s.id] || s.options[0]?.name || '');
                                        const matchedOpt = s.options.find(o => o.name === selName);
                                        if (matchedOpt) {
                                          newUnitPrice += matchedOpt.price;
                                        }
                                      });
                                      
                                      const lineItemsCopy = lineItems.map(li => {
                                        if (li.id === item.id) {
                                          return {
                                            ...li,
                                            selectedOptions: updatedSelectedOptions,
                                            unitPrice: newUnitPrice
                                          };
                                        }
                                        return li;
                                      });
                                      setLineItems(lineItemsCopy);
                                    }}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1 focus:outline-none focus:border-brand-blue-sky text-[10px] font-semibold text-slate-750"
                                  >
                                    {submenu.options.map(opt => (
                                      <option key={opt.id} value={opt.name}>
                                        {opt.name} {opt.price > 0 ? ` (+₹${opt.price})` : ''}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <select
                              value={item.glassType}
                              onChange={(e) => handleUpdateItem(item.id, 'glassType', e.target.value)}
                              className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-brand-blue-sky text-[10px]"
                            >
                              <option value="5mm Clear">5mm Clear</option>
                              <option value="6mm Clear Toughened">6mm Toughened</option>
                              <option value="6mm Single Frosted">6mm Frosted</option>
                              <option value="6mm DGU Double Glazed">6mm DGU</option>
                              <option value="12mm DGU Soundproof">12mm Soundproof</option>
                            </select>
                            <select
                              value={item.frameType}
                              onChange={(e) => handleUpdateItem(item.id, 'frameType', e.target.value)}
                              className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-brand-blue-sky text-[10px]"
                            >
                              <option value="Classic White">Classic White</option>
                              <option value="Premium Grey">Premium Grey</option>
                              <option value="Forest Walnut Wood">Forest Walnut</option>
                              <option value="Sleek Obsidian Black">Obsidian Black</option>
                            </select>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1.5"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Add item button */}
          <button
            onClick={handleAddItem}
            className="flex items-center gap-2 border border-dashed border-slate-300 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-brand-blue-sky hover:border-brand-blue-sky transition-all w-full justify-center"
          >
            <Plus className="w-4 h-4" /> Add Custom Product Line Item
          </button>

          {/* Notes and Totals Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Terms & Special Quotation Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Specify warranty, profiles, delivery deadlines, and glass details here..."
                rows={4}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-brand-blue-sky text-xs text-slate-700"
              />
            </div>
            <div className="bg-slate-50 rounded-xl p-5 space-y-3.5 text-xs text-slate-600 border border-slate-100">
              <div className="flex justify-between">
                <span>Subtotal Value:</span>
                <span className="font-semibold text-slate-800">₹{subTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>GST / Integrated Tax (18%):</span>
                <span className="font-semibold text-slate-800">₹{taxAmount.toLocaleString('en-IN')}</span>
              </div>
              <hr className="border-slate-200" />
              <div className="flex justify-between text-sm font-bold text-slate-800">
                <span>Grand Estimate Total:</span>
                <span className="text-brand-blue-deep font-extrabold text-base">₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSaveQuotation}
                  className="w-full flex items-center justify-center gap-2 bg-brand-blue-deep hover:bg-brand-blue-dark text-white rounded-xl py-3 font-semibold text-xs shadow-md transition-all"
                >
                  <Save className="w-4 h-4" />
                  {history.length > 0 ? 'Save & Dispatch Revision v' + (history.length + 1) : 'Save & Dispatch Initial Estimate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'preview' && (
        <div className="p-6 space-y-6 bg-slate-50/50">
          {/* Simulated PDF print layout */}
          <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-3xl mx-auto shadow-sm space-y-8 font-sans">
            {/* Header info */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-6">
              <div>
                <RenoletLogo height={38} />
                <div className="text-[10px] text-slate-500 mt-2 space-y-0.5">
                  <p>A-10 Corporate Towers, Ahmedabad</p>
                  <p>support@renolet.com | +91 79 12345678</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">ESTIMATE PROPOSAL</h2>
                <div className="text-[10px] text-slate-500 mt-2 space-y-1">
                  <p><span className="font-medium text-slate-400">Estimate No:</span> <span className="font-bold text-slate-800">Q-{lead.id.replace('L-', '')}-{selectedVersion || 1}</span></p>
                  <p><span className="font-medium text-slate-400">Version:</span> <span className="font-bold text-slate-700">v{selectedVersion || 1}</span></p>
                  <p><span className="font-medium text-slate-400">Date:</span> <span>{new Date().toLocaleDateString()}</span></p>
                </div>
              </div>
            </div>

            {/* Client address detail */}
            <div className="grid grid-cols-2 gap-4 text-xs text-slate-600">
              <div>
                <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">PROPOSAL PREPARED FOR:</h4>
                <p className="font-bold text-slate-800">{lead.clientName}</p>
                <p className="mt-1">{lead.address}</p>
                <p className="mt-1">{lead.mobile}</p>
              </div>
              <div className="text-right">
                <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">PROJECT DETAILS:</h4>
                <p><span className="font-medium text-slate-400">Required Service:</span> {lead.serviceRequired}</p>
                <p className="mt-1"><span className="font-medium text-slate-400">Sales Assigned:</span> {lead.assignedSalesMember || 'N/A'}</p>
              </div>
            </div>

            {/* Line items table */}
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-slate-200 bg-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-2">Description</th>
                  <th className="py-2.5 px-2 text-center">Dimensions</th>
                  <th className="py-2.5 px-2 text-center">Qty</th>
                  <th className="py-2.5 px-2 text-right">Unit Rate</th>
                  <th className="py-2.5 px-2 text-right">Net Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {lineItems.map((item, idx) => {
                  const services = RenoletDatabase.getServices();
                  const matchedSvc = services.find(s => s.name === lead.serviceRequired);
                  return (
                    <tr key={item.id || idx}>
                      <td className="py-3 px-2">
                        <p className="font-semibold text-slate-850 text-xs">{item.description}</p>
                        {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 ? (
                          <p className="text-[9px] text-slate-550 mt-0.5 max-w-[340px] leading-relaxed">
                            {Object.entries(item.selectedOptions).map(([subId, optVal]) => {
                              const sub = matchedSvc?.submenus?.find(s => s.id === subId);
                              return `${sub ? sub.name : subId}: ${optVal}`;
                            }).join(' | ')}
                          </p>
                        ) : (
                          <p className="text-[10px] text-slate-400 mt-0.5">Glass: {item.glassType} | Profile: {item.frameType}</p>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center font-medium">
                        {item.width} x {item.height} mm
                      </td>
                      <td className="py-3 px-2 text-center font-bold text-slate-800">{item.qty}</td>
                      <td className="py-3 px-2 text-right">₹{item.unitPrice.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-2 text-right font-semibold">₹{(item.unitPrice * item.qty).toLocaleString('en-IN')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Subtotals breakdown */}
            <div className="flex justify-end pt-4 border-t border-slate-200">
              <div className="w-[280px] space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-800">₹{subTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (18%):</span>
                  <span className="font-semibold text-slate-800">₹{taxAmount.toLocaleString('en-IN')}</span>
                </div>
                <hr className="border-slate-200" />
                <div className="flex justify-between text-sm font-bold text-slate-800 bg-slate-50 p-2 rounded-lg">
                  <span>Grand Total:</span>
                  <span className="text-brand-blue-deep font-extrabold text-base">₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {notes && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-[11px] text-slate-500">
                <h5 className="font-bold text-slate-700 mb-1 uppercase tracking-wide">ESTIMATE REMARKS & WARRANTY TERMS:</h5>
                <p className="leading-relaxed whitespace-pre-line">{notes}</p>
              </div>
            )}

            {/* Signature mockup */}
            <div className="grid grid-cols-2 gap-6 pt-10 text-[10px] text-slate-400">
              <div>
                <div className="border-b border-slate-200 h-10 w-44" />
                <p className="mt-1">Prepared By: Renolet Estimator</p>
              </div>
              <div className="text-right flex flex-col items-end">
                <div className="border-b border-slate-200 h-10 w-44" />
                <p className="mt-1">Client Signature & Date</p>
              </div>
            </div>
          </div>

          {/* Action buttons (WhatsApp, Email) */}
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setSharingMethod('whatsapp')}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-5 py-2.5 font-semibold text-xs shadow-sm transition-colors"
            >
              <Send className="w-4 h-4" /> Send via WhatsApp
            </button>
            <button
              onClick={() => setSharingMethod('email')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 font-semibold text-xs shadow-sm transition-colors"
            >
              <Mail className="w-4 h-4" /> Send via Email
            </button>
            <button
              onClick={() => {
                window.print();
              }}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl px-5 py-2.5 font-semibold text-xs shadow-sm transition-colors"
            >
              <Eye className="w-4 h-4" /> Print Proposal
            </button>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="p-6">
          <div className="space-y-4">
            {history.map((rev) => (
              <div
                key={rev.id}
                className={`border rounded-xl p-4 flex items-center justify-between hover:bg-slate-50 transition-colors ${rev.version === selectedVersion ? 'border-brand-blue-sky bg-blue-50/20' : 'border-slate-200'}`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-sm">Version {rev.version}</span>
                    <span className="text-[10px] text-slate-400 font-mono">ID: {rev.id}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Created on {new Date(rev.createdAt).toLocaleString()} by {rev.createdBy}
                  </p>
                  <p className="text-xs text-slate-600 mt-2 font-medium">
                    Total: ₹{rev.grandTotal.toLocaleString('en-IN')} ({rev.lineItems.length} items)
                  </p>
                </div>
                <button
                  onClick={() => handleViewVersion(rev.version)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${rev.version === selectedVersion ? 'bg-brand-blue-deep border-brand-blue-deep text-white shadow-sm' : 'border-slate-200 hover:border-slate-400 text-slate-700'}`}
                >
                  <Eye className="w-3.5 h-3.5" /> View / Load
                </button>
              </div>
            ))}
            {history.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-sm">
                No quotations generated yet for this lead.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mock Social Sharing Dialog overlay */}
      {sharingMethod && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Share2 className="w-4 h-4 text-brand-blue-sky" />
                {sharingMethod === 'whatsapp' ? 'Simulate WhatsApp Delivery' : 'Simulate Email Client Dispatch'}
              </h4>
              <button onClick={() => setSharingMethod(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                {sharingMethod === 'whatsapp'
                  ? `Simulating API payload delivery to client's registered mobile number: ${lead.mobile}`
                  : `Preparing HTML styled proposal attachment template for client's inbox: ${lead.email}`
                }
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-[11px] font-mono text-slate-600 whitespace-pre-wrap select-all max-h-[220px] overflow-y-auto">
                {getShareText()}
              </div>
            </div>

            <div className="flex justify-end gap-2 text-xs font-semibold">
              <button
                onClick={() => setSharingMethod(null)}
                className="border border-slate-200 rounded-xl px-4 py-2 hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(getShareText());
                  addToast('success', 'Copied to Clipboard', 'Quotation content copied successfully.');
                  setSharingMethod(null);
                  RenoletDatabase.addLog(lead.id, 'Quotation', `Dispatched quote via ${sharingMethod === 'whatsapp' ? 'WhatsApp' : 'Email'}`);
                }}
                className="bg-brand-blue-deep hover:bg-brand-blue-dark text-white rounded-xl px-4 py-2 flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <ShieldCheck className="w-4 h-4" /> Copy Message & Dispatch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
