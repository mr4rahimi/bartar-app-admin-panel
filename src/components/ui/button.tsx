// src/components/ui/button.tsx
import React from 'react';
type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default'|'destructive' };
export const Button: React.FC<Props> = ({ children, className='', variant='default', ...rest }) => {
  const base = 'px-3 py-1 rounded shadow-sm text-sm';
  const style = variant === 'destructive' ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-blue-600 text-white hover:bg-blue-700';
  return <button className={`${base} ${style} ${className}`} {...rest}>{children}</button>;
};
export default Button;