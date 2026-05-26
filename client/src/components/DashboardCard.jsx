import React, { useState } from "react";
import { Link } from "react-router-dom";

const DashboardCard = ({ title, value, subtext, color, link, icon, onClick, budgetStats }) => {
  const [hovered, setHovered] = useState(false);

  // Helper to convert hex color to rgba for custom glowing shadows
  const getGlowColor = (hex) => {
    if (!hex) return "rgba(99, 102, 241, 0.15)";
    const cleanHex = hex.replace("#", "");
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, 0.25)`;
  };

  // Budget bar color logic
  const getBudgetBarColor = (percent) => {
    if (percent >= 100) return "#ef4444";
    if (percent >= 80) return "#f59e0b";
    return "#10b981";
  };

  const cardContent = (
    <div
      style={{
        background: hovered
          ? "rgba(30, 41, 59, 0.65)"
          : "rgba(15, 23, 42, 0.45)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: "24px",
        border: hovered
          ? `1px solid ${color}`
          : "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: hovered
          ? `0 15px 35px ${getGlowColor(color)}, 0 5px 15px rgba(0, 0, 0, 0.4)`
          : "0 10px 30px rgba(0, 0, 0, 0.2)",
        cursor: "pointer",
        transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxSizing: "border-box",
        transform: hovered ? "translateY(-6px) scale(1.02)" : "translateY(0) scale(1)",
        overflow: "hidden",  // keeps budget bar within rounded corners
        position: "relative"
      }}
    >
      {/* Top Section */}
      <div style={{ padding: "24px 28px 0 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <h3 style={{
            margin: 0,
            color: hovered ? color : "#94a3b8",
            fontSize: "12px",
            textTransform: "uppercase",
            fontWeight: "800",
            letterSpacing: "1px",
            transition: "color 0.3s"
          }}>
            {title}
          </h3>
          <span style={{
            fontSize: "24px",
            filter: hovered ? `drop-shadow(0 0 8px ${color})` : "none",
            transform: hovered ? "scale(1.15) rotate(5deg)" : "scale(1)",
            transition: "all 0.3s ease"
          }}>
            {icon}
          </span>
        </div>

        {typeof value === 'string' || typeof value === 'number' ? (
          <h2 style={{
            margin: 0,
            fontSize: "28px",
            color: "#f8fafc",
            fontWeight: "800",
            letterSpacing: "-0.5px",
            textShadow: hovered ? `0 0 15px ${getGlowColor(color)}` : "none",
            transition: "all 0.3s"
          }}>
            {value}
          </h2>
        ) : (
          <div>{value}</div>
        )}
      </div>

      {/* Bottom Section */}
      <div>
        <div style={{
          margin: "0 28px",
          paddingTop: "14px",
          marginTop: "20px",
          borderTop: hovered ? `1px dashed ${color}40` : "1px solid rgba(255, 255, 255, 0.06)",
          transition: "border-top 0.3s",
          paddingBottom: budgetStats && budgetStats.limit > 0 ? "14px" : "24px"
        }}>
          <p style={{
            margin: 0,
            color: hovered ? "#e2e8f0" : "#64748b",
            fontSize: "12px",
            fontWeight: "600",
            transition: "color 0.3s",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <span>{subtext}</span>
            <span style={{
              opacity: hovered ? 1 : 0,
              transform: hovered ? "translateX(0)" : "translateX(-5px)",
              transition: "all 0.3s",
              color: color,
              fontWeight: "bold"
            }}>
              Explore ➔
            </span>
          </p>
        </div>

        {/* Budget Progress Bar — pinned to card bottom, visual only */}
        {budgetStats && budgetStats.limit > 0 && (() => {
          const pct = budgetStats.percent;
          const barColor = getBudgetBarColor(pct);
          return (
            <div style={{ padding: "0 28px 20px 28px" }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "10px",
                fontWeight: "700",
                color: "#64748b",
                marginBottom: "5px"
              }}>
                <span style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>Budget</span>
                <span style={{ color: barColor }}>{Math.round(pct)}%</span>
              </div>
              <div style={{
                width: "100%",
                height: "4px",
                background: "rgba(255, 255, 255, 0.07)",
                borderRadius: "4px",
                overflow: "hidden"
              }}>
                <div
                  style={{
                    width: `${Math.min(pct, 100)}%`,
                    height: "100%",
                    borderRadius: "4px",
                    backgroundColor: barColor,
                    transition: "width 0.5s ease-out",
                    boxShadow: pct >= 80 && pct < 100
                      ? `0 0 7px ${barColor}`
                      : pct >= 100
                        ? `0 0 10px ${barColor}`
                        : "none",
                    animation: pct >= 100 ? "blink-red 1s infinite" : "none"
                  }}
                />
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );

  if (onClick) {
    return (
      <div
        onClick={onClick}
        style={{
          display: "block",
          height: "100%",
          boxSizing: "border-box"
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {cardContent}
      </div>
    );
  }

  return (
    <Link
      to={link}
      style={{
        textDecoration: "none",
        display: "block",
        height: "100%",
        boxSizing: "border-box"
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {cardContent}
    </Link>
  );
};

export default DashboardCard;