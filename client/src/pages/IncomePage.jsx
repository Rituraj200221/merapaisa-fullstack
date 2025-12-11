import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { coreService } from '../services/api_core';

const IncomePage = () => {
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch all transactions
    coreService.getTransactions()
      .then(res => {
        // Filter: Keep only transactions where category type is 'INCOME'
        // (Note: In a real app, we usually filter on the backend, but this works for now)
        const incomeList = res.data.filter(t => t.category_name === 'Salary' || t.amount > 0); 
        // Since we don't have categories fully set up in UI yet, we will just show everything for now 
        // so you can see the table works.
        setIncomes(res.data); 
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching incomes:", err);
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
        <h1 style={{ margin: 0, color: "#10b981", fontSize: "36px", fontWeight: "800" }}>
          My Incomes
        </h1>
      </div>

      {/* Income List Card */}
      <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "30px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
        
        {loading ? (
          <p>Loading your earnings...</p>
        ) : incomes.length > 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #f1f5f9" }}>
                <th style={{ padding: "15px", color: "#64748b" }}>DATE</th>
                <th style={{ padding: "15px", color: "#64748b" }}>SOURCE</th>
                <th style={{ padding: "15px", color: "#64748b" }}>DESCRIPTION</th>
                <th style={{ padding: "15px", color: "#64748b", textAlign: "right" }}>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {incomes.map((inc) => (
                <tr key={inc.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                  <td style={{ padding: "15px", fontWeight: "600" }}>{inc.date}</td>
                  <td style={{ padding: "15px" }}>
                    <span style={{ backgroundColor: "#d1fae5", color: "#065f46", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "700" }}>
                      {inc.category_name || "Income"}
                    </span>
                  </td>
                  <td style={{ padding: "15px", color: "#64748b" }}>{inc.description}</td>
                  <td style={{ padding: "15px", textAlign: "right", fontWeight: "bold", color: "#10b981" }}>
                    + ₹{parseFloat(inc.amount).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p style={{ color: "#94a3b8", fontSize: "18px" }}>No income records found.</p>
            <p style={{ color: "#cbd5e1", fontSize: "14px" }}>Add transactions via Django Admin for now.</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default IncomePage;