import React from 'react';
import { useToast } from '../../stores/toast-store';
import Notification from './Notification';

// Aviso global (ex.: sessão expirada), usando o componente Notification do site
const GlobalToast: React.FC = () => {
  const { message, type, hide } = useToast();
  if (!message) return null;
  return <Notification message={message} type={type} onClose={hide} duration={4000} />;
};

export default GlobalToast;
