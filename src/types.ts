export type Role =
  | 'Admin'
  | 'Sales'
  | 'Quotation'
  | 'Accounts'
  | 'Purchase'
  | 'Production'
  | 'Installation';

export interface ServiceSubmenuOption {
  id: string;
  name: string;
  price: number;
}

export interface ServiceSubmenu {
  id: string;
  name: string; // e.g. Track, Sash, Glass Type, Mesh, Hardware, Mesh Mullin
  options: ServiceSubmenuOption[];
}

export interface Service {
  id: string;
  name: string;
  category: 'uPVC' | 'Aluminium' | 'Insect Mesh' | 'Other';
  description: string;
  basePrice: number; // Price per unit/sqm
  submenus?: ServiceSubmenu[]; // Subcategory dropdown menus
  isActive: boolean;
}export interface Agent {
  id: string;
  name: string;
  role: string; // e.g. Sales Executive
  email: string;
  isActive: boolean;
}

export type LeadStatus =
  | 'New'
  | 'Assigned'
  | 'Measurement Pending'
  | 'Quotation Pending'
  | 'Quotation Sent'
  | 'Order Won'
  | 'Order Lost'
  | 'Advance Pending'
  | 'Purchase Pending'
  | 'Production Pending'
  | 'In Production'
  | 'Ready to Dispatch'
  | 'Dispatched'
  | 'Installation Scheduled'
  | 'Installation In Progress'
  | 'Final Payment Pending'
  | 'Feedback Unlocked'
  | 'Closed';

export interface ActivityLog {
  id: string;
  leadId: string;
  timestamp: string;
  role: Role;
  action: string;
  notes?: string;
}

export interface Lead {
  id: string;
  clientName: string;
  mobile: string; // Will be masked in Purchase View
  email: string;
  address: string;
  source: 'Web Scrape' | 'Manual Add' | 'Social Media' | 'Website' | 'WhatsApp' | 'Call';
  serviceRequired: string; // Links to Service name
  status: LeadStatus;
  assignedSalesMember?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;

  // Handoff details entered by Sales upon winning the order
  handoffDetails?: {
    finalMeasurements: string;
    orderValue: number;
    advanceAmount: number;
    targetDispatchDate: string;
    siteLocation: string;
    billingAddress: string;
    dispatchAddress: string;
  };

  // Accounts Advance Stage Payment details
  advancePaymentDetails?: {
    paymentExpectedDate: string;
    followUpDateTime: string;
    paymentNotes: string;
    paymentStatus: 'Pending' | 'Partial' | 'Received';
    amountReceived: number;
  };

  // Accounts Final Stage Payment details
  finalPaymentDetails?: {
    paymentExpectedDate: string;
    followUpDateTime: string;
    paymentNotes: string;
    paymentStatus: 'Pending' | 'Received';
    amountReceived: number;
  };
}

export interface MeasurementLineItem {
  id: string;
  productType: string;
  width: number; // in mm
  height: number; // in mm
  qty: number;
  openingStyle: string;
  meshRequired: boolean;
}

export interface MeasurementTicket {
  id: string;
  leadId: string;
  meetingNotes: string;
  measurements: MeasurementLineItem[];
  submittedAt: string;
  submittedBy: string;
}

export interface QuotationLineItem {
  id: string;
  description: string;
  width: number;
  height: number;
  qty: number;
  unitPrice: number;
  taxRate: number; // default e.g. 18% for GST
  glassType: string;
  frameType: string;
  selectedOptions?: Record<string, string>; // Maps submenuId -> selectedOptionName
}

export interface Quotation {
  id: string;
  leadId: string;
  version: number;
  lineItems: QuotationLineItem[];
  subTotal: number;
  taxAmount: number;
  grandTotal: number;
  notes?: string;
  createdAt: string;
  createdBy: string;
}

export interface BOMItem {
  id: string;
  materialName: string; // e.g. 'uPVC Casement Profile - White'
  qty: number;
  unit: string; // e.g. 'meters', 'pieces'
}

export interface BOM {
  id: string;
  leadId: string;
  items: BOMItem[];
  assignedVendorId?: string;
  vendorQuotedPrice?: number;
  generatedAt: string;
}

export interface Vendor {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  category: string;
}

export interface VendorBill {
  id: string;
  bomId: string;
  leadId: string;
  vendorName: string;
  amount: number;
  status: 'Due' | 'Pending' | 'Paid';
  raisedAt: string;
  paidAt?: string;
}

export interface Feedback {
  id: string;
  leadId: string;
  rating: number; // 1 to 5
  reviewText: string;
  photos: string[]; // base64 or mock URLs
  videos: string[]; // base64 or mock URLs
  submittedAt: string;
}
