"use client"

// Shared dialog for every admin form. Renders over the page (fixed), so the
// fields are always on screen no matter where the button that opened it sits.
// Header and footer stay put; only the body scrolls. Esc closes; clicking the
// backdrop does NOT (a stray click shouldn't throw away a half-filled form).
import React, { useEffect, useRef } from 'react';

export const btnPrimary = {
  padding: '8px 18px', background: '#3b82f6', color: 'white', border: 'none',
  borderRadius: '6px', fontSize: '14px', fontWeight: '500', cursor: 'pointer'
};
export const btnSecondary = {
  padding: '8px 18px', background: '#f3f4f6', color: '#374151',
  border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px',
  fontWeight: '500', cursor: 'pointer'
};

const AdminModal = ({ title, subtitle, onClose, width = 720, footer, children }) => {
  const panelRef = useRef(null);
  // Keep the latest onClose without re-running the mount effect (callers pass
  // inline arrows; re-running would re-focus the first field on every render).
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCloseRef.current?.(); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const first = panelRef.current?.querySelector(
      'input:not([disabled]):not([type=hidden]):not([type=checkbox]), select:not([disabled]), textarea:not([disabled])'
    );
    first?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '5vh 16px', zIndex: 1000
    }}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        style={{
          background: 'white', borderRadius: '12px', width: '100%', maxWidth: `${width}px`,
          maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)'
        }}
      >
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px',
          padding: '16px 20px', borderBottom: '1px solid #e5e7eb'
        }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: '600', margin: 0 }}>{title}</h3>
            {subtitle && <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>{subtitle}</div>}
          </div>
          <button
            type="button"
            onClick={() => onCloseRef.current?.()}
            aria-label="Close"
            title="Close (Esc)"
            style={{
              background: 'none', border: 'none', fontSize: '20px', lineHeight: 1,
              color: '#6b7280', cursor: 'pointer', padding: '2px 6px'
            }}
          >
            &#10005;
          </button>
        </div>

        <div style={{ padding: '18px 20px', overflowY: 'auto', flex: 1 }}>
          {children}
        </div>

        {footer && (
          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: '8px',
            padding: '12px 20px', borderTop: '1px solid #e5e7eb', background: '#f9fafb',
            borderRadius: '0 0 12px 12px'
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminModal;
