import React from 'react';
import ReactDOM from 'react-dom';
import { ToastMessage } from '../../types/index.js';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return ReactDOM.createPortal(
    <div className="toast-container" role="region" aria-label="Notifications">
      {toasts.map((toast) => {
        const getIcon = () => {
          switch (toast.type) {
            case 'success':
              return <CheckCircle className="toast-icon toast-icon-success" size={20} />;
            case 'error':
              return <AlertCircle className="toast-icon toast-icon-error" size={20} />;
            case 'warning':
              return <AlertTriangle className="toast-icon toast-icon-warning" size={20} />;
            case 'info':
            default:
              return <Info className="toast-icon toast-icon-info" size={20} />;
          }
        };

        return (
          <div
            key={toast.id}
            className={`toast-item toast-${toast.type}`}
            role="alert"
            aria-live="assertive"
          >
            <div className="toast-content">
              {getIcon()}
              <div className="toast-text">
                {toast.title && <div className="toast-title">{toast.title}</div>}
                <div className="toast-message">{toast.message}</div>
              </div>
            </div>
            <button
              type="button"
              className="toast-close-btn"
              onClick={() => onDismiss(toast.id)}
              aria-label="Close notification"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>,
    document.body
  );
};
