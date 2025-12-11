import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { coreService } from '../services/api_core';

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch all transactions
    coreService.getTransactions()
      .then(res => {
        // Filter: Show only items that are NOT 'Salary' (assuming everything else is an expense for now)
        // In the future, we will have a proper 'type' field in the API
        const expenseList = res.data.filter(t => t.category_name !== 'Salary' && t.category_name !== 'Income'); 
        setExpenses(expenseList); 
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching expenses:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ padding: "40px", backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      
      {/* Header with Back Button */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: "30px" }}>
        <Link to="/" style={{ textDecoration: "none", marginRight: "20px", fontSize: "24px" }}>
          ⬅️
        </Link>
        <h1 style={{ margin: 0, color: "#ef4444", fontSize: "36px", fontWeight: "800" }}>
          My Expenses
        </h1>
      </div>

      {/* Expenses List Card */}
      <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "30px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
        
        {loading ? (
          <p style={{ color: "#64748b" }}>Loading your spending history...</p>
        ) : expenses.length > 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #f1f5f9" }}>
                <th style={{ padding: "15px", color: "#64748b", fontSize: "14px", fontWeight: "600" }}>DATE</th>
                <th style={{ padding: "15px", color: "#64748b", fontSize: "14px", fontWeight: "600" }}>CATEGORY</th>
                <th style={{ padding: "15px", color: "#64748b", fontSize: "14px", fontWeight: "600" }}>DESCRIPTION</th>
                <th style={{ padding: "15px", color: "#64748b", fontSize: "14px", fontWeight: "600", textAlign: "right" }}>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp) => (
                <tr key={exp.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                  <td style={{ padding: "15px", fontWeight: "600", color: "#334155" }}>{exp.date}</td>
                  <td style={{ padding: "15px" }}>
                    <span style={{ backgroundColor: "#fee2e2", color: "#991b1b", padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" }}>
                      {exp.category_name || "General"}
                    </span>
                  </td>
                  <td style={{ padding: "15px", color: "#64748b" }}>{exp.description}</td>
                  <td style={{ padding: "15px", textAlign: "right", fontWeight: "bold", color: "#ef4444" }}>
                    - ₹{parseFloat(exp.amount).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p style={{ color: "#94a3b8", fontSize: "18px", fontWeight: "500" }}>No expense records found.</p>
            <p style={{ color: "#cbd5e1", fontSize: "14px" }}>Great! You haven't spent anything yet.</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default ExpensesPage;