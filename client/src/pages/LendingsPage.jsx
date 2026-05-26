import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { coreService } from '../services/api_core';

const LendingsPage = () => {
    const [lendings, setLendings] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [personName, setPersonName] = useState('');
    const [debtType, setDebtType] = useState('GIVEN'); // GIVEN or TAKEN
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState('');
    const [statusVal, setStatusVal] = useState('PENDING'); // PENDING, PARTIAL, SETTLED

    // Feedback States
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Fetch records
    useEffect(() => {
        fetchLendings();
    }, []);

    const fetchLendings = async () => {
        try {
            setLoading(true);
            const res = await coreService.getDebts();
            setLendings(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching lendings:", err);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setSubmitting(true);

        if (!personName.trim()) {
            setError('Please provide a person name.');
            setSubmitting(false);
            return;
        }

        try {
            await coreService.createDebt({
                person_name: personName.trim(),
                debt_type: debtType,
                amount: parseFloat(amount),
                description: description.trim(),
                transaction_date: transactionDate,
                due_date: dueDate || null,
                status: statusVal
            });

            setSuccessMessage('Debt record created successfully!');
            setPersonName('');
            setDebtType('GIVEN');
            setAmount('');
            setDescription('');
            setTransactionDate(new Date().toISOString().split('T')[0]);
            setDueDate('');
            setStatusVal('PENDING');

            setTimeout(() => {
                setIsModalOpen(false);
                setSuccessMessage('');
                fetchLendings();
            }, 1000);
        } catch (err) {
            console.error("Error creating debt:", err);
            setError(err.response?.data?.error || 'Failed to save record. Please check inputs.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this lending/borrowing record?")) return;
        try {
            await coreService.deleteDebt(id);
            setLendings(lendings.filter(item => item.id !== id));
        } catch (err) {
            console.error("Error deleting debt record:", err);
            alert("Failed to delete record.");
        }
    };

    // Calculate aggregated metrics
    const totals = lendings.reduce((acc, item) => {
        const amt = parseFloat(item.amount) || 0;
        if (item.debt_type === 'GIVEN') {
            acc.lent += amt;
        } else {
            acc.borrowed += amt;
        }
        return acc;
    }, { lent: 0, borrowed: 0 });

    return (
        <div style={{
            position: 'relative',
            minHeight: '100vh',
            background: 'radial-gradient(circle at top right, #042f2e, #0f172a, #020617)',
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
                background: 'rgba(20, 184, 166, 0.12)',
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
                                My <span style={{ color: '#14b8a6' }}>Lendings</span> 🤝
                            </h1>
                            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
                                The 'Khata Book' — track informal borrowing and lending securely
                            </p>
                        </div>
                    </div>

                    <button 
                        onClick={() => setIsModalOpen(true)}
                        style={{
                            background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
                            border: 'none',
                            borderRadius: '14px',
                            padding: '14px 24px',
                            color: 'white',
                            fontSize: '15px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 20px rgba(20, 184, 166, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 6px 25px rgba(20, 184, 166, 0.45)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 20px rgba(20, 184, 166, 0.3)';
                        }}
                    >
                        <span>+</span> Record Debt
                    </button>
                </div>

                {/* Aggregated Overview Cards */}
                <div style={{
                    display: 'flex',
                    gap: '20px',
                    marginBottom: '30px',
                    flexWrap: 'wrap'
                }}>
                    {/* You Lent Card */}
                    <div style={{
                        flex: 1,
                        minWidth: '240px',
                        background: 'rgba(15, 23, 42, 0.45)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(20, 184, 166, 0.15)',
                        borderRadius: '20px',
                        padding: '25px',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)'
                    }}>
                        <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
                            Total Money Lent 📈
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: '800', color: '#14b8a6' }}>
                            ₹{totals.lent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <div style={{ color: '#64748b', fontSize: '12px', marginTop: '6px' }}>
                            Owed back to you by others
                        </div>
                    </div>

                    {/* You Borrowed Card */}
                    <div style={{
                        flex: 1,
                        minWidth: '240px',
                        background: 'rgba(15, 23, 42, 0.45)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(239, 68, 68, 0.15)',
                        borderRadius: '20px',
                        padding: '25px',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)'
                    }}>
                        <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
                            Total Money Borrowed 📉
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: '800', color: '#f87171' }}>
                            ₹{totals.borrowed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <div style={{ color: '#64748b', fontSize: '12px', marginTop: '6px' }}>
                            To be paid back by you to others
                        </div>
                    </div>
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
                            <p style={{ fontWeight: '500' }}>Retrieving your debt records...</p>
                        </div>
                    ) : lendings.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                                        <th style={{ padding: '16px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Person Name</th>
                                        <th style={{ padding: '16px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Relationship</th>
                                        <th style={{ padding: '16px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Status</th>
                                        <th style={{ padding: '16px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Transaction Date</th>
                                        <th style={{ padding: '16px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Due Date</th>
                                        <th style={{ padding: '16px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Description</th>
                                        <th style={{ padding: '16px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', textAlign: 'right' }}>Amount</th>
                                        <th style={{ padding: '16px', width: '80px', textAlign: 'center' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lendings.map((item) => {
                                        const isLent = item.debt_type === 'GIVEN';
                                        
                                        // Status styles mapping
                                        let statusColor = '#34d399';
                                        let statusBg = 'rgba(16, 185, 129, 0.12)';
                                        let statusBorder = 'rgba(16, 185, 129, 0.25)';
                                        if (item.status === 'PENDING') {
                                            statusColor = '#facc15';
                                            statusBg = 'rgba(250, 204, 21, 0.12)';
                                            statusBorder = 'rgba(250, 204, 21, 0.25)';
                                        } else if (item.status === 'PARTIAL') {
                                            statusColor = '#fb923c';
                                            statusBg = 'rgba(251, 146, 60, 0.12)';
                                            statusBorder = 'rgba(251, 146, 60, 0.25)';
                                        }

                                        return (
                                            <tr key={item.id} style={{ 
                                                borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                                                transition: 'background 0.2s',
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <td style={{ padding: '16px', fontWeight: '700', color: '#f8fafc' }}>
                                                    {item.person_name}
                                                </td>
                                                <td style={{ padding: '16px' }}>
                                                    <span style={{ 
                                                        backgroundColor: isLent ? 'rgba(20, 184, 166, 0.12)' : 'rgba(239, 68, 68, 0.12)', 
                                                        color: isLent ? '#2dd4bf' : '#f87171', 
                                                        padding: '4px 10px', 
                                                        borderRadius: '8px', 
                                                        fontSize: '11px', 
                                                        fontWeight: '800',
                                                        border: isLent ? '1px solid rgba(20, 184, 166, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)'
                                                    }}>
                                                        {isLent ? 'LENT (ASSET)' : 'BORROWED (LIAB)'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '16px' }}>
                                                    <span style={{ 
                                                        backgroundColor: statusBg, 
                                                        color: statusColor, 
                                                        padding: '4px 10px', 
                                                        borderRadius: '8px', 
                                                        fontSize: '11px', 
                                                        fontWeight: '800',
                                                        border: `1px solid ${statusBorder}`
                                                    }}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '16px', color: '#cbd5e1', fontSize: '13px' }}>
                                                    {item.transaction_date}
                                                </td>
                                                <td style={{ padding: '16px', color: '#cbd5e1', fontSize: '13px' }}>
                                                    {item.due_date || <span style={{ color: '#475569' }}>-</span>}
                                                </td>
                                                <td style={{ padding: '16px', color: '#94a3b8', fontSize: '13px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.description}>
                                                    {item.description || <span style={{ color: '#475569', fontStyle: 'italic' }}>No notes</span>}
                                                </td>
                                                <td style={{ 
                                                    padding: '16px', 
                                                    textAlign: 'right', 
                                                    fontWeight: '800', 
                                                    color: isLent ? '#14b8a6' : '#ef4444', 
                                                    fontSize: '15px' 
                                                }}>
                                                    {isLent ? '+' : '-'} ₹{parseFloat(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td style={{ padding: '16px', textAlign: 'center' }}>
                                                    <button 
                                                        onClick={() => handleDelete(item.id)}
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
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '60px 40px' }}>
                            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🤝</div>
                            <p style={{ color: '#94a3b8', fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0' }}>No informal debts registered.</p>
                            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Click the "+ Record Debt" button to log money given or taken.</p>
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
                            Record <span style={{ color: '#14b8a6' }}>Lending or Borrowing</span> ✍️
                        </h3>
                        <p style={{ margin: '0 0 25px 0', color: '#94a3b8', fontSize: '13px', lineHeight: '1.5' }}>
                            Log informal financial promises, friendly lended cash, or family loans into your cloud ledger.
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

                            {/* Person Name */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Person Name</label>
                                <input 
                                    type="text" 
                                    required
                                    placeholder="e.g. Ramesh Kumar"
                                    value={personName}
                                    onChange={(e) => setPersonName(e.target.value)}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '12px',
                                        padding: '12px 16px',
                                        color: '#f8fafc',
                                        fontSize: '14px',
                                        outline: 'none',
                                    }}
                                    onFocus={(e) => e.target.style.border = '1px solid #14b8a6'}
                                    onBlur={(e) => e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '15px' }}>
                                {/* Debt Type (Lent vs Borrowed) */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                                    <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Transaction Type</label>
                                    <select
                                        value={debtType}
                                        onChange={(e) => setDebtType(e.target.value)}
                                        style={{
                                            background: '#0f172a',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '12px',
                                            padding: '12px 16px',
                                            color: '#f8fafc',
                                            fontSize: '14px',
                                            outline: 'none',
                                        }}
                                        onFocus={(e) => e.target.style.border = '1px solid #14b8a6'}
                                        onBlur={(e) => e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'}
                                    >
                                        <option value="GIVEN">Lent (I gave money)</option>
                                        <option value="TAKEN">Borrowed (I took money)</option>
                                    </select>
                                </div>

                                {/* Amount */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                                    <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Amount (₹)</label>
                                    <input 
                                        type="number" 
                                        required
                                        step="0.01"
                                        min="0.01"
                                        placeholder="5000.00"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.03)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '12px',
                                            padding: '12px 16px',
                                            color: '#f8fafc',
                                            fontSize: '14px',
                                            outline: 'none',
                                        }}
                                        onFocus={(e) => e.target.style.border = '1px solid #14b8a6'}
                                        onBlur={(e) => e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '15px' }}>
                                {/* Transaction Date */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                                    <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Date Record</label>
                                    <input 
                                        type="date" 
                                        required
                                        value={transactionDate}
                                        onChange={(e) => setTransactionDate(e.target.value)}
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.03)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '12px',
                                            padding: '12px 16px',
                                            color: '#f8fafc',
                                            fontSize: '14px',
                                            outline: 'none',
                                        }}
                                        onFocus={(e) => e.target.style.border = '1px solid #14b8a6'}
                                        onBlur={(e) => e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'}
                                    />
                                </div>

                                {/* Due Date */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                                    <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Expected Back (Due Date)</label>
                                    <input 
                                        type="date" 
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
                                        onFocus={(e) => e.target.style.border = '1px solid #14b8a6'}
                                        onBlur={(e) => e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'}
                                    />
                                </div>
                            </div>

                            {/* Status */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Debt Status</label>
                                <select
                                    value={statusVal}
                                    onChange={(e) => setStatusVal(e.target.value)}
                                    style={{
                                        background: '#0f172a',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '12px',
                                        padding: '12px 16px',
                                        color: '#f8fafc',
                                        fontSize: '14px',
                                        outline: 'none',
                                    }}
                                    onFocus={(e) => e.target.style.border = '1px solid #14b8a6'}
                                    onBlur={(e) => e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'}
                                >
                                    <option value="PENDING">Pending (Not paid back)</option>
                                    <option value="PARTIAL">Partially Settled</option>
                                    <option value="SETTLED">Settled / Paid in Full</option>
                                </select>
                            </div>

                            {/* Description Notes */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Notes / Reason</label>
                                <textarea 
                                    rows="3"
                                    placeholder="e.g. Lent for emergency bike repair bills"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '12px',
                                        padding: '12px 16px',
                                        color: '#f8fafc',
                                        fontSize: '14px',
                                        outline: 'none',
                                        resize: 'none',
                                        fontFamily: 'inherit'
                                    }}
                                    onFocus={(e) => e.target.style.border = '1px solid #14b8a6'}
                                    onBlur={(e) => e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'}
                                />
                            </div>

                            {/* Submit Button */}
                            <button 
                                type="submit" 
                                disabled={submitting}
                                style={{
                                    background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    padding: '14px',
                                    color: 'white',
                                    fontSize: '15px',
                                    fontWeight: '700',
                                    cursor: submitting ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease',
                                    marginTop: '10px',
                                    boxShadow: '0 4px 15px rgba(20, 184, 166, 0.3)'
                                }}
                                onMouseEnter={(e) => {
                                    if (!submitting) {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(20, 184, 166, 0.45)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!submitting) {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(20, 184, 166, 0.3)';
                                    }
                                }}
                            >
                                {submitting ? 'Creating Entry...' : 'Save Debt Record'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LendingsPage;