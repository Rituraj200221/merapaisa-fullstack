import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { coreService } from '../services/api_core';

const LoansPage = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    coreService.getLoans()
      .then(res => {
        setLoans(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching loans:", err);
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
        <h1 style={{ margin: 0, color: "#8b5cf6", fontSize: "36px", fontWeight: "800" }}>
          My Loans
        </h1>
      </div>

      {/* Loans List Card */}
      <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "30px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
        
        {loading ? (
          <p style={{ color: "#64748b" }}>Loading your loan details...</p>
        ) : loans.length > 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #f1f5f9" }}>
                <th style={{ padding: "15px", color: "#64748b", fontSize: "14px", fontWeight: "600" }}>LOAN NAME</th>
                <th style={{ padding: "15px", color: "#64748b", fontSize: "14px", fontWeight: "600" }}>TYPE</th>
                <th style={{ padding: "15px", color: "#64748b", fontSize: "14px", fontWeight: "600" }}>EMI AMOUNT</th>
                <th style={{ padding: "15px", color: "#64748b", fontSize: "14px", fontWeight: "600", textAlign: "right" }}>TOTAL DEBT</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr key={loan.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                  <td style={{ padding: "15px", fontWeight: "bold", color: "#334155" }}>
                    {loan.name}
                  </td>
                  <td style={{ padding: "15px" }}>
                    <span style={{ backgroundColor: "#f3e8ff", color: "#7e22ce", padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" }}>
                      {loan.loan_type}
                    </span>
                  </td>
                  <td style={{ padding: "15px", color: "#64748b" }}>
                    ₹{parseFloat(loan.emi_amount).toLocaleString()} / month
                  </td>
                  <td style={{ padding: "15px", textAlign: "right", fontWeight: "bold", color: "#8b5cf6" }}>
                    ₹{parseFloat(loan.total_principal).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p style={{ color: "#94a3b8", fontSize: "18px", fontWeight: "500" }}>No active loans.</p>
            <p style={{ color: "#cbd5e1", fontSize: "14px" }}>You are debt-free! 🎉</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default LoansPage;