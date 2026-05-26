import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { coreService } from '../services/api_core';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // DRF Token Obtain Pair requires username and password. 
            // In case we want to support email-based login, let's map email to username if that's what user registered with, 
            // or pass username directly. Since our Register view registers with both email and username,
            // we will pass the username to login. Let's make the form let users login with Username.
            const response = await coreService.login({
                username: username,
                password: password
            });

            // Save tokens and user info
            localStorage.setItem('accessToken', response.data.access);
            localStorage.setItem('refreshToken', response.data.refresh);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            navigate('/', { replace: true });
        } catch (err) {
            console.error('Login error:', err);
            const errDetail = err.response?.data?.detail || err.response?.data?.error || 'Invalid credentials';
            
            if (errDetail === 'EMAIL_NOT_VERIFIED') {
                // Find or infer the registered email to redirect for OTP verification
                // Since they logged in with username, let's pass a query param or redirect.
                // We'll also store the username to help with OTP verification if needed.
                setError('Email is not verified. Redirecting to verification...');
                setTimeout(() => {
                    navigate(`/verify-email?username=${encodeURIComponent(username)}`);
                }, 1500);
            } else {
                setError(errDetail);
            }
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
                background: 'rgba(99, 102, 241, 0.15)',
                filter: 'blur(80px)',
                top: '20%',
                left: '25%',
                pointerEvents: 'none'
            }} />
            <div style={{
                position: 'absolute',
                width: '350px',
                height: '350px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.12)',
                filter: 'blur(100px)',
                bottom: '15%',
                right: '25%',
                pointerEvents: 'none'
            }} />

            {/* Glassmorphic Container */}
            <div style={{
                width: '100%',
                maxWidth: '450px',
                background: 'rgba(15, 23, 42, 0.45)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '40px 35px',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
                boxSizing: 'border-box',
                position: 'relative',
                zIndex: 1
            }}>
                {/* Branding/Header */}
                <div style={{ textAlign: 'center', marginBottom: '35px' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '64px',
                        height: '64px',
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, #6366f1, #10b981)',
                        fontSize: '32px',
                        marginBottom: '15px',
                        boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)'
                    }}>
                        💰
                    </div>
                    <h2 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>
                        MeraPaisa <span style={{ color: '#10b981' }}>Elite</span>
                    </h2>
                    <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px', fontWeight: '500' }}>
                        Empower your fintech portfolio securely
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Error Alerts */}
                    {error && (
                        <div style={{
                            backgroundColor: error.includes('Redirecting') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            border: `1px solid ${error.includes('Redirecting') ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                            color: error.includes('Redirecting') ? '#34d399' : '#f87171',
                            borderRadius: '12px',
                            padding: '12px 16px',
                            fontSize: '13px',
                            fontWeight: '600',
                            textAlign: 'center'
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Username Input */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                            Username
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={{
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px',
                                padding: '14px 16px',
                                color: '#f8fafc',
                                fontSize: '14px',
                                outline: 'none',
                                transition: 'all 0.3s ease',
                                WebkitBoxShadow: '0 0 0 1000px rgba(15, 23, 42, 0.4) inset',
                                WebkitTextFillColor: '#f8fafc'
                            }}
                            onFocus={(e) => {
                                e.target.style.border = '1px solid #6366f1';
                                e.target.style.boxShadow = '0 0 8px rgba(99, 102, 241, 0.2)';
                            }}
                            onBlur={(e) => {
                                e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>

                    {/* Password Input */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                                Password
                            </label>
                            <Link to="/forgot-password" style={{ color: '#10b981', fontSize: '12px', fontWeight: '600', textDecoration: 'none' }}>
                                Forgot Password?
                            </Link>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{
                                    width: '100%',
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px',
                                    padding: '14px 45px 14px 16px',
                                    color: '#f8fafc',
                                    fontSize: '14px',
                                    outline: 'none',
                                    transition: 'all 0.3s ease',
                                    boxSizing: 'border-box',
                                    WebkitBoxShadow: '0 0 0 1000px rgba(15, 23, 42, 0.4) inset',
                                    WebkitTextFillColor: '#f8fafc'
                                }}
                                onFocus={(e) => {
                                    e.target.style.border = '1px solid #6366f1';
                                    e.target.style.boxShadow = '0 0 8px rgba(99, 102, 241, 0.2)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                            {/* Toggle Password Visibility */}
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '16px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: '#94a3b8',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    padding: 0
                                }}
                            >
                                {showPassword ? '👁️' : '🙈'}
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '14px',
                            color: 'white',
                            fontSize: '15px',
                            fontWeight: '700',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s ease',
                            marginTop: '10px',
                            boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.45)';
                                e.target.style.background = 'linear-gradient(135deg, #4f46e5, #4338ca)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!loading) {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 4px 15px rgba(99, 102, 241, 0.3)';
                                e.target.style.background = 'linear-gradient(135deg, #6366f1, #4f46e5)';
                            }
                        }}
                    >
                        {loading ? 'Logging in...' : 'Sign In'}
                    </button>
                </form>

                {/* Footer Switcher */}
                <div style={{
                    marginTop: '30px',
                    textAlign: 'center',
                    fontSize: '14px',
                    color: '#94a3b8',
                    fontWeight: '500'
                }}>
                    Don't have an account?{' '}
                    <Link to="/register" style={{ color: '#10b981', fontWeight: '700', textDecoration: 'none' }}>
                        Create one
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
