import React from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import { useAuthModal } from '../../stores/auth-modal-store';
import Login from './Login';
import Register from './Register';
import '../../styles/legacy/components/auth/Auth.css';

// Modal de login/cadastro, aberto de qualquer lugar via useAuthModal
const AuthModal: React.FC = () => {
  const navigate = useNavigate();
  const { isOpen, view, redirectTo, setView, close } = useAuthModal();

  if (!isOpen) return null;

  const handleSuccess = () => {
    close();
    if (redirectTo) navigate(redirectTo);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      close();
    }
  };

  return createPortal(
    <div className="auth-modal-overlay" onClick={handleOverlayClick}>
      {view === 'login' ? (
        <Login
          onSwitchToRegister={() => setView('register')}
          onClose={close}
          onSuccess={handleSuccess}
        />
      ) : (
        <Register
          onSwitchToLogin={() => setView('login')}
          onClose={close}
          onSuccess={handleSuccess}
        />
      )}
    </div>,
    document.body,
  );
};

export default AuthModal;
