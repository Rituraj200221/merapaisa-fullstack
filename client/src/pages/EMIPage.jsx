import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { coreService } from '../services/api_core';

const EMIPage = () => {
  const [emis, setEmis] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Currently, we fetch Loans to calculate EMIs
    coreService.getLoans()
      .then(res => {
        // We will treat every active loan as having a pending EMI for this month
        setEmis(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching EMIs:", err);
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
        <h1 style={{ margin: 0, color: "#f59e0b", fontSize: "36px", fontWeight: "800" }}>
          My EMIs
        </h1>
      </div>

      {/* EMI List Card */}
      <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "30px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
        
        {loading ? (
          <p style={{ color: "#64748b" }}>Calculating upcoming payments...</p>
        ) : emis.length > 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #f1f5f9" }}>
                <th style={{ padding: "15px", color: "#64748b", fontSize: "14px", fontWeight: "600" }}>LOAN NAME</th>
                <th style={{ padding: "15px", color: "#64748b", fontSize: "14px", fontWeight: "600" }}>DUE DATE</th>
                <th style={{ padding: "15px", color: "#64748b", fontSize: "14px", fontWeight: "600" }}>STATUS</th>
                <th style={{ padding: "15px", color: "#64748b", fontSize: "14px", fontWeight: "600", textAlign: "right" }}>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {emis.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                  <td style={{ padding: "15px", fontWeight: "bold", color: "#334155" }}>
                    {item.name}
                  </td>
                  <td style={{ padding: "15px", color: "#64748b" }}>
                    {/* Hardcoded 5th for now, until we add specific dates */}
                    5th of every month
                  </td>
                  <td style={{ padding: "15px" }}>
                    <span style={{ backgroundColor: "#fffbeb", color: "#b45309", padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" }}>
                      PENDING
                    </span>
                  </td>
                  <td style={{ padding: "15px", textAlign: "right", fontWeight: "bold", color: "#f59e0b" }}>
                    ₹{parseFloat(item.emi_amount).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p style={{ color: "#94a3b8", fontSize: "18px", fontWeight: "500" }}>No upcoming EMIs.</p>
            <p style={{ color: "#cbd5e1", fontSize: "14px" }}>Relax, your payments are up to date.</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default EMIPage;