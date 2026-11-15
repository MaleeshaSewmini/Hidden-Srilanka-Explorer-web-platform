"use client";

import { useMemo, useState } from "react";
import { ExpenseCategory, TripExpense } from "@/lib/trip-planner/types";
import { calculateBudgetSummary, formatCurrency } from "@/lib/trip-planner/budget";
import {
  Wallet,
  Car,
  Home,
  Utensils,
  Ticket,
  Compass,
  Plus,
  Trash2,
  Edit2,
  Check,
} from "lucide-react";

interface BudgetCalculatorProps {
  expenses: TripExpense[];
  totalBudget: number;
  currency?: string;
  onUpdateExpenses: (expenses: TripExpense[]) => void;
  onUpdateTotalBudget: (budget: number) => void;
  className?: string;
}

const CATEGORY_ICONS: Record<ExpenseCategory, typeof Wallet> = {
  transport: Car,
  accommodation: Home,
  food: Utensils,
  entrance_fees: Ticket,
  activities: Compass,
  other: Wallet,
};

export default function BudgetCalculator({
  expenses,
  totalBudget,
  currency = "LKR",
  onUpdateExpenses,
  onUpdateTotalBudget,
  className = "",
}: BudgetCalculatorProps) {
  // Budget summary
  const summary = useMemo(() => {
    return calculateBudgetSummary(expenses, totalBudget);
  }, [expenses, totalBudget]);

  // New custom expense form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAmount, setNewAmount] = useState<number>(0);
  const [newCategory, setNewCategory] = useState<ExpenseCategory>("activities");
  const [newIsEstimated, setNewIsEstimated] = useState(true);

  // Editing existing expense line
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editTitle, setEditTitle] = useState("");
  const [editIsEstimated, setEditIsEstimated] = useState(true);

  const handleStartEdit = (exp: TripExpense) => {
    setEditingExpenseId(exp.id);
    setEditAmount(exp.amount);
    setEditTitle(exp.title);
    setEditIsEstimated(exp.is_estimated);
  };

  const handleSaveEdit = (expId: string) => {
    const updated = expenses.map((e) =>
      e.id === expId
        ? {
            ...e,
            amount: editAmount,
            title: editTitle.trim() || e.title,
            is_estimated: editIsEstimated,
          }
        : e
    );
    onUpdateExpenses(updated);
    setEditingExpenseId(null);
  };

  const handleDeleteExpense = (expId: string) => {
    const updated = expenses.filter((e) => e.id !== expId);
    onUpdateExpenses(updated);
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || newAmount <= 0) return;

    const newExpense: TripExpense = {
      id: `exp-${Date.now()}`,
      trip_id: expenses[0]?.trip_id || "trip",
      category: newCategory,
      title: newTitle.trim(),
      amount: newAmount,
      is_estimated: newIsEstimated,
      notes: "Custom user-added expense",
    };

    onUpdateExpenses([...expenses, newExpense]);
    setNewTitle("");
    setNewAmount(0);
    setShowAddForm(false);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Top Banner: Budget Health & Comparison */}
      <div className="rounded-2xl bg-white p-5 border border-[#0b2417]/10 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-[#0b2417] text-base sm:text-lg flex items-center gap-2">
              <Wallet size={19} className="text-[#c99a43]" />
              <span>Trip Expense Calculator</span>
            </h3>
            <p className="text-xs text-[#718078]">
              Itemized estimates compared against your target budget of{" "}
              {formatCurrency(totalBudget, currency)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#718078]">Target Budget:</span>
            <input
              type="number"
              step={5000}
              value={totalBudget}
              onChange={(e) => onUpdateTotalBudget(Number(e.target.value))}
              className="w-32 rounded-xl border border-gray-300 bg-[#f6f1e8] px-2.5 py-1 text-xs font-bold text-[#0b2417] outline-none"
            />
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div>
          <div className="flex justify-between text-xs font-bold mb-1.5">
            <span className="text-[#0b2417]">
              Total Cost: {formatCurrency(summary.grandTotal, currency)}
            </span>
            <span
              className={
                summary.status === "over"
                  ? "text-rose-600 font-extrabold"
                  : summary.status === "under"
                  ? "text-emerald-700"
                  : "text-[#c99a43]"
              }
            >
              {summary.percentUsed}% of budget ({summary.difference >= 0 ? "+" : ""}
              {formatCurrency(summary.difference, currency)}{" "}
              {summary.difference >= 0 ? "remaining" : "over"})
            </span>
          </div>

          <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden flex">
            <div
              className={`h-full transition-all duration-500 ${
                summary.status === "over"
                  ? "bg-rose-500"
                  : summary.status === "under"
                  ? "bg-emerald-600"
                  : "bg-[#c99a43]"
              }`}
              style={{ width: `${Math.min(100, summary.percentUsed)}%` }}
            />
          </div>
        </div>

        {/* Estimated vs Confirmed Legend */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="text-gray-600">
                Estimated: <b>{formatCurrency(summary.totalEstimated, currency)}</b>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
              <span className="text-gray-600">
                Confirmed: <b>{formatCurrency(summary.totalConfirmed, currency)}</b>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm((s) => !s)}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#123b26] hover:text-[#c99a43]"
          >
            <Plus size={14} />
            <span>{showAddForm ? "Cancel Add Expense" : "Add Custom Expense"}</span>
          </button>
        </div>
      </div>

      {/* Add Custom Expense Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddExpense}
          className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3"
        >
          <div className="font-bold text-sm uppercase tracking-wider text-emerald-950">
            Add New Trip Expense Line
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <input
                type="text"
                required
                placeholder="Expense description (e.g. Ella Safari Jeep hire)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white p-2 text-sm text-[#0b2417] outline-none"
              />
            </div>

            <div>
              <input
                type="number"
                required
                min={1}
                placeholder="Amount (LKR)"
                value={newAmount || ""}
                onChange={(e) => setNewAmount(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-300 bg-white p-2 text-sm text-[#0b2417] outline-none"
              />
            </div>

            <div>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as ExpenseCategory)}
                className="w-full rounded-xl border border-gray-300 bg-white p-2 text-xs text-[#0b2417] outline-none capitalize"
              >
                <option value="activities">Activities</option>
                <option value="transport">Transport</option>
                <option value="accommodation">Accommodation</option>
                <option value="food">Food</option>
                <option value="entrance_fees">Entrance Fees</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-sm text-[#0b2417] cursor-pointer">
              <input
                type="checkbox"
                checked={!newIsEstimated}
                onChange={(e) => setNewIsEstimated(!e.target.checked)}
                className="rounded text-[#123b26]"
              />
              <span>Mark as Confirmed / Paid Price</span>
            </label>

            <button
              type="submit"
              className="rounded-xl bg-[#123b26] px-4 py-1.5 text-sm font-bold text-white hover:bg-[#c99a43] hover:text-[#0b2417]"
            >
              Add Expense
            </button>
          </div>
        </form>
      )}

      {/* Expenses Itemized List */}
      <div className="rounded-2xl border border-[#0b2417]/10 bg-white overflow-hidden shadow-sm divide-y divide-gray-100">
        {expenses.map((expense) => {
          const Icon = CATEGORY_ICONS[expense.category] || Wallet;
          const isEditing = editingExpenseId === expense.id;

          if (isEditing) {
            return (
              <div key={expense.id} className="p-3 bg-amber-50/50 space-y-2">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm text-[#0b2417]"
                  />
                  <input
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm text-[#0b2417]"
                  />
                  <label className="flex items-center gap-2 text-xs text-[#0b2417]">
                    <input
                      type="checkbox"
                      checked={!editIsEstimated}
                      onChange={(e) => setEditIsEstimated(!e.target.checked)}
                      className="rounded"
                    />
                    <span>Confirmed Price</span>
                  </label>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingExpenseId(null)}
                    className="px-2.5 py-1 text-sm text-gray-600 hover:text-black"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveEdit(expense.id)}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#123b26] px-3 py-1 text-sm font-bold text-white"
                  >
                    <Check size={13} /> Save
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={expense.id}
              className="flex items-center justify-between p-3.5 hover:bg-gray-50/60 transition"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f6f1e8] text-[#123b26]">
                  <Icon size={16} />
                </span>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm sm:text-sm text-[#0b2417]">
                      {expense.title}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        expense.is_estimated
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {expense.is_estimated ? "Estimated" : "Confirmed"}
                    </span>
                  </div>

                  {expense.notes && (
                    <p className="text-[15px] text-[#718078]">{expense.notes}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-bold text-sm sm:text-sm text-[#0b2417]">
                  {formatCurrency(expense.amount, currency)}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(expense)}
                    className="rounded-lg p-1 text-gray-400 hover:text-gray-700"
                    title="Edit amount"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteExpense(expense.id)}
                    className="rounded-lg p-1 text-gray-400 hover:text-rose-600"
                    title="Delete expense"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
