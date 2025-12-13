import { useEffect, useState } from 'react';
import { coreService } from './services/api_core';
import DashboardCard from './components/DashboardCard';
import rupeeCoin from './assets/rupee_coin.png';

const Dashboard = () => {
  // 1. STATE VARIABLES
  const [totalLoans, setTotalLoans] = useState(0);
  const [totalInvested, setTotalInvested] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [totalEMI, setTotalEMI] = useState(0);
  const [totalLending, setTotalLending] = useState(0);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
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
        console.log("Transactions Data:", transRes.data); // Debugging ke liye

        // INCOME CALCULATION LOGIC (Updated)
        const incomeSum = transRes.data
          .filter(t => {
            // Agar backend 'transaction_type' bhej raha hai (Income/Expense)
            if (t.transaction_type && t.transaction_type.toLowerCase() === 'income') return true;
            // Agar category name mein 'salary' ya 'income' word hai
            if (t.category_name && (t.category_name.toLowerCase().includes('salary') || t.category_name.toLowerCase().includes('income'))) return true;
            return false;
          })
          .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

        // EXPENSE CALCULATION LOGIC (Updated)
        // Jo Income nahi hai, wo Expense hai
        const expenseSum = transRes.data
          .filter(t => {
            // Check agar ye Income hai, to false return karo (exclude karo)
            if (t.transaction_type && t.transaction_type.toLowerCase() === 'income') return false;
            if (t.category_name && (t.category_name.toLowerCase().includes('salary') || t.category_name.toLowerCase().includes('income'))) return false;
            return true; // Baaki sab Expense
          })
          .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
          
        setTotalIncome(incomeSum);
        setTotalExpense(expenseSum);

        // --- D. Fetch Lendings (Debts) ---
        const debtRes = await coreService.getDebts();
        const lendingSum = debtRes.data.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
        setTotalLending(lendingSum);
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div style={{ 
      backgroundColor: "#f8f9fa", 
      height: "100vh",           
      width: "100vw",            
      padding: "20px 30px",      
      boxSizing: "border-box",   
      display: "flex",           
      flexDirection: "column",
      overflow: "hidden"         
    }}>
      
      {/* HEADER */}
      <div style={{ 
        flex: "0 0 auto",        
        marginBottom: "25px",    
        display: "flex", 
        alignItems: "center", 
        gap: "18px" 
      }}>
        <h1 style={{ 
            color: "#1e293b", 
            fontSize: "48px",   
            fontWeight: "900",  
            margin: 0, 
            letterSpacing: "-1.5px" 
        }}>
          MeraPaisa
        </h1>
        <img 
            src={rupeeCoin} 
            alt="Rupee Coin" 
            style={{ width: "54px", height: "54px", objectFit: "contain" }} 
        />
      </div>

      {/* THE GRID LAYOUT */}
      <div style={{ 
        flex: "1",               
        display: "grid", 
        gridTemplateColumns: "repeat(3, 1fr)", 
        gridTemplateRows: "repeat(2, minmax(0, 1fr))", 
        gap: "20px", 
        maxHeight: "600px" 
      }}>
        
        {/* ROW 1 */}
        <DashboardCard 
          title="My Incomes"
          value={loading ? "..." : `₹ ${totalIncome.toLocaleString()}`} 
          subtext="Total earnings"
          color="#10b981" 
          link="/incomes"
          icon="💰"
        />

        <DashboardCard 
          title="My Expenses"
          value={loading ? "..." : `₹ ${totalExpense.toLocaleString()}`} 
          subtext="Total spending"
          color="#ef4444" 
          link="/expenses"
          icon="📉"
        />

        <DashboardCard 
          title="My EMIs"
          value={loading ? "..." : `₹ ${totalEMI.toLocaleString()}`} 
          subtext="Monthly Commitment"
          color="#f59e0b" 
          link="/emis"
          icon="📅"
        />

        {/* ROW 2 */}
        <DashboardCard 
          title="My Loans"
          value={loading ? "..." : `₹ ${totalLoans.toLocaleString()}`}
          subtext="Total Outstanding Principal"
          color="#8b5cf6" 
          link="/loans"
          icon="🏦"
        />

        <DashboardCard 
          title="My Lendings"
          value={loading ? "..." : `₹ ${totalLending.toLocaleString()}`} 
          subtext="Recoverable from Friends"
          color="#14b8a6" 
          link="/lendings"
          icon="🤝"
        />

        <DashboardCard 
          title="My Investments"
          value={loading ? "..." : `₹ ${totalInvested.toLocaleString()}`}
          subtext="Stocks & Mutual Funds"
          color="#3b82f6" 
          link="/investments"
          icon="📈"
        />

      </div>
    </div>
  );
};

export default Dashboard;