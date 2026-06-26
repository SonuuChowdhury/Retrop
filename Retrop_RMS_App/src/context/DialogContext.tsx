// ============================================================================
// DIALOG CONTEXT
// ============================================================================
// Centralized dialog system — replaces all Alert.alert() calls with a
// beautiful, on-brand, theme-aware dialog.
//
// USAGE:
//   const { showAlert, showConfirm, showSuccess, showError } = useDialog();
//
//   // Simple alert
//   showAlert('title', 'message');
//
//   // Typed alerts
//   showSuccess('Saved!', 'Changes saved successfully.');
//   showError('Failed', error.message);
//   showWarning('Warning', 'This action cannot be undone.');
//
//   // Confirmation with callbacks
//   showConfirm({
//     title: 'Delete Item',
//     message: 'This cannot be undone.',
//     confirmText: 'Delete',
//     destructive: true,
//     onConfirm: () => doDelete(),
//     onCancel: () => {}, // optional
//   });
// ============================================================================

import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react';
import { AppDialog, DialogConfig, DialogType } from '@/components/AppDialog';

// ─── Context shape ──────────────────────────────────────────────────────────

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface DialogContextType {
  /** Show a plain informational alert */
  showAlert: (title: string, message?: string) => void;
  /** Show a success alert */
  showSuccess: (title: string, message?: string) => void;
  /** Show an error alert */
  showError: (title: string, message?: string) => void;
  /** Show a warning alert */
  showWarning: (title: string, message?: string) => void;
  /** Show a confirm dialog with confirm/cancel buttons */
  showConfirm: (options: ConfirmOptions) => void;
  /** Low-level: show any custom dialog config */
  showDialog: (config: DialogConfig) => void;
  /** Imperatively dismiss the current dialog */
  dismissDialog: () => void;
}

// ─── Context ────────────────────────────────────────────────────────────────

const DialogContext = createContext<DialogContextType | undefined>(undefined);

// ─── Provider ───────────────────────────────────────────────────────────────

export function DialogProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<DialogConfig | null>(null);

  const showDialog = useCallback((cfg: DialogConfig) => {
    setConfig(cfg);
    setVisible(true);
  }, []);

  const dismissDialog = useCallback(() => {
    setVisible(false);
  }, []);

  // ── Convenience helpers ──────────────────────────────────────────────────

  const showAlert = useCallback((title: string, message?: string) => {
    showDialog({
      type: 'info',
      title,
      message,
      buttons: [{ text: 'OK', style: 'default' }],
    });
  }, [showDialog]);

  const showSuccess = useCallback((title: string, message?: string) => {
    showDialog({
      type: 'success',
      title,
      message,
      buttons: [{ text: 'OK', style: 'default' }],
    });
  }, [showDialog]);

  const showError = useCallback((title: string, message?: string) => {
    showDialog({
      type: 'error',
      title,
      message,
      buttons: [{ text: 'OK', style: 'default' }],
    });
  }, [showDialog]);

  const showWarning = useCallback((title: string, message?: string) => {
    showDialog({
      type: 'warning',
      title,
      message,
      buttons: [{ text: 'OK', style: 'default' }],
    });
  }, [showDialog]);

  const showConfirm = useCallback((opts: ConfirmOptions) => {
    showDialog({
      type: 'confirm',
      title: opts.title,
      message: opts.message,
      buttons: [
        {
          text: opts.cancelText ?? 'Cancel',
          style: 'cancel',
          onPress: opts.onCancel,
        },
        {
          text: opts.confirmText ?? 'Confirm',
          style: opts.destructive ? 'destructive' : 'default',
          onPress: opts.onConfirm,
        },
      ],
    });
  }, [showDialog]);

  return (
    <DialogContext.Provider
      value={{ showAlert, showSuccess, showError, showWarning, showConfirm, showDialog, dismissDialog }}
    >
      {children}
      <AppDialog visible={visible} config={config} onDismiss={dismissDialog} />
    </DialogContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useDialog(): DialogContextType {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used within a DialogProvider');
  return ctx;
}
