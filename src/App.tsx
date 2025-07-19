import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Home,
  Users,
  Package,
  FileText,
  ShoppingCart,
  DollarSign,
  BarChart3,
  Settings,
  Menu,
  X,
  User,
  Bell,
  Truck,
  Zap,
  BookOpen,
  TrendingUp,
  Wallet,
  Bot,
  Download
} from 'lucide-react';

// Import ERP Modules
import Dashboard from './components/ERPModules/Dashboard';
import Customers from './components/ERPModules/Customers';
import Products from './components/ERPModules/Products';
import Invoices from './components/ERPModules/Invoices';
import DC from './components/ERPModules/DC';
import InvoicePanel from './components/ERPModules/InvoicePanel';
import Ledger from './components/ERPModules/Ledger';

// Placeholder components for remaining modules
const ProfitLossPanel = () => (
  <div className="bg-[#2a2a2a] rounded-2xl p-6 shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a]">
    <h2 className="text-2xl font-bold text-white mb-4">Profit & Loss</h2>
    <p className="text-gray-400">Daily/Monthly profit analysis, pending profits, and withdrawal history will be implemented here.</p>
  </div>
);

const CashFlowPanel = () => (
  <div className="bg-[#2a2a2a] rounded-2xl p-6 shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a]">
    <h2 className="text-2xl font-bold text-white mb-4">Cash Flow Management</h2>
    <p className="text-gray-400">Track cash/online payments, vendor costs, expenses, and current market position.</p>
  </div>
);

const AIAssistantPanel = () => (
  <div className="bg-[#2a2a2a] rounded-2xl p-6 shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a]">
    <h2 className="text-2xl font-bold text-white mb-4">AI Assistant</h2>
    <p className="text-gray-400">AI-powered business insights, error detection, and guidance system.</p>
    <button className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white">
      Connect to Internet
    </button>
  </div>
);

const ExportImportPanel = () => (
  <div className="bg-[#2a2a2a] rounded-2xl p-6 shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a]">
    <h2 className="text-2xl font-bold text-white mb-4">Export & Import</h2>
    <p className="text-gray-400">Export data to Excel, import edited data, and manage backups.</p>
    <div className="flex gap-3 mt-4">
      <button className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white">
        Export to Excel
      </button>
      <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white">
        Import from Excel
      </button>
    </div>
  </div>
);

export default function ERPApp() {
  const [activeModule, setActiveModule] = useState('Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const modules = [
    { name: 'Dashboard', icon: <Home className="w-5 h-5" />, component: Dashboard },
    { name: 'DC', icon: <Truck className="w-5 h-5" />, component: DC },
    { name: 'Invoice Panel', icon: <FileText className="w-5 h-5" />, component: InvoicePanel },
    { name: 'Customer Ledger', icon: <BookOpen className="w-5 h-5" />, component: Ledger },
    { name: 'Profit & Loss', icon: <TrendingUp className="w-5 h-5" />, component: ProfitLossPanel },
    { name: 'Cash Flow', icon: <Wallet className="w-5 h-5" />, component: CashFlowPanel },
    { name: 'AI Assistant', icon: <Bot className="w-5 h-5" />, component: AIAssistantPanel },
    { name: 'Export & Import', icon: <Download className="w-5 h-5" />, component: ExportImportPanel },
    { name: 'Customers', icon: <Users className="w-5 h-5" />, component: Customers },
    { name: 'Products', icon: <Package className="w-5 h-5" />, component: Products },
    { name: 'Settings', icon: <Settings className="w-5 h-5" />, component: Dashboard }
  ];

  const ActiveComponent = modules.find(m => m.name === activeModule)?.component || Dashboard;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e1e1e] via-[#1a1a1a] to-[#121212] text-white">
      {/* Top Navigation Bar */}
      <header className="bg-[#2a2a2a]/80 backdrop-blur-lg border-b border-gray-700/50 shadow-[0_8px_32px_rgba(0,0,0,0.3)] sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Left Section - Logo & Menu */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-xl bg-[#1a1a1a] shadow-[4px_4px_8px_#0f0f0f,-4px_-4px_8px_#2a2a2a] hover:shadow-[inset_4px_4px_8px_#0f0f0f,inset_-4px_-4px_8px_#2a2a2a] transition-all duration-300"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            
            {/* Logo with Rainbow Gradient */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-pink-500 via-orange-400 via-yellow-400 via-green-400 via-blue-400 to-purple-500 flex items-center justify-center shadow-[0_0_20px_rgba(255,0,128,0.3)]">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-pink-400 via-orange-400 via-yellow-400 via-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                NeoVault ERP
              </h1>
            </div>
          </div>

          {/* Center - Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-2 bg-[#1a1a1a]/50 backdrop-blur-lg rounded-2xl p-2 shadow-[inset_4px_4px_8px_#0f0f0f,inset_-4px_-4px_8px_#2a2a2a]">
            {['Dashboard', 'DC', 'Invoice Panel'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveModule(tab)}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 text-sm ${
                  activeModule === tab
                    ? 'bg-gradient-to-r from-pink-500 via-orange-400 via-yellow-400 via-green-400 via-blue-400 to-purple-500 text-white shadow-[0_0_20px_rgba(255,0,128,0.3)]'
                    : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>

          {/* Right Section - User & Notifications */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <button className="p-2 rounded-xl bg-[#1a1a1a] shadow-[4px_4px_8px_#0f0f0f,-4px_-4px_8px_#2a2a2a] hover:shadow-[inset_4px_4px_8px_#0f0f0f,inset_-4px_-4px_8px_#2a2a2a] transition-all duration-300">
                <Bell className="w-5 h-5 text-gray-400" />
              </button>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse"></span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center shadow-[0_0_15px_rgba(0,255,255,0.3)]">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-white">Admin User</p>
                <p className="text-xs text-gray-400">ERP Administrator</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          fixed lg:static inset-y-0 left-0 z-30 w-80 bg-[#2a2a2a]/90 backdrop-blur-lg
          shadow-[8px_0_32px_rgba(0,0,0,0.3)] transition-transform duration-300 ease-in-out
          border-r border-gray-700/50
        `}>
          <div className="p-6 pt-8">
            {/* Module Navigation */}
            <nav className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                ERP Modules
              </h3>
              {modules.map((module) => (
                <motion.button
                  key={module.name}
                  onClick={() => {
                    setActiveModule(module.name);
                    setSidebarOpen(false);
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    w-full flex items-center gap-4 p-4 rounded-2xl font-medium transition-all duration-300
                    ${activeModule === module.name
                      ? 'bg-gradient-to-r from-pink-500/20 via-orange-400/20 via-yellow-400/20 via-green-400/20 via-blue-400/20 to-purple-500/20 text-white shadow-[inset_4px_4px_8px_rgba(255,0,128,0.1),inset_-4px_-4px_8px_rgba(255,0,128,0.1)] border border-pink-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a] shadow-[4px_4px_8px_#0f0f0f,-4px_-4px_8px_#3a3a3a] hover:shadow-[inset_2px_2px_4px_#0f0f0f,inset_-2px_-2px_4px_#3a3a3a]'
                    }
                  `}
                >
                  <div className={`p-2 rounded-lg ${
                    activeModule === module.name
                      ? 'bg-gradient-to-r from-pink-500 via-orange-400 via-yellow-400 via-green-400 via-blue-400 to-purple-500 shadow-[0_0_15px_rgba(255,0,128,0.3)]'
                      : 'bg-[#1a1a1a]'
                  }`}>
                    {module.icon}
                  </div>
                  <span className="drop-shadow-[0_0_2px_rgba(255,255,255,0.1)]">
                    {module.name}
                  </span>
                </motion.button>
              ))}
            </nav>

            {/* System Status */}
            <div className="mt-8 p-4 bg-[#1a1a1a] rounded-2xl shadow-[inset_4px_4px_8px_#0f0f0f,inset_-4px_-4px_8px_#2a2a2a]">
              <h4 className="text-sm font-medium text-white mb-3">System Status</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Local Storage</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-400">Active</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Auto-Save</span>
                  <span className="text-xs text-white">Every 5 min</span>
                </div>
                <div className="w-full bg-[#0f0f0f] rounded-full h-1.5">
                  <div className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 h-1.5 rounded-full" style={{ width: '78%' }}></div>
                </div>
                <span className="text-xs text-gray-400">Storage: 78% Used</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 lg:ml-0">
          <motion.div
            key={activeModule}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ActiveComponent />
          </motion.div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}