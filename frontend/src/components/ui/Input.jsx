import React from 'react';

export default function Input({ id, value, onChange, placeholder = '', type = 'text', className = '', ...rest }) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-white/60 border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-500 outline-none focus:border-accent transition-colors duration-150 ${className}`}
      {...rest}
    />
  );
}
