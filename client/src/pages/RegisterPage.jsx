import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { coreService } from '../services/api_core';

const RegisterPage = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Generate a mock browser device token to test device integration
        const mockDeviceToken = 'web_device_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const deviceType = 'Web';

        try {
            await coreService.register({
                username,
                email,
                password,
                first_name: firstName,
                last_name: lastName,
                device_token: mockDeviceToken,
                device_type: deviceType
            });

            // Redirect to verify-email with email as state / query param
            navigate(`/verify-email?email=${encodeURIComponent(email)}`);
        } catch (err) {
            console.error('Registration error:', err);
            const errData = err.response?.data;
            if (errData) {
                // DRF might return dict of field errors
                const firstError = Object.values(errData)[0];
                setError(Array.isArray(firstError) ? firstError[0] : firstError || 'Registration failed');
            } else {
                setError('Something went wrong. Please try again.');
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
                background: 'rgba(16, 185, 129, 0.12)',
                filter: 'blur(80px)',
                top: '15%',
                right: '25%',
                pointerEvents: 'none'
            }} />
            <div style={{
                position: 'absolute',
                width: '350px',
                height: '350px',
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.15)',
                filter: 'blur(100px)',
                bottom: '20%',
                left: '25%',
                pointerEvents: 'none'
            }} />

            {/* Glassmorphic Container */}
            <div style={{
                width: '100%',
                maxWidth: '480px',
                background: 'rgba(15, 23, 42, 0.45)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '35px 30px',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
                boxSizing: 'border-box',
                position: 'relative',
                zIndex: 1
            }}>
                {/* Branding/Header */}
                <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                    <h2 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>
                        Create <span style={{ color: '#10b981' }}>Account</span>
                    </h2>
                    <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px', fontWeight: '500' }}>
                        Join the MeraPaisa Elite fintech network
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Error Alerts */}
                    {error && (
                        <div style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#f87171',
                            borderRadius: '12px',
                            padding: '12px 16px',
                            fontSize: '13px',
                            fontWeight: '600',
                            textAlign: 'center'
                        }}>
                            {error}
                        </div>
                    )}

                    {/* First & Last Name */}
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                            <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                                First Name
                            </label>
                            <input
                                type="text"
                                placeholder="John"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px',
                                    padding: '12px 14px',
                                    color: '#f8fafc',
                                    fontSize: '14px',
                                    outline: 'none',
                                    transition: 'all 0.3s ease',
                                    width: '100%',
                                    boxSizing: 'border-box'
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                            <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                                Last Name
                            </label>
                            <input
                                type="text"
                                placeholder="Doe"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px',
                                    padding: '12px 14px',
                                    color: '#f8fafc',
                                    fontSize: '14px',
                                    outline: 'none',
                                    transition: 'all 0.3s ease',
                                    width: '100%',
                                    boxSizing: 'border-box'
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
                    </div>

                    {/* Username Input */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                            Username
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Choose a unique username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={{
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px',
                                padding: '12px 14px',
                                color: '#f8fafc',
                                fontSize: '14px',
                                outline: 'none',
                                transition: 'all 0.3s ease',
                                width: '100%',
                                boxSizing: 'border-box'
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

                    {/* Email Input */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                            Email Address
                        </label>
                        <input
                            type="email"
                            required
                            placeholder="john@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px',
                                padding: '12px 14px',
                                color: '#f8fafc',
                                fontSize: '14px',
                                outline: 'none',
                                transition: 'all 0.3s ease',
                                width: '100%',
                                boxSizing: 'border-box'
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                            Password
                        </label>
                        <input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px',
                                padding: '12px 14px',
                                color: '#f8fafc',
                                fontSize: '14px',
                                outline: 'none',
                                transition: 'all 0.3s ease',
                                width: '100%',
                                boxSizing: 'border-box'
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

                    {/* Submit Button */}
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
                                e.target.style.background = 'linear-gradient(135deg, #059669, #047857)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!loading) {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)';
                                e.target.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                            }
                        }}
                    >
                        {loading ? 'Registering...' : 'Create Account'}
                    </button>
                </form>

                {/* Footer Switcher */}
                <div style={{
                    marginTop: '25px',
                    textAlign: 'center',
                    fontSize: '14px',
                    color: '#94a3b8',
                    fontWeight: '500'
                }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: '#6366f1', fontWeight: '700', textDecoration: 'none' }}>
                        Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
