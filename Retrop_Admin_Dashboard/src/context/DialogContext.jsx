import React, { createContext, useContext, useState } from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';

const DialogContext = createContext(null);

export function useDialog() {
  return useContext(DialogContext);
}

export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState({
    open: false,
    type: 'alert', // 'alert' | 'confirm'
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    resolve: null,
  });

  const showAlert = (message, title = 'Notification') => {
    return new Promise((resolve) => {
      setDialog({
        open: true,
        type: 'alert',
        title,
        message,
        confirmText: 'OK',
        cancelText: 'Cancel',
        resolve,
      });
    });
  };

  const showConfirm = (message, title = 'Are you sure?') => {
    return new Promise((resolve) => {
      setDialog({
        open: true,
        type: 'confirm',
        title,
        message,
        confirmText: 'Yes, proceed',
        cancelText: 'No, cancel',
        resolve,
      });
    });
  };

  const handleClose = (value) => {
    setDialog((prev) => ({ ...prev, open: false }));
    if (dialog.resolve) {
      dialog.resolve(value);
    }
  };

  return (
    <DialogContext.Provider value={{ alert: showAlert, confirm: showConfirm }}>
      {children}
      {dialog.open && (
        <div style={styles.overlay}>
          <style>{`
            @keyframes retropFadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes retropScaleIn {
              from { transform: scale(0.96); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
          `}</style>
          <div style={styles.modal}>
            <div style={styles.header}>
              <div style={styles.titleWrapper}>
                {dialog.type === 'confirm' ? (
                  <AlertTriangle size={22} color="#F59E0B" />
                ) : (
                  <Info size={22} color="#3B82F6" />
                )}
                <h3 style={styles.title}>{dialog.title}</h3>
              </div>
              <button onClick={() => handleClose(false)} style={styles.closeBtn}>
                <X size={18} />
              </button>
            </div>
            <div style={styles.body}>
              <p style={styles.message}>{dialog.message}</p>
            </div>
            <div style={styles.footer}>
              {dialog.type === 'confirm' && (
                <button onClick={() => handleClose(false)} style={styles.cancelBtn}>
                  {dialog.cancelText}
                </button>
              )}
              <button 
                onClick={() => handleClose(true)} 
                style={{
                  ...styles.confirmBtn,
                  backgroundColor: dialog.type === 'confirm' ? '#EF4444' : '#3B82F6'
                }}
              >
                {dialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px',
    animation: 'retropFadeIn 0.2s ease-out forwards',
  },
  modal: {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: '#1E293B',
    border: '1px solid #334155',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    animation: 'retropScaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  titleWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  title: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#F8FAFC',
    margin: 0,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#94A3B8',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  body: {
    marginBottom: '24px',
  },
  message: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#CBD5E1',
    margin: 0,
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  cancelBtn: {
    padding: '10px 18px',
    borderRadius: '8px',
    border: '1px solid #334155',
    backgroundColor: 'transparent',
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  confirmBtn: {
    padding: '10px 18px',
    borderRadius: '8px',
    border: 'none',
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  }
};
