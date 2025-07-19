// Mock Data for ERP System (will be replaced with local storage)
import { Customer, Product, Invoice, Employee, SalesOrder, PurchaseOrder, FinancialRecord } from '../types/erp';

export const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Acme Corporation',
    email: 'contact@acme.com',
    phone: '+1-555-0123',
    address: '123 Business St, City, State 12345',
    status: 'active',
    createdAt: new Date('2024-01-15')
  },
  {
    id: '2',
    name: 'TechStart Inc',
    email: 'hello@techstart.com',
    phone: '+1-555-0456',
    address: '456 Innovation Ave, Tech City, TC 67890',
    status: 'active',
    createdAt: new Date('2024-02-20')
  },
  {
    id: '3',
    name: 'Global Solutions Ltd',
    email: 'info@globalsolutions.com',
    phone: '+1-555-0789',
    address: '789 Enterprise Blvd, Metro, MT 11111',
    status: 'inactive',
    createdAt: new Date('2024-01-05')
  }
];

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Premium Software License',
    sku: 'PSL-001',
    category: 'Software',
    price: 24999,
    stock: 50,
    minStock: 10,
    supplier: 'Software Distributors Inc',
    status: 'active'
  },
  {
    id: '2',
    name: 'Enterprise Hardware Kit',
    sku: 'EHK-002',
    category: 'Hardware',
    price: 108000,
    stock: 25,
    minStock: 5,
    supplier: 'Tech Hardware Co',
    status: 'active'
  },
  {
    id: '3',
    name: 'Consulting Services Package',
    sku: 'CSP-003',
    category: 'Services',
    price: 208000,
    stock: 100,
    minStock: 20,
    supplier: 'Internal',
    status: 'active'
  }
];

export const mockInvoices: Invoice[] = [
  {
    id: 'INV-001',
    customerId: '1',
    customerName: 'Acme Corporation',
    items: [
      {
        productId: '1',
        productName: 'Premium Software License',
        quantity: 5,
        price: 24999,
        total: 124995
      }
    ],
    subtotal: 124995,
    tax: 22499,
    total: 147494,
    status: 'paid',
    dueDate: new Date('2024-02-15'),
    createdAt: new Date('2024-01-15')
  },
  {
    id: 'INV-002',
    customerId: '2',
    customerName: 'TechStart Inc',
    items: [
      {
        productId: '2',
        productName: 'Enterprise Hardware Kit',
        quantity: 2,
        price: 108000,
        total: 216000
      }
    ],
    subtotal: 216000,
    tax: 38880,
    total: 254880,
    status: 'sent',
    dueDate: new Date('2024-03-20'),
    createdAt: new Date('2024-02-20')
  }
];

export const mockEmployees: Employee[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@company.com',
    department: 'Sales',
    position: 'Sales Manager',
    salary: 6250000,
    hireDate: new Date('2023-01-15'),
    status: 'active'
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    department: 'Finance',
    position: 'Financial Analyst',
    salary: 5416000,
    hireDate: new Date('2023-03-10'),
    status: 'active'
  },
  {
    id: '3',
    name: 'Mike Davis',
    email: 'mike.davis@company.com',
    department: 'IT',
    position: 'System Administrator',
    salary: 5833000,
    hireDate: new Date('2023-06-01'),
    status: 'active'
  }
];

export const mockSalesOrders: SalesOrder[] = [
  {
    id: 'SO-001',
    customerId: '1',
    customerName: 'Acme Corporation',
    items: [
      {
        productId: '3',
        productName: 'Consulting Services Package',
        quantity: 1,
        price: 208000,
        total: 208000
      }
    ],
    total: 208000,
    status: 'processing',
    orderDate: new Date('2024-02-25'),
    expectedDelivery: new Date('2024-03-15')
  }
];

export const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: 'PO-001',
    supplier: 'Software Distributors Inc',
    items: [
      {
        productId: '1',
        productName: 'Premium Software License',
        quantity: 20,
        price: 20833,
        total: 416660
      }
    ],
    total: 416660,
    status: 'approved',
    orderDate: new Date('2024-02-20'),
    expectedDelivery: new Date('2024-03-05')
  }
];

export const mockFinancialRecords: FinancialRecord[] = [
  {
    id: '1',
    type: 'income',
    category: 'Sales Revenue',
    amount: 147494,
    description: 'Payment from Acme Corporation - INV-001',
    date: new Date('2024-02-15'),
    reference: 'INV-001'
  },
  {
    id: '2',
    type: 'expense',
    category: 'Office Supplies',
    amount: 20458,
    description: 'Monthly office supplies purchase',
    date: new Date('2024-02-10')
  },
  {
    id: '3',
    type: 'expense',
    category: 'Software Licenses',
    amount: 416660,
    description: 'Bulk software license purchase - PO-001',
    date: new Date('2024-02-20'),
    reference: 'PO-001'
  }
];