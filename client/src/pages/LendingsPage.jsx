import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { coreService } from '../services/api_core';

const LendingsPage = () => {
  const [lendings, setLendings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    coreService.getDebts()
      .then(res => {
        // Filter: We only want money we GAVE (Lended)
        // Assuming your Debt model has a 'debt_type' field. 
        // If not, it will show all debts (borrowed & lent), which is fine for now.
        setLendings(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching lendings:", err);
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
        <h1 style={{ margin: 0, color: "#14b8a6", fontSize: "36px", fontWeight: "800" }}>
          My Lendings
        </h1>
      </div>

      {/* Lendings List Card */}
      <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "30px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
        
        {loading ? (
          <p style={{ color: "#64748b" }}>Loading records...</p>
        ) : lendings.length > 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #f1f5f9" }}>
                <th style={{ padding: "15px", color: "#64748b", fontSize: "14px", fontWeight: "600" }}>PERSON NAME</th>
                <th style={{ padding: "15px", color: "#64748b", fontSize: "14px", fontWeight: "600" }}>TYPE</th>
                <th style={{ padding: "15px", color: "#64748b", fontSize: "14px", fontWeight: "600" }}>DUE DATE</th>
                <th style={{ padding: "15px", color: "#64748b", fontSize: "14px", fontWeight: "600", textAlign: "right" }}>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {lendings.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                  <td style={{ padding: "15px", fontWeight: "bold", color: "#334155" }}>
                    {item.person_name}
                  </td>
                  <td style={{ padding: "15px" }}>
                    {/* Visual badge to see if we Borrowed or Lended */}
                    <span style={{ 
                        backgroundColor: item.debt_type === 'LENT' ? "#ccfbf1" : "#ffe4e6", 
                        color: item.debt_type === 'LENT' ? "#0f766e" : "#be123c",
                        padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" 
                    }}>
                      {item.debt_type || "GENERAL"}
                    </span>
                  </td>
                  <td style={{ padding: "15px", color: "#64748b" }}>
                    {item.due_date}
                  </td>
                  <td style={{ padding: "15px", textAlign: "right", fontWeight: "bold", color: "#14b8a6" }}>
                    ₹{parseFloat(item.amount).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p style={{ color: "#94a3b8", fontSize: "18px", fontWeight: "500" }}>No records found.</p>
            <p style={{ color: "#cbd5e1", fontSize: "14px" }}>No one owes you money right now.</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default LendingsPage;