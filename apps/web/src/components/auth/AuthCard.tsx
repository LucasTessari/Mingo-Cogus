import React, { type ReactNode } from 'react';
import '../../styles/legacy/components/auth/Auth.css';

interface AuthFieldProps {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
}

export const AuthField: React.FC<AuthFieldProps> = ({ id, label, type, value, onChange }) => (
  <div className="form-group">
    <label htmlFor={id}>{label}</label>
    <input type={type} id={id} value={value} onChange={(e) => onChange(e.target.value)} required />
  </div>
);

interface AuthCardProps {
  title: string;
  error: string;
  loading: boolean;
  submitLabel: string;
  loadingLabel: string;
  switchPrompt: string;
  switchLabel: string;
  onSwitch: () => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  children: ReactNode;
}

// Estrutura comum dos formulários de login e cadastro
const AuthCard: React.FC<AuthCardProps> = ({
  title,
  error,
  loading,
  submitLabel,
  loadingLabel,
  switchPrompt,
  switchLabel,
  onSwitch,
  onClose,
  onSubmit,
  children,
}) => (
  <div className="auth-container">
    <div className="auth-header">
      <h2>{title}</h2>
      <button className="close-btn" onClick={onClose}>
        ×
      </button>
    </div>

    <form onSubmit={onSubmit} className="auth-form">
      {error && <div className="auth-error">{error}</div>}

      {children}

      <button type="submit" disabled={loading} className="auth-btn">
        {loading ? loadingLabel : submitLabel}
      </button>

      <div className="auth-switch">
        {switchPrompt}
        <button type="button" onClick={onSwitch} className="switch-btn">
          {switchLabel}
        </button>
      </div>
    </form>
  </div>
);

export default AuthCard;
