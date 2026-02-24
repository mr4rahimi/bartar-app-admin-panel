// src/components/ui/input.tsx
import React from 'react';
type Props = React.InputHTMLAttributes<HTMLInputElement>;
export const Input: React.FC<Props> = (props) => (
  <input {...props} className={`border p-2 rounded ${props.className ?? ''}`} />
);
export default Input;