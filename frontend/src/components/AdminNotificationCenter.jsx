import React, { useContext } from 'react';
import { X, AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { AdminNotificationContext } from '../context/AdminNotificationContext';

export function AdminNotificationCenter() {
  const { notifications, removeNotification } = useContext(AdminNotificationContext);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-2 max-w-xs">
      {notifications.map((notif) => {
        const typeConfig = {
          info: {
            bg: 'bg-cyan-500/10',
            border: 'border-cyan-500/30',
            text: 'text-cyan-400',
            icon: Info,
          },
          success: {
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/30',
            text: 'text-emerald-400',
            icon: CheckCircle,
          },
          warning: {
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/30',
            text: 'text-amber-400',
            icon: AlertTriangle,
          },
          error: {
            bg: 'bg-red-500/10',
            border: 'border-red-500/30',
            text: 'text-red-400',
            icon: AlertCircle,
          },
        };

        const config = typeConfig[notif.type] || typeConfig.info;
        const Icon = config.icon;

        return (
          <div
            key={notif.id}
            className={`flex items-start gap-3 px-4 py-3 border rounded-lg ${config.bg} ${config.border} ${config.text} text-sm animate-slideIn`}
            role="alert"
          >
            <Icon size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
            <p className="flex-1 text-sm leading-relaxed">{notif.message}</p>
            <button
              onClick={() => removeNotification(notif.id)}
              className="shrink-0 hover:opacity-70 transition-opacity duration-150"
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
