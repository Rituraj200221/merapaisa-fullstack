import React, { useState, useEffect } from "react";

const MarketingPopup = ({ campaign, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  if (!campaign) return null;

  const handleDismiss = () => {
    setIsExiting(true);
    // Wait for the exit animation to finish before calling onClose
    setTimeout(() => {
      localStorage.setItem(`dismissed_campaign_${campaign.id}`, "true");
      onClose();
    }, 400);
  };

  const handleCTA = () => {
    localStorage.setItem(`dismissed_campaign_${campaign.id}`, "true");
    onClose();
    window.location.href = campaign.cta_link;
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(3, 7, 18, 0.75)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        zIndex: 10000,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        animation: isExiting 
          ? "fadeOut 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards"
          : "fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9) translateY(20px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes scaleOut {
          from { transform: scale(1) translateY(0); opacity: 1; }
          to { transform: scale(0.9) translateY(20px); opacity: 0; }
        }
      `}</style>

      {/* Main Card */}
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(8, 10, 18, 0.98) 100%)",
          border: "1px solid rgba(99, 102, 241, 0.35)",
          borderRadius: "28px",
          overflow: "hidden",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 40px rgba(99, 102, 241, 0.25)",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          animation: isExiting
            ? "scaleOut 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards"
            : "scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        }}
      >
        {/* Close Button on Top Right (Glow Hover) */}
        <button
          onClick={handleDismiss}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            color: "#94a3b8",
            fontSize: "18px",
            fontWeight: "bold",
            cursor: "pointer",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 10,
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
            e.currentTarget.style.border = "1px solid rgba(239, 68, 68, 0.4)";
            e.currentTarget.style.color = "#f87171";
            e.currentTarget.style.boxShadow = "0 0 10px rgba(239, 68, 68, 0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
            e.currentTarget.style.border = "1px solid rgba(255, 255, 255, 0.15)";
            e.currentTarget.style.color = "#94a3b8";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          ✕
        </button>

        {/* Campaign Banner Image */}
        {campaign.image_url && (
          <div style={{ width: "100%", height: "190px", overflow: "hidden", position: "relative" }}>
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "60px",
                background: "linear-gradient(to top, rgba(15, 23, 42, 1), transparent)",
                zIndex: 2,
              }}
            />
            <img
              src={campaign.image_url}
              alt={campaign.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
              }}
            />
          </div>
        )}

        {/* Content Area */}
        <div style={{ padding: "28px", paddingTop: campaign.image_url ? "8px" : "36px" }}>
          <span
            style={{
              display: "inline-block",
              background: "rgba(99, 102, 241, 0.15)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              color: "#a5b4fc",
              fontSize: "11px",
              fontWeight: "800",
              letterSpacing: "1.5px",
              padding: "4px 10px",
              borderRadius: "20px",
              textTransform: "uppercase",
              marginBottom: "14px",
            }}
          >
            🔥 Elite Special
          </span>

          <h2
            style={{
              margin: 0,
              fontSize: "24px",
              color: "#f8fafc",
              fontWeight: "800",
              letterSpacing: "-0.5px",
              lineHeight: "1.25",
              marginBottom: "6px",
            }}
          >
            {campaign.title}
          </h2>

          {campaign.subtitle && (
            <h4
              style={{
                margin: 0,
                fontSize: "14px",
                color: "#818cf8",
                fontWeight: "600",
                marginBottom: "16px",
              }}
            >
              {campaign.subtitle}
            </h4>
          )}

          <p
            style={{
              margin: 0,
              fontSize: "14px",
              color: "#94a3b8",
              lineHeight: "1.6",
              fontWeight: "500",
              whiteSpace: "pre-wrap",
              marginBottom: "28px",
            }}
          >
            {campaign.content}
          </p>

          {/* Action Buttons Row */}
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={handleDismiss}
              style={{
                flex: 1,
                padding: "14px 20px",
                borderRadius: "16px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#cbd5e1",
                fontSize: "14px",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
              }}
            >
              Dismiss
            </button>

            <button
              onClick={handleCTA}
              style={{
                flex: 2,
                padding: "14px 20px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                border: "none",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: "700",
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(99, 102, 241, 0.4)",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = "brightness(1.15)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(99, 102, 241, 0.6), 0 0 15px rgba(99, 102, 241, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = "brightness(1)";
                e.currentTarget.style.boxShadow = "0 4px 15px rgba(99, 102, 241, 0.4)";
              }}
            >
              {campaign.cta_text || "Explore"} ➔
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketingPopup;
