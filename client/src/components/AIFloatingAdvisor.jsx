import { useState, useEffect, useRef } from 'react';
import { coreService } from '../services/api_core';

const AIFloatingAdvisor = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            sender: 'bot',
            text: 'Hello! I am your **MeraPaisa Elite AI Wealth Advisor**. I can read your active financial dashboard tables and formulate high-performance audits or advice. \n\nClick below to run a comprehensive audit, or type any wealth-building query!',
            isMarkdown: true
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [streamingText, setStreamingText] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, streamingText]);

    // Simple custom markdown to beautiful HTML renderer with premium styled widgets
    const renderMarkdown = (text) => {
        if (!text) return '';
        
        let html = text;
        
        // Escape HTML tags to prevent XSS
        html = html.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        // 1. Headers (### or ## or #)
        html = html.replace(/^###\s+(.*)$/gim, '<h4 style="color: #60a5fa; font-size: 15px; font-weight: 700; margin-top: 18px; margin-bottom: 8px; font-family: \'Outfit\', sans-serif;">$1</h4>');
        html = html.replace(/^##\s+(.*)$/gim, '<h3 style="color: #818cf8; font-size: 17px; font-weight: 700; margin-top: 22px; margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 4px; font-family: \'Outfit\', sans-serif;">$1</h3>');
        html = html.replace(/^#\s+(.*)$/gim, '<h2 style="color: #c084fc; font-size: 19px; font-weight: 800; margin-top: 24px; margin-bottom: 12px; font-family: \'Outfit\', sans-serif; text-shadow: 0 0 10px rgba(192, 132, 252, 0.3);">$1</h2>');

        // 2. Bold text (**text**)
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #f8fafc; font-weight: 700;">$1</strong>');

        // 3. Bullet points (- or * )
        // Mapped to custom glowing startup checkmarks
        html = html.replace(/^\s*[-*]\s+(.*)$/gim, '<li style="list-style-type: none; margin-bottom: 6px; padding-left: 20px; position: relative; color: #cbd5e1; font-size: 13.5px;"><span style="position: absolute; left: 0; color: #60a5fa;">✦</span> $1</li>');

        // 4. Tables parsing
        // We will parse standard markdown tables and replace them with glassmorphic layouts!
        const lines = html.split('\n');
        let inTable = false;
        let tableRows = [];
        let headerParsed = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('|') && line.endsWith('|')) {
                if (!inTable) {
                    inTable = true;
                    tableRows = [];
                    headerParsed = false;
                }
                
                // Skip separator rows (| :--- | :--- |)
                if (line.includes('---') || line.includes(':---')) {
                    continue;
                }
                
                const cells = line.split('|').map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
                
                if (!headerParsed) {
                    // Header row
                    const headerHtml = `<tr style="background: rgba(255,255,255,0.06); border-bottom: 1px solid rgba(255,255,255,0.15);">${cells.map(c => `<th style="padding: 10px; color: #94a3b8; font-size: 11px; font-weight: 700; text-transform: uppercase; text-align: left; letter-spacing: 0.5px;">${c}</th>`).join('')}</tr>`;
                    tableRows.push(headerHtml);
                    headerParsed = true;
                } else {
                    // Body rows
                    const rowHtml = `<tr style="border-bottom: 1px solid rgba(255,255,255,0.04); transition: background 0.2s; &:hover { background: rgba(255,255,255,0.02); }">${cells.map(c => `<td style="padding: 10px; color: #cbd5e1; font-size: 12.5px;">${c}</td>`).join('')}</tr>`;
                    tableRows.push(rowHtml);
                }
                
                lines[i] = ''; // Remove from basic processing
            } else {
                if (inTable) {
                    const fullTable = `<div style="overflow-x: auto; margin: 15px 0; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; background: rgba(15,23,42,0.4); backdrop-filter: blur(10px);"><table style="width: 100%; border-collapse: collapse;">${tableRows.join('')}</table></div>`;
                    lines[i - 1] = fullTable;
                    inTable = false;
                }
            }
        }
        
        html = lines.join('\n');

        // 5. Line breaks and clean blocks
        html = html.replace(/\n/g, '<br/>');

        // Clean double breaks
        html = html.replace(/(<br\/>){3,}/g, '<br/><br/>');

        return html;
    };

    // Simulate real-time character-by-character typewriter streaming
    const simulateStream = (fullText) => {
        setIsStreaming(true);
        setStreamingText('');
        let currentIdx = 0;
        const speed = 10; // ms per character

        const interval = setInterval(() => {
            if (currentIdx < fullText.length) {
                setStreamingText(prev => prev + fullText.charAt(currentIdx));
                currentIdx++;
            } else {
                clearInterval(interval);
                setIsStreaming(false);
                setMessages(prev => [...prev, { sender: 'bot', text: fullText, isMarkdown: true }]);
                setStreamingText('');
            }
        }, speed);
    };

    const handleSend = async (customText = '') => {
        const queryText = customText || input;
        if (!queryText.trim() || loading || isStreaming) return;

        // Reset input box
        if (!customText) setInput('');

        // 1. Append user prompt
        setMessages(prev => [...prev, { sender: 'user', text: queryText }]);
        setLoading(true);

        try {
            // 2. Call Django AI View paired with current database context
            const res = await coreService.getAIAudit(queryText);
            const rawResponse = res.data.report;
            
            setLoading(false);
            // 3. Trigger premium character-by-character typewriter stream effect
            simulateStream(rawResponse);
        } catch (err) {
            console.error("AI Advisor request failed:", err);
            setLoading(false);
            setMessages(prev => [...prev, {
                sender: 'bot',
                text: '❌ **Audit pipeline failed**. Please ensure your backend server is online, database migrations are applied, and verify your network connections.',
                isMarkdown: true
            }]);
        }
    };

    const runQuickAudit = () => {
        handleSend("Please generate my full startup wealth audit and tactical recommendations.");
    };

    const runDebtReduction = () => {
        handleSend("Analyze my outstanding loans and informal debts. Formulate a high-efficiency debt reduction timeline and suggestions.");
    };

    const runBudgetOptimizer = () => {
        handleSend("Review my monthly spending category limits. Generate budget optimizer tips to trim my burn rate by 15%.");
    };

    return (
        <>
            {/* 1. Floating Actions Badge */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    boxShadow: isOpen ? '0 0 25px rgba(59, 130, 246, 0.6)' : '0 0 15px rgba(79, 70, 229, 0.4)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    animation: isOpen ? 'none' : 'breathingGlow 3s infinite ease-in-out',
                }}
            >
                {isOpen ? (
                    <svg style={{ width: '26px', height: '26px', fill: '#ffffff' }} viewBox="0 0 24 24">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                ) : (
                    <span style={{ fontSize: '26px' }}>🤖</span>
                )}
            </button>

            {/* 2. Glassmorphic Chat Drawer */}
            <div
                style={{
                    position: 'fixed',
                    bottom: '96px',
                    right: '24px',
                    width: '380px',
                    height: '560px',
                    background: 'rgba(15, 23, 42, 0.75)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '24px',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 9998,
                    overflow: 'hidden',
                    transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.92)',
                    opacity: isOpen ? 1 : 0,
                    pointerEvents: isOpen ? 'all' : 'none',
                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                        background: 'rgba(30, 41, 59, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ position: 'relative' }}>
                            <span style={{ fontSize: '24px' }}>🤖</span>
                            <span
                                style={{
                                    position: 'absolute',
                                    bottom: '2px',
                                    right: '2px',
                                    width: '8px',
                                    height: '8px',
                                    background: '#10b981',
                                    borderRadius: '50%',
                                    border: '1px solid #0f172a',
                                    boxShadow: '0 0 8px #10b981'
                                }}
                            />
                        </div>
                        <div>
                            <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '14.5px', fontWeight: '700', fontFamily: "'Outfit', sans-serif" }}>MeraPaisa AI Advisor</h4>
                            <p style={{ margin: 0, color: '#94a3b8', fontSize: '10.5px', fontWeight: '500' }}>Active Financial Auditor</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: '6px',
                            borderRadius: '50%',
                            display: 'flex',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                            e.currentTarget.style.color = '#f1f5f9';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                            e.currentTarget.style.color = '#94a3b8';
                        }}
                    >
                        <svg style={{ width: '16px', height: '16px', fill: 'currentColor' }} viewBox="0 0 24 24">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>

                {/* Messages Body */}
                <div
                    style={{
                        flex: 1,
                        padding: '20px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px'
                    }}
                >
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            style={{
                                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '85%',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            <div
                                style={{
                                    padding: '12px 16px',
                                    borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                    background: msg.sender === 'user'
                                        ? 'linear-gradient(135deg, rgba(79,70,229,0.3) 0%, rgba(59,130,246,0.3) 100%)'
                                        : 'rgba(255, 255, 255, 0.04)',
                                    border: msg.sender === 'user'
                                        ? '1px solid rgba(99,102,241,0.2)'
                                        : '1px solid rgba(255, 255, 255, 0.05)',
                                    color: '#cbd5e1',
                                    fontSize: '13px',
                                    lineHeight: '1.5',
                                    fontFamily: "'Outfit', sans-serif"
                                }}
                                dangerouslySetInnerHTML={{
                                    __html: msg.isMarkdown ? renderMarkdown(msg.text) : msg.text
                                }}
                            />
                        </div>
                    ))}

                    {/* Stream Typing response */}
                    {isStreaming && (
                        <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
                            <div
                                style={{
                                    padding: '12px 16px',
                                    borderRadius: '16px 16px 16px 4px',
                                    background: 'rgba(255, 255, 255, 0.04)',
                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                    color: '#cbd5e1',
                                    fontSize: '13px',
                                    lineHeight: '1.5',
                                    fontFamily: "'Outfit', sans-serif"
                                }}
                                dangerouslySetInnerHTML={{
                                    __html: renderMarkdown(streamingText) + '<span style="display:inline-block; width:6px; height:12px; background:#60a5fa; margin-left:4px; animation:blink 1s infinite;"></span>'
                                }}
                            />
                        </div>
                    )}

                    {/* Active Loading Analyzer */}
                    {loading && (
                        <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.04)' }}>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <div style={{ width: '6px', height: '6px', background: '#60a5fa', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both' }}></div>
                                <div style={{ width: '6px', height: '6px', background: '#818cf8', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both 0.2s' }}></div>
                                <div style={{ width: '6px', height: '6px', background: '#c084fc', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both 0.4s' }}></div>
                            </div>
                            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>AI is compiling your audit...</span>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Quick Action Prompts */}
                {messages.length === 1 && !loading && !isStreaming && (
                    <div
                        style={{
                            padding: '0 20px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            marginBottom: '10px'
                        }}
                    >
                        <button
                            onClick={runQuickAudit}
                            style={{
                                padding: '8px 12px',
                                background: 'rgba(79, 70, 229, 0.1)',
                                border: '1px solid rgba(99, 102, 241, 0.25)',
                                borderRadius: '12px',
                                color: '#a5b4fc',
                                fontSize: '11.5px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                textAlign: 'left',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(79, 70, 229, 0.2)';
                                e.currentTarget.style.boxShadow = '0 0 10px rgba(99, 102, 241, 0.2)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(79, 70, 229, 0.1)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <span>📊</span> Generate My Wealth Audit
                        </button>
                        <button
                            onClick={runDebtReduction}
                            style={{
                                padding: '8px 12px',
                                background: 'rgba(239, 68, 68, 0.08)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                borderRadius: '12px',
                                color: '#fca5a5',
                                fontSize: '11.5px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                textAlign: 'left',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                                e.currentTarget.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.15)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <span>💸</span> Debt Reduction Strategy
                        </button>
                        <button
                            onClick={runBudgetOptimizer}
                            style={{
                                padding: '8px 12px',
                                background: 'rgba(16, 185, 129, 0.08)',
                                border: '1px solid rgba(16, 185, 129, 0.2)',
                                borderRadius: '12px',
                                color: '#a7f3d0',
                                fontSize: '11.5px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                textAlign: 'left',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)';
                                e.currentTarget.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.15)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <span>💡</span> Budget Optimizer Tips
                        </button>
                    </div>
                )}

                {/* Input Container */}
                <div
                    style={{
                        padding: '16px 20px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                        background: 'rgba(15, 23, 42, 0.5)',
                        display: 'flex',
                        gap: '10px'
                    }}
                >
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        disabled={loading || isStreaming}
                        placeholder={loading || isStreaming ? 'Advisor is typing...' : 'Ask your AI financial advisor...'}
                        style={{
                            flex: 1,
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '12px',
                            padding: '10px 14px',
                            color: '#f8fafc',
                            fontSize: '12.5px',
                            fontFamily: "'Outfit', sans-serif",
                            outline: 'none',
                            transition: 'all 0.2s'
                        }}
                        onFocus={(e) => {
                            e.currentTarget.style.border = '1px solid rgba(99, 102, 241, 0.4)';
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.08)';
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        }}
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || loading || isStreaming}
                        style={{
                            background: input.trim() && !loading && !isStreaming ? 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)' : 'rgba(255,255,255,0.04)',
                            color: input.trim() && !loading && !isStreaming ? '#ffffff' : '#475569',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '0 14px',
                            cursor: input.trim() && !loading && !isStreaming ? 'pointer' : 'default',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                        }}
                    >
                        <svg style={{ width: '18px', height: '18px', fill: 'currentColor' }} viewBox="0 0 24 24">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                        </svg>
                    </button>
                </div>
            </div>

            {/* Custom breathing global keyframe animation */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes breathingGlow {
                    0% { box-shadow: 0 0 10px rgba(79, 70, 229, 0.4); transform: scale(1); }
                    50% { box-shadow: 0 0 25px rgba(59, 130, 246, 0.7); transform: scale(1.04); }
                    100% { box-shadow: 0 0 10px rgba(79, 70, 229, 0.4); transform: scale(1); }
                }
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                }
                @keyframes bounce {
                    0%, 80%, 100% { transform: scale(0); }
                    40% { transform: scale(1); }
                }
            `}} />
        </>
    );
};

export default AIFloatingAdvisor;
