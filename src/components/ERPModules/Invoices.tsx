import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Download,
  Filter,
  Calendar,
  DollarSign
} from 'lucide-react';
import { mockInvoices } from '../../data/mockData';
import { Invoice } from '../../types/erp';

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);

  const statuses = ['all', 'draft', 'sent', 'paid', 'overdue'];

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || invoice.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0);
  const pendingAmount = invoices.filter(i => i.status === 'sent').reduce((sum, i) => sum + i.total, 0);
  const overdueAmount = invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.total, 0);

  const handleAddInvoice = () => {
    setShowAddForm(true);
  };

  const handleDeleteInvoice = (id: string) => {
    setInvoices(invoices.filter(i => i.id !== id));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'sent': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'overdue': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'draft': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Invoice Management</h1>
            <p className="text-gray-400">Create and manage customer invoices</p>
          </div>
        </div>
        <button
          onClick={handleAddInvoice}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-xl text-white font-medium shadow-[0_0_20px_rgba(255,0,128,0.3)] hover:shadow-[0_0_30px_rgba(255,0,128,0.5)] transition-all duration-300"
        >
          <Plus className="w-5 h-5" />
          Create Invoice
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-[#2a2a2a] rounded-2xl p-6 shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a]">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#1a1a1a] border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none shadow-[inset_2px_2px_4px_#0f0f0f,inset_-2px_-2px_4px_#2a2a2a]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="text-gray-400 w-5 h-5" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 bg-[#1a1a1a] border border-gray-600 rounded-xl text-white focus:border-purple-500 focus:outline-none shadow-[inset_2px_2px_4px_#0f0f0f,inset_-2px_-2px_4px_#2a2a2a]"
            >
              {statuses.map(status => (
                <option key={status} value={status}>
                  {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Invoice Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#2a2a2a] rounded-2xl p-6 shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a]">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <h3 className="text-gray-400 text-sm font-medium">Total Invoices</h3>
          </div>
          <p className="text-3xl font-bold text-white">{invoices.length}</p>
        </div>
        <div className="bg-[#2a2a2a] rounded-2xl p-6 shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a]">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            <h3 className="text-gray-400 text-sm font-medium">Total Revenue</h3>
          </div>
          <p className="text-3xl font-bold text-green-400">${totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-[#2a2a2a] rounded-2xl p-6 shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a]">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            <h3 className="text-gray-400 text-sm font-medium">Pending</h3>
          </div>
          <p className="text-3xl font-bold text-blue-400">₹{pendingAmount.toLocaleString()}</p>
        </div>
        <div className="bg-[#2a2a2a] rounded-2xl p-6 shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a]">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-red-400" />
            <h3 className="text-gray-400 text-sm font-medium">Overdue</h3>
          </div>
          <p className="text-3xl font-bold text-red-400">₹{overdueAmount.toLocaleString()}</p>
        </div>
      </div>

      {/* Invoice List */}
      <div className="bg-[#2a2a2a] rounded-2xl shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a] overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-xl font-semibold text-white">Invoice List</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1a1a1a]">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Invoice ID</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Customer</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Due Date</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredInvoices.map((invoice, index) => (
                <motion.tr
                  key={invoice.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="hover:bg-[#1a1a1a] transition-colors duration-200"
                >
                  <td className="px-6 py-4">
                    <p className="text-white font-medium">{invoice.id}</p>
                    <p className="text-gray-400 text-sm">{invoice.createdAt.toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-white font-medium">{invoice.customerName}</p>
                    <p className="text-gray-400 text-sm">{invoice.items.length} item(s)</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-white font-medium">₹{invoice.total.toFixed(2)}</p>
                    <p className="text-gray-400 text-sm">Tax: ₹{invoice.tax.toFixed(2)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-white">{invoice.dueDate.toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors duration-200">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors duration-200">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors duration-200">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteInvoice(invoice.id)}
                        className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Invoice Modal (placeholder) */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#2a2a2a] rounded-2xl p-6 w-full max-w-md shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a]">
            <h3 className="text-xl font-semibold text-white mb-4">Create New Invoice</h3>
            <p className="text-gray-400 mb-4">Invoice creation form will be implemented here</p>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}