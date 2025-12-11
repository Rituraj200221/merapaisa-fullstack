import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { coreService } from '../services/api_core';

const InvestmentsPage = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    coreService.getAssets()
      .then(res => {
        setAssets(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching assets:", err);
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
        <h1 style={{ margin: 0, color: "#3b82f6", fontSize: "36px", fontWeight: "800" }}>
          My Investments
        </h1>
      </div>

      {/* Assets List Card */}
      <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "30px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
        
        {loading ? (
          <p style={{ color: "#64748b" }}>Loading your portfolio...</p>
        ) : assets.length > 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #f1f5f9" }}>
                <th style={{ padding: "15px", color: "#64748b", fontSize: "14px", fontWeight: "600" }}>SYMBOL</th>
                <th style={{ padding: "15px", color: "#64748b", fontSize: "14px", fontWeight: "600" }}>NAME</th>
                <th style={{ padding: "15px", color: "#64748b", fontSize: "14px", fontWeight: "600" }}>TYPE</th>
                <th style={{ padding: "15px", color: "#64748b", fontSize: "14px", fontWeight: "600" }}>QTY</th>
                <th style={{ padding: "15px", color: "#64748b", fontSize: "14px", fontWeight: "600", textAlign: "right" }}>INVESTED</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                  <td style={{ padding: "15px", fontWeight: "bold", color: "#334155" }}>
                    {asset.symbol}
                  </td>
                  <td style={{ padding: "15px", color: "#64748b" }}>
                    {asset.name}
                  </td>
                  <td style={{ padding: "15px" }}>
                    <span style={{ backgroundColor: "#dbeafe", color: "#1e40af", padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" }}>
                      {asset.asset_type}
                    </span>
                  </td>
                  <td style={{ padding: "15px", fontWeight: "600", color: "#334155" }}>
                    {parseFloat(asset.quantity)}
                  </td>
                  <td style={{ padding: "15px", textAlign: "right", fontWeight: "bold", color: "#3b82f6" }}>
                    ₹{(parseFloat(asset.buy_price_avg) * parseFloat(asset.quantity)).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p style={{ color: "#94a3b8", fontSize: "18px", fontWeight: "500" }}>Portfolio is empty.</p>
            <p style={{ color: "#cbd5e1", fontSize: "14px" }}>Start your wealth creation journey!</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default InvestmentsPage;