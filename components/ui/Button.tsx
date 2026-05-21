import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  id?: string;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  disabled = false,
  type = 'button',
  id,
}: ButtonProps) {
  const baseClasses = 'btn-base rounded-sm font-heading';

  const variantClasses = {
    primary: 'bg-crimson text-white hover:bg-crimson-dark shadow-lg hover:shadow-xl',
    secondary: 'bg-espresso text-cream hover:bg-espresso-light shadow-lg hover:shadow-xl',
    outline: 'border-2 border-cream text-espresso hover:bg-cream hover:text-espresso',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  };

  return (
    <button
      id={id}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      {children}
    </button>
  );
}
