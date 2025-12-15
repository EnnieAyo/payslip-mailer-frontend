import { forwardRef, InputHTMLAttributes, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPasswordInput = type === 'password';
    const inputType = isPasswordInput && showPassword ? 'text' : type;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            {...props}
            type={inputType}
            ref={ref}
            className={`mt-1 block w-full px-3 py-2 ${isPasswordInput ? 'pr-10' : ''} border-2 border-gray-300 dark:border-dark-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-600 hover:border-primary-400 transition-colors duration-200 sm:text-sm bg-white dark:bg-dark-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-dark-600 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed ${
              error ? 'border-red-500 hover:border-red-600 focus:border-red-600 focus:ring-red-500' : ''
            } ${className}`}
          />
          {isPasswordInput && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
