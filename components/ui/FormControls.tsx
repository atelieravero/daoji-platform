import React from 'react';
import { LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  helperText?: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  helperText?: string;
}

export function FormInput({ 
  label, 
  error, 
  icon: Icon, 
  helperText, 
  className = '', 
  id, 
  ...props 
}: InputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-semibold text-gray-950">
          {label}
        </label>
      )}
      
      <div className="relative rounded-lg shadow-sm">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        
        <input
          id={inputId}
          className={`
            w-full bg-white text-gray-950 placeholder-gray-400 border rounded-lg text-sm
            transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500
            ${Icon ? 'pl-10 pr-3 py-2' : 'px-3 py-2'}
            ${error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500'}
            ${className}
          `}
          {...props}
        />
      </div>

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      {helperText && !error && <p className="text-xs text-gray-500 mt-1">{helperText}</p>}
    </div>
  );
}

export function FormSelect({ 
  label, 
  error, 
  icon: Icon, 
  helperText, 
  children, 
  className = '', 
  id, 
  ...props 
}: SelectProps) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-semibold text-gray-950">
          {label}
        </label>
      )}
      
      <div className="relative rounded-lg shadow-sm">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        
        <select
          id={selectId}
          className={`
            w-full bg-white text-gray-950 border rounded-lg text-sm appearance-none
            transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500
            ${Icon ? 'pl-10 pr-10 py-2' : 'px-3 py-2'}
            ${error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500'}
            ${className}
          `}
          {...props}
        >
          {children}
        </select>
      </div>

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      {helperText && !error && <p className="text-xs text-gray-500 mt-1">{helperText}</p>}
    </div>
  );
}