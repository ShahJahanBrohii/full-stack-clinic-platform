import React from 'react';

export default function Button({ children, type = 'button', loading = false, variant = 'primary', className = '', ...rest }) {
  const base = 'flex items-center justify-center gap-3 font-bold text-sm tracking-widest uppercase py-3 px-4 rounded-md transition-all duration-200';

  const variants = {
    primary: 'bg-primary text-text-primary hover:bg-secondary disabled:opacity-50',
    secondary: 'bg-white border border-slate-200 text-slate-800 hover:shadow-glow-primary',
    ghost: 'bg-transparent text-primary hover:text-accent',
  };

  const cls = `${base} ${variants[variant] ?? variants.primary} ${className}`;

  return (
    <button type={type} className={cls} disabled={loading || rest.disabled} {...rest}>
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
        </>
      ) : (
        children
      )}
    </button>
  );
}
