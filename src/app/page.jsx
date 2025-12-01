// app/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/config/supabaseClient';
import KPIDashboard from '@/components/KPIDashboard';
import Link from 'next/link';

// Allowed email domain - users with this domain are auto-created on first login
const ALLOWED_DOMAIN = '@encorelm.com';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userAccess, setUserAccess] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSessionAndAccess = async () => {
      // 1. Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }
      
      const userEmail = session.user.email.toLowerCase();
      const userName = session.user.user_metadata?.full_name || 
                       session.user.user_metadata?.name || 
                       '';
      
      // 2. Check if email is from allowed domain
      if (!userEmail.endsWith(ALLOWED_DOMAIN)) {
        router.push('/access-denied');
        return;
      }
      
      // 3. Check if user exists in allowed_users
      let { data: allowedUser, error: allowedError } = await supabase
        .from('allowed_users')
        .select('*')
        .eq('email', userEmail)
        .single();
      
      // 4. If user doesn't exist, auto-create them
      if (allowedError && allowedError.code === 'PGRST116') {
        // User not found - create them
        const { data: newUser, error: createError } = await supabase
          .from('allowed_users')
          .insert([{
            email: userEmail,
            name: userName,
            is_admin: false,
            is_active: true
          }])
          .select()
          .single();
        
        if (createError) {
          console.error('Error creating user:', createError);
          router.push('/access-denied');
          return;
        }
        
        allowedUser = newUser;
      } else if (allowedError) {
        console.error('Error checking user:', allowedError);
        router.push('/access-denied');
        return;
      }
      
      // 5. Check if user is active
      if (!allowedUser.is_active) {
        router.push('/access-denied');
        return;
      }
      
      // 6. Fetch user's allowed roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role_key')
        .eq('user_email', userEmail);
      
      const allowedRoles = userRoles?.map(r => r.role_key) || [];
      
      setUser(session.user);
      setUserAccess({
        isAdmin: allowedUser.is_admin,
        allowedRoles: allowedRoles
      });
      setLoading(false);
    };

    checkSessionAndAccess();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          router.push('/login');
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #e2e8f0',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{
            fontSize: '16px',
            color: '#64748b',
            fontWeight: '500'
          }}>
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Modern Navigation Header */}
      <nav style={{ 
        padding: '0 24px',
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '64px'
        }}>
          {/* Logo */}
          <Link href="/" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            textDecoration: 'none'
          }}>
            {/* Agave Logo */}
            <img 
              src="/agave.png" 
              alt="Encore" 
              style={{
                height: '40px',
                width: 'auto',
                filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
              }}
            />
            <div>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: '700', 
                color: '#1e293b',
                lineHeight: '1.2'
              }}>
                KPI Dashboard
              </div>
              <div style={{
                fontSize: '11px',
                color: '#94a3b8',
                fontWeight: '500',
                letterSpacing: '0.5px'
              }}>
                ENCORE LANDSCAPE MANAGEMENT
              </div>
            </div>
          </Link>
          
          {/* Right Side - User Menu */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Admin Button */}
            {userAccess?.isAdmin && (
              <Link 
                href="/admin" 
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px', 
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
                  transition: 'all 0.2s ease'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Admin
              </Link>
            )}
            
            {/* User Profile */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              padding: '6px 12px 6px 6px',
              background: '#f8fafc',
              borderRadius: '24px',
              border: '1px solid #e2e8f0'
            }}>
              {user?.user_metadata?.avatar_url ? (
                <img 
                  src={user.user_metadata.avatar_url} 
                  alt="Profile" 
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: '2px solid white',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                  }}
                />
              ) : (
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ 
                  fontSize: '13px', 
                  fontWeight: '600',
                  color: '#1e293b',
                  lineHeight: '1.2'
                }}>
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ 
                    fontSize: '11px', 
                    color: '#64748b'
                  }}>
                    {user?.email}
                  </span>
                  {userAccess?.isAdmin && (
                    <span style={{
                      background: '#dbeafe',
                      color: '#1d4ed8',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '600'
                    }}>
                      ADMIN
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                background: 'white',
                color: '#64748b',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.color = '#ef4444';
                e.currentTarget.style.borderColor = '#fecaca';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.color = '#64748b';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="16,17 21,12 16,7" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <KPIDashboard 
        isAdmin={userAccess?.isAdmin} 
        allowedRoles={userAccess?.allowedRoles} 
      />
    </main>
  );
}