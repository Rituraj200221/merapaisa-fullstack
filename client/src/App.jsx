import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./Dashboard";
import IncomePage from "./pages/IncomePage"; 
import ExpensesPage from "./pages/ExpensesPage";
import LoansPage from "./pages/LoansPage";
import EMIPage from "./pages/EMIPage";
import InvestmentsPage from "./pages/InvestmentsPage";
import LendingsPage from "./pages/LendingsPage";

// Auth & Security components
import PrivateRoute from "./components/PrivateRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Protected Financial & Portfolio Routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/incomes" element={<IncomePage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/loans" element={<LoansPage />} />
          <Route path="/emis" element={<EMIPage />} />
          <Route path="/investments" element={<InvestmentsPage />} />
          <Route path="/lendings" element={<LendingsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;