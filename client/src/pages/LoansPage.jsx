import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { coreService } from '../services/api_core';

const LoansPage = () => {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [name, setName] = useState('');
    const [loanType, setLoanType] = useState('PERSONAL');
    const [totalPrincipal, setTotalPrincipal] = useState('');
    const [interestRate, setInterestRate] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [tenureMonths, setTenureMonths] = useState('');
    const [emiAmount, setEmiAmount] = useState('');

    // Feedback States
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Fetch Loans
    useEffect(() => {
        fetchLoans();
    }, []);

    const fetchLoans = async () => {
        try {
            setLoading(true);
            const res = await coreService.getLoans();
            setLoans(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching loans:", err);
            setLoading(false);
        }
    };

    // Calculate real-time EMI
    const calculatedEmi = (() => {
        const P = parseFloat(totalPrincipal);
        const annualR = parseFloat(interestRate);
        const N = parseInt(tenureMonths);

        if (isNaN(P) || isNaN(annualR) || isNaN(N) || P <= 0 || annualR < 0 || N <= 0) {
            return 0;
        }

        const R = annualR / 12 / 100; // monthly interest rate
        if (R === 0) {
            return P / N;
        }

        const emi = (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1);
        return isNaN(emi) ? 0 : parseFloat(emi.toFixed(2));
    })();

    // Auto-update EMI field when math changes
    useEffect(() => {
        if (calculatedEmi > 0) {
            setEmiAmount(calculatedEmi.toString());
        } else {
            setEmiAmount('');
        }
    }, [calculatedEmi]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setSubmitting(true);

        if (!name.trim()) {
            setError('Please provide a loan name.');
            setSubmitting(false);
            return;
        }

        try {
            await coreService.createLoan({
                name: name.trim(),
                loan_type: loanType,
                total_principal: parseFloat(totalPrincipal),
                interest_rate: parseFloat(interestRate),
                start_date: startDate,
                tenure_months: parseInt(tenureMonths),
                emi_amount: parseFloat(emiAmount || calculatedEmi),
            });

            setSuccessMessage('Loan record created successfully!');
            setName('');
            setLoanType('PERSONAL');
            setTotalPrincipal('');
            setInterestRate('');
            setStartDate(new Date().toISOString().split('T')[0]);
            setTenureMonths('');
            setEmiAmount('');

            setTimeout(() => {
                setIsModalOpen(false);
                setSuccessMessage('');
                fetchLoans();
            }, 1000);
        } catch (err) {
            console.error("Error creating loan:", err);
            setError(err.response?.data?.error || 'Failed to save loan. Please check input values.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this loan record? This will also remove any linked EMIs.")) return;
        try {
            await coreService.deleteLoan(id);
            setLoans(loans.filter(loan => loan.id !== id));
        } catch (err) {
            console.error("Error deleting loan:", err);
            alert("Failed to delete the loan record.");
        }
    };

    return (
        <div style={{
            position: 'relative',
            minHeight: '100vh',
            background: 'radial-gradient(circle at top right, #311059, #0f172a, #020617)',
            fontFamily: "'Inter', sans-serif",
            color: '#f8fafc',
            padding: '40px 20px',
            boxSizing: 'border-box',
            overflowX: 'hidden'
        }}>
            {/* Glowing background auroras */}
            <div style={{
                position: 'absolute',
                width: '350px',
                height: '350px',
                borderRadius: '50%',
                background: 'rgba(139, 92, 246, 0.12)',
                filter: 'blur(100px)',
                top: '10%',
                right: '10%',
                pointerEvents: 'none'
            }} />
            <div style={{
                position: 'absolute',
                width: '300px',
                height: '300px',
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.08)',
                filter: 'blur(90px)',
                bottom: '15%',
                left: '10%',
                pointerEvents: 'none'
            }} />

            <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                
                {/* Header Section */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '40px',
                    flexWrap: 'wrap',
                    gap: '20px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <Link to="/" style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '44px',
                            height: '44px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '12px',
                            color: '#f8fafc',
                            fontSize: '20px',
                            textDecoration: 'none',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                            e.currentTarget.style.transform = 'translateX(-3px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                            e.currentTarget.style.transform = 'translateX(0)';
                        }}>
                            ⬅️
                        </Link>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '800', letterSpacing: '-0.5px' }}>
                                My <span style={{ color: '#8b5cf6' }}>Loans</span> 🏛️
                            </h1>
                            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
                                Manage your liabilities and monitor your amortization schedules
                            </p>
                        </div>
                    </div>

                    <button 
                        onClick={() => setIsModalOpen(true)}
                        style={{
                            background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                            border: 'none',
                            borderRadius: '14px',
                            padding: '14px 24px',
                            color: 'white',
                            fontSize: '15px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 6px 25px rgba(139, 92, 246, 0.45)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 20px rgba(139, 92, 246, 0.3)';
                        }}
                    >
                        <span>+</span> Add Loan Entry
                    </button>
                </div>

                {/* Main Data Container */}
                <div style={{
                    background: 'rgba(15, 23, 42, 0.45)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderRadius: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '30px',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
                    boxSizing: 'border-box'
                }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                            <div style={{ fontSize: '24px', marginBottom: '10px' }}>⚡</div>
                            <p style={{ fontWeight: '500' }}>Retrieving your loan details...</p>
                        </div>
                    ) : loans.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                                        <th style={{ padding: '16px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Loan Name</th>
                                        <th style={{ padding: '16px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Type</th>
                                        <th style={{ padding: '16px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Rate (%)</th>
                                        <th style={{ padding: '16px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Tenure</th>
                                        <th style={{ padding: '16px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Start Date</th>
                                        <th style={{ padding: '16px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>EMI Amount</th>
                                        <th style={{ padding: '16px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', textAlign: 'right' }}>Total Principal</th>
                                        <th style={{ padding: '16px', width: '80px', textAlign: 'center' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loans.map((loan) => (
                                        <tr key={loan.id} style={{ 
                                            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                                            transition: 'background 0.2s',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <td style={{ padding: '16px', fontWeight: '700', color: '#f8fafc' }}>
                                                {loan.name}
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                <span style={{ 
                                                    backgroundColor: 'rgba(139, 92, 246, 0.15)', 
                                                    color: '#a78bfa', 
                                                    padding: '4px 10px', 
                                                    borderRadius: '8px', 
                                                    fontSize: '12px', 
                                                    fontWeight: '700',
                                                    border: '1px solid rgba(139, 92, 246, 0.3)'
                                                }}>
                                                    {loan.loan_type}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px', color: '#e2e8f0', fontWeight: '500' }}>
                                                {loan.interest_rate}%
                                            </td>
                                            <td style={{ padding: '16px', color: '#cbd5e1' }}>
                                                {loan.tenure_months} months
                                            </td>
                                            <td style={{ padding: '16px', color: '#94a3b8', fontSize: '13px' }}>
                                                {loan.start_date}
                                            </td>
                                            <td style={{ padding: '16px', color: '#cbd5e1', fontWeight: '600' }}>
                                                ₹{parseFloat(loan.emi_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'right', fontWeight: '800', color: '#8b5cf6', fontSize: '15px' }}>
                                                ₹{parseFloat(loan.total_principal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'center' }}>
                                                <button 
                                                    onClick={() => handleDelete(loan.id)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: '#f87171',
                                                        cursor: 'pointer',
                                                        fontSize: '16px',
                                                        transition: 'all 0.2s',
                                                        opacity: 0.7
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.opacity = 1;
                                                        e.currentTarget.style.transform = 'scale(1.15)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.opacity = 0.7;
                                                        e.currentTarget.style.transform = 'scale(1)';
                                                    }}
                                                >
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '60px 40px' }}>
                            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🏛️</div>
                            <p style={{ color: '#94a3b8', fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0' }}>No active loans registered.</p>
                            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Click the "+ Add Loan Entry" button to record your bank debt details.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Premium Dynamic Modal overlay */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(2, 6, 17, 0.7)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px',
                    boxSizing: 'border-box'
                }}>
                    <div style={{
                        width: '100%',
                        maxWidth: '550px',
                        background: 'rgba(15, 23, 42, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '24px',
                        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)',
                        padding: '35px',
                        boxSizing: 'border-box',
                        position: 'relative',
                        maxHeight: '90vh',
                        overflowY: 'auto'
                    }}>
                        {/* Close button */}
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            style={{
                                position: 'absolute',
                                right: '20px',
                                top: '20px',
                                background: 'none',
                                border: 'none',
                                color: '#94a3b8',
                                cursor: 'pointer',
                                fontSize: '20px',
                                transition: 'color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#f8fafc'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                        >
                            ✕
                        </button>

                        <h3 style={{ margin: '0 0 10px 0', fontSize: '22px', fontWeight: '800' }}>
                            Add New <span style={{ color: '#8b5cf6' }}>Bank Loan</span> ✍️
                        </h3>
                        <p style={{ margin: '0 0 25px 0', color: '#94a3b8', fontSize: '13px', lineHeight: '1.5' }}>
                            Register your formal bank loans. This allows real-time liability planning and automated EMI calculations.
                        </p>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                            {/* Error Alert */}
                            {error && (
                                <div style={{
                                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                                    border: '1px solid rgba(239, 68, 68, 0.25)',
                                    color: '#f87171',
                                    borderRadius: '12px',
                                    padding: '12px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    textAlign: 'center'
                                }}>
                                    {error}
                                </div>
                            )}

                            {/* Success Alert */}
                            {successMessage && (
                                <div style={{
                                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                                    border: '1px solid rgba(16, 185, 129, 0.25)',
                                    color: '#34d399',
                                    borderRadius: '12px',
                                    padding: '12px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    textAlign: 'center'
                                }}>
                                    {successMessage}
                                </div>
                            )}

                            {/* Loan Name */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Loan Name</label>
                                <input 
                                    type="text" 
                                    required
                                    placeholder="e.g. HDFC Home Loan"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '12px',
                                        padding: '12px 16px',
                                        color: '#f8fafc',
                                        fontSize: '14px',
                                        outline: 'none',
                                    }}
                                    onFocus={(e) => e.target.style.border = '1px solid #8b5cf6'}
                                    onBlur={(e) => e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'}
                                />
                            </div>

                            {/* Loan Type Dropdown */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Loan Type</label>
                                <select
                                    value={loanType}
                                    onChange={(e) => setLoanType(e.target.value)}
                                    style={{
                                        background: '#0f172a',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '12px',
                                        padding: '12px 16px',
                                        color: '#f8fafc',
                                        fontSize: '14px',
                                        outline: 'none',
                                    }}
                                    onFocus={(e) => e.target.style.border = '1px solid #8b5cf6'}
                                    onBlur={(e) => e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'}
                                >
                                    <option value="HOME">Home Loan</option>
                                    <option value="CAR">Car Loan</option>
                                    <option value="PERSONAL">Personal Loan</option>
                                    <option value="EDUCATION">Education Loan</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: '15px' }}>
                                {/* Principal Amount */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                                    <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Principal (₹)</label>
                                    <input 
                                        type="number" 
                                        required
                                        min="1"
                                        placeholder="500000"
                                        value={totalPrincipal}
                                        onChange={(e) => setTotalPrincipal(e.target.value)}
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.03)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '12px',
                                            padding: '12px 16px',
                                            color: '#f8fafc',
                                            fontSize: '14px',
                                            outline: 'none',
                                        }}
                                        onFocus={(e) => e.target.style.border = '1px solid #8b5cf6'}
                                        onBlur={(e) => e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'}
                                    />
                                </div>

                                {/* Interest Rate */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                                    <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Annual Interest (%)</label>
                                    <input 
                                        type="number" 
                                        required
                                        step="0.01"
                                        min="0"
                                        placeholder="8.5"
                                        value={interestRate}
                                        onChange={(e) => setInterestRate(e.target.value)}
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.03)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '12px',
                                            padding: '12px 16px',
                                            color: '#f8fafc',
                                            fontSize: '14px',
                                            outline: 'none',
                                        }}
                                        onFocus={(e) => e.target.style.border = '1px solid #8b5cf6'}
                                        onBlur={(e) => e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '15px' }}>
                                {/* Tenure */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                                    <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Tenure (Months)</label>
                                    <input 
                                        type="number" 
                                        required
                                        min="1"
                                        placeholder="120"
                                        value={tenureMonths}
                                        onChange={(e) => setTenureMonths(e.target.value)}
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.03)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '12px',
                                            padding: '12px 16px',
                                            color: '#f8fafc',
                                            fontSize: '14px',
                                            outline: 'none',
                                        }}
                                        onFocus={(e) => e.target.style.border = '1px solid #8b5cf6'}
                                        onBlur={(e) => e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'}
                                    />
                                </div>

                                {/* Start Date */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                                    <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Start Date</label>
                                    <input 
                                        type="date" 
                                        required
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.03)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '12px',
                                            padding: '12px 16px',
                                            color: '#f8fafc',
                                            fontSize: '14px',
                                            outline: 'none',
                                        }}
                                        onFocus={(e) => e.target.style.border = '1px solid #8b5cf6'}
                                        onBlur={(e) => e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'}
                                    />
                                </div>
                            </div>

                            {/* Mathematical Real-time Estimation Banner */}
                            {calculatedEmi > 0 && (
                                <div style={{
                                    background: 'rgba(139, 92, 246, 0.08)',
                                    border: '1px solid rgba(139, 92, 246, 0.18)',
                                    borderRadius: '16px',
                                    padding: '16px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px',
                                    fontSize: '13px'
                                }}>
                                    <div style={{ color: '#a78bfa', fontWeight: '800', fontSize: '11px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                                        📐 Mathematical Real-time Guidelines
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
                                        <span>Estimated Monthly EMI:</span>
                                        <span style={{ fontWeight: '800', color: '#f8fafc' }}>
                                            ₹{calculatedEmi.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                                        <span>Total Interest Payable:</span>
                                        <span style={{ fontWeight: '700' }}>
                                            ₹{((calculatedEmi * parseInt(tenureMonths)) - parseFloat(totalPrincipal)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                                        <span>Total Amount Payable:</span>
                                        <span style={{ fontWeight: '700' }}>
                                            ₹{(calculatedEmi * parseInt(tenureMonths)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Manual or Overridden EMI Field */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Approved EMI (₹ / month)</label>
                                <input 
                                    type="number" 
                                    required
                                    step="0.01"
                                    min="0.01"
                                    placeholder="Calculated EMI pre-fills here"
                                    value={emiAmount}
                                    onChange={(e) => setEmiAmount(e.target.value)}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '12px',
                                        padding: '12px 16px',
                                        color: '#f8fafc',
                                        fontSize: '14px',
                                        outline: 'none',
                                    }}
                                    onFocus={(e) => e.target.style.border = '1px solid #8b5cf6'}
                                    onBlur={(e) => e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'}
                                />
                            </div>

                            {/* Submit Button */}
                            <button 
                                type="submit" 
                                disabled={submitting}
                                style={{
                                    background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    padding: '14px',
                                    color: 'white',
                                    fontSize: '15px',
                                    fontWeight: '700',
                                    cursor: submitting ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease',
                                    marginTop: '10px',
                                    boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)'
                                }}
                                onMouseEnter={(e) => {
                                    if (!submitting) {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.45)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!submitting) {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.3)';
                                    }
                                }}
                            >
                                {submitting ? 'Creating Entry...' : 'Save Loan Record'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoansPage;