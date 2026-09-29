import { useEffect } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { qk } from '../lib/query-keys';
import { useCartStore } from '../stores/cart-store';

// Cotação do carrinho no servidor (preços, estoque e totais atuais).
// Também atualiza os dados guardados no carrinho com os valores do servidor.
export function useCartQuote() {
  const items = useCartStore((state) => state.items);
  const applyQuote = useCartStore((state) => state.applyQuote);
  const refs = items.map(({ productId, quantity }) => ({ productId, quantity }));

  const query = useQuery({
    queryKey: qk.cartQuote(refs),
    queryFn: () => api.cartQuote(refs),
    enabled: refs.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  });

  useEffect(() => {
    if (query.data) applyQuote(query.data);
  }, [query.data, applyQuote]);

  return query;
}
