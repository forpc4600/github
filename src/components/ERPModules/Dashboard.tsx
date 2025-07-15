import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  Package, 
  FileText, 
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { mockInvoices, mockCustomers, mockProducts, mockSalesOrders } from '../../data/mockData';

export default function Dashboard() {
  // Calculate dashboard metrics
  const totalRevenue = mockInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalCustomers = mockCustomers.filter(c => c.status === 'active').length;
  const lowStockProducts = mockProducts.filter(p => p.stock <= p.minStock).length;
  const pendingOrders = mockSalesOrders.filter(o => o.status === 'pending').length;

  const dashboardCards = [
    {
      title: 'Total Revenue',
      value: `$${totalRevenue.toLocaleString()}`,
      change: '+12.5%',
      icon: <DollarSign className="w-6 h-6" />,
      gradient: 'from-pink-500 via-purple-500 to-indigo-500'
    },
    {
      title: 'Active Customers',
      value: totalCustomers.toString(),
      change: '+8.2%',
      icon: <Users className="w-6 h-6" />,
      gradient: 'from-cyan-400 via-blue-500 to-purple-600'
    },
    {
      title: 'Low Stock Items',
      value: lowStockProducts.toString(),
      change: 'Alert',
      icon: <AlertTriangle className="w-6 h-6" />,
      gradient: 'from-orange-400 via-red-500 to-pink-600'
    },
    {
      title: 'Pending Orders',
      value: pendingOrders.toString(),
      change: '+5.1%',
      icon: <ShoppingCart className="w-6 h-6" />,
      gradient: 'from-green-400 via-emerald-500 to-teal-600'
    }
  ];

  const recentActivities = [
    { action: 'New invoice created', details: 'INV-003 for $2,450', time: '2 hours ago', type: 'invoice' },
    { action: 'Customer added', details: 'New Enterprise Solutions LLC', time: '4 hours ago', type: 'customer' },
    { action: 'Low stock alert', details: 'Enterprise Hardware Kit (5 remaining)', time: '6 hours ago', type: 'alert' },
    { action: 'Payment received', details: '$1,649.94 from Acme Corporation', time: '1 day ago', type: 'payment' }
  ];

  const chartData = [
    { month: 'Jan', value: 4500 },
    { month: 'Feb', value: 6200 },
    { month: 'Mar', value: 5800 },
    { month: 'Apr', value: 7200 },
    { month: 'May', value: 6900 },
    { month: 'Jun', value: 8100 }
  ];

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Dashboard Overview
          </h1>
          <p className="text-gray-400 mt-2">Welcome back! Here's what's happening with your business.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Calendar className="w-4 h-4" />
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {dashboardCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.6 }}
            className="relative group"
          >
            <div className="bg-[#2a2a2a] rounded-2xl p-6 shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a] hover:shadow-[12px_12px_24px_#0f0f0f,-12px_-12px_24px_#3a3a3a] transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${card.gradient} shadow-lg`}>
                  {card.icon}
                </div>
                <span className={`text-sm font-medium ${
                  card.change.includes('+') ? 'text-green-400' : 
                  card.change === 'Alert' ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {card.change}
                </span>
              </div>
              <h3 className="text-gray-400 text-sm font-medium mb-2">{card.title}</h3>
              <p className="text-2xl font-bold text-white">{card.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts and Activity Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="xl:col-span-2">
          <div className="bg-[#2a2a2a] rounded-2xl p-6 shadow-[inset_4px_4px_8px_#1a1a1a,inset_-4px_-4px_8px_#3a3a3a]">
            <h3 className="text-xl font-semibold text-white mb-6">Revenue Trends</h3>
            <div className="h-64 flex items-end justify-between gap-4">
              {chartData.map((item, index) => (
                <div key={item.month} className="flex flex-col items-center flex-1">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(item.value / 8100) * 100}%` }}
                    transition={{ delay: index * 0.1, duration: 0.8 }}
                    className={`w-full rounded-t-lg bg-gradient-to-t ${
                      index % 4 === 0 ? 'from-pink-500 to-purple-500' :
                      index % 4 === 1 ? 'from-cyan-400 to-blue-500' :
                      index % 4 === 2 ? 'from-orange-400 to-red-500' :
                      'from-green-400 to-emerald-500'
                    } shadow-[0_0_20px_rgba(255,255,255,0.1)]`}
                    style={{ minHeight: '20px' }}
                  />
                  <span className="text-gray-400 text-sm mt-2">{item.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-[#2a2a2a] rounded-2xl p-6 shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a]">
          <h3 className="text-xl font-semibold text-white mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-[#1a1a1a] shadow-[inset_2px_2px_4px_#0f0f0f,inset_-2px_-2px_4px_#2a2a2a]"
              >
                <div className={`p-2 rounded-lg ${
                  activity.type === 'invoice' ? 'bg-gradient-to-r from-blue-500 to-purple-500' :
                  activity.type === 'customer' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                  activity.type === 'alert' ? 'bg-gradient-to-r from-orange-500 to-red-500' :
                  'bg-gradient-to-r from-pink-500 to-purple-500'
                }`}>
                  {activity.type === 'invoice' && <FileText className="w-4 h-4" />}
                  {activity.type === 'customer' && <Users className="w-4 h-4" />}
                  {activity.type === 'alert' && <AlertTriangle className="w-4 h-4" />}
                  {activity.type === 'payment' && <DollarSign className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{activity.action}</p>
                  <p className="text-gray-400 text-xs">{activity.details}</p>
                  <p className="text-gray-500 text-xs mt-1">{activity.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}