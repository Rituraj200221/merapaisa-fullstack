import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { coreService } from '../services/api_core';
import api from '../services/api_core'; // For direct patch calls if needed

const EMIPage = () => {
    const [emis, setEmis] = useState([]);
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState('');
    const [amountDue, setAmountDue] = useState('');
    const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
    const [isPaid, setIsPaid] = useState(false);
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [remarks, setRemarks] = useState('');
    
    // Status/Feedback States
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [emiRes, loanRes] = await Promise.all([
                coreService.getEMIPayments(),
                coreService.getLoans()
            ]);
            setEmis(emiRes.data);
            setLoans(loanRes.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching EMI page data:", err);
            setLoading(false);
        }
    };

    // When a loan is selected, pre-fill its standard emi_amount
    const handleLoanChange = (loanId) => {
        setSelectedLoan(loanId);
        if (!loanId) {
            setAmountDue('');
            return;
        }
        const loanObj = loans.find(l => l.id === parseInt(loanId));
        if (loanObj) {
            setAmountDue(loanObj.emi_amount);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setSubmitting(true);

        if (!selectedLoan) {
            setError('Please select an active loan.');
            setSubmitting(false);
            return;
        }

        try {
            const payload = {
                loan: parseInt(selectedLoan),
                amount_due: parseFloat(amountDue),
                due_date: dueDate,
                is_paid: isPaid,
                remarks: remarks.trim()
            };
            if (isPaid) {
                payload.payment_date = paymentDate;
            }

            await coreService.createEMIPayment(payload);

            setSuccessMessage('EMI payment schedule recorded successfully!');
            setSelectedLoan('');
            setAmountDue('');
            setIsPaid(false);
            setRemarks('');
            
            setTimeout(() => {
                setIsModalOpen(false);
                setSuccessMessage('');
                fetchData();
            }, 1000);
        } catch (err) {
            console.error("Error saving EMI payment:", err);
            setError(err.response?.data?.error || 'Failed to save EMI schedule.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleQuickPay = async (item) => {
        try {
            const today = new Date().toISOString().split('T')[0];
            await api.patch(`/emi-payments/${item.id}/`, {
                is_paid: true,
                payment_date: today
            });
            // Update local state instantly
            setEmis(emis.map(e => e.id === item.id ? { ...e, is_paid: true, payment_date: today } : e));
        } catch (err) {
            console.error("Error updating EMI status:", err);
            alert("Failed to update EMI payment status.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this EMI record?")) return;
        try {
            await coreService.deleteEMIPayment(id);
            setEmis(emis.filter(e => e.id !== id));
        } catch (err) {
            console.error("Error deleting EMI payment:", err);
            alert("Failed to delete the entry.");
        }
    };

    return (
        <div style={{
            position: 'relative',
            minHeight: '100vh',
            background: 'radial-gradient(circle at top right, #451a03, #0f172a, #020617)',
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
                background: 'rgba(245, 158, 11, 0.08)',
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
                                My <span style={{ color: '#f59e0b' }}>EMIs</span> 📅
                            </h1>
                            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
                                Catalog and execute monthly schedules seamlessly
                            </p>
                        </div>
                    </div>

                    <button 
                        onClick={() => setIsModalOpen(true)}
                        style={{
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            border: 'none',
                            borderRadius: '14px',
                            padding: '14px 24px',
                            color: 'white',
                            fontSize: '15px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 20px rgba(245, 158, 11, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 6px 25px rgba(245, 158, 11, 0.45)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 20px rgba(245, 158, 11, 0.3)';
                        }}
                    >
                        <span>+</span> Record EMI Schedule
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
                            <p style={{ fontWeight: '500' }}>Retrieving your EMI calendar metrics...</p>
                        </div>
                    ) : emis.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                                        <th style={{ padding: '16px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Loan Name</th>
                                        <th style={{ padding: '16px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Due Date</th>
                                        <th style={{ padding: '16px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Status</th>
                                        <th style={{ padding: '16px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Payment Date / Remarks</th>
                                        <th style={{ padding: '16px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', textAlign: 'right' }}>Amount</th>
                                        <th style={{ padding: '16px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', textAlign: 'center' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {emis.map((item) => (
                                        <tr key={item.id} style={{ 
                                            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                                            transition: 'background 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                                            <td style={{ padding: '16px', fontWeight: '600', color: '#e2e8f0' }}>{item.loan_name}</td>
                                            <td style={{ padding: '16px', color: '#94a3b8', fontSize: '14px' }}>{item.due_date}</td>
                                            <td style={{ padding: '16px' }}>
                                                {item.is_paid ? (
                                                    <span style={{
                                                        backgroundColor: 'rgba(16, 185, 129, 0.12)',
                                                        border: '1px solid rgba(16, 185, 129, 0.25)',
                                                        color: '#34d399',
                                                        padding: '6px 12px',
                                                        borderRadius: '20px',
                                                        fontSize: '12px',
                                                        fontWeight: '700'
                                                    }}>
                                                        PAID
                                                    </span>
                                                ) : (
                                                    <span style={{
                                                        backgroundColor: 'rgba(245, 158, 11, 0.12)',
                                                        border: '1px solid rgba(245, 158, 11, 0.25)',
                                                        color: '#f59e0b',
                                                        padding: '6px 12px',
                                                        borderRadius: '20px',
                                                        fontSize: '12px',
                                                        fontWeight: '700'
                                                    }}>
                                                        PENDING
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ padding: '16px', color: '#94a3b8', fontSize: '14px' }}>
                                                {item.is_paid 
                                                    ? `Paid on ${item.payment_date || 'N/A'}` 
                                                    : (item.remarks || 'No remarks')
                                                }
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'right', fontWeight: '800', color: item.is_paid ? '#10b981' : '#f59e0b', fontSize: '16px' }}>
                                                ₹{parseFloat(item.amount_due).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'center', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                {!item.is_paid && (
                                                    <button 
                                                        onClick={() => handleQuickPay(item)}
                                                        style={{
                                                            background: 'rgba(16, 185, 129, 0.15)',
                                                            border: '1px solid rgba(16, 185, 129, 0.3)',
                                                            color: '#34d399',
                                                            cursor: 'pointer',
                                                            fontSize: '11px',
                                                            fontWeight: '700',
                                                            padding: '6px 12px',
                                                            borderRadius: '10px',
                                                            transition: 'all 0.2s ease',
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.25)';
                                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)';
                                                            e.currentTarget.style.transform = 'translateY(0)';
                                                        }}
                                                    >
                                                        Pay Now
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => handleDelete(item.id)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: '#f87171',
                                                        cursor: 'pointer',
                                                        fontSize: '16px',
                                                        padding: '4px 8px',
                                                        borderRadius: '8px',
                                                        transition: 'all 0.2s ease',
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                                                        e.currentTarget.style.transform = 'scale(1.1)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = 'none';
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
                            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📅</div>
                            <p style={{ color: '#94a3b8', fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0' }}>No active EMI tracking schedules.</p>
                            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Click the "+ Record EMI Schedule" button to map loan timelines dynamically.</p>
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
                        maxWidth: '500px',
                        background: 'rgba(15, 23, 42, 0.85)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '24px',
                        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)',
                        padding: '35px',
                        boxSizing: 'border-box',
                        position: 'relative'
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
                            Record <span style={{ color: '#f59e0b' }}>EMI Payment</span>
                        </h3>
                        <p style={{ margin: '0 0 25px 0', color: '#94a3b8', fontSize: '13px', lineHeight: '1.5' }}>
                            Select your corresponding active bank loan to record or schedule its dynamic EMI cost.
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

                            {/* Loan Selector */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Select Loan</label>
                                <select
                                    value={selectedLoan}
                                    onChange={(e) => handleLoanChange(e.target.value)}
                                    required
                                    style={{
                                        background: '#0f172a',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '12px',
                                        padding: '12px 16px',
                                        color: '#f8fafc',
                                        fontSize: '14px',
                                        outline: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="">-- Choose Active Loan --</option>
                                    {loans.map(loan => (
                                        <option key={loan.id} value={loan.id}>{loan.name} (EMI: ₹{loan.emi_amount})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Amount Due (Auto-prefilled) */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>EMI Amount Due (₹)</label>
                                <input 
                                    type="number" 
                                    required
                                    step="0.01"
                                    min="0.01"
                                    placeholder="0.00"
                                    value={amountDue}
                                    onChange={(e) => setAmountDue(e.target.value)}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '12px',
                                        padding: '12px 16px',
                                        color: '#f8fafc',
                                        fontSize: '14px',
                                        outline: 'none',
                                    }}
                                    onFocus={(e) => e.target.style.border = '1px solid #f59e0b'}
                                    onBlur={(e) => e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'}
                                />
                            </div>

                            {/* Due Date */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Due Date</label>
                                <input 
                                    type="date" 
                                    required
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '12px',
                                        padding: '12px 16px',
                                        color: '#f8fafc',
                                        fontSize: '14px',
                                        outline: 'none',
                                    }}
                                    onFocus={(e) => e.target.style.border = '1px solid #f59e0b'}
                                    onBlur={(e) => e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'}
                                />
                            </div>

                            {/* Paid Checklist Toggle */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0' }}>
                                <input 
                                    type="checkbox"
                                    id="isPaidCheckbox"
                                    checked={isPaid}
                                    onChange={(e) => setIsPaid(e.target.checked)}
                                    style={{
                                        width: '18px',
                                        height: '18px',
                                        cursor: 'pointer',
                                        accentColor: '#f59e0b'
                                    }}
                                />
                                <label htmlFor="isPaidCheckbox" style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                                    I have already paid this EMI
                                </label>
                            </div>

                            {/* Payment Date (renders conditionally if paid) */}
                            {isPaid && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', animation: 'fadeIn 0.3s ease' }}>
                                    <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Actual Payment Date</label>
                                    <input 
                                        type="date" 
                                        required
                                        value={paymentDate}
                                        onChange={(e) => setPaymentDate(e.target.value)}
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.03)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '12px',
                                            padding: '12px 16px',
                                            color: '#f8fafc',
                                            fontSize: '14px',
                                            outline: 'none',
                                        }}
                                        onFocus={(e) => e.target.style.border = '1px solid #f59e0b'}
                                        onBlur={(e) => e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'}
                                    />
                                </div>
                            )}

                            {/* Remarks Input */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Remarks</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Paid via HDFC AutoDebit"
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '12px',
                                        padding: '12px 16px',
                                        color: '#f8fafc',
                                        fontSize: '14px',
                                        outline: 'none',
                                    }}
                                    onFocus={(e) => e.target.style.border = '1px solid #f59e0b'}
                                    onBlur={(e) => e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'}
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={submitting}
                                style={{
                                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    padding: '14px',
                                    color: 'white',
                                    fontSize: '15px',
                                    fontWeight: '700',
                                    cursor: submitting ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease',
                                    marginTop: '10px',
                                    boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)'
                                }}
                                onMouseEnter={(e) => {
                                    if (!submitting) {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(245, 158, 11, 0.45)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!submitting) {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(245, 158, 11, 0.3)';
                                    }
                                }}
                            >
                                {submitting ? 'Recording scheduled payment...' : 'Record Payment'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EMIPage;