import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { coreService } from '../services/api_core';

const IncomePage = () => {
    const [incomes, setIncomes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    
    // Category Creation State
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    
    // Status/Feedback States
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [selectedFilterCategory, setSelectedFilterCategory] = useState('ALL');


    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [transRes, catRes] = await Promise.all([
                coreService.getTransactions(),
                coreService.getCategories()
            ]);
            
            const incomeList = transRes.data.filter(t => t.category_type === 'INCOME');
            const incomeCats = catRes.data.filter(c => c.type === 'INCOME');
            
            setIncomes(incomeList);
            setCategories(incomeCats);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching income page data:", err);
            setLoading(false);
        }
    };

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) return;
        setError('');
        try {
            const response = await coreService.createCategory({
                name: newCategoryName.trim(),
                type: 'INCOME'
            });
            setCategories([...categories, response.data]);
            setSelectedCategory(response.data.id);
            setNewCategoryName('');
            setIsCreatingCategory(false);
        } catch (err) {
            console.error("Error creating category:", err);
            setError(err.response?.data?.error || 'Failed to create category.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setSubmitting(true);

        if (!selectedCategory) {
            setError('Please select or create an income category.');
            setSubmitting(false);
            return;
        }

        try {
            let formattedDate = date;
            if (date && date.includes('/')) {
                const parts = date.split('/');
                if (parts.length === 3) {
                    if (parts[0].length <= 2 && parts[1].length <= 2 && parts[2].length === 4) {
                        formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                    } else if (parts[0].length === 4 && parts[1].length <= 2 && parts[2].length <= 2) {
                        formattedDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
                    }
                }
            }

            await coreService.createTransaction({
                amount: parseFloat(amount),
                date: formattedDate,
                description,
                category: parseInt(selectedCategory)
            });

            setSuccessMessage('Income recorded successfully!');
            setAmount('');
            setDescription('');
            setSelectedCategory('');
            
            setTimeout(() => {
                setIsModalOpen(false);
                setSuccessMessage('');
                fetchData();
            }, 1000);
        } catch (err) {
            console.error("Error saving transaction:", err);
            setError(err.response?.data?.error || 'Failed to save transaction.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this income entry?")) return;
        try {
            await coreService.deleteTransaction(id);
            setIncomes(incomes.filter(inc => inc.id !== id));
        } catch (err) {
            console.error("Error deleting transaction:", err);
            alert("Failed to delete the entry.");
        }
    };

    return (
        <div style={{
            position: 'relative',
            minHeight: '100vh',
            background: 'radial-gradient(circle at top right, #064e3b, #0f172a, #020617)',
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
                background: 'rgba(16, 185, 129, 0.12)',
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
                                My <span style={{ color: '#10b981' }}>Incomes</span> 💰
                            </h1>
                            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
                                Monitor and catalog your dynamic inflows securely
                            </p>
                        </div>
                    </div>

                    <button 
                        onClick={() => setIsModalOpen(true)}
                        style={{
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            border: 'none',
                            borderRadius: '14px',
                            padding: '14px 24px',
                            color: 'white',
                            fontSize: '15px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 6px 25px rgba(16, 185, 129, 0.45)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 20px rgba(16, 185, 129, 0.3)';
                        }}
                    >
                        <span>+</span> Add Income Entry
                    </button>
                </div>

                {/* Filters Row */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '24px',
                    background: 'rgba(15, 23, 42, 0.3)',
                    padding: '12px 20px',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    width: 'fit-content'
                }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Filter Category:</span>
                    <select
                        value={selectedFilterCategory}
                        onChange={(e) => setSelectedFilterCategory(e.target.value)}
                        style={{
                            background: '#0f172a',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '8px',
                            color: '#f8fafc',
                            padding: '6px 12px',
                            fontSize: '13px',
                            fontWeight: '600',
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="ALL">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                    </select>
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
                            <p style={{ fontWeight: '500' }}>Retrieving your wealth entries...</p>
                        </div>
                    ) : incomes.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                                        <th style={{ padding: '16px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Date</th>
                                        <th style={{ padding: '16px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Source Category</th>
                                        <th style={{ padding: '16px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Description</th>
                                        <th style={{ padding: '16px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', textAlign: 'right' }}>Amount</th>
                                        <th style={{ padding: '16px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', textAlign: 'center' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(selectedFilterCategory === 'ALL'
                                        ? incomes
                                        : incomes.filter(inc => inc.category_name === selectedFilterCategory)
                                    ).map((inc) => (
                                        <tr key={inc.id} style={{ 
                                            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                                            transition: 'background 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                                            <td style={{ padding: '16px', fontWeight: '600', color: '#e2e8f0' }}>{inc.date}</td>
                                            <td style={{ padding: '16px' }}>
                                                {inc.category_name === 'Borrowing' || inc.category_name === 'Loan' ? (
                                                    <span style={{
                                                        backgroundColor: 'rgba(239, 68, 68, 0.12)',
                                                        border: '1px solid rgba(239, 68, 68, 0.25)',
                                                        color: '#f87171',
                                                        padding: '6px 12px',
                                                        borderRadius: '20px',
                                                        fontSize: '12px',
                                                        fontWeight: '700'
                                                    }}>
                                                        {inc.category_name}
                                                    </span>
                                                ) : (
                                                    <span style={{
                                                        backgroundColor: 'rgba(16, 185, 129, 0.12)',
                                                        border: '1px solid rgba(16, 185, 129, 0.25)',
                                                        color: '#34d399',
                                                        padding: '6px 12px',
                                                        borderRadius: '20px',
                                                        fontSize: '12px',
                                                        fontWeight: '700'
                                                    }}>
                                                        {inc.category_name || "Income"}
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ padding: '16px', color: '#94a3b8', fontSize: '14px' }}>{inc.description || '—'}</td>
                                            <td style={{ padding: '16px', textAlign: 'right', fontWeight: '800', color: '#10b981', fontSize: '16px' }}>
                                                + ₹{parseFloat(inc.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'center' }}>
                                                <button 
                                                    onClick={() => handleDelete(inc.id)}
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
                            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🍃</div>
                            <p style={{ color: '#94a3b8', fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0' }}>No income records cataloged.</p>
                            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Click the "+ Add Income Entry" button to record your first asset flow.</p>
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
                            Add New <span style={{ color: '#10b981' }}>Income Flow</span>
                        </h3>
                        <p style={{ margin: '0 0 25px 0', color: '#94a3b8', fontSize: '13px', lineHeight: '1.5' }}>
                            Input your earned inflows. This updates your dynamic dashboard index instantly.
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

                            {/* Amount Input */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Amount (₹)</label>
                                <input 
                                    type="number" 
                                    required
                                    step="0.01"
                                    min="0.01"
                                    placeholder="50000.00"
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
                                    onFocus={(e) => e.target.style.border = '1px solid #10b981'}
                                    onBlur={(e) => e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'}
                                />
                            </div>

                            {/* Category Lookup/Creation */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Income Category</label>
                                    <button 
                                        type="button"
                                        onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#10b981',
                                            fontSize: '11px',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            padding: 0
                                        }}
                                    >
                                        {isCreatingCategory ? '✕ Cancel' : '+ Create Category'}
                                    </button>
                                </div>

                                {isCreatingCategory ? (
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                                        <input 
                                            type="text"
                                            placeholder="e.g. Freelance"
                                            value={newCategoryName}
                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                            style={{
                                                flex: 1,
                                                background: 'rgba(255, 255, 255, 0.03)',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                borderRadius: '12px',
                                                padding: '10px 14px',
                                                color: '#f8fafc',
                                                fontSize: '14px',
                                                outline: 'none',
                                            }}
                                            onFocus={(e) => e.target.style.border = '1px solid #10b981'}
                                            onBlur={(e) => e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleCreateCategory}
                                            style={{
                                                background: 'rgba(16, 185, 129, 0.15)',
                                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                                color: '#34d399',
                                                borderRadius: '12px',
                                                padding: '0 16px',
                                                fontSize: '13px',
                                                fontWeight: '700',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            Save
                                        </button>
                                    </div>
                                ) : (
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
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
                                        <option value="">-- Choose Category --</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Date Selector */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Date</label>
                                <input 
                                    type="date" 
                                    required
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '12px',
                                        padding: '12px 16px',
                                        color: '#f8fafc',
                                        fontSize: '14px',
                                        outline: 'none',
                                    }}
                                    onFocus={(e) => e.target.style.border = '1px solid #10b981'}
                                    onBlur={(e) => e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'}
                                />
                            </div>

                            {/* Description Input */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Description</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Monthly salary payout"
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
                                    }}
                                    onFocus={(e) => e.target.style.border = '1px solid #10b981'}
                                    onBlur={(e) => e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'}
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={submitting}
                                style={{
                                    background: 'linear-gradient(135deg, #10b981, #059669)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    padding: '14px',
                                    color: 'white',
                                    fontSize: '15px',
                                    fontWeight: '700',
                                    cursor: submitting ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease',
                                    marginTop: '10px',
                                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                                }}
                                onMouseEnter={(e) => {
                                    if (!submitting) {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.45)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!submitting) {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)';
                                    }
                                }}
                            >
                                {submitting ? 'Recording asset flow...' : 'Record Inflow'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IncomePage;