// src/components/ui/textarea.tsx
import React from 'react';
type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement>;
export const Textarea: React.FC<Props> = (props) => (
  <textarea {...props} className={`border p-2 rounded ${props.className ?? ''}`} />
);
export default Textarea;