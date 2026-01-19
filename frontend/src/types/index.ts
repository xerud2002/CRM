// Email types
export interface Email {
  id: string;
  leadId?: string;
  direction: 'inbound' | 'outbound';
  subject: string;
  body: string;
  fromAddress: string;
  toAddress: string;
  sentAt: string;
  isRead: boolean;
  accountId?: string;
  snippet?: string;
}

export interface EmailAccount {
  id: string;
  name: string;
  email: string;
  provider: string;
  isActive: boolean;
  displayName?: string;
}

// Lead types - extended to match actual usage
export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  fromPostcode?: string;
  toPostcode?: string;
  fromAddress?: string;
  toAddress?: string;
  moveDate?: string;
  bedrooms?: number;
  status: string;
  contactStatus: string;
  source: string;
  assignedToId?: string;
  assignedTo?: User;
  createdAt: string;
  updatedAt: string;
  // Extended fields
  xeroQuoteLink?: string | null;
  xeroInvoiceLink?: string | null;
  serviceType?: string | null;
  startTime?: string | null;
  jobDays?: JobDay[];
  submitterComments?: string;
}

export interface JobDay {
  day: number;
  date: string;
  type: 'packing' | 'loading' | 'moving' | 'unloading';
  startTime?: string;
}

// User types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
}

// Activity types
export interface Activity {
  id: string;
  leadId: string;
  userId?: string;
  type: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  user?: User;
}

// Quote types
export interface Quote {
  id: string;
  quoteNumber: string;
  leadId: string;
  lead?: Lead;
  status: string;
  total: number;
  validUntil?: string;
  moveDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Assessment types
export interface Assessment {
  id: string;
  leadId: string;
  lead?: Lead;
  type: string;
  status: string;
  scheduledAt: string;
  completedAt?: string;
  notes?: string;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// API Error
export interface ApiError {
  message: string;
  statusCode: number;
}
