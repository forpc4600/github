import { useEffect, useState } from "react";
import { dataService } from "../../services/dataService";
import { LedgerEntry } from "../../types/erp";
import { Search, Edit, Save } from "lucide-react";

export default function LedgerPanel() {
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [filterText, setFilterText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPaid, setEditPaid] = useState<number>(0);

  useEffect(() => {
    loadLedger();
  }, []);

  const loadLedger = async () => {
    const entries = await dataService.getLedgerEntries();
    setLedgerEntries(entries);
  };

  const filteredEntries = ledgerEntries.filter((e) =>
    e.customerName.toLowerCase().includes(filterText.toLowerCase())
  );

  const startEdit = (entry: LedgerEntry) => {
    setEditingId(entry.id);
    setEditPaid(entry.paid || 0);
  };

  const saveEdit = async (entry: LedgerEntry) => {
    const newDue = entry.amount - editPaid;
    await dataService.updateLedgerEntry(entry.id, {
      paid: editPaid,
      balance: newDue,
      due: newDue,
    });
    setEditingId(null);
    loadLedger();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">📒 Ledger</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Search by vendor or customer..."
            className="pl-10 pr-4 py-2 rounded-xl bg-[#1a1a1a] border border-gray-700 text-white placeholder-gray-400"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#2a2a2a]">
              <th className="p-3 text-gray-400">Name</th>
              <th className="p-3 text-gray-400">Type</th>
              <th className="p-3 text-gray-400">Date</th>
              <th className="p-3 text-gray-400">Amount</th>
              <th className="p-3 text-gray-400">Paid</th>
              <th className="p-3 text-gray-400">Balance</th>
              <th className="p-3 text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map((entry) => (
              <tr
                key={entry.id}
                className="border-b border-gray-700 hover:bg-[#1f1f1f]"
              >
                <td className="p-3 text-white">{entry.customerName}</td>
                <td className="p-3 text-white">{entry.type}</td>
                <td className="p-3 text-gray-300">
                  {new Date(entry.date).toLocaleDateString()}
                </td>
                <td className="p-3 text-yellow-400">₹{entry.amount.toFixed(2)}</td>

                <td className="p-3">
                  {editingId === entry.id ? (
                    <input
                      type="number"
                      value={editPaid}
                      onChange={(e) =>
                        setEditPaid(parseFloat(e.target.value) || 0)
                      }
                      className="w-20 px-2 py-1 rounded bg-[#2a2a2a] border border-gray-600 text-white"
                    />
                  ) : (
                    <span className="text-green-400">₹{entry.paid || 0}</span>
                  )}
                </td>

                <td className="p-3 text-red-400">₹{entry.balance.toFixed(2)}</td>

                <td className="p-3">
                  {editingId === entry.id ? (
                    <button
                      onClick={() => saveEdit(entry)}
                      className="px-3 py-1 bg-green-500 rounded-lg text-white flex items-center gap-1"
                    >
                      <Save className="w-4 h-4" /> Save
                    </button>
                  ) : (
                    <button
                      onClick={() => startEdit(entry)}
                      className="px-3 py-1 bg-blue-500 rounded-lg text-white flex items-center gap-1"
                    >
                      <Edit className="w-4 h-4" /> Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}

            {filteredEntries.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="p-6 text-center text-gray-400 italic"
                >
                  No ledger entries found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
