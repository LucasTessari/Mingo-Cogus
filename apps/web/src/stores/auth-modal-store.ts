import { create } from 'zustand';

type AuthView = 'login' | 'register';

interface AuthModalState {
  isOpen: boolean;
  view: AuthView;
  // Rota para onde ir depois de entrar (ex.: /checkout)
  redirectTo: string | null;
  open: (options?: { view?: AuthView; redirectTo?: string }) => void;
  setView: (view: AuthView) => void;
  close: () => void;
}

export const useAuthModal = create<AuthModalState>((set) => ({
  isOpen: false,
  view: 'login',
  redirectTo: null,
  open: ({ view = 'login', redirectTo } = {}) =>
    set({ isOpen: true, view, redirectTo: redirectTo ?? null }),
  setView: (view) => set({ view }),
  close: () => set({ isOpen: false, redirectTo: null }),
}));
