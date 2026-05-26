import { useEffect, useState } from 'react';
import { coreService } from './services/api_core';
import DashboardCard from './components/DashboardCard';
import rupeeCoin from './assets/rupee_coin.png';
import MarketingPopup from './components/MarketingPopup';
import AIFloatingAdvisor from './components/AIFloatingAdvisor';
import axios from 'axios';
import BudgetsDrawer from './components/BudgetsDrawer';

const Dashboard = () => {
  // 1. STATE VARIABLES
  const [totalLoans, setTotalLoans] = useState(0);
  const [totalInvested, setTotalInvested] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [totalEMI, setTotalEMI] = useState(0);
  const [totalLending, setTotalLending] = useState(0);
  const [totalBorrowing, setTotalBorrowing] = useState(0);
  
  // 3-Layer Budgeting State Variables
  const [showBudgetsDrawer, setShowBudgetsDrawer] = useState(false);
  const [budgets, setBudgets] = useState([]);
  const [totalBudgetLimit, setTotalBudgetLimit] = useState(0);
  const [allTransactions, setAllTransactions] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Phase 3 State Variables
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [activeCampaign, setActiveCampaign] = useState(null);

  // Advanced Recycle Bin & Scheduler States
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  const [recycleItems, setRecycleItems] = useState([]);
  const [sendingDigest, setSendingDigest] = useState(false);

  const fetchRecycleBin = async () => {
    try {
      const res = await coreService.getRecycleBin();
      setRecycleItems(res.data);
    } catch (err) {
      console.error("Failed to load recycle bin:", err);
    }
  };

  useEffect(() => {
    if (showRecycleBin) {
      fetchRecycleBin();
    }
  }, [showRecycleBin]);

  const handleRestoreItem = async (id, type) => {
    try {
      await coreService.restoreItem(id, type);
      triggerToast(`${type} restored successfully!`);
      fetchRecycleBin();
      fetchData(); // Refreshes everything instantly!
    } catch (err) {
      console.error("Failed to restore item:", err);
      triggerToast("Restoration failed.");
    }
  };

  const handlePurgeItem = async (id, type) => {
    try {
      await coreService.purgeItem(id, type);
      triggerToast(`${type} permanently deleted!`);
      fetchRecycleBin();
    } catch (err) {
      console.error("Failed to purge item:", err);
      triggerToast("Purge failed.");
    }
  };

  const handleSendEmailDigest = async () => {
    setSendingDigest(true);
    try {
      await coreService.triggerEmailStatementDigest();
      triggerToast("📧 Asynchronous Statement compiled and mailed! Check your email.");
    } catch (err) {
      console.error("Failed to send digest:", err);
      triggerToast("Failed to compile statement email.");
    } finally {
      setSendingDigest(false);
    }
  };

  const handleDownloadStatement = async (format) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios({
        url: `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/export/${format}/`,
        method: 'GET',
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const responseType = response.data.type || '';
      const contentType = response.headers['content-type'] || '';
      
      let mimeType = format === 'pdf' ? 'application/pdf' : 'text/csv';
      let downloadExt = format;
      
      if (responseType.includes('text/html') || contentType.includes('text/html')) {
        mimeType = 'text/html';
        downloadExt = 'html';
      }

      // Reconstruct filename from Content-Disposition if present
      let filename = '';
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      
      if (!filename) {
        // Fallback dynamic month naming if header not exposed/found
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const currentMonth = monthNames[new Date().getMonth()];
        filename = `merapaisa_${currentMonth}_statement.${downloadExt}`;
      }
      
      const blob = new Blob([response.data], { type: mimeType });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      triggerToast(`Statement downloaded as ${downloadExt.toUpperCase()} successfully!`);
    } catch (err) {
      console.error("Export failed:", err);
      triggerToast("Failed to compile statement document.");
    }
  };


  const fetchNotifications = async () => {
    try {
      const res = await coreService.getNotifications();
      const data = res.data;
      setNotifications(data);
      
      const unread = data.filter(n => !n.is_read).length;
      setUnreadCount(unread);
      
      // Determine if we should display toast warnings for unread budget alerts
      const toastedIds = JSON.parse(sessionStorage.getItem('toasted_notifications') || '[]');
      const newToasts = [];
      
      data.forEach(n => {
        if (!n.is_read && n.notification_type === 'BUDGET_ALERT' && !toastedIds.includes(n.id)) {
          newToasts.push(n);
          toastedIds.push(n.id);
        }
      });
      
      if (newToasts.length > 0) {
        sessionStorage.setItem('toasted_notifications', JSON.stringify(toastedIds));
        setToasts(prev => [...prev, ...newToasts]);
        
        // Auto-dismiss after 6 seconds
        newToasts.forEach(toast => {
          setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== toast.id));
          }, 6000);
        });
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const res = await coreService.getActiveCampaigns();
      const active = res.data;
      const undismissed = active.find(c => localStorage.getItem(`dismissed_campaign_${c.id}`) !== "true");
      if (undismissed) {
        setActiveCampaign(undismissed);
      }
    } catch (error) {
      console.error("Error fetching active campaigns:", error);
    }
  };
  // Budget stats math helper
  const getBudgetConsumptonStats = () => {
    if (!budgets || budgets.length === 0) return { limit: 0, spent: 0, percent: 0 };
    
    let limitSum = 0;
    let spentSum = 0;
    
    budgets.forEach(b => {
      const limit = parseFloat(b.amount_limit || 0);
      limitSum += limit;
      
      if (allTransactions && allTransactions.length > 0) {
        const budgetMonth = new Date(b.month);
        const budgetYear = budgetMonth.getFullYear();
        const budgetMonthNum = budgetMonth.getMonth();
        
        const catSpent = allTransactions
          .filter(t => {
            if (t.category_type !== 'EXPENSE' || t.category_name !== b.category_name) return false;
            const tDate = new Date(t.date);
            return tDate.getFullYear() === budgetYear && tDate.getMonth() === budgetMonthNum;
          })
          .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
        
        spentSum += catSpent;
      }
    });
    
    const percent = limitSum > 0 ? (spentSum / limitSum) * 100 : 0;
    return { limit: limitSum, spent: spentSum, percent };
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      // --- A. Fetch Loans & EMIs ---
      const loanRes = await coreService.getLoans();
      const loanSum = loanRes.data.reduce((sum, item) => sum + parseFloat(item.total_principal || 0), 0);
      const emiSum = loanRes.data.reduce((sum, item) => sum + parseFloat(item.emi_amount || 0), 0);
      setTotalLoans(loanSum);
      setTotalEMI(emiSum);

      // --- B. Fetch Assets (Investments) ---
      const assetRes = await coreService.getAssets();
      const investSum = assetRes.data.reduce((sum, item) => sum + (parseFloat(item.buy_price_avg || 0) * parseFloat(item.quantity || 0)), 0);
      setTotalInvested(investSum);

      // --- C. Fetch Transactions (Income & Expense) ---
      const transRes = await coreService.getTransactions();
      setAllTransactions(transRes.data);

      // INCOME CALCULATION LOGIC (Filtered by Type)
      const incomeSum = transRes.data
        .filter(t => t.category_type === 'INCOME')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      // EXPENSE CALCULATION LOGIC (Filtered by Type)
      const expenseSum = transRes.data
        .filter(t => t.category_type === 'EXPENSE')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
        
      setTotalIncome(incomeSum);
      setTotalExpense(expenseSum);

      // --- D. Fetch Lendings & Borrowings (Debts - Lended vs Borrowed) ---
      const debtRes = await coreService.getDebts();
      const lendedSum = debtRes.data
        .filter(item => item.debt_type === 'GIVEN')
        .reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
      const borrowedSum = debtRes.data
        .filter(item => item.debt_type === 'TAKEN')
        .reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
      setTotalLending(lendedSum);
      setTotalBorrowing(borrowedSum);
      
      // --- E. Fetch Budgets ---
      const budgetRes = await coreService.getBudgets();
      setBudgets(budgetRes.data);
      const activeBudgetSum = budgetRes.data.reduce((sum, b) => sum + parseFloat(b.amount_limit || 0), 0);
      setTotalBudgetLimit(activeBudgetSum);
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }

    fetchData();
    fetchNotifications();
    fetchCampaigns();

    // Poll for notifications every 10 seconds
    const intervalId = setInterval(() => {
      fetchNotifications();
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    // Clear all dismissed campaigns from localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('dismissed_campaign_')) {
        localStorage.removeItem(key);
      }
    });
    window.location.href = '/login';
  };

  // Dynamic Net Wealth Index math
  const netWealth = (totalIncome + totalInvested + totalLending) - (totalExpense + totalLoans);
  const isNetPositive = netWealth >= 0;

  return (
    <div style={{ 
      position: 'relative',
      minHeight: '100vh',
      background: 'radial-gradient(circle at top right, #1d4ed81a, #0f172a, #020617)',
      fontFamily: "'Inter', sans-serif",
      color: '#f8fafc',
      padding: '40px 20px',
      boxSizing: 'border-box',
      overflowX: 'hidden'
    }}>
      {/* Floating keyframes injection */}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(4deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes subtle-glow {
          0% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.16; transform: scale(1.05); }
          100% { opacity: 0.1; transform: scale(1); }
        }
        @keyframes pulse-glow {
          0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(99, 102, 241, 0); }
          100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
        }
        @keyframes bell-ring {
          0% { transform: rotate(0); }
          10% { transform: rotate(15deg); }
          20% { transform: rotate(-10deg); }
          30% { transform: rotate(5deg); }
          40% { transform: rotate(-5deg); }
          50% { transform: rotate(0); }
          100% { transform: rotate(0); }
        }
        @keyframes blink-red {
          0%, 100% { background-color: #ef4444; box-shadow: 0 0 10px #ef4444; }
          50% { background-color: rgba(239, 68, 68, 0.4); box-shadow: none; }
        }
      `}</style>

      {/* Glowing background auroras */}
      <div style={{
        position: 'absolute',
        width: '450px',
        height: '450px',
        borderRadius: '50%',
        background: 'rgba(59, 130, 246, 0.15)',
        filter: 'blur(130px)',
        top: '-10%',
        right: '5%',
        pointerEvents: 'none',
        animation: 'subtle-glow 6s infinite ease-in-out'
      }} />
      <div style={{
        position: 'absolute',
        width: '350px',
        height: '350px',
        borderRadius: '50%',
        background: 'rgba(99, 102, 241, 0.08)',
        filter: 'blur(100px)',
        bottom: '10%',
        left: '5%',
        pointerEvents: 'none'
      }} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        
        {/* HEADER SECTION */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between",
          marginBottom: "40px",
          flexWrap: "wrap",
          gap: "20px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <img 
              src={rupeeCoin} 
              alt="Rupee Coin" 
              style={{ 
                width: "48px", 
                height: "48px", 
                objectFit: "contain",
                animation: 'float 3.5s infinite ease-in-out'
              }} 
            />
            <div>
              <h1 style={{ 
                  color: "#f8fafc", 
                  fontSize: "32px",   
                  fontWeight: "900",  
                  margin: 0, 
                  letterSpacing: "-1px" 
              }}>
                Mera<span style={{ color: '#3b82f6' }}>Paisa</span>
              </h1>
              <p style={{ margin: '2px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>
                Your unified financial command center
              </p>
            </div>
          </div>

           {/* User profile, Notification Bell, & Logout pill */}
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {/* Budgets Target Button */}
              <div style={{ position: "relative" }}>
                <button 
                  onClick={() => setShowBudgetsDrawer(true)}
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "14px",
                    padding: "12px",
                    color: "#94a3b8",
                    fontSize: "18px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.3s ease",
                    boxShadow: "0 0 10px rgba(239, 68, 68, 0.05)"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
                    e.currentTarget.style.color = "#ef4444";
                    e.currentTarget.style.boxShadow = "0 0 15px rgba(239, 68, 68, 0.25)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                    e.currentTarget.style.color = "#94a3b8";
                    e.currentTarget.style.boxShadow = "0 0 10px rgba(239, 68, 68, 0.05)";
                  }}
                  title="Open Category Budgets"
                >
                  🎯
                </button>
              </div>

              {/* Recycle Bin Button */}
              <div style={{ position: "relative" }}>
                <button 
                  onClick={() => setShowRecycleBin(!showRecycleBin)}
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "14px",
                    padding: "12px",
                    color: "#94a3b8",
                    fontSize: "18px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
                    e.currentTarget.style.color = "#fbbf24";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                    e.currentTarget.style.color = "#94a3b8";
                  }}
                >
                  🗑️
                </button>

                {/* Recycle Bin Dropdown */}
                {showRecycleBin && (
                  <div style={{
                    position: "absolute",
                    top: "56px",
                    right: "0",
                    width: "320px",
                    background: "rgba(15, 23, 42, 0.95)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "20px",
                    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                    zIndex: 1000,
                    padding: "16px",
                    maxHeight: "380px",
                    overflowY: "auto"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "8px" }}>
                      <h4 style={{ margin: 0, color: "#f8fafc", fontSize: "14px", fontWeight: "700", fontFamily: "'Outfit', sans-serif" }}>🧹 Recycle Bin</h4>
                      <button onClick={() => setShowRecycleBin(false)} style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: "11px", fontWeight: "700" }}>Close</button>
                    </div>

                    {recycleItems.length === 0 ? (
                      <p style={{ margin: "20px 0", color: "#64748b", fontSize: "12px", textAlign: "center", fontFamily: "'Outfit', sans-serif" }}>No deleted items in bin.</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {recycleItems.map(item => (
                          <div key={`${item.type}-${item.id}`} style={{
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.04)",
                            borderRadius: "12px",
                            padding: "10px 12px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px"
                          }}>
                            <div>
                              <span style={{ fontSize: "9px", fontWeight: "900", color: "#fbbf24", background: "rgba(251,191,36,0.1)", padding: "2px 6px", borderRadius: "4px", textTransform: "uppercase", fontFamily: "'Outfit', sans-serif" }}>{item.type}</span>
                              <p style={{ margin: "6px 0 0 0", color: "#e2e8f0", fontSize: "12px", fontWeight: "600", fontFamily: "'Outfit', sans-serif" }}>{item.title}</p>
                              <span style={{ fontSize: "10px", color: "#64748b", fontFamily: "'Outfit', sans-serif" }}>Deleted: {item.date}</span>
                            </div>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button 
                                onClick={() => handleRestoreItem(item.id, item.type)}
                                style={{
                                  flex: 1,
                                  background: "rgba(16, 185, 129, 0.1)",
                                  border: "1px solid rgba(16, 185, 129, 0.2)",
                                  borderRadius: "6px",
                                  padding: "4px 0",
                                  color: "#34d399",
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  cursor: "pointer",
                                  fontFamily: "'Outfit', sans-serif"
                                }}
                              >
                                Restore
                              </button>
                              <button 
                                onClick={() => handlePurgeItem(item.id, item.type)}
                                style={{
                                  flex: 1,
                                  background: "rgba(239, 68, 68, 0.1)",
                                  border: "1px solid rgba(239, 68, 68, 0.2)",
                                  borderRadius: "6px",
                                  padding: "4px 0",
                                  color: "#f87171",
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  cursor: "pointer",
                                  fontFamily: "'Outfit', sans-serif"
                                }}
                              >
                                Purge
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Notification Bell Dropdown */}
              <div style={{ position: "relative" }}>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "14px",
                    padding: "12px",
                    color: unreadCount > 0 ? "#60a5fa" : "#94a3b8",
                    fontSize: "18px",
                    cursor: "pointer",
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.3s ease",
                    boxShadow: unreadCount > 0 ? "0 0 15px rgba(99, 102, 241, 0.25)" : "none",
                    animation: unreadCount > 0 ? "pulse-glow 2s infinite, bell-ring 3s infinite ease-in-out" : "none"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
                    e.currentTarget.style.color = "#cbd5e1";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                    e.currentTarget.style.color = unreadCount > 0 ? "#60a5fa" : "#94a3b8";
                  }}
                >
                  🔔
                  {unreadCount > 0 && (
                    <span style={{
                      position: "absolute",
                      top: "-4px",
                      right: "-4px",
                      background: "linear-gradient(135deg, #ef4444, #dc2626)",
                      color: "white",
                      fontSize: "10px",
                      fontWeight: "900",
                      borderRadius: "50%",
                      width: "18px",
                      height: "18px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 0 8px rgba(239, 68, 68, 0.6)",
                      border: "2px solid #0f172a"
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div style={{
                    position: "absolute",
                    right: 0,
                    top: "55px",
                    width: "340px",
                    maxHeight: "450px",
                    background: "linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(8, 10, 18, 0.99) 100%)",
                    border: "1px solid rgba(99, 102, 241, 0.25)",
                    borderRadius: "22px",
                    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(99, 102, 241, 0.15)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    padding: "20px",
                    zIndex: 1000,
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "12px" }}>
                      <h3 style={{ margin: 0, fontSize: "14px", color: "#f8fafc", fontWeight: "800" }}>
                        Notifications ({unreadCount})
                      </h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={async () => {
                            const unreadNotifs = notifications.filter(n => !n.is_read);
                            await Promise.all(unreadNotifs.map(n => coreService.markNotificationRead(n.id)));
                            fetchNotifications();
                          }}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#60a5fa",
                            fontSize: "11px",
                            fontWeight: "700",
                            cursor: "pointer",
                            padding: 0
                          }}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", maxHeight: "300px", paddingRight: "4px" }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: "30px 10px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div 
                            key={n.id}
                            onClick={async () => {
                              if (!n.is_read) {
                                await coreService.markNotificationRead(n.id);
                                fetchNotifications();
                              }
                            }}
                            style={{
                              background: n.is_read ? "rgba(255, 255, 255, 0.01)" : "rgba(99, 102, 241, 0.06)",
                              border: n.is_read ? "1px solid rgba(255,255,255,0.03)" : "1px solid rgba(99, 102, 241, 0.2)",
                              borderRadius: "14px",
                              padding: "12px",
                              position: "relative",
                              cursor: "pointer",
                              transition: "all 0.3s ease",
                              opacity: n.is_read ? 0.75 : 1
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.4)";
                              e.currentTarget.style.background = "rgba(99, 102, 241, 0.08)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = n.is_read ? "rgba(255,255,255,0.03)" : "rgba(99, 102, 241, 0.2)";
                              e.currentTarget.style.background = n.is_read ? "rgba(255, 255, 255, 0.01)" : "rgba(99, 102, 241, 0.06)";
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                              <span style={{ 
                                fontWeight: "800", 
                                fontSize: "12px", 
                                color: n.notification_type === "BUDGET_ALERT" ? "#f87171" : "#f8fafc" 
                              }}>
                                {n.notification_type === "BUDGET_ALERT" ? "🚨 " : "🔔 "} {n.title}
                              </span>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  await coreService.clearNotification(n.id);
                                  fetchNotifications();
                                }}
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  color: "#64748b",
                                  fontSize: "12px",
                                  cursor: "pointer",
                                  padding: 0
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = "#ef4444"}
                                onMouseLeave={(e) => e.currentTarget.style.color = "#64748b"}
                              >
                                🗑️
                              </button>
                            </div>
                            <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8", lineHeight: "1.4" }}>
                              {n.message}
                            </p>
                            <span style={{ fontSize: "9px", color: "#475569", marginTop: "6px", display: "block" }}>
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <span style={{ 
                color: "#cbd5e1", 
                fontSize: "13px", 
                fontWeight: "700",
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                padding: "10px 18px",
                borderRadius: "14px",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                backdropFilter: 'blur(10px)'
              }}>
                Welcome, <span style={{ color: "#60a5fa" }}>{user.username}</span> 👋
              </span>
              <button 
                onClick={handleLogout}
                style={{
                  background: "linear-gradient(135deg, #ef4444, #b91c1c)",
                  border: "none",
                  borderRadius: "14px",
                  padding: "11px 20px",
                  color: "white",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: "pointer",
                  boxShadow: "0 4px 15px rgba(239, 68, 68, 0.25)",
                  transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(239, 68, 68, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 15px rgba(239, 68, 68, 0.25)";
                }}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>

        {/* 📊 DYNAMIC WEALTH SUMMARY BANNER */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.35)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '24px',
          border: isNetPositive 
            ? '1px solid rgba(16, 185, 129, 0.15)' 
            : '1px solid rgba(239, 68, 68, 0.15)',
          padding: '30px 40px',
          marginBottom: '40px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '30px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Internal visual accent */}
          <div style={{
            position: 'absolute',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: isNetPositive ? 'rgba(16, 185, 129, 0.06)' : 'rgba(239, 68, 68, 0.06)',
            filter: 'blur(30px)',
            right: '-10px',
            top: '-10px'
          }} />

          <div>
            <div style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
              📊 Net Wealth Index
            </div>
            <h2 style={{ 
              margin: 0, 
              fontSize: '38px', 
              fontWeight: '900', 
              color: isNetPositive ? '#10b981' : '#f87171',
              letterSpacing: '-1px',
              textShadow: isNetPositive ? '0 0 20px rgba(16, 185, 129, 0.2)' : '0 0 20px rgba(239, 68, 68, 0.2)'
            }}>
              {loading ? "Calculating..." : `${isNetPositive ? '+' : ''}₹ ${netWealth.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
            </h2>
            <p style={{ margin: '8px 0 0 0', color: '#64748b', fontSize: '13px', lineHeight: '1.4', maxWidth: '550px' }}>
              Aggregate of your active savings, capital holdings, and friend loans, minus bank debts and registered monthly spending.
            </p>
            
            {/* Dynamic Export and Background Asynchronous Scheduler Mail buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
              <button 
                onClick={() => handleDownloadStatement('pdf')}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '6px 12px',
                  color: '#cbd5e1',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                  fontFamily: "'Outfit', sans-serif"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
              >
                📄 Export PDF
              </button>
              <button 
                onClick={() => handleDownloadStatement('csv')}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '6px 12px',
                  color: '#cbd5e1',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                  fontFamily: "'Outfit', sans-serif"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
              >
                📊 Export CSV
              </button>
              <button 
                onClick={handleSendEmailDigest}
                disabled={sendingDigest}
                style={{
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  borderRadius: '10px',
                  padding: '6px 12px',
                  color: '#a5b4fc',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: sendingDigest ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                  fontFamily: "'Outfit', sans-serif"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'}
              >
                📧 {sendingDigest ? 'Mailing...' : 'Email Wealth Digest'}
              </button>
            </div>
          </div>

          {/* Goal & Budget Progress Rings Container */}
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {/* SVG Wealth Goal Progress Ring */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              background: 'rgba(255,255,255,0.01)',
              border: '1px solid rgba(255,255,255,0.04)',
              borderRadius: '20px',
              padding: '12px 20px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ position: 'relative', width: '76px', height: '76px' }}>
                <svg width="76" height="76" viewBox="0 0 90 90" style={{ transform: 'rotate(-90deg)' }}>
                  <defs>
                    <linearGradient id="goalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#60a5fa" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                  {/* Background Circle */}
                  <circle
                    cx="45"
                    cy="45"
                    r="36"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="7"
                    fill="transparent"
                  />
                  {/* Progress Circle */}
                  <circle
                    cx="45"
                    cy="45"
                    r="36"
                    stroke="url(#goalGrad)"
                    strokeWidth="7"
                    fill="transparent"
                    strokeDasharray="226.2"
                    strokeDashoffset={226.2 - (226.2 * Math.min(Math.round((Math.max(netWealth, 0) / 1000000) * 100), 100)) / 100}
                    strokeLinecap="round"
                    style={{
                      transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)',
                      filter: 'drop-shadow(0 0 5px rgba(59, 130, 246, 0.4))'
                    }}
                  />
                </svg>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '13px', fontWeight: '900', color: '#f8fafc' }}>
                    {Math.round((Math.max(netWealth, 0) / 1000000) * 100)}%
                  </span>
                  <span style={{ fontSize: '7px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Goal
                  </span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#e2e8f0', marginBottom: '2px' }}>₹10L Goal</div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                  {netWealth >= 1000000 ? "🎉 Achieved!" : `₹${(1000000 - Math.max(netWealth, 0)).toLocaleString('en-IN')} left`}
                </div>
              </div>
            </div>

            {/* Level 1: Budgets Ambient Circular Ring */}
            <div 
              onClick={() => setShowBudgetsDrawer(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                background: 'rgba(255,255,255,0.01)',
                border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: '20px',
                padding: '12px 20px',
                backdropFilter: 'blur(10px)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.01)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)';
                e.currentTarget.style.transform = 'none';
              }}
              title="Click to view category budgets details"
            >
              <div style={{ position: 'relative', width: '76px', height: '76px' }}>
                <svg width="76" height="76" viewBox="0 0 90 90" style={{ transform: 'rotate(-90deg)' }}>
                  <defs>
                    <linearGradient id="budgetRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={
                        getBudgetConsumptonStats().percent >= 100 ? "#ef4444" : 
                        getBudgetConsumptonStats().percent >= 80 ? "#f59e0b" : "#10b981"
                      } />
                      <stop offset="100%" stopColor={
                        getBudgetConsumptonStats().percent >= 100 ? "#b91c1c" : 
                        getBudgetConsumptonStats().percent >= 80 ? "#d97706" : "#059669"
                      } />
                    </linearGradient>
                  </defs>
                  {/* Background Circle */}
                  <circle
                    cx="45"
                    cy="45"
                    r="36"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="7"
                    fill="transparent"
                  />
                  {/* Progress Circle */}
                  <circle
                    cx="45"
                    cy="45"
                    r="36"
                    stroke="url(#budgetRingGrad)"
                    strokeWidth="7"
                    fill="transparent"
                    strokeDasharray="226.2"
                    strokeDashoffset={226.2 - (226.2 * Math.min(Math.round(getBudgetConsumptonStats().percent), 100)) / 100}
                    strokeLinecap="round"
                    style={{
                      transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)',
                      filter: `drop-shadow(0 0 5px ${
                        getBudgetConsumptonStats().percent >= 100 ? "rgba(239, 68, 68, 0.4)" : 
                        getBudgetConsumptonStats().percent >= 80 ? "rgba(245, 158, 11, 0.4)" : "rgba(16, 185, 129, 0.4)"
                      })`
                    }}
                  />
                </svg>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <span style={{ 
                    fontSize: '13px', 
                    fontWeight: '900', 
                    color: getBudgetConsumptonStats().percent >= 100 ? "#f87171" : 
                           getBudgetConsumptonStats().percent >= 80 ? "#fbbf24" : "#34d399" 
                  }}>
                    {budgets.length > 0 ? `${Math.round(getBudgetConsumptonStats().percent)}%` : "0%"}
                  </span>
                  <span style={{ fontSize: '7px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Budget
                  </span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#e2e8f0', marginBottom: '2px' }}>Category Budgets 🎯</div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                  {budgets.length > 0 
                    ? `₹${Math.round(getBudgetConsumptonStats().spent).toLocaleString('en-IN')} / ₹${Math.round(getBudgetConsumptonStats().limit).toLocaleString('en-IN')}` 
                    : "No budgets set"}
                </div>
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '25px',
            flexWrap: 'wrap'
          }}>
            {/* Quick Liquidity Stat */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '16px',
              padding: '15px 20px',
              minWidth: '150px'
            }}>
              <div style={{ color: '#64748b', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Liquid Cash Flows</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#e2e8f0' }}>
                ₹ {(totalIncome - totalExpense).toLocaleString('en-IN')}
              </div>
            </div>

            {/* Quick Assets vs Loans */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '16px',
              padding: '15px 20px',
              minWidth: '150px'
            }}>
              <div style={{ color: '#64748b', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Capital Holdings</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#3b82f6' }}>
                ₹ {(totalInvested + totalLending).toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>

        {/* 🎛️ THE 6 CORE SERVICES GRID */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", 
          gap: "24px",
          marginBottom: "40px"
        }}>
          
          <DashboardCard 
            title="My Incomes"
            value={loading ? "..." : `₹ ${totalIncome.toLocaleString('en-IN')}`} 
            subtext="Track dynamic income streams"
            color="#10b981" 
            link="/incomes"
            icon="💰"
          />

          <DashboardCard 
            title="My Expenses"
            value={loading ? "..." : `₹ ${totalExpense.toLocaleString('en-IN')}`}
            subtext="Monitor dynamic cash outflows"
            color="#ef4444" 
            link="/expenses"
            icon="📉"
            budgetStats={getBudgetConsumptonStats()}
          />

          <DashboardCard 
            title="My EMIs"
            value={loading ? "..." : `₹ ${totalEMI.toLocaleString('en-IN')}`} 
            subtext="Active monthly installments"
            color="#f59e0b" 
            link="/emis"
            icon="📅"
          />

          <DashboardCard 
            title="My Loans"
            value={loading ? "..." : `₹ ${totalLoans.toLocaleString('en-IN')}`}
            subtext="Outstanding bank liabilities"
            color="#8b5cf6" 
            link="/loans"
            icon="🏦"
          />

          <DashboardCard 
            title="Lend & Borrow"
            value={loading ? "..." : (
              <div style={{ display: "flex", alignItems: "center", gap: "14px", marginTop: "4px" }}>
                {/* Lendings (I Lent) */}
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span style={{ fontSize: "10px", color: "#64748b", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>Lent</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                    <span style={{ color: "#10b981", fontSize: "14px", fontWeight: "bold" }}>↗</span>
                    <span style={{ fontSize: "18px", color: "#f8fafc", fontWeight: "800" }}>
                      ₹{totalLending.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Clear Separation Divider */}
                <div style={{ width: "1px", height: "28px", background: "rgba(255, 255, 255, 0.12)" }}></div>

                {/* Borrowings (I Borrowed) */}
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span style={{ fontSize: "10px", color: "#64748b", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>Borrowed</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                    <span style={{ color: "#ef4444", fontSize: "14px", fontWeight: "bold" }}>↘</span>
                    <span style={{ fontSize: "18px", color: "#f8fafc", fontWeight: "800" }}>
                      ₹{totalBorrowing.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            )} 
            subtext="Informal book debt accounts"
            color="#14b8a6" 
            link="/lendings"
            icon="🤝"
          />

          <DashboardCard 
            title="My Investments"
            value={loading ? "..." : `₹ ${totalInvested.toLocaleString('en-IN')}`}
            subtext="Real-time stock/MF holdings"
            color="#3b82f6" 
            link="/investments"
            icon="📈"
          />

        </div>
      </div>

      {/* Sliding Toast Container */}
      <div style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 10000,
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        pointerEvents: "none"
      }}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            style={{
              pointerEvents: "auto",
              background: "linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              borderRadius: "18px",
              padding: "16px 20px",
              width: "320px",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(239, 68, 68, 0.2)",
              display: "flex",
              alignItems: "flex-start",
              gap: "14px",
              animation: "toastSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
              position: "relative"
            }}
          >
            <style>{`
              @keyframes toastSlideIn {
                from { transform: translateX(50px) scale(0.9); opacity: 0; }
                to { transform: translateX(0) scale(1); opacity: 1; }
              }
            `}</style>
            <span style={{ fontSize: "22px" }}>🚨</span>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: "14px", color: "#f87171", fontWeight: "800", marginBottom: "4px" }}>
                {toast.title}
              </h4>
              <p style={{ margin: 0, fontSize: "12px", color: "#cbd5e1", lineHeight: "1.4" }}>
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              style={{
                background: "transparent",
                border: "none",
                color: "#64748b",
                fontSize: "12px",
                fontWeight: "bold",
                cursor: "pointer",
                padding: "2px"
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Dynamic Targeted Marketing Overlay */}
      {activeCampaign && (
        <MarketingPopup 
          campaign={activeCampaign} 
          onClose={() => setActiveCampaign(null)} 
        />
      )}

      {/* Budgets Sliding Drawer */}
      <BudgetsDrawer 
        isOpen={showBudgetsDrawer} 
        onClose={() => setShowBudgetsDrawer(false)}
        totalExpense={totalExpense}
        onBudgetUpdate={fetchData}
        allTransactions={allTransactions}
      />

      {/* Global AI Financial Advisor Floating Overlay */}
      <AIFloatingAdvisor />
    </div>
  );
};

export default Dashboard;