import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// Inline Icons for Web3 aesthetic
const Icon = {
  User: () => (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  ),
  Ticket: () => (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2Z"/></svg>
  ),
  Coupon: () => (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
  ),
  GiftCard: () => (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="12" rx="2" ry="2"/><path d="M12 8v13"/><path d="M19 12H5"/><path d="M12 8V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v3"/><path d="M12 8V5a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2v3"/></svg>
  ),
  Reward: () => (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 15l-3.09 1.62.59-3.44L7 10.74l3.46-.5L12 7l1.54 3.24 3.46.5-2.5 2.44.59 3.44Z"/><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
  ),
  Help: () => (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
  ),
  Check: () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
  )
};

// --- Tab Components ---

const ProfileDetailsTab = ({ user, walletAddress, token, login }) => {
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.profile?.phone || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('http://localhost:5000/api/v1/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, phone })
      });
      const data = await res.json();
      if (data.success) {
        // Update context user object
        login(data.user, token, walletAddress);
        toast.success('Profile updated successfully!');
      } else {
        toast.error(data.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error while saving profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fade-in brutal-card" style={{ padding: '30px' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 'bold', color: 'var(--text)', marginBottom: '24px', textTransform: 'uppercase' }}>Profile Details</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px', alignItems: 'start' }}>
        
        {/* Avatar Section */}
        <div style={{ border: '3px solid var(--border)', background: 'var(--bg)', padding: '30px', textAlign: 'center' }}>
          <div style={{ width: '100px', height: '100px', borderRadius: '0%', background: 'var(--surface)', margin: '0 auto 15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', border: '3px solid var(--primary)', fontWeight: 'bold', color: 'var(--text)' }}>
            {user?.name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <h3 style={{ margin: '0 0 5px 0', color: 'var(--text)', fontFamily: 'var(--font-display)' }}>{user?.name || 'Explorer'}</h3>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Level 1 Web3 User</p>
          <button className="brutal-btn" style={{ marginTop: '20px', padding: '10px 16px', fontSize: '11px', width: '100%' }}>Update Avatar</button>
        </div>

        {/* Form Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text)', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>Email Address</label>
            <input type="text" value={user?.email || ''} readOnly style={{ width: '100%', padding: '12px 16px', background: 'var(--surface)', border: '2px solid var(--border)', color: 'var(--muted)', fontFamily: 'var(--font-mono)', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text)', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>Full Name</label>
            <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Enter your name" style={{ width: '100%', padding: '12px 16px', background: 'var(--input-bg)', border: '2px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-mono)', outline: 'none' }} onFocus={e=>e.target.style.borderColor='var(--primary)'} onBlur={e=>e.target.style.borderColor='var(--border)'} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text)', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>Phone Number</label>
            <input type="text" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Enter phone number" style={{ width: '100%', padding: '12px 16px', background: 'var(--input-bg)', border: '2px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-mono)', outline: 'none' }} onFocus={e=>e.target.style.borderColor='var(--primary)'} onBlur={e=>e.target.style.borderColor='var(--border)'} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text)', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>Connected Wallet</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--surface)', border: '2px solid var(--border)', padding: '12px 16px' }}>
              <span style={{ color: 'var(--primary)' }}><Icon.Check /></span>
              <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{walletAddress || 'Not Connected'}</span>
            </div>
          </div>
          <button onClick={handleSave} disabled={isSaving} className="brutal-btn" style={{ marginTop: '10px', padding: '14px', fontSize: '14px', alignSelf: 'flex-start' }}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};



const CouponsTab = () => (
  <div className="fade-in brutal-card" style={{ padding: '30px' }}>
    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 'bold', color: 'var(--text)', marginBottom: '24px', textTransform: 'uppercase' }}>Coupons & Offers</h2>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
      {[
        { title: '15% OFF Next Mint', desc: 'Valid on any premium event ticket', code: 'WEB3FEST15', exp: 'Expires in 2 days' },
        { title: 'Free POAP Badge', desc: 'Claim your exclusive early-bird badge', code: 'EARLYBIRD', exp: 'Expires in 5 days' },
      ].map((c, i) => (
        <div key={i} style={{ background: 'var(--bg)', border: '3px dashed var(--primary)', padding: '24px', position: 'relative' }}>
          <h3 style={{ margin: '0 0 10px 0', color: 'var(--text)', fontSize: '20px', fontFamily: 'var(--font-display)' }}>{c.title}</h3>
          <p style={{ margin: '0 0 20px 0', color: 'var(--muted)', fontSize: '13px', fontWeight: 'bold' }}>{c.desc}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ background: 'var(--surface)', border: '2px solid var(--border)', padding: '8px 12px', fontFamily: 'var(--font-mono)', color: 'var(--primary)', fontWeight: 'bold' }}>{c.code}</span>
            <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>{c.exp}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const GiftCardsTab = () => (
  <div className="fade-in brutal-card" style={{ padding: '30px' }}>
    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 'bold', color: 'var(--text)', marginBottom: '24px', textTransform: 'uppercase' }}>Gift Cards</h2>
    <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 300px', background: 'var(--surface)', border: '3px solid var(--border)', padding: '30px' }}>
        <h3 style={{ color: 'var(--text)', marginTop: 0, fontFamily: 'var(--font-display)' }}>Redeem a Gift Card</h3>
        <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '20px', fontWeight: 'bold' }}>Enter your 16-digit gift card code to add credits to your wallet.</p>
        <input type="text" placeholder="XXXX-XXXX-XXXX-XXXX" style={{ width: '100%', padding: '16px', background: 'var(--input-bg)', border: '2px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: '16px', textAlign: 'center', marginBottom: '20px', outline: 'none' }} onFocus={e=>e.target.style.borderColor='var(--primary)'} onBlur={e=>e.target.style.borderColor='var(--border)'} />
        <button className="brutal-btn" style={{ width: '100%', padding: '16px', fontSize: '14px' }}>Redeem to Wallet</button>
      </div>
      <div style={{ flex: '1 1 300px', background: 'var(--surface)', border: '3px solid var(--primary)', padding: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: 'var(--primary)', textTransform: 'uppercase', fontWeight: 'bold', fontSize: '12px', margin: '0 0 10px 0' }}>Current Gift Balance</p>
        <h1 style={{ color: 'var(--text)', fontSize: '48px', margin: 0, fontFamily: 'var(--font-display)' }}>₹0.00</h1>
        <p style={{ color: 'var(--muted)', fontSize: '12px', marginTop: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>Can be used for any event ticket</p>
      </div>
    </div>
  </div>
);

const RewardsTab = ({ user }) => (
  <div className="fade-in brutal-card" style={{ padding: '30px' }}>
    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 'bold', color: 'var(--text)', marginBottom: '24px', textTransform: 'uppercase' }}>Rewards & Loyalty</h2>
    
    <div style={{ background: 'var(--surface)', border: '3px solid var(--border)', padding: '30px', marginBottom: '30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
      <div>
        <p style={{ color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 'bold', fontSize: '12px', margin: '0 0 5px 0' }}>Available Block Coins</p>
        <h1 style={{ color: 'var(--text)', fontSize: '36px', margin: 0, fontFamily: 'var(--font-display)' }}>{user?.blockCoins || 0} <span style={{ fontSize: '16px', color: 'var(--primary)' }}>BC</span></h1>
      </div>
      <div style={{ width: '100%', maxWidth: '300px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>
          <span>Level 1</span>
          <span>Level 2 (1000 BC)</span>
        </div>
        <div style={{ height: '12px', background: 'var(--bg)', border: '2px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(100, ((user?.blockCoins || 0) / 1000) * 100)}%`, height: '100%', background: 'var(--primary)' }}></div>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '8px', textAlign: 'right', fontWeight: 'bold', textTransform: 'uppercase' }}>{Math.max(0, 1000 - (user?.blockCoins || 0))} BC to next tier</p>
      </div>
    </div>

    <h3 style={{ color: 'var(--text)', fontSize: '18px', marginBottom: '20px', fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>Redeemable Perks</h3>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
      {['Free Event Drink', 'VIP Gate Access', 'Exclusive NFT Drop'].map((p, i) => (
        <div key={i} style={{ background: 'var(--surface)', border: '3px solid var(--border)', padding: '24px', textAlign: 'center' }}>
          <div style={{ width: '50px', height: '50px', background: 'var(--bg)', border: '2px solid var(--border)', margin: '0 auto 15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <Icon.Reward />
          </div>
          <h4 style={{ color: 'var(--text)', margin: '0 0 15px 0', fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: '14px' }}>{p}</h4>
          <button className="brutal-btn" style={{ padding: '8px 12px', fontSize: '10px', width: '100%' }}>500 BC Required</button>
        </div>
      ))}
    </div>
  </div>
);

const HelpCentreTab = () => (
  <div className="fade-in brutal-card" style={{ padding: '30px' }}>
    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 'bold', color: 'var(--text)', marginBottom: '24px', textTransform: 'uppercase' }}>Help Centre</h2>
    <div style={{ background: 'var(--surface)', border: '3px solid var(--border)', padding: '30px' }}>
      <h3 style={{ color: 'var(--text)', marginTop: 0, marginBottom: '20px', fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>Frequently Asked Questions</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {[
          { q: 'How do I access my NFT ticket at the gate?', a: 'Your NFT ticket contains a unique dynamic QR code. Open the My Tickets tab and present the QR code to the scanner at the venue.' },
          { q: 'Can I transfer my ticket to a friend?', a: 'Standard tickets are non-transferable to prevent scalping. However, specific events may allow secure peer-to-peer transfers via our smart contracts.' },
          { q: 'What happens if the event is cancelled?', a: 'Smart contracts automatically process refunds directly to your connected wallet if an event is officially cancelled.' }
        ].map((faq, i) => (
          <div key={i} style={{ background: 'var(--bg)', padding: '20px', border: '2px solid var(--border)' }}>
            <h4 style={{ color: 'var(--primary)', margin: '0 0 10px 0', fontSize: '15px', fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>{faq.q}</h4>
            <p style={{ color: 'var(--text)', margin: 0, fontSize: '13px', lineHeight: '1.6' }}>{faq.a}</p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '40px', paddingTop: '30px', borderTop: '3px solid var(--border)', textAlign: 'center' }}>
        <p style={{ color: 'var(--text)', marginBottom: '20px', fontWeight: 'bold', textTransform: 'uppercase' }}>Still need help with your account or tickets?</p>
        <button className="brutal-btn" style={{ padding: '16px 32px', fontSize: '14px' }}>Contact Support</button>
      </div>
    </div>
  </div>
);


// --- Main Profile Page Component ---

export default function ProfilePage() {
  const { user, walletAddress, token, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Initial tab from URL or fallback
  const searchParams = new URLSearchParams(location.search);
  const urlTab = searchParams.get('tab') || 'profile';
  const [activeTab, setActiveTab] = useState(urlTab);

  // Sync state when URL search changes (e.g., clicking Navbar link while already on Profile)
  useEffect(() => {
    const currentTab = searchParams.get('tab') || 'profile';
    setActiveTab(currentTab);
  }, [location.search]);

  const TABS = [
    { id: 'profile', label: 'Edit Profile', icon: Icon.User },
    { id: 'coupons', label: 'Coupons & Offers', icon: Icon.Coupon },
    { id: 'giftcards', label: 'Gift Cards', icon: Icon.GiftCard },
    { id: 'rewards', label: 'Rewards', icon: Icon.Reward },
    { id: 'help', label: 'Help Centre', icon: Icon.Help },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'profile': return <ProfileDetailsTab user={user} walletAddress={walletAddress} token={token} login={login} />;
      case 'coupons': return <CouponsTab />;
      case 'giftcards': return <GiftCardsTab />;
      case 'rewards': return <RewardsTab user={user} />;
      case 'help': return <HelpCentreTab />;
      default: return <ProfileDetailsTab user={user} walletAddress={walletAddress} token={token} login={login} />;
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: 'var(--bg)', padding: '40px 20px' }}>
      <style>{`
        .fade-in { animation: fadeIn 0.2s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
        
        {/* Sidebar Navigation */}
        <div style={{ flex: '1 1 250px', maxWidth: '300px' }}>
          <div className="brutal-card" style={{ padding: '20px', position: 'sticky', top: '80px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', paddingBottom: '20px', borderBottom: '3px solid var(--border)', marginBottom: '20px' }}>
              <div style={{ width: '48px', height: '48px', background: 'var(--primary)', border: '2px solid var(--border)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>
                {user?.name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <div style={{ color: 'var(--text)', fontWeight: 'bold', fontSize: '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px', fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>{user?.name || 'Explorer'}</div>
                <div style={{ color: 'var(--muted)', fontSize: '11px', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>{user?.email || 'No email linked'}</div>
              </div>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {TABS.map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      navigate(`/profile?tab=${tab.id}`, { replace: true });
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '14px 16px',
                      background: isActive ? 'var(--primary)' : 'var(--bg)',
                      color: isActive ? '#000' : 'var(--text)',
                      border: '2px solid var(--border)',
                      boxShadow: isActive ? '2px 2px 0 var(--border)' : 'none',
                      cursor: 'pointer', textAlign: 'left',
                      fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => { if (!isActive) { e.currentTarget.style.transform = 'translate(-2px, -2px)'; e.currentTarget.style.boxShadow = '2px 2px 0 var(--border)'; } }}
                    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'none'; } }}
                  >
                    <tab.icon />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{ flex: '3 1 0%' }}>
          {renderContent()}
        </div>

      </div>
    </div>
  );
}
