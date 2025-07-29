import React from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  rightText?: string;
}

export default function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  rightText,
  className,
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="text-gray-400">{leftIcon}</div>
          </div>
        )}
        <input
          className={clsx(
            'block w-full rounded-lg border bg-gray-800 text-white placeholder-gray-400',
            'focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors',
            error ? 'border-red-500' : 'border-gray-700 hover:border-gray-600',
            leftIcon ? 'pl-10' : 'pl-3',
            rightIcon || rightText ? 'pr-10' : 'pr-3',
            'py-2.5',
            className
          )}
          {...props}
        />
        {(rightIcon || rightText) && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {rightIcon && <div className="text-gray-400">{rightIcon}</div>}
            {rightText && <span className="text-sm text-gray-400">{rightText}</span>}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-400">{helperText}</p>
      )}
    </div>
  );
}