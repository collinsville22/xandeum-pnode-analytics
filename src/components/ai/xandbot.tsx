'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Sparkles, RefreshCw } from 'lucide-react';
import { usePreferences } from '@/contexts/preferences-context';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface XandbotProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUGGESTED_QUESTIONS = [
  'What is a pNode?',
  'Network status',
  'XAND token price',
  'How to stake SOL?',
  'What is STOINC?',
];

const KNOWLEDGE_BASE: Record<string, string> = {
  'pnode': `A pNode (provider node) is a server that stores and serves data on the Xandeum network. They use erasure coding to split files into redundant shards distributed across the network.

Key points:
• Run by community members on VPS or dedicated hardware
• Earn STOINC rewards based on uptime and performance
• Require ports 9001 (UDP), 5000 (TCP), and 6000 (TCP)
• Data is encrypted so no single node holds complete files

To run a pNode, check docs.xandeum.com/operator-guides`,

  'vnode': `vNodes (validator nodes) are supervisory nodes that cryptographically verify pNode data integrity using periodic challenges. They ensure the network remains honest without burdening Solana's main validators.`,

  'stoinc': `STOINC (Storage Income) is the reward mechanism for pNode operators.

How it works:
• Nodes are ranked by total data served to the network
• Heartbeats every 30 seconds confirm node availability
• NFT multipliers can significantly boost earnings
• Monthly XAND allocations to top performers via Foundation Program

Higher uptime + more data served = better rankings = more rewards.`,

  'stake': `Liquid staking with xandSOL:

1. Go to the Stake page in this dashboard
2. Connect your wallet and stake SOL
3. Receive xandSOL tokens that accrue value over time
4. Use xandSOL in DeFi while still earning staking rewards

Benefits:
• No lock-up period
• Instant unstaking available
• Higher APY than most LST providers
• Automatic reward compounding

Check the Stake page for current APY and exchange rates.`,

  'xand': `XAND is Xandeum's governance and utility token.

Tokenomics:
• Fixed supply of ~4 billion tokens
• Use: Lock in DAO to vote on network upgrades, fees, treasury

Where to trade:
• Use the Trade page in this dashboard (powered by Jupiter)
• Also available on Raydium

Check the Trade page for current price and market cap.

Lock XAND on realms.today/dao/XAND to participate in governance.`,

  'network': `Network status can be viewed on the Dashboard and Network pages.

Key features:
• pNodes distributed globally across many countries
• Gossip protocol for P2P coordination
• Stuttgart (v0.6) release with redundancy mechanisms

Check the Dashboard for live node counts, geographic distribution, and network health.

The network is in the South Era of development, progressing toward mainnet launch.`,

  'storage': `Xandeum solves the blockchain storage trilemma:

1. Scalability - Exabyte-scale storage via distributed pNodes
2. Smart Contract Native - Direct integration with Solana programs
3. Random Access - Read/write any data segment, not just whole files

Think of Solana as RAM (fast, limited) and Xandeum as the hard drive (massive, affordable).`,

  'sedapp': `sedApps (storage-enabled dApps) are applications that use Xandeum for massive on-chain storage.

Examples in development:
• iKnowIt.live - Community-driven knowledge game
• info.wiki - Decentralized Wikipedia alternative

sedApps can store social media content, AI models, research data—anything that needs Web2-scale storage with Web3 trust.`,

  'default': `I can help you understand:

• pNodes & vNodes - Storage provider and validator nodes
• STOINC - How node operators earn rewards
• Staking - xandSOL liquid staking (check Stake page for APY)
• XAND Token - Governance, tokenomics, where to trade
• Network Status - Check Dashboard for live stats
• Storage Layer - How Xandeum extends Solana

What would you like to know more about?`,
};

function getResponse(query: string): string {
  const q = query.toLowerCase();

  if (q.includes('pnode') || q.includes('provider node') || q.includes('what is a p')) {
    return KNOWLEDGE_BASE['pnode'];
  }
  if (q.includes('vnode') || q.includes('validator')) {
    return KNOWLEDGE_BASE['vnode'];
  }
  if (q.includes('stoinc') || q.includes('storage income') || q.includes('reward') || q.includes('credit') || q.includes('earn') || q.includes('data served')) {
    return KNOWLEDGE_BASE['stoinc'];
  }
  if (q.includes('stake') || q.includes('xandsol') || q.includes('liquid') || q.includes('apy')) {
    return KNOWLEDGE_BASE['stake'];
  }
  if (q.includes('xand') && (q.includes('token') || q.includes('price') || q.includes('buy') || q.includes('trade') || q.includes('governance'))) {
    return KNOWLEDGE_BASE['xand'];
  }
  if (q.includes('network') || q.includes('status') || q.includes('node') && q.includes('count') || q.includes('online')) {
    return KNOWLEDGE_BASE['network'];
  }
  if (q.includes('storage') || q.includes('trilemma') || q.includes('scalab')) {
    return KNOWLEDGE_BASE['storage'];
  }
  if (q.includes('sedapp') || q.includes('dapp') || q.includes('application')) {
    return KNOWLEDGE_BASE['sedapp'];
  }
  if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
    return `Hey! I'm here to help you navigate Xandeum. Ask me about pNodes, staking, the XAND token, or anything else about the network.`;
  }

  return KNOWLEDGE_BASE['default'];
}

export function Xandbot({ isOpen, onClose }: XandbotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme, preferences } = usePreferences();

  const bgBase = resolvedTheme === 'light' ? '#f5f5f5' : '#121212';
  const bgRaised = resolvedTheme === 'light' ? '#ffffff' : '#1a1a1a';
  const bgElevated = resolvedTheme === 'light' ? '#f0f0f0' : '#252525';
  const textPrimary = resolvedTheme === 'light' ? '#1a1a1a' : '#ffffff';
  const textSecondary = resolvedTheme === 'light' ? '#666666' : '#888888';
  const textMuted = resolvedTheme === 'light' ? '#999999' : '#666666';
  const border = resolvedTheme === 'light' ? '#e0e0e0' : '#2a2a2a';
  const borderHover = resolvedTheme === 'light' ? '#d0d0d0' : '#333333';
  const accentColor = preferences.xandeumTheme ? '#14b8a6' : '#f59e0b';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text?: string) => {
    const query = text || input.trim();
    if (!query) return;

    const userMessage: Message = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));

    const response = getResponse(query);
    const assistantMessage: Message = { role: 'assistant', content: response };
    setMessages(prev => [...prev, assistantMessage]);
    setIsTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    setMessages([]);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', right: 0, top: 0, bottom: 0, width: 380,
      background: bgBase, borderLeft: `1px solid ${border}`,
      display: 'flex', flexDirection: 'column', zIndex: 50,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', borderBottom: `1px solid ${border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: `linear-gradient(135deg, ${accentColor}, ${preferences.xandeumTheme ? '#0d9488' : '#d97706'})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Bot size={18} color="#000" />
          </div>
          <div>
            <div style={{ color: textPrimary, fontSize: 14, fontWeight: 600 }}>Xandbot AI Assistant</div>
            <div style={{ color: textMuted, fontSize: 11 }}>Ask questions about Xandeum</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={handleReset}
            style={{
              width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 4,
            }}
            title="Clear chat"
          >
            <RefreshCw size={14} color={textMuted} />
          </button>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 4,
            }}
          >
            <X size={18} color={textMuted} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 40 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16, margin: '0 auto 20px',
              background: `linear-gradient(135deg, ${accentColor}20, ${preferences.xandeumTheme ? '#0d948820' : '#d9770620'})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Sparkles size={28} color={accentColor} />
            </div>
            <h3 style={{ color: textPrimary, fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              Hi! I'm Xandbot
            </h3>
            <p style={{ color: textSecondary, fontSize: 13, lineHeight: 1.6, maxWidth: 280, margin: '0 auto 24px' }}>
              I can help you understand the Xandeum network, pNode operations, check network stats, and answer questions about the XAND token.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  style={{
                    padding: '8px 14px', borderRadius: 20,
                    background: 'transparent', border: `1px solid ${borderHover}`,
                    color: textSecondary, fontSize: 12, cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = accentColor;
                    e.currentTarget.style.color = textPrimary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = borderHover;
                    e.currentTarget.style.color = textSecondary;
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div style={{
                  maxWidth: '85%',
                  padding: '12px 16px',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.role === 'user' ? accentColor : bgRaised,
                  border: msg.role === 'user' ? 'none' : `1px solid ${border}`,
                }}>
                  <p style={{
                    color: msg.role === 'user' ? '#000' : textSecondary,
                    fontSize: 13,
                    lineHeight: 1.6,
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                  }}>
                    {msg.content}
                  </p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '12px 16px', borderRadius: '16px 16px 16px 4px',
                  background: bgRaised, border: `1px solid ${border}`,
                }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: textMuted, animation: 'pulse 1s infinite' }} />
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: textMuted, animation: 'pulse 1s infinite 0.2s' }} />
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: textMuted, animation: 'pulse 1s infinite 0.4s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div style={{ padding: 16, borderTop: `1px solid ${border}` }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', borderRadius: 12,
          background: bgRaised, border: `1px solid ${border}`,
        }}>
          <input
            type="text"
            placeholder="Ask about Xandeum..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: textPrimary, fontSize: 14,
            }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim()}
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: input.trim() ? accentColor : borderHover,
              border: 'none', cursor: input.trim() ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
          >
            <Send size={14} color={input.trim() ? '#000' : textMuted} />
          </button>
        </div>
        <p style={{ color: textMuted, fontSize: 10, textAlign: 'center', marginTop: 8 }}>
          Xandbot uses a local knowledge base. For detailed info, visit docs.xandeum.com
        </p>
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
