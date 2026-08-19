import type {
  Lead,
  Service,
  Agent,
  MeasurementTicket,
  Quotation,
  BOM,
  Vendor,
  VendorBill,
  Feedback,
  ActivityLog,
  LeadStatus,
  Role,
  ServiceSubmenu
} from './types';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 9).toUpperCase();

// Seed data keys
const STORAGE_KEYS = {
  SERVICES: 'renolet_services',
  AGENTS: 'renolet_agents',
  LEADS: 'renolet_leads',
  MEASUREMENTS: 'renolet_measurements',
  QUOTATIONS: 'renolet_quotations',
  BOMS: 'renolet_boms',
  VENDORS: 'renolet_vendors',
  VENDOR_BILLS: 'renolet_vendor_bills',
  FEEDBACKS: 'renolet_feedbacks',
  LOGS: 'renolet_logs'
};

export const DEFAULT_SUBMENUS: ServiceSubmenu[] = [
  {
    id: 'sub-track',
    name: 'Track',
    options: [
      { id: 'opt-t1', name: '2 Track', price: 0 },
      { id: 'opt-t2', name: '2.5 Track', price: 1500 },
      { id: 'opt-t3', name: '3 Track', price: 3000 }
    ]
  },
  {
    id: 'sub-sash',
    name: 'Sash',
    options: [
      { id: 'opt-s1', name: '57 Sash', price: 0 },
      { id: 'opt-s2', name: '74 Sash', price: 2000 },
      { id: 'opt-s3', name: '88 Sash', price: 4500 }
    ]
  },
  {
    id: 'sub-glass',
    name: 'Glass Type',
    options: [
      { id: 'opt-g1', name: '5mm', price: 0 },
      { id: 'opt-g2', name: '6mm', price: 500 },
      { id: 'opt-g3', name: '7mm', price: 1000 },
      { id: 'opt-g4', name: '8mm', price: 1500 },
      { id: 'opt-g5', name: '10mm', price: 2500 }
    ]
  },
  {
    id: 'sub-mesh',
    name: 'Mesh',
    options: [
      { id: 'opt-m1', name: 'SS Natural', price: 0 },
      { id: 'opt-m2', name: 'SS Black', price: 800 },
      { id: 'opt-m3', name: 'Alluminium', price: 1200 },
      { id: 'opt-m4', name: 'Nylon', price: 400 }
    ]
  },
  {
    id: 'sub-hard',
    name: 'Hardware',
    options: [
      { id: 'opt-h1', name: 'Touch Lock', price: 0 },
      { id: 'opt-h2', name: 'ESPAG Handle', price: 1800 },
      { id: 'opt-h3', name: 'Popup', price: 2400 }
    ]
  },
  {
    id: 'sub-mullin',
    name: 'Mesh Mullin',
    options: [
      { id: 'opt-mu1', name: 'No', price: 0 },
      { id: 'opt-mu2', name: 'Yes', price: 1000 }
    ]
  }
];

// Initial services list
const INITIAL_SERVICES: Service[] = [
  { id: 'S1', name: 'uPVC Windows (Casement)', category: 'uPVC', description: 'Premium outward or inward swing windows.', basePrice: 12000, submenus: DEFAULT_SUBMENUS, isActive: true },
  { id: 'S2', name: 'uPVC Windows (Awning/Top Hung)', category: 'uPVC', description: 'Excellent ventilation and rain protection.', basePrice: 13000, submenus: DEFAULT_SUBMENUS, isActive: true },
  { id: 'S3', name: 'uPVC Windows (French)', category: 'uPVC', description: 'Classic aesthetic double sash openable windows.', basePrice: 15000, submenus: DEFAULT_SUBMENUS, isActive: true },
  { id: 'S4', name: 'uPVC Windows (Sliding)', category: 'uPVC', description: 'Space saving, smooth glide sliding tracks.', basePrice: 9000, submenus: DEFAULT_SUBMENUS, isActive: true },
  { id: 'S5', name: 'uPVC Windows (Fixed)', category: 'uPVC', description: 'Non-openable windows for maximum light.', basePrice: 6000, submenus: DEFAULT_SUBMENUS, isActive: true },
  { id: 'S6', name: 'uPVC Windows (Tilt and Turn)', category: 'uPVC', description: 'Dual action handle for ventilation or full open.', basePrice: 18000, submenus: DEFAULT_SUBMENUS, isActive: true },
  { id: 'S7', name: 'uPVC Windows (Ventilator)', category: 'uPVC', description: 'Small ventilators for toilets/bathrooms.', basePrice: 4000, submenus: DEFAULT_SUBMENUS, isActive: true },
  { id: 'S8', name: 'uPVC Doors (Bi-Fold)', category: 'uPVC', description: 'Multi-fold panoramic patio doors.', basePrice: 28000, submenus: DEFAULT_SUBMENUS, isActive: true },
  { id: 'S9', name: 'uPVC Doors (Casement)', category: 'uPVC', description: 'Heavy duty single/double openable doors.', basePrice: 16000, submenus: DEFAULT_SUBMENUS, isActive: true },
  { id: 'S10', name: 'uPVC Doors (French)', category: 'uPVC', description: 'Elegant glass doors opening to lawns or balconies.', basePrice: 22000, submenus: DEFAULT_SUBMENUS, isActive: true },
  { id: 'S11', name: 'uPVC Doors (Sliding)', category: 'uPVC', description: 'Heavy slider doors with low thresholds.', basePrice: 18000, submenus: DEFAULT_SUBMENUS, isActive: true },
  { id: 'S12', name: 'Aluminium Windows', category: 'Aluminium', description: 'Sleek, modern slimline thermal-break aluminium.', basePrice: 24000, submenus: DEFAULT_SUBMENUS, isActive: true },
  { id: 'S13', name: 'Insect Mesh', category: 'Insect Mesh', description: 'Plisse, roller, or magnetic fiberglass/SS mesh.', basePrice: 3500, submenus: DEFAULT_SUBMENUS, isActive: true }
];

const INITIAL_AGENTS: Agent[] = [
  { id: 'A1', name: 'John Doe (Sales)', role: 'Sales Executive', email: 'john.doe@renolet.com', isActive: true },
  { id: 'A2', name: 'Vikram Singh (Sales)', role: 'Senior Exec', email: 'vikram.s@renolet.com', isActive: true },
  { id: 'A3', name: 'Lata Mangeshkar (Sales)', role: 'Field Sales', email: 'lata.m@renolet.com', isActive: true }
];

const INITIAL_VENDORS: Vendor[] = [
  { id: 'V1', name: 'Aluplast Extrusions Ltd.', contactPerson: 'Michael K.', phone: '+91 98765-43210', email: 'michael@aluplast.com', category: 'Profiles & Extrusions' },
  { id: 'V2', name: 'Saint-Gobain Glass India', contactPerson: 'Rohan Mehta', phone: '+91 99988-77665', email: 'rohan.mehta@saint-gobain.com', category: 'Glass & Glazing' },
  { id: 'V3', name: 'Securist Hardware Pvt Ltd', contactPerson: 'Anjali Shah', phone: '+91 91234-56789', email: 'sales@securisthardware.com', category: 'Handles & Hinges' },
  { id: 'V4', name: 'Phifer Mesh Corp', contactPerson: 'Arthur Dent', phone: '+91 88877-66554', email: 'contact@phifermesh.in', category: 'Insect Mesh' }
];

// Seed Leads to display pipeline stages immediately
const INITIAL_LEADS: Lead[] = [
  {
    id: 'L-1001',
    clientName: 'Amit Patel',
    mobile: '+91 98111-22233',
    email: 'amit.patel@gmail.com',
    address: 'A-402 Shanti Villa, Bodakdev, Ahmedabad',
    source: 'Website',
    serviceRequired: 'uPVC Windows (Casement)',
    status: 'New',
    createdAt: '2026-07-28T10:00:00Z',
    updatedAt: '2026-07-28T10:00:00Z',
    notes: 'Client looking for soundproofing casement windows for bedrooms.'
  },
  {
    id: 'L-1002',
    clientName: 'Sarah Jenkins',
    mobile: '+91 98444-55566',
    email: 'sarah.j@outlook.com',
    address: 'Villa 12, Sobha Greenwoods, Whitefield, Bangalore',
    source: 'WhatsApp',
    serviceRequired: 'uPVC Doors (French)',
    status: 'Measurement Pending',
    assignedSalesMember: 'John Doe (Sales)',
    createdAt: '2026-07-28T11:30:00Z',
    updatedAt: '2026-07-29T09:00:00Z',
    notes: 'Assigned to John Doe for immediate site measurement.'
  },
  {
    id: 'L-1003',
    clientName: 'Rajesh Kumar',
    mobile: '+91 98777-88899',
    email: 'rajesh.k@yahoo.com',
    address: 'Plot 72, Sector 15, Vashi, Navi Mumbai',
    source: 'Social Media',
    serviceRequired: 'uPVC Windows (Sliding)',
    status: 'Quotation Pending',
    assignedSalesMember: 'John Doe (Sales)',
    createdAt: '2026-07-27T08:00:00Z',
    updatedAt: '2026-07-29T11:00:00Z',
    notes: 'Measurements submitted. Quotation team needs to prepare price estimate.'
  },
  {
    id: 'L-1004',
    clientName: 'Emily Watson',
    mobile: '+91 90000-11122',
    email: 'emily.w@company.com',
    address: 'Penthouse B, DLF Phase 5, Gurgaon',
    source: 'Call',
    serviceRequired: 'Aluminium Windows',
    status: 'Advance Pending',
    assignedSalesMember: 'Vikram Singh (Sales)',
    createdAt: '2026-07-26T14:00:00Z',
    updatedAt: '2026-07-29T12:30:00Z',
    notes: 'Order won! v2 quotation approved. Awaiting client deposit clearance.',
    handoffDetails: {
      finalMeasurements: 'Item 1: 1500 x 2100 mm, Item 2: 1200 x 1500 mm',
      orderValue: 175000,
      advanceAmount: 87500,
      targetDispatchDate: '2026-08-25',
      siteLocation: 'Gurgaon Sector 54',
      billingAddress: 'Penthouse B, DLF Phase 5, Gurgaon',
      dispatchAddress: 'Penthouse B, DLF Phase 5, Gurgaon'
    },
    advancePaymentDetails: {
      paymentExpectedDate: '2026-08-05',
      followUpDateTime: '2026-07-30T10:00',
      paymentNotes: 'Client promised to initiate wire transfer by tomorrow.',
      paymentStatus: 'Pending',
      amountReceived: 0
    }
  },
  {
    id: 'L-1005',
    clientName: 'Vijay Sharma',
    mobile: '+91 95555-66677',
    email: 'vijay.sharma@gmail.com',
    address: 'Flat 101, Prestige Heights, HSR Layout, Bangalore',
    source: 'Manual Add',
    serviceRequired: 'Insect Mesh',
    status: 'In Production',
    assignedSalesMember: 'John Doe (Sales)',
    createdAt: '2026-07-25T09:00:00Z',
    updatedAt: '2026-07-29T14:00:00Z',
    notes: 'Material received and paid to vendor. Production team has begun assembly.',
    handoffDetails: {
      finalMeasurements: '5 Windows: 900 x 1200 mm Plisse mesh',
      orderValue: 45000,
      advanceAmount: 25000,
      targetDispatchDate: '2026-08-10',
      siteLocation: 'HSR Layout Sector 3',
      billingAddress: 'Flat 101, Prestige Heights, HSR Layout, Bangalore',
      dispatchAddress: 'Flat 101, Prestige Heights, HSR Layout, Bangalore'
    },
    advancePaymentDetails: {
      paymentExpectedDate: '2026-07-27',
      followUpDateTime: '2026-07-27T12:00',
      paymentNotes: 'Advance received in GPay.',
      paymentStatus: 'Received',
      amountReceived: 25000
    }
  },
  {
    id: 'L-1006',
    clientName: 'George Thomas',
    mobile: '+91 91111-33355',
    email: 'george@thomas.net',
    address: '42 Orchid Residency, Kakkanad, Kochi',
    source: 'Call',
    serviceRequired: 'uPVC Windows (Casement)',
    status: 'Feedback Unlocked',
    assignedSalesMember: 'Vikram Singh (Sales)',
    createdAt: '2026-07-24T10:00:00Z',
    updatedAt: '2026-07-29T15:30:00Z',
    notes: 'Installation finalized. Accounts successfully collected the balance payment. Feedback form unlocked.',
    handoffDetails: {
      finalMeasurements: '3 Windows: 1200 x 1200 mm',
      orderValue: 80000,
      advanceAmount: 40000,
      targetDispatchDate: '2026-08-01',
      siteLocation: 'Orchid Residency Kochi',
      billingAddress: '42 Orchid Residency, Kakkanad, Kochi',
      dispatchAddress: '42 Orchid Residency, Kakkanad, Kochi'
    },
    advancePaymentDetails: {
      paymentExpectedDate: '2026-07-25',
      followUpDateTime: '2026-07-25T11:00',
      paymentNotes: 'Advance paid in full.',
      paymentStatus: 'Received',
      amountReceived: 40000
    },
    finalPaymentDetails: {
      paymentExpectedDate: '2026-07-29',
      followUpDateTime: '2026-07-29T15:00',
      paymentNotes: 'Balance 40000 received via net banking.',
      paymentStatus: 'Received',
      amountReceived: 40000
    }
  }
];

const INITIAL_MEASUREMENTS: MeasurementTicket[] = [
  {
    id: 'M-101',
    leadId: 'L-1003',
    meetingNotes: 'Site visit completed. Customer selected charcoal mesh with dark brown sliding frames.',
    measurements: [
      { id: generateId(), productType: 'Sliding Window', width: 1800, height: 1400, qty: 3, openingStyle: '2-Track Sliding', meshRequired: true }
    ],
    submittedAt: '2026-07-29T11:00:00Z',
    submittedBy: 'John Doe (Sales)'
  },
  {
    id: 'M-102',
    leadId: 'L-1004',
    meetingNotes: 'Finalizing measurements for DLF Phase 5 Penthouse.',
    measurements: [
      { id: generateId(), productType: 'Aluminium Fixed', width: 1500, height: 2100, qty: 1, openingStyle: 'Fixed', meshRequired: false },
      { id: generateId(), productType: 'Aluminium Casement', width: 1200, height: 1500, qty: 2, openingStyle: 'Outward Open', meshRequired: true }
    ],
    submittedAt: '2026-07-28T12:00:00Z',
    submittedBy: 'Vikram Singh (Sales)'
  },
  {
    id: 'M-103',
    leadId: 'L-1005',
    meetingNotes: 'Window insect mesh site visit.',
    measurements: [
      { id: generateId(), productType: 'Insect Mesh Plisse', width: 900, height: 1200, qty: 5, openingStyle: 'Pleated', meshRequired: true }
    ],
    submittedAt: '2026-07-26T09:00:00Z',
    submittedBy: 'John Doe (Sales)'
  },
  {
    id: 'M-104',
    leadId: 'L-1006',
    meetingNotes: 'Casement window measurements Kochi.',
    measurements: [
      { id: generateId(), productType: 'uPVC Casement', width: 1200, height: 1200, qty: 3, openingStyle: 'Outward Open', meshRequired: false }
    ],
    submittedAt: '2026-07-25T10:00:00Z',
    submittedBy: 'Vikram Singh (Sales)'
  }
];

const INITIAL_QUOTATIONS: Quotation[] = [
  {
    id: 'Q-201',
    leadId: 'L-1004',
    version: 1,
    lineItems: [
      { id: generateId(), description: 'Aluminium Fixed Frame Window 1500x2100', width: 1500, height: 2100, qty: 1, unitPrice: 45000, taxRate: 18, glassType: '6mm Clear Tempered', frameType: 'Thermal Break DGU' },
      { id: generateId(), description: 'Aluminium Casement Window 1200x1500', width: 1200, height: 1500, qty: 2, unitPrice: 35000, taxRate: 18, glassType: '6mm Clear Tempered', frameType: 'Thermal Break DGU' }
    ],
    subTotal: 115000,
    taxAmount: 20700,
    grandTotal: 135700,
    notes: 'Draft quotation v1.',
    createdAt: '2026-07-28T14:00:00Z',
    createdBy: 'Quotation Officer'
  },
  {
    id: 'Q-202',
    leadId: 'L-1004',
    version: 2,
    lineItems: [
      { id: generateId(), description: 'Aluminium Fixed Frame Window 1500x2100', width: 1500, height: 2100, qty: 1, unitPrice: 55000, taxRate: 18, glassType: '6mm DGU Double Glazed', frameType: 'Premium Grey' },
      { id: generateId(), description: 'Aluminium Casement Window 1200x1500', width: 1200, height: 1500, qty: 2, unitPrice: 40000, taxRate: 18, glassType: '6mm DGU Double Glazed', frameType: 'Premium Grey' }
    ],
    subTotal: 135000,
    taxAmount: 24300,
    grandTotal: 159300, // Adjusted with handoff value in database later
    notes: 'Revised quotation with double glazed glass upgrade as requested by customer.',
    createdAt: '2026-07-29T10:00:00Z',
    createdBy: 'Quotation Officer'
  },
  {
    id: 'Q-203',
    leadId: 'L-1006',
    version: 1,
    lineItems: [
      { id: generateId(), description: 'uPVC Casement Window 1200x1200', width: 1200, height: 1200, qty: 3, unitPrice: 22000, taxRate: 18, glassType: '5mm Clear', frameType: 'Classic White' }
    ],
    subTotal: 66000,
    taxAmount: 11880,
    grandTotal: 77880,
    notes: 'Initial casement quotation.',
    createdAt: '2026-07-25T11:00:00Z',
    createdBy: 'Quotation Officer'
  }
];

const INITIAL_BOMS: BOM[] = [
  {
    id: 'B-301',
    leadId: 'L-1005',
    items: [
      { id: generateId(), materialName: 'Insect Pleated Mesh roll (Phifer)', qty: 6, unit: 'meters' },
      { id: generateId(), materialName: 'Slimline Mesh Tracks - Charcoal', qty: 12, unit: 'meters' },
      { id: generateId(), materialName: 'Corner joints & Tension cords', qty: 5, unit: 'sets' }
    ],
    assignedVendorId: 'V4',
    vendorQuotedPrice: 15000,
    generatedAt: '2026-07-27T10:00:00Z'
  },
  {
    id: 'B-302',
    leadId: 'L-1006',
    items: [
      { id: generateId(), materialName: 'uPVC Multi-chamber Casement Profiles - White', qty: 15, unit: 'meters' },
      { id: generateId(), materialName: '5mm toughened float glass panels', qty: 3, unit: 'sheets' },
      { id: generateId(), materialName: 'Friction hinges & multi-point locks', qty: 3, unit: 'sets' }
    ],
    assignedVendorId: 'V1',
    vendorQuotedPrice: 32000,
    generatedAt: '2026-07-26T12:00:00Z'
  }
];

const INITIAL_VENDOR_BILLS: VendorBill[] = [
  {
    id: 'VB-401',
    bomId: 'B-301',
    leadId: 'L-1005',
    vendorName: 'Phifer Mesh Corp',
    amount: 15000,
    status: 'Paid',
    raisedAt: '2026-07-27T11:00:00Z',
    paidAt: '2026-07-29T13:30:00Z'
  },
  {
    id: 'VB-402',
    bomId: 'B-302',
    leadId: 'L-1006',
    vendorName: 'Aluplast Extrusions Ltd.',
    amount: 32000,
    status: 'Paid',
    raisedAt: '2026-07-26T14:00:00Z',
    paidAt: '2026-07-27T10:00:00Z'
  }
];

const INITIAL_LOGS: ActivityLog[] = [
  { id: generateId(), leadId: 'L-1001', timestamp: '2026-07-28T10:00:00Z', role: 'Admin', action: 'Lead created in Renolet CRM' },
  { id: generateId(), leadId: 'L-1002', timestamp: '2026-07-28T11:30:00Z', role: 'Admin', action: 'Lead created in Renolet CRM' },
  { id: generateId(), leadId: 'L-1002', timestamp: '2026-07-29T09:00:00Z', role: 'Admin', action: 'Assigned lead and site visit to John Doe (Sales)' },
  { id: generateId(), leadId: 'L-1003', timestamp: '2026-07-27T08:00:00Z', role: 'Admin', action: 'Lead created in Renolet CRM' },
  { id: generateId(), leadId: 'L-1003', timestamp: '2026-07-28T10:00:00Z', role: 'Admin', action: 'Assigned lead to John Doe (Sales)' },
  { id: generateId(), leadId: 'L-1003', timestamp: '2026-07-29T11:00:00Z', role: 'Sales', action: 'Site measurements successfully submitted to Quotation Department', notes: 'Window: 1800 x 1400 sliding.' },
  { id: generateId(), leadId: 'L-1004', timestamp: '2026-07-26T14:00:00Z', role: 'Admin', action: 'Lead created in Renolet CRM' },
  { id: generateId(), leadId: 'L-1004', timestamp: '2026-07-28T12:00:00Z', role: 'Sales', action: 'Measurements sent to Quotation Department' },
  { id: generateId(), leadId: 'L-1004', timestamp: '2026-07-28T14:00:00Z', role: 'Quotation', action: 'Created quotation draft (Version 1)' },
  { id: generateId(), leadId: 'L-1004', timestamp: '2026-07-29T10:00:00Z', role: 'Quotation', action: 'Created revised quotation (Version 2)' },
  { id: generateId(), leadId: 'L-1004', timestamp: '2026-07-29T12:30:00Z', role: 'Sales', action: 'Followed up, customer agreed! Marked as ORDER WON.', notes: 'Handoff forms filled.' },
  { id: generateId(), leadId: 'L-1005', timestamp: '2026-07-25T09:00:00Z', role: 'Admin', action: 'Lead created in Renolet CRM' },
  { id: generateId(), leadId: 'L-1005', timestamp: '2026-07-26T09:00:00Z', role: 'Sales', action: 'Measurements sent to Quotation Department' },
  { id: generateId(), leadId: 'L-1005', timestamp: '2026-07-26T14:00:00Z', role: 'Quotation', action: 'Quotation v1 sent to customer' },
  { id: generateId(), leadId: 'L-1005', timestamp: '2026-07-26T16:00:00Z', role: 'Sales', action: 'Marked as ORDER WON' },
  { id: generateId(), leadId: 'L-1005', timestamp: '2026-07-27T12:00:00Z', role: 'Accounts', action: 'Advance payment of ₹25,000 confirmed' },
  { id: generateId(), leadId: 'L-1005', timestamp: '2026-07-27T15:00:00Z', role: 'Purchase', action: 'BOM generated and assigned to Phifer Mesh Corp' },
  { id: generateId(), leadId: 'L-1005', timestamp: '2026-07-29T13:30:00Z', role: 'Accounts', action: 'Vendor payment processed. Automatically moved to Production.' },
  { id: generateId(), leadId: 'L-1005', timestamp: '2026-07-29T14:00:00Z', role: 'Production', action: 'Production status set to: In Production' }
];

export class RenoletDatabase {
  private static load<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private static save<T>(key: string, data: T): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // Initialize DB with seed data if empty
  public static init(): void {
    if (!localStorage.getItem(STORAGE_KEYS.SERVICES)) {
      this.save(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.AGENTS)) {
      this.save(STORAGE_KEYS.AGENTS, INITIAL_AGENTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.LEADS)) {
      this.save(STORAGE_KEYS.LEADS, INITIAL_LEADS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.MEASUREMENTS)) {
      this.save(STORAGE_KEYS.MEASUREMENTS, INITIAL_MEASUREMENTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.QUOTATIONS)) {
      this.save(STORAGE_KEYS.QUOTATIONS, INITIAL_QUOTATIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.BOMS)) {
      this.save(STORAGE_KEYS.BOMS, INITIAL_BOMS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.VENDORS)) {
      this.save(STORAGE_KEYS.VENDORS, INITIAL_VENDORS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.VENDOR_BILLS)) {
      this.save(STORAGE_KEYS.VENDOR_BILLS, INITIAL_VENDOR_BILLS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.FEEDBACKS)) {
      this.save(STORAGE_KEYS.FEEDBACKS, [] as Feedback[]);
    }
    if (!localStorage.getItem(STORAGE_KEYS.LOGS)) {
      this.save(STORAGE_KEYS.LOGS, INITIAL_LOGS);
    }
  }

  // SERVICES CRUD
  public static getServices(): Service[] {
    const list = this.load<Service[]>(STORAGE_KEYS.SERVICES, []);
    if (list.length === 0) {
      this.save(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
      return INITIAL_SERVICES;
    }
    // Automatically migrate old databases that don't have option submenus seeded yet
    const needsMigration = list.every(s => !s.submenus || s.submenus.length === 0);
    if (needsMigration) {
      this.save(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
      return INITIAL_SERVICES;
    }
    return list;
  }

  public static saveServices(services: Service[]): void {
    this.save(STORAGE_KEYS.SERVICES, services);
  }

  // AGENTS CRUD
  public static getAgents(): Agent[] {
    return this.load<Agent[]>(STORAGE_KEYS.AGENTS, []);
  }

  public static saveAgents(agents: Agent[]): void {
    this.save(STORAGE_KEYS.AGENTS, agents);
  }

  // LEADS CRUD
  public static getLeads(): Lead[] {
    return this.load<Lead[]>(STORAGE_KEYS.LEADS, []);
  }

  public static saveLeads(leads: Lead[]): void {
    this.save(STORAGE_KEYS.LEADS, leads);
  }

  public static updateLeadStatus(leadId: string, status: LeadStatus, role: Role, notes?: string): void {
    const leads = this.getLeads();
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      lead.status = status;
      lead.updatedAt = new Date().toISOString();
      this.saveLeads(leads);
      this.addLog(leadId, role, `Status updated to ${status}`, notes);
    }
  }

  // MEASUREMENTS
  public static getMeasurements(): MeasurementTicket[] {
    return this.load<MeasurementTicket[]>(STORAGE_KEYS.MEASUREMENTS, []);
  }

  public static saveMeasurements(tickets: MeasurementTicket[]): void {
    this.save(STORAGE_KEYS.MEASUREMENTS, tickets);
  }

  // QUOTATIONS
  public static getQuotations(): Quotation[] {
    return this.load<Quotation[]>(STORAGE_KEYS.QUOTATIONS, []);
  }

  public static saveQuotations(quotes: Quotation[]): void {
    this.save(STORAGE_KEYS.QUOTATIONS, quotes);
  }

  // BOMS
  public static getBOMs(): BOM[] {
    return this.load<BOM[]>(STORAGE_KEYS.BOMS, []);
  }

  public static saveBOMs(boms: BOM[]): void {
    this.save(STORAGE_KEYS.BOMS, boms);
  }

  // VENDORS
  public static getVendors(): Vendor[] {
    return this.load<Vendor[]>(STORAGE_KEYS.VENDORS, []);
  }

  // VENDOR BILLS
  public static getVendorBills(): VendorBill[] {
    return this.load<VendorBill[]>(STORAGE_KEYS.VENDOR_BILLS, []);
  }

  public static saveVendorBills(bills: VendorBill[]): void {
    this.save(STORAGE_KEYS.VENDOR_BILLS, bills);
  }

  // FEEDBACKS
  public static getFeedbacks(): Feedback[] {
    return this.load<Feedback[]>(STORAGE_KEYS.FEEDBACKS, []);
  }

  public static saveFeedbacks(feedbacks: Feedback[]): void {
    this.save(STORAGE_KEYS.FEEDBACKS, feedbacks);
  }

  // ACTIVITY LOGS
  public static getLogs(): ActivityLog[] {
    return this.load<ActivityLog[]>(STORAGE_KEYS.LOGS, []);
  }

  public static addLog(leadId: string, role: Role, action: string, notes?: string): void {
    const logs = this.getLogs();
    const log: ActivityLog = {
      id: generateId(),
      leadId,
      timestamp: new Date().toISOString(),
      role,
      action,
      notes
    };
    logs.unshift(log);
    this.save(STORAGE_KEYS.LOGS, logs);
  }

  // Clean Reset Helper
  public static resetToSeed(): void {
    localStorage.removeItem(STORAGE_KEYS.SERVICES);
    localStorage.removeItem(STORAGE_KEYS.AGENTS);
    localStorage.removeItem(STORAGE_KEYS.LEADS);
    localStorage.removeItem(STORAGE_KEYS.MEASUREMENTS);
    localStorage.removeItem(STORAGE_KEYS.QUOTATIONS);
    localStorage.removeItem(STORAGE_KEYS.BOMS);
    localStorage.removeItem(STORAGE_KEYS.VENDORS);
    localStorage.removeItem(STORAGE_KEYS.VENDOR_BILLS);
    localStorage.removeItem(STORAGE_KEYS.FEEDBACKS);
    localStorage.removeItem(STORAGE_KEYS.LOGS);
    this.init();
  }
}
