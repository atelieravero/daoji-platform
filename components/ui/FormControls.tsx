import React from 'react';
import { LucideIcon, ChevronDown } from 'lucide-react';

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

interface ToggleProps {
  label?: string;
  helperText?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
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
            ${Icon ? 'pl-10 pr-9 py-2' : 'px-3 pr-9 py-2'}
            ${error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500'}
            ${className}
          `}
          {...props}
        >
          {children}
        </select>

        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      {helperText && !error && <p className="text-xs text-gray-500 mt-1">{helperText}</p>}
    </div>
  );
}

export function FormToggle({ label, helperText, checked, onChange, disabled = false }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-2 border-y border-gray-100">
      <div>
        {label && <span className="text-xs font-bold text-gray-900 block">{label}</span>}
        {helperText && <p className="text-[11px] text-gray-500 leading-tight mt-0.5">{helperText}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${checked ? 'bg-indigo-600' : 'bg-gray-200'}`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}