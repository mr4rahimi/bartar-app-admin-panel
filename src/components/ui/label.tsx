// src/components/ui/label.tsx
import React from 'react';
export const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({ children, className='' }) => (
  <label className={`block text-sm font-medium mb-1 ${className}`}>{children}</label>
);
export default Label;