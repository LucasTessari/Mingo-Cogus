import React, { useState } from 'react';
import { useRegister } from '../../hooks/useSession';
import AuthCard, { AuthField } from './AuthCard';

interface RegisterProps {
  onSwitchToLogin: () => void;
  onClose: () => void;
  onSuccess: () => void;
}

const Register: React.FC<RegisterProps> = ({ onSwitchToLogin, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const register = useRegister();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    register.reset();

    if (password !== confirmPassword) {
      return setValidationError('As senhas não coincidem');
    }

    if (password.length < 6) {
      return setValidationError('A senha deve ter pelo menos 6 caracteres');
    }

    register.mutate({ name, email, password }, { onSuccess });
  };

  const error =
    validationError || (register.error ? register.error.message || 'Erro ao criar conta' : '');

  return (
    <AuthCard
      title="Cadastro"
      error={error}
      loading={register.isPending}
      submitLabel="Cadastrar"
      loadingLabel="Cadastrando..."
      switchPrompt="Já tem uma conta?"
      switchLabel="Faça login"
      onSwitch={onSwitchToLogin}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <AuthField id="name" label="Nome" type="text" value={name} onChange={setName} />
      <AuthField id="email" label="Email" type="email" value={email} onChange={setEmail} />
      <AuthField
        id="password"
        label="Senha"
        type="password"
        value={password}
        onChange={setPassword}
      />
      <AuthField
        id="confirmPassword"
        label="Confirmar Senha"
        type="password"
        value={confirmPassword}
        onChange={setConfirmPassword}
      />
    </AuthCard>
  );
};

export default Register;
