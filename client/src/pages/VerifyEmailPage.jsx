import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { coreService } from '../services/api_core';

const VerifyEmailPage = () => {
    const [searchParams] = useSearchParams();
    const urlEmail = searchParams.get('email') || '';
    const [email, setEmail] = useState(urlEmail);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    
    // Ref array for input elements to handle auto-focus
    const inputRefs = [
        useRef(null),
        useRef(null),
        useRef(null),
        useRef(null),
        useRef(null),
        useRef(null)
    ];

    useEffect(() => {
        // If email came in URL, prefill it
        if (urlEmail) {
            setEmail(urlEmail);
        }
    }, [urlEmail]);

    const handleOtpChange = (index, value) => {
        // Allow only numbers
        if (value && isNaN(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1); // take only last char
        setOtp(newOtp);

        // Move to next input box if filled
        if (value && index < 5) {
            inputRefs[index + 1].current.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        // Move to previous input box on backspace if empty
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs[index - 1].current.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').trim();
        if (pastedData.length === 6 && !isNaN(pastedData)) {
            const newOtp = pastedData.split('');
            setOtp(newOtp);
            inputRefs[5].current.focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        const codeStr = otp.join('');
        if (codeStr.length < 6) {
            setError('Please enter all 6 digits.');
            setLoading(false);
            return;
        }

        try {
            const response = await coreService.verifyEmail({
                email,
                code: codeStr
            });
            setMessage(response.data.message || 'Email verified successfully!');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            console.error('Verification error:', err);
            setError(err.response?.data?.error || 'Invalid verification code. Please check console/terminal logs.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: 'radial-gradient(circle at top right, #1e1b4b, #0f172a, #020617)',
            fontFamily: "'Inter', sans-serif",
            color: '#f8fafc',
            padding: '20px',
            boxSizing: 'border-box'
        }}>
            {/* Glowing background auroras */}
            <div style={{
                position: 'absolute',
                width: '300px',
                height: '300px',
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.12)',
                filter: 'blur(90px)',
                top: '20%',
                left: '20%',
                pointerEvents: 'none'
            }} />
            <div style={{
                position: 'absolute',
                width: '320px',
                height: '320px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                filter: 'blur(110px)',
                bottom: '20%',
                right: '20%',
                pointerEvents: 'none'
            }} />

            {/* Glassmorphic Container */}
            <div style={{
                width: '100%',
                maxWidth: '460px',
                background: 'rgba(15, 23, 42, 0.45)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '40px 35px',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
                boxSizing: 'border-box',
                position: 'relative',
                zIndex: 1,
                textAlign: 'center'
            }}>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    fontSize: '32px',
                    marginBottom: '20px',
                    boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)'
                }}>
                    ✉️
                </div>

                <h2 style={{ margin: '0 0 10px 0', fontSize: '26px', fontWeight: '800', letterSpacing: '-0.5px' }}>
                    Verify Your <span style={{ color: '#10b981' }}>Email</span>
                </h2>
                <p style={{ margin: '0 0 30px 0', color: '#94a3b8', fontSize: '14px', lineHeight: '1.6' }}>
                    {urlEmail 
                        ? `We sent a 6-digit OTP code to ${urlEmail}. Please check Django terminal log or your email.`
                        : 'Please enter your registered email address and the 6-digit verification code.'
                    }
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Error Alerts */}
                    {error && (
                        <div style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#f87171',
                            borderRadius: '12px',
                            padding: '12px 16px',
                            fontSize: '13px',
                            fontWeight: '600'
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Success Alerts */}
                    {message && (
                        <div style={{
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            color: '#34d399',
                            borderRadius: '12px',
                            padding: '12px 16px',
                            fontSize: '13px',
                            fontWeight: '600'
                        }}>
                            {message}
                        </div>
                    )}

                    {/* Email Prefill / Input Field */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                        <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                            Email Address
                        </label>
                        <input
                            type="email"
                            required
                            placeholder="Enter your registered email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={!!urlEmail}
                            style={{
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px',
                                padding: '14px 16px',
                                color: urlEmail ? '#64748b' : '#f8fafc',
                                fontSize: '14px',
                                outline: 'none',
                                transition: 'all 0.3s ease',
                                cursor: urlEmail ? 'not-allowed' : 'text'
                            }}
                            onFocus={(e) => {
                                if(!urlEmail) {
                                    e.target.style.border = '1px solid #10b981';
                                    e.target.style.boxShadow = '0 0 8px rgba(16, 185, 129, 0.2)';
                                }
                            }}
                            onBlur={(e) => {
                                if(!urlEmail) {
                                    e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                                    e.target.style.boxShadow = 'none';
                                }
                            }}
                        />
                    </div>

                    {/* 6-Digit Glowing OTP Blocks */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                        <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                            Verification Code
                        </label>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }} onPaste={handlePaste}>
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={inputRefs[index]}
                                    type="text"
                                    maxLength="1"
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    style={{
                                        width: '48px',
                                        height: '56px',
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        border: '2px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '12px',
                                        color: '#f8fafc',
                                        fontSize: '22px',
                                        fontWeight: '800',
                                        textAlign: 'center',
                                        outline: 'none',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        boxShadow: digit ? '0 0 15px rgba(16, 185, 129, 0.25)' : 'none',
                                        borderColor: digit ? '#10b981' : 'rgba(255, 255, 255, 0.1)'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#10b981';
                                        e.target.style.boxShadow = '0 0 12px rgba(16, 185, 129, 0.35)';
                                        e.target.style.background = 'rgba(255, 255, 255, 0.06)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = digit ? '#10b981' : 'rgba(255, 255, 255, 0.1)';
                                        e.target.style.boxShadow = digit ? '0 0 15px rgba(16, 185, 129, 0.25)' : 'none';
                                        e.target.style.background = 'rgba(255, 255, 255, 0.03)';
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Verify Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '14px',
                            color: 'white',
                            fontSize: '15px',
                            fontWeight: '700',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s ease',
                            marginTop: '10px',
                            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.45)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!loading) {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)';
                            }
                        }}
                    >
                        {loading ? 'Verifying OTP...' : 'Verify & Activate'}
                    </button>
                </form>

                <div style={{
                    marginTop: '30px',
                    textAlign: 'center',
                    fontSize: '14px',
                    color: '#94a3b8',
                    fontWeight: '500'
                }}>
                    Back to{' '}
                    <Link to="/login" style={{ color: '#6366f1', fontWeight: '700', textDecoration: 'none' }}>
                        Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmailPage;
