import React from 'react';
import { AlertTriangle, Trash2, Info } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar Exclusão',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <Trash2 className="w-6 h-6 text-rose-500" />,
          iconBg: 'bg-rose-500/10 border-rose-500/20 text-rose-500',
          btnConfirm:
            'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/25 border-rose-700',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-amber-500" />,
          iconBg: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
          btnConfirm:
            'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/25 border-amber-700',
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-6 h-6 text-blue-500" />,
          iconBg: 'bg-blue-500/10 border-blue-500/20 text-blue-500',
          btnConfirm:
            'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 border-blue-700',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="space-y-4">
        {/* Header Icon + Description */}
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border ${styles.iconBg}`}
          >
            {styles.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {message}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            disabled={isLoading}
            className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all ${styles.btnConfirm}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};
