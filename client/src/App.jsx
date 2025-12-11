import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./Dashboard";
import IncomePage from "./pages/IncomePage"; 
import ExpensesPage from "./pages/ExpensesPage";
import LoansPage from "./pages/LoansPage";
import EMIPage from "./pages/EMIPage";
import InvestmentsPage from "./pages/InvestmentsPage";
import LendingsPage from "./pages/LendingsPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/incomes" element={<IncomePage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/loans" element={<LoansPage />} />
        <Route path="/emis" element={<EMIPage />} />
        <Route path="/investments" element={<InvestmentsPage />} />
        <Route path="/lendings" element={<LendingsPage />} />

      </Routes>
    </Router>
  );
}

export default App;