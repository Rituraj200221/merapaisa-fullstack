import React from "react";
import { Link } from "react-router-dom";

const DashboardCard = ({ title, value, subtext, color, link, icon }) => {
  return (
    // THE LINK WRAPPER: This makes the whole card clickable
    <Link 
      to={link} 
      style={{ 
        textDecoration: "none",
        display: "block",      
        height: "100%",        
        boxSizing: "border-box" 
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "16px",
          padding: "20px 24px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
          borderLeft: `6px solid ${color}`,
          cursor: "pointer", // <--- Forces the "Hand" cursor
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          boxSizing: "border-box"
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.12)";
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.08)";
        }}
      >
        {/* Top Section */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
            <h3 style={{ margin: 0, color: "#64748b", fontSize: "13px", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.8px" }}>
              {title}
            </h3>
            <span style={{ fontSize: "22px", opacity: 0.8 }}>{icon}</span>
          </div>
          <h2 style={{ margin: 0, fontSize: "26px", color: "#1e293b", fontWeight: "800", letterSpacing: "-0.5px" }}>
            {value}
          </h2>
        </div>
        
        {/* Bottom Section */}
        <div style={{ marginTop: "15px", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
           <p style={{ margin: 0, color: "#94a3b8", fontSize: "12px", fontWeight: "500" }}>
             {subtext}
           </p>
        </div>
      </div>
    </Link>
  );
};

export default DashboardCard;