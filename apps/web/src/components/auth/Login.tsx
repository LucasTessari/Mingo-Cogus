import React, { useState } from 'react';
import { useLogin } from '../../hooks/useSession';
import AuthCard, { AuthField } from './AuthCard';

interface LoginProps {
  onSwitchToRegister: () => void;
  onClose: () => void;
  onSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onSwitchToRegister, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ email, password }, { onSuccess });
  };

  return (
    <AuthCard
      title="Login"
      error={login.error ? login.error.message || 'Erro ao fazer login' : ''}
      loading={login.isPending}
      submitLabel="Entrar"
      loadingLabel="Entrando..."
      switchPrompt="Não tem uma conta?"
      switchLabel="Cadastre-se"
      onSwitch={onSwitchToRegister}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <AuthField id="email" label="Email" type="email" value={email} onChange={setEmail} />
      <AuthField
        id="password"
        label="Senha"
        type="password"
        value={password}
        onChange={setPassword}
      />
    </AuthCard>
  );
};

export default Login;
