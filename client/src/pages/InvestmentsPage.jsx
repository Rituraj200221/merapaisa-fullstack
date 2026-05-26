import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { coreService } from '../services/api_core';
import { marketService } from '../services/api_market';

const InvestmentsPage = () => {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [name, setName] = useState('');
    const [symbol, setSymbol] = useState('');
    const [assetType, setAssetType] = useState('STOCK');
    const [quantity, setQuantity] = useState('');
    const [buyPriceAvg, setBuyPriceAvg] = useState('');

    // Feedback States
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Fetch Assets and Fetch Live Prices
    useEffect(() => {
        fetchAssetsAndPrices();
    }, []);

    const fetchAssetsAndPrices = async () => {
        try {
            setLoading(true);
            const res = await coreService.getAssets();
            const assetsList = res.data;

            // Perform parallel live market fetches for all assets
            const updatedAssets = await Promise.all(
                assetsList.map(async (asset) => {
                    let livePrice = null;
                    let sentimentData = null;
                    try {
                        if (asset.asset_type === 'STOCK') {
                            const priceRes = await marketService.getStockPrice(asset.symbol);
                            livePrice = parseFloat(priceRes.data.current_price);
                            try {
                                const sentimentRes = await marketService.getStockSentiment(asset.symbol);
                                sentimentData = sentimentRes.data;
                            } catch (sErr) {
                                console.error(`Error fetching sentiment for ${asset.symbol}:`, sErr);
                            }
                        } else if (asset.asset_type === 'MF') {
                            const navRes = await marketService.getMFNav(asset.symbol);
                            livePrice = parseFloat(navRes.data.nav);
                        }
                    } catch (err) {
                        console.error(`Error fetching live price for ${asset.symbol}:`, err);
                    }

                    return {
                        ...asset,
                        livePrice: livePrice !== null && !isNaN(livePrice) ? livePrice : parseFloat(asset.buy_price_avg),
                        sentiment: sentimentData
                    };
                })
            );

            setAssets(updatedAssets);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching assets and prices:", err);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setSubmitting(true);

        if (!name.trim() || !symbol.trim()) {
            setError('Please provide asset name and ticker symbol.');
            setSubmitting(false);
            return;
        }

        try {
            await coreService.createAsset({
                name: name.trim(),
                symbol: symbol.trim().toUpperCase(),
                asset_type: assetType,
                quantity: parseFloat(quantity),
                buy_price_avg: parseFloat(buyPriceAvg),
            });

            setSuccessMessage('Investment logged successfully!');
            setName('');
            setSymbol('');
            setAssetType('STOCK');
            setQuantity('');
            setBuyPriceAvg('');

            setTimeout(() => {
                setIsModalOpen(false);
                setSuccessMessage('');
                fetchAssetsAndPrices();
            }, 1000);
        } catch (err) {
            console.error("Error creating asset:", err);
            setError(err.response?.data?.error || 'Failed to save investment. Check ticker syntax.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to remove this investment from your portfolio?")) return;
        try {
            await coreService.deleteAsset(id);
            setAssets(assets.filter(a => a.id !== id));
        } catch (err) {
            console.error("Error deleting asset:", err);
            alert("Failed to delete the asset.");
        }
    };

    // Calculate aggregated metrics
    const portfolioMetrics = assets.reduce((acc, asset) => {
        const qty = parseFloat(asset.quantity || 0);
        const buyPrice = parseFloat(asset.buy_price_avg || 0);
        const livePrice = parseFloat(asset.livePrice || buyPrice);

        acc.totalInvested += qty * buyPrice;
        acc.totalCurrent += qty * livePrice;
        return acc;
    }, { totalInvested: 0, totalCurrent: 0 });

    const totalPnL = portfolioMetrics.totalCurrent - portfolioMetrics.totalInvested;
    const totalPnLPercent = portfolioMetrics.totalInvested > 0 
        ? (totalPnL / portfolioMetrics.totalInvested) * 100 
        : 0;

    return (
        <div style={{
            position: 'relative',
            minHeight: '100vh',
            background: 'radial-gradient(circle at top right, #1d4ed8, #0f172a, #020617)',
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
                background: 'rgba(59, 130, 246, 0.12)',
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

            <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                
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
                                My <span style={{ color: '#3b82f6' }}>Investments</span> 📈
                            </h1>
                            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
                                Track real-time prices for Stocks and Mutual Funds automatically
                            </p>
                        </div>
                    </div>

                    <button 
                        onClick={() => setIsModalOpen(true)}
                        style={{
                            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                            border: 'none',
                            borderRadius: '14px',
                            padding: '14px 24px',
                            color: 'white',
                            fontSize: '15px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 6px 25px rgba(59, 130, 246, 0.45)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 20px rgba(59, 130, 246, 0.3)';
                        }}
                    >
                        <span>+</span> Add Investment
                    </button>
                </div>

                {/* Portfolio Summary Widgets */}
                <div style={{
                    display: 'flex',
                    gap: '20px',
                    marginBottom: '30px',
                    flexWrap: 'wrap'
                }}>
                    {/* Total Invested */}
                    <div style={{
                        flex: 1,
                        minWidth: '240px',
                        background: 'rgba(15, 23, 42, 0.45)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '20px',
                        padding: '25px',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)'
                    }}>
                        <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
                            Total Invested 🏦
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: '800', color: '#cbd5e1' }}>
                            ₹{portfolioMetrics.totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div style={{ color: '#64748b', fontSize: '12px', marginTop: '6px' }}>
                            Cost basis of entire portfolio
                        </div>
                    </div>

                    {/* Current Value */}
                    <div style={{
                        flex: 1,
                        minWidth: '240px',
                        background: 'rgba(15, 23, 42, 0.45)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(59, 130, 246, 0.15)',
                        borderRadius: '20px',
                        padding: '25px',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)'
                    }}>
                        <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
                            Current Value 💼
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: '800', color: '#3b82f6' }}>
                            ₹{portfolioMetrics.totalCurrent.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div style={{ color: '#64748b', fontSize: '12px', marginTop: '6px' }}>
                            Valued at live market quotes
                        </div>
                    </div>

                    {/* Profit & Loss */}
                    <div style={{
                        flex: 1,
                        minWidth: '240px',
                        background: 'rgba(15, 23, 42, 0.45)',
                        backdropFilter: 'blur(20px)',
                        border: `1px solid ${totalPnL >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}`,
                        borderRadius: '20px',
                        padding: '25px',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)'
                    }}>
                        <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
                            Total Profit & Loss 📊
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: '800', color: totalPnL >= 0 ? '#10b981' : '#f87171' }}>
                            {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div style={{ color: totalPnL >= 0 ? '#34d399' : '#f87171', fontSize: '12px', marginTop: '6px', fontWeight: '600' }}>
                            {totalPnL >= 0 ? '▲' : '▼'} {totalPnLPercent.toFixed(2)}% net returns
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
                            <p style={{ fontWeight: '500' }}>Loading your portfolio and fetching live prices...</p>
                        </div>
                    ) : assets.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                                        <th style={{ padding: '16px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Symbol</th>
                                        <th style={{ padding: '16px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Asset Name</th>
                                        <th style={{ padding: '16px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Type</th>
                                        <th style={{ padding: '16px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', textAlign: 'right' }}>Qty</th>
                                        <th style={{ padding: '16px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', textAlign: 'right' }}>Avg Buy Price</th>
                                        <th style={{ padding: '16px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', textAlign: 'right' }}>Invested Value</th>
                                        <th style={{ padding: '16px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', textAlign: 'right' }}>Live Price</th>
                                        <th style={{ padding: '16px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', textAlign: 'right' }}>Current Value</th>
                                        <th style={{ padding: '16px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', textAlign: 'right' }}>Profit / Loss</th>
                                        <th style={{ padding: '16px', width: '60px', textAlign: 'center' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assets.map((asset) => {
                                        const qty = parseFloat(asset.quantity || 0);
                                        const buyPrice = parseFloat(asset.buy_price_avg || 0);
                                        const livePrice = parseFloat(asset.livePrice || buyPrice);

                                        const invested = qty * buyPrice;
                                        const current = qty * livePrice;
                                        const pnl = current - invested;
                                        const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0;
                                        const isProfit = pnl >= 0;

                                        // Badge colors mapping
                                        let typeBg = 'rgba(59, 130, 246, 0.15)';
                                        let typeColor = '#60a5fa';
                                        let typeBorder = 'rgba(59, 130, 246, 0.3)';
                                        if (asset.asset_type === 'MF') {
                                            typeBg = 'rgba(167, 139, 250, 0.15)';
                                            typeColor = '#c084fc';
                                            typeBorder = 'rgba(167, 139, 250, 0.3)';
                                        } else if (asset.asset_type === 'GOLD') {
                                            typeBg = 'rgba(234, 179, 8, 0.12)';
                                            typeColor = '#facc15';
                                            typeBorder = 'rgba(234, 179, 8, 0.25)';
                                        } else if (asset.asset_type === 'CRYPTO') {
                                            typeBg = 'rgba(236, 72, 153, 0.12)';
                                            typeColor = '#f472b6';
                                            typeBorder = 'rgba(236, 72, 153, 0.25)';
                                        }

                                        return (
                                            <tr key={asset.id} style={{ 
                                                borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                                                transition: 'background 0.2s',
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <td style={{ padding: '16px', fontWeight: '800', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span>{asset.symbol}</span>
                                                    {asset.sentiment && (
                                                        <div style={{ position: 'relative', display: 'inline-block' }} className="sentiment-badge-container">
                                                            <span style={{
                                                                backgroundColor: asset.sentiment.sentiment === 'BULLISH' ? 'rgba(16, 185, 129, 0.15)' : asset.sentiment.sentiment === 'BEARISH' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                                                color: asset.sentiment.sentiment === 'BULLISH' ? '#34d399' : asset.sentiment.sentiment === 'BEARISH' ? '#f87171' : '#fbbf24',
                                                                border: asset.sentiment.sentiment === 'BULLISH' ? '1px solid rgba(16, 185, 129, 0.3)' : asset.sentiment.sentiment === 'BEARISH' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                                                                boxShadow: asset.sentiment.sentiment === 'BULLISH' ? '0 0 10px rgba(16, 185, 129, 0.2)' : asset.sentiment.sentiment === 'BEARISH' ? '0 0 10px rgba(239, 68, 68, 0.2)' : '0 0 10px rgba(245, 158, 11, 0.2)',
                                                                padding: '2px 6px',
                                                                borderRadius: '6px',
                                                                fontSize: '9px',
                                                                fontWeight: '800',
                                                                cursor: 'help',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '3px'
                                                            }}>
                                                                {asset.sentiment.sentiment} {asset.sentiment.emoji}
                                                            </span>
                                                            <div style={{
                                                                visibility: 'hidden',
                                                                width: '240px',
                                                                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                                                backdropFilter: 'blur(15px)',
                                                                color: '#e2e8f0',
                                                                textAlign: 'left',
                                                                borderRadius: '8px',
                                                                padding: '10px 12px',
                                                                position: 'absolute',
                                                                zIndex: 999,
                                                                bottom: '125%',
                                                                left: '50%',
                                                                transform: 'translateX(-50%)',
                                                                opacity: 0,
                                                                transition: 'opacity 0.2s',
                                                                fontSize: '11px',
                                                                fontWeight: '500',
                                                                lineHeight: '1.4',
                                                                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)',
                                                                pointerEvents: 'none'
                                                            }} className="sentiment-tooltip">
                                                                <strong style={{ color: '#f8fafc', display: 'block', marginBottom: '4px' }}>📊 Technical Sentiment</strong>
                                                                <span style={{ display: 'block', marginBottom: '2px' }}>Price: ₹{asset.sentiment.current_price}</span>
                                                                <span style={{ display: 'block', marginBottom: '4px' }}>50-day SMA: ₹{asset.sentiment.sma_50} | 200-day SMA: ₹{asset.sentiment.sma_200}</span>
                                                                <p style={{ margin: 0, color: '#94a3b8', fontSize: '10.5px' }}>{asset.sentiment.summary}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ padding: '16px', color: '#cbd5e1', fontWeight: '500' }}>
                                                    {asset.name}
                                                </td>
                                                <td style={{ padding: '16px' }}>
                                                    <span style={{ 
                                                        backgroundColor: typeBg, 
                                                        color: typeColor, 
                                                        padding: '4px 10px', 
                                                        borderRadius: '8px', 
                                                        fontSize: '11px', 
                                                        fontWeight: '800',
                                                        border: typeBorder
                                                    }}>
                                                        {asset.asset_type}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '16px', textAlign: 'right', fontWeight: '700', color: '#cbd5e1' }}>
                                                    {qty.toLocaleString('en-IN', { maximumFractionDigits: 4 })}
                                                </td>
                                                <td style={{ padding: '16px', textAlign: 'right', color: '#cbd5e1' }}>
                                                    ₹{buyPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td style={{ padding: '16px', textAlign: 'right', fontWeight: '700', color: '#3b82f6' }}>
                                                    ₹{invested.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td style={{ padding: '16px', textAlign: 'right', fontWeight: '700', color: '#94a3b8' }}>
                                                    ₹{livePrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td style={{ padding: '16px', textAlign: 'right', fontWeight: '800', color: '#f8fafc' }}>
                                                    ₹{current.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td style={{ 
                                                    padding: '16px', 
                                                    textAlign: 'right', 
                                                    fontWeight: '800', 
                                                    color: isProfit ? '#10b981' : '#f87171',
                                                    fontSize: '14px'
                                                }}>
                                                    <div>{isProfit ? '+' : ''}₹{pnl.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                                    <div style={{ fontSize: '11px', fontWeight: '600' }}>({isProfit ? '+' : ''}{pnlPercent.toFixed(2)}%)</div>
                                                </td>
                                                <td style={{ padding: '16px', textAlign: 'center' }}>
                                                    <button 
                                                        onClick={() => handleDelete(asset.id)}
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
                            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📊</div>
                            <p style={{ color: '#94a3b8', fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0' }}>Portfolio is empty.</p>
                            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Click the "+ Add Investment" button to record your first asset purchase.</p>
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
                            Add New <span style={{ color: '#3b82f6' }}>Portfolio Asset</span> ✍️
                        </h3>
                        <p style={{ margin: '0 0 25px 0', color: '#94a3b8', fontSize: '13px', lineHeight: '1.5' }}>
                            Log your stocks, mutual funds, gold, or cryptos. MeraPaisa will track live market prices for you automatically.
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

                            {/* Asset Name */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Asset Name</label>
                                <input 
                                    type="text" 
                                    required
                                    placeholder="e.g. Tata Motors"
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
                                    onFocus={(e) => e.target.style.border = '1px solid #3b82f6'}
                                    onBlur={(e) => e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '15px' }}>
                                {/* Asset Type */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                                    <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Asset Type</label>
                                    <select
                                        value={assetType}
                                        onChange={(e) => setAssetType(e.target.value)}
                                        style={{
                                            background: '#0f172a',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '12px',
                                            padding: '12px 16px',
                                            color: '#f8fafc',
                                            fontSize: '14px',
                                            outline: 'none',
                                        }}
                                        onFocus={(e) => e.target.style.border = '1px solid #3b82f6'}
                                        onBlur={(e) => e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'}
                                    >
                                        <option value="STOCK">Stock / Share</option>
                                        <option value="MF">Mutual Fund</option>
                                        <option value="GOLD">Digital Gold / SGB</option>
                                        <option value="CRYPTO">Cryptocurrency</option>
                                    </select>
                                </div>

                                {/* Symbol */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                                    <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Ticker / Code</label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="e.g. TATAMOTORS.NS"
                                        value={symbol}
                                        onChange={(e) => setSymbol(e.target.value)}
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.03)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '12px',
                                            padding: '12px 16px',
                                            color: '#f8fafc',
                                            fontSize: '14px',
                                            outline: 'none',
                                        }}
                                        onFocus={(e) => e.target.style.border = '1px solid #3b82f6'}
                                        onBlur={(e) => e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '15px' }}>
                                {/* Quantity */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                                    <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Quantity</label>
                                    <input 
                                        type="number" 
                                        required
                                        step="0.0001"
                                        min="0.0001"
                                        placeholder="10"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.03)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '12px',
                                            padding: '12px 16px',
                                            color: '#f8fafc',
                                            fontSize: '14px',
                                            outline: 'none',
                                        }}
                                        onFocus={(e) => e.target.style.border = '1px solid #3b82f6'}
                                        onBlur={(e) => e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'}
                                    />
                                </div>

                                {/* Buy Price Average */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                                    <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Avg Buy Price (₹)</label>
                                    <input 
                                        type="number" 
                                        required
                                        step="0.01"
                                        min="0.01"
                                        placeholder="640.50"
                                        value={buyPriceAvg}
                                        onChange={(e) => setBuyPriceAvg(e.target.value)}
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.03)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '12px',
                                            padding: '12px 16px',
                                            color: '#f8fafc',
                                            fontSize: '14px',
                                            outline: 'none',
                                        }}
                                        onFocus={(e) => e.target.style.border = '1px solid #3b82f6'}
                                        onBlur={(e) => e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'}
                                    />
                                </div>
                            </div>

                            <div style={{ color: '#94a3b8', fontSize: '11px', fontStyle: 'italic', lineHeight: '1.4' }}>
                                💡 Tip: For Indian equities, append `.NS` for NSE or `.BO` for BSE (e.g. `INFY.NS`). For Mutual Funds, use the 6-digit AMFI fund code (e.g. `118989`).
                            </div>

                            {/* Submit Button */}
                            <button 
                                type="submit" 
                                disabled={submitting}
                                style={{
                                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    padding: '14px',
                                    color: 'white',
                                    fontSize: '15px',
                                    fontWeight: '700',
                                    cursor: submitting ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease',
                                    marginTop: '10px',
                                    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
                                }}
                                onMouseEnter={(e) => {
                                    if (!submitting) {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.45)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!submitting) {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
                                    }
                                }}
                            >
                                {submitting ? 'Creating Entry...' : 'Save Investment'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* Tooltip Hover styles */}
            <style dangerouslySetInnerHTML={{ __html: `
                .sentiment-badge-container:hover .sentiment-tooltip {
                    visibility: visible !important;
                    opacity: 1 !important;
                }
            `}} />
        </div>
    );
};

export default InvestmentsPage;