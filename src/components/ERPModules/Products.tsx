import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  AlertTriangle,
  Filter,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { mockProducts } from '../../data/mockData';
import { Product } from '../../types/erp';

export default function Products() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterCategory === 'all' || product.category === filterCategory;
    return matchesSearch && matchesFilter;
  });

  const lowStockProducts = products.filter(p => p.stock <= p.minStock);
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

  const handleAddProduct = () => {
    setShowAddForm(true);
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 shadow-lg">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Product Management</h1>
            <p className="text-gray-400">Manage your product inventory</p>
          </div>
        </div>
        <button
          onClick={handleAddProduct}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-xl text-white font-medium shadow-[0_0_20px_rgba(255,0,128,0.3)] hover:shadow-[0_0_30px_rgba(255,0,128,0.5)] transition-all duration-300"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-[#2a2a2a] rounded-2xl p-6 shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a]">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#1a1a1a] border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none shadow-[inset_2px_2px_4px_#0f0f0f,inset_-2px_-2px_4px_#2a2a2a]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="text-gray-400 w-5 h-5" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-3 bg-[#1a1a1a] border border-gray-600 rounded-xl text-white focus:border-purple-500 focus:outline-none shadow-[inset_2px_2px_4px_#0f0f0f,inset_-2px_-2px_4px_#2a2a2a]"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Product Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#2a2a2a] rounded-2xl p-6 shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a]">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-blue-400" />
            <h3 className="text-gray-400 text-sm font-medium">Total Products</h3>
          </div>
          <p className="text-3xl font-bold text-white">{products.length}</p>
        </div>
        <div className="bg-[#2a2a2a] rounded-2xl p-6 shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a]">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h3 className="text-gray-400 text-sm font-medium">Low Stock</h3>
          </div>
          <p className="text-3xl font-bold text-red-400">{lowStockProducts.length}</p>
        </div>
        <div className="bg-[#2a2a2a] rounded-2xl p-6 shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a]">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h3 className="text-gray-400 text-sm font-medium">Total Value</h3>
          </div>
          <p className="text-3xl font-bold text-green-400">${totalValue.toLocaleString()}</p>
        </div>
        <div className="bg-[#2a2a2a] rounded-2xl p-6 shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a]">
          <div className="flex items-center gap-3 mb-2">
            <TrendingDown className="w-5 h-5 text-purple-400" />
            <h3 className="text-gray-400 text-sm font-medium">Categories</h3>
          </div>
          <p className="text-3xl font-bold text-purple-400">{categories.length - 1}</p>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <h3 className="text-lg font-semibold text-red-400">Low Stock Alert</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStockProducts.map(product => (
              <div key={product.id} className="bg-[#2a2a2a] rounded-lg p-4">
                <p className="text-white font-medium">{product.name}</p>
                <p className="text-gray-400 text-sm">Stock: {product.stock} / Min: {product.minStock}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product List */}
      <div className="bg-[#2a2a2a] rounded-2xl shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a] overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-xl font-semibold text-white">Product Inventory</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1a1a1a]">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Product</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Category</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Price</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Stock</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredProducts.map((product, index) => (
                <motion.tr
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="hover:bg-[#1a1a1a] transition-colors duration-200"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-white font-medium">{product.name}</p>
                      <p className="text-gray-400 text-sm">SKU: {product.sku}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-white font-medium">${product.price.toFixed(2)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className={`font-medium ${product.stock <= product.minStock ? 'text-red-400' : 'text-white'}`}>
                        {product.stock}
                      </p>
                      <p className="text-gray-400 text-sm">Min: {product.minStock}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      product.status === 'active' 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors duration-200">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(product.id)}
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

      {/* Add Product Modal (placeholder) */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#2a2a2a] rounded-2xl p-6 w-full max-w-md shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a]">
            <h3 className="text-xl font-semibold text-white mb-4">Add New Product</h3>
            <p className="text-gray-400 mb-4">Product form will be implemented here</p>
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