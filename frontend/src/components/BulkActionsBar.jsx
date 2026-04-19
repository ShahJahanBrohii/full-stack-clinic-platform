import { useContext } from 'react';
import { Trash2, FileDown, CheckSquare, Download, ChevronDown } from 'lucide-react';
import { AdminNotificationContext } from '../context/AdminNotificationContext';
import { exportBookingsToCSV, exportPatientsToCSV, exportServicesToCSV } from '../utils/exportData';

export function BulkActionsBar({
  selectedCount = 0,
  onBulkDelete,
  onBulkStatusChange,
  exportType = null,
  exportData = null,
  itemType = 'items',
  disableDelete = false,
  loading = false,
}) {
  const { addNotification } = useContext(AdminNotificationContext);
  const hasSelection = selectedCount > 0;

  const handleExport = () => {
    if (!exportData || !exportType) {
      addNotification('No data to export', 'warning');
      return;
    }

    try {
      if (exportType === 'bookings') {
        exportBookingsToCSV(exportData);
        addNotification(`Exported ${exportData.length} bookings successfully`, 'success');
      } else if (exportType === 'patients') {
        exportPatientsToCSV(exportData);
        addNotification(`Exported ${exportData.length} patients successfully`, 'success');
      } else if (exportType === 'services') {
        exportServicesToCSV(exportData);
        addNotification(`Exported ${exportData.length} services successfully`, 'success');
      }
    } catch (error) {
      addNotification('Failed to export data', 'error');
      console.error('Export error:', error);
    }
  };

  if (!hasSelection && !exportData) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 p-4 border border-white/10 bg-white/[0.01] rounded">
      {hasSelection && (
        <>
          <span className="text-xs font-semibold text-slate-400">
            {selectedCount} {itemType} selected
          </span>

          {onBulkStatusChange && !disableDelete && (
            <div className="relative group">
              <button
                className="flex items-center gap-2 px-3 py-2 text-xs font-bold tracking-widest uppercase border border-white/10 text-slate-400 hover:text-white hover:border-accent/50 transition-all duration-150"
                title="Change status for selected items"
              >
                <CheckSquare size={12} /> Change Status
                <ChevronDown size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <div className="absolute hidden group-hover:flex flex-col top-full left-0 mt-1 bg-bg-secondary border border-white/10 rounded shadow-lg z-10">
                {['pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
                  <button
                    key={status}
                    onClick={() => onBulkStatusChange(status)}
                    disabled={loading}
                    className="px-4 py-2 text-xs font-semibold text-left text-slate-400 hover:bg-accent/10 hover:text-accent transition-all duration-150 disabled:opacity-50 whitespace-nowrap"
                  >
                    Mark as {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {onBulkDelete && !disableDelete && (
            <button
              onClick={onBulkDelete}
              disabled={loading || disableDelete}
              className="flex items-center gap-2 px-3 py-2 bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold tracking-widest uppercase hover:bg-red-500/30 transition-all duration-150 disabled:opacity-50"
            >
              <Trash2 size={12} /> Delete {selectedCount}
            </button>
          )}
        </>
      )}

      {exportData && (
        <button
          onClick={handleExport}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border border-accent/30 text-accent text-xs font-bold tracking-widest uppercase hover:bg-accent/5 transition-all duration-150 disabled:opacity-50 ml-auto"
        >
          <Download size={12} /> Export {exportData.length > 0 ? `(${exportData.length})` : ''}
        </button>
      )}
    </div>
  );
}
