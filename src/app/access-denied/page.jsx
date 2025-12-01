// app/access-denied/page.jsx
'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/config/supabaseClient';

export default function AccessDenied() {
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        padding: '48px',
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
        textAlign: 'center',
        maxWidth: '450px',
        width: '100%'
      }}>
        {/* Icon */}
        <div style={{
          width: '64px',
          height: '64px',
          background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          border: '2px solid #fecaca'
        }}>
          <svg 
            width="32" 
            height="32" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="#dc2626" 
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>

        <h1 style={{
          fontSize: '24px',
          fontWeight: '700',
          color: '#1e293b',
          marginBottom: '12px'
        }}>
          Access Denied
        </h1>
        
        <p style={{
          color: '#64748b',
          marginBottom: '24px',
          lineHeight: '1.6',
          fontSize: '15px'
        }}>
          Your account is not authorized to access the KPI Dashboard. 
          This application is restricted to <strong>@encorelm.com</strong> email addresses.
        </p>

        <div style={{
          background: '#f8fafc',
          borderRadius: '10px',
          padding: '16px',
          marginBottom: '28px',
          border: '1px solid #e2e8f0'
        }}>
          <p style={{
            fontSize: '13px',
            color: '#64748b',
            margin: 0
          }}>
            <strong style={{ color: '#475569' }}>Need access?</strong><br />
            Contact your administrator to request access with your company email.
          </p>
        </div>

        <button
          onClick={handleSignOut}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            padding: '14px 24px',
            background: '#f1f5f9',
            color: '#475569',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#e2e8f0';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = '#f1f5f9';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="16,17 21,12 16,7" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Sign Out & Try Again
        </button>
      </div>
    </div>
  );
}