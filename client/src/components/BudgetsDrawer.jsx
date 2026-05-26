import React, { useState, useEffect } from "react";
import { coreService } from "../services/api_core";

const BudgetsDrawer = ({ isOpen, onClose, totalExpense, onBudgetUpdate, allTransactions }) => {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // Budget Form State
  const [selectedCategory, setSelectedCategory] = useState("");
  const [amountLimit, setAmountLimit] = useState("");
  const [month, setMonth] = useState(new Date().toISOString().split("T")[0]);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  // New Category Form State
  const [showNewCatForm, setShowNewCatForm] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState("EXPENSE");
  const [savingCat, setSavingCat] = useState(false);
  const [catError, setCatError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchBudgetsAndCategories();
    }
  }, [isOpen]);

  const fetchBudgetsAndCategories = async () => {
    try {
      setLoading(true);
      const [budgetRes, catRes] = await Promise.all([
        coreService.getBudgets(),
        coreService.getCategories()
      ]);
      setBudgets(budgetRes.data);
      // Show ALL categories (both EXPENSE and INCOME so user can pick)
      setCategories(catRes.data);
    } catch (err) {
      console.error("Error loading budgets drawer data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Expense categories only (for budget form)
  const expenseCategories = categories.filter(c => c.type === "EXPENSE");

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setCatError("");
    if (!newCatName.trim()) {
      setCatError("Category name is required.");
      return;
    }
    try {
      setSavingCat(true);
      await coreService.createCategory({ name: newCatName.trim(), type: newCatType });
      setNewCatName("");
      setNewCatType("EXPENSE");
      setShowNewCatForm(false);
      // Reload categories list
      const catRes = await coreService.getCategories();
      setCategories(catRes.data);
    } catch (err) {
      setCatError(
        err.response?.data?.non_field_errors?.[0] ||
        err.response?.data?.name?.[0] ||
        "Failed to create category."
      );
    } finally {
      setSavingCat(false);
    }
  };

  // Helper to calculate how much has been spent in a specific category for the budget month
  const calculateSpentForCategory = (catName, budgetMonthStr) => {
    if (!allTransactions || allTransactions.length === 0) return 0;

    const budgetMonth = new Date(budgetMonthStr);
    const budgetYear = budgetMonth.getFullYear();
    const budgetMonthNum = budgetMonth.getMonth();

    return allTransactions
      .filter(t => {
        if (t.category_type !== "EXPENSE" || t.category_name !== catName) return false;
        const tDate = new Date(t.date);
        return tDate.getFullYear() === budgetYear && tDate.getMonth() === budgetMonthNum;
      })
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!selectedCategory) {
      setFormError("Please select an expense category.");
      return;
    }
    if (!amountLimit || parseFloat(amountLimit) <= 0) {
      setFormError("Please enter a valid limit amount.");
      return;
    }

    try {
      setSaving(true);
      await coreService.createBudget({
        category: parseInt(selectedCategory),
        amount_limit: parseFloat(amountLimit),
        month: month
      });

      setFormSuccess("Budget configured successfully!");
      setAmountLimit("");
      setSelectedCategory("");

      await fetchBudgetsAndCategories();
      if (onBudgetUpdate) {
        onBudgetUpdate();
      }
    } catch (err) {
      console.error("Error creating budget:", err);
      setFormError(err.response?.data?.error || "Failed. Budget may already exist for this category/month.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBudget = async (id) => {
    if (!window.confirm("Delete this category budget?")) return;
    try {
      await coreService.deleteBudget(id);
      await fetchBudgetsAndCategories();
      if (onBudgetUpdate) onBudgetUpdate();
    } catch (err) {
      console.error("Error deleting budget:", err);
      alert("Failed to delete budget.");
    }
  };

  if (!isOpen) return null;

  const inputStyle = {
    background: "#080b14",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "10px",
    color: "#f8fafc",
    padding: "10px 14px",
    fontSize: "13px",
    fontWeight: "600",
    outline: "none",
    width: "100%",
    boxSizing: "border-box"
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(3, 7, 18, 0.6)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 9999,
        display: "flex",
        justifyContent: "flex-end",
        animation: "fadeIn 0.3s ease-out forwards"
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>

      {/* Drawer Shell */}
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          height: "100%",
          background: "linear-gradient(135deg, #0b1329 0%, #030712 100%)",
          borderLeft: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "-15px 0 45px rgba(0, 0, 0, 0.55)",
          padding: "36px 30px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          overflowY: "auto",
          animation: "slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "24px", color: "#f8fafc", fontWeight: "800", letterSpacing: "-0.5px" }}>
              Category <span style={{ color: "#ef4444" }}>Budgets</span> 🎯
            </h2>
            <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "12px", fontWeight: "500" }}>
              Configure and audit your category limits
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "50%",
              width: "36px",
              height: "36px",
              color: "#64748b",
              fontSize: "14px",
              cursor: "pointer",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              transition: "all 0.3s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#ef4444";
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#64748b";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
            }}
          >
            ✕
          </button>
        </div>

        {/* ── SECTION 1: SET BUDGET FORM ── */}
        <div style={{
          background: "rgba(255, 255, 255, 0.02)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          borderRadius: "20px",
          padding: "20px 24px",
          boxSizing: "border-box"
        }}>
          <h4 style={{ margin: "0 0 16px 0", color: "#f1f5f9", fontSize: "14px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            🎯 Set Category Budget
          </h4>

          <form onSubmit={handleSaveBudget} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

            {/* Category select + create new */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ color: "#94a3b8", fontSize: "11px", fontWeight: "700" }}>EXPENSE CATEGORY</label>
                <button
                  type="button"
                  onClick={() => { setShowNewCatForm(v => !v); setCatError(""); }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#60a5fa",
                    fontSize: "11px",
                    fontWeight: "700",
                    cursor: "pointer",
                    padding: 0,
                    textDecoration: "underline"
                  }}
                >
                  {showNewCatForm ? "Cancel" : "+ New Category"}
                </button>
              </div>

              {expenseCategories.length > 0 ? (
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Select Category</option>
                  {expenseCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              ) : (
                <div style={{
                  padding: "12px 14px",
                  background: "rgba(245, 158, 11, 0.08)",
                  border: "1px dashed rgba(245, 158, 11, 0.3)",
                  borderRadius: "10px",
                  color: "#fbbf24",
                  fontSize: "12px",
                  fontWeight: "600"
                }}>
                  ⚠️ No expense categories yet. Create one below!
                </div>
              )}

              {/* Inline new category form */}
              {showNewCatForm && (
                <div style={{
                  background: "rgba(96, 165, 250, 0.05)",
                  border: "1px solid rgba(96, 165, 250, 0.15)",
                  borderRadius: "12px",
                  padding: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px"
                }}>
                  <p style={{ margin: 0, color: "#60a5fa", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>
                    Create New Category
                  </p>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <input
                      type="text"
                      placeholder="e.g. Groceries, Fuel"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      style={{ ...inputStyle, flex: 2 }}
                    />
                    <select
                      value={newCatType}
                      onChange={(e) => setNewCatType(e.target.value)}
                      style={{ ...inputStyle, flex: 1 }}
                    >
                      <option value="EXPENSE">Expense</option>
                      <option value="INCOME">Income</option>
                    </select>
                  </div>
                  {catError && (
                    <p style={{ margin: 0, color: "#f87171", fontSize: "11px", fontWeight: "600" }}>⚠️ {catError}</p>
                  )}
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    disabled={savingCat}
                    style={{
                      background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                      border: "none",
                      borderRadius: "8px",
                      color: "white",
                      padding: "9px",
                      fontWeight: "700",
                      fontSize: "12px",
                      cursor: "pointer"
                    }}
                  >
                    {savingCat ? "Creating..." : "✓ Create Category"}
                  </button>
                </div>
              )}
            </div>

            {/* Limit + Month */}
            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ color: "#94a3b8", fontSize: "11px", fontWeight: "700" }}>LIMIT AMOUNT (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={amountLimit}
                  onChange={(e) => setAmountLimit(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ color: "#94a3b8", fontSize: "11px", fontWeight: "700" }}>TARGET MONTH</label>
                <input
                  type="date"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            {formError && <p style={{ margin: 0, color: "#f87171", fontSize: "12px", fontWeight: "600" }}>⚠️ {formError}</p>}
            {formSuccess && <p style={{ margin: 0, color: "#34d399", fontSize: "12px", fontWeight: "600" }}>✅ {formSuccess}</p>}

            <button
              type="submit"
              disabled={saving}
              style={{
                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                border: "none",
                borderRadius: "12px",
                color: "white",
                padding: "12px",
                fontWeight: "700",
                fontSize: "13px",
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(239, 68, 68, 0.25)",
                transition: "all 0.3s",
                marginTop: "4px"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.15)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = "brightness(1)"; }}
            >
              {saving ? "Configuring..." : "Configure Category Limit"}
            </button>
          </form>
        </div>

        {/* ── SECTION 2: ACTIVE BUDGET STATUS ── */}
        <div>
          <h4 style={{ margin: "0 0 16px 0", color: "#f1f5f9", fontSize: "14px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            📊 Active Budget Status
          </h4>

          {loading ? (
            <p style={{ color: "#64748b", fontSize: "13px", textAlign: "center", padding: "20px 0" }}>Loading limits...</p>
          ) : budgets.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 20px", background: "rgba(255, 255, 255, 0.01)", border: "1px dashed rgba(255, 255, 255, 0.05)", borderRadius: "16px" }}>
              <span style={{ fontSize: "28px" }}>🎯</span>
              <p style={{ margin: "10px 0 0 0", color: "#64748b", fontSize: "13px", fontWeight: "600" }}>No category limits configured yet.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {budgets.map(b => {
                const limit = parseFloat(b.amount_limit);
                const spent = calculateSpentForCategory(b.category_name, b.month);
                const percent = limit > 0 ? (spent / limit) * 100 : 0;

                let color = "#10b981";
                let bgColor = "rgba(16, 185, 129, 0.1)";
                let tag = "Safe";
                if (percent >= 100) { color = "#ef4444"; bgColor = "rgba(239, 68, 68, 0.15)"; tag = "Exceeded"; }
                else if (percent >= 80) { color = "#f59e0b"; bgColor = "rgba(245, 158, 11, 0.12)"; tag = "Warning"; }

                return (
                  <div
                    key={b.id}
                    style={{
                      background: "rgba(15, 23, 42, 0.45)",
                      border: `1px solid ${percent >= 100 ? "rgba(239, 68, 68, 0.25)" : "rgba(255, 255, 255, 0.06)"}`,
                      borderRadius: "16px",
                      padding: "16px 20px",
                      boxSizing: "border-box"
                    }}
                  >
                    {/* Top row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <div>
                        <span style={{
                          backgroundColor: bgColor,
                          border: `1px solid ${color}35`,
                          color: color,
                          padding: "4px 10px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: "800",
                          textTransform: "uppercase"
                        }}>
                          {b.category_name || "Category"}
                        </span>
                        <span style={{ fontSize: "10px", color: "#475569", marginLeft: "10px" }}>
                          {new Date(b.month).toLocaleDateString([], { month: "short", year: "numeric" })}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteBudget(b.id)}
                        style={{ background: "none", border: "none", color: "#475569", fontSize: "14px", cursor: "pointer", transition: "color 0.3s" }}
                        onMouseEnter={(e) => e.currentTarget.style.color = "#ef4444"}
                        onMouseLeave={(e) => e.currentTarget.style.color = "#475569"}
                      >
                        🗑️
                      </button>
                    </div>

                    {/* Spent vs Limit */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "8px" }}>
                      <span style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "600" }}>
                        Spent: <b style={{ color: percent >= 100 ? "#ef4444" : "#f1f5f9" }}>₹{spent.toLocaleString("en-IN")}</b>
                      </span>
                      <span style={{ color: "#64748b", fontSize: "11px", fontWeight: "600" }}>
                        Limit: ₹{limit.toLocaleString("en-IN")}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div style={{ width: "100%", height: "6px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "10px", overflow: "hidden" }}>
                      <div style={{
                        width: `${Math.min(percent, 100)}%`,
                        height: "100%",
                        background: color,
                        borderRadius: "10px",
                        transition: "width 0.4s ease-out",
                        boxShadow: `0 0 10px ${color}`
                      }} />
                    </div>

                    {/* Labels */}
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "10px", fontWeight: "700" }}>
                      <span style={{ color: color }}>{tag}</span>
                      <span style={{ color: "#64748b" }}>{Math.round(percent)}% consumed</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BudgetsDrawer;
