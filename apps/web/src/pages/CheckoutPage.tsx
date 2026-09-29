import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  customerInfo as customerInfoSchema,
  formatPrice,
  shippingAddress as shippingAddressSchema,
  type CustomerInfo,
  type OrderDetail,
  type PaymentMethod,
  type ShippingAddressInput,
} from '@mingo/shared';
import { api } from '../lib/api';
import { ApiError } from '../lib/api-client';
import { qk } from '../lib/query-keys';
import { useCartStore } from '../stores/cart-store';
import { useAuthModal } from '../stores/auth-modal-store';
import { useCartQuote } from '../hooks/useCartQuote';
import { useSession } from '../hooks/useSession';
import LoadingSpinner from '../components/common/LoadingSpinner';
import '../styles/legacy/components/checkout/Checkout.css';

const STEP_LABELS = ['Informações', 'Entrega', 'Pagamento', 'Confirmação'];
const CONFIRMATION_STEP = 4;

const PAYMENT_OPTIONS: Array<{
  value: string;
  method: PaymentMethod;
  label: string;
  description: string;
}> = [
  {
    value: 'credit',
    method: 'CREDIT_CARD',
    label: '💳 Cartão de Crédito',
    description: 'Parcelamento em até 12x',
  },
  {
    value: 'debit',
    method: 'DEBIT_CARD',
    label: '🏦 Cartão de Débito',
    description: 'Pagamento à vista',
  },
  { value: 'pix', method: 'PIX', label: '📱 PIX', description: 'Pagamento instantâneo' },
];

const REQUIRED_CUSTOMER_FIELDS: Array<keyof CustomerInfo> = ['name', 'email', 'phone'];
const REQUIRED_ADDRESS_FIELDS: Array<keyof ShippingAddressInput> = [
  'street',
  'number',
  'neighborhood',
  'city',
  'state',
  'zipCode',
];

const EMPTY_ADDRESS: ShippingAddressInput = {
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  zipCode: '',
};

const errorStyle = {
  color: 'red',
  marginTop: '1rem',
  padding: '0.5rem',
  backgroundColor: '#ffebee',
  borderRadius: '4px',
};

const allFilled = <T,>(values: T, fields: Array<keyof T>) =>
  fields.every((field) => String(values[field] ?? '').trim() !== '');

const firstIssue = (result: {
  success: boolean;
  error?: { issues: Array<{ message: string }> };
}) => (result.success ? null : (result.error?.issues[0]?.message ?? 'Dados inválidos'));

interface FieldProps {
  id: string;
  label: string;
  value?: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  size?: 'large' | 'small';
}

const Field: React.FC<FieldProps> = ({
  id,
  label,
  value,
  onChange,
  type = 'text',
  required = true,
  size,
}) => (
  <div className={size ? `form-group ${size}` : 'form-group'}>
    <label htmlFor={id}>{label}</label>
    <input
      type={type}
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
    />
  </div>
);

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isLoading: sessionLoading } = useSession();
  const openAuthModal = useAuthModal((state) => state.open);
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clear);
  const quote = useCartQuote();

  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [customer, setCustomer] = useState<CustomerInfo>({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: '',
  });
  const [address, setAddress] = useState<ShippingAddressInput>(EMPTY_ADDRESS);
  const [payment, setPayment] = useState('credit');
  const [confirmedOrder, setConfirmedOrder] = useState<OrderDetail | null>(null);

  // Nome e email vêm da conta (inclusive se a sessão terminar de carregar depois)
  const [prefilledFor, setPrefilledFor] = useState(user?.id ?? null);
  if (user && prefilledFor !== user.id) {
    setPrefilledFor(user.id);
    setCustomer((prev) => ({
      ...prev,
      name: prev.name || user.name,
      email: prev.email || user.email,
    }));
  }
  // Mesma chave em novas tentativas do mesmo pedido: um clique duplo não cria dois pedidos
  const idempotencyKey = useRef(crypto.randomUUID());

  // Checkout exige login: sem sessão, volta ao carrinho com o login aberto
  useEffect(() => {
    if (!sessionLoading && !user && !confirmedOrder) {
      openAuthModal({ redirectTo: '/checkout' });
      navigate('/cart', { replace: true });
    }
  }, [sessionLoading, user, confirmedOrder, openAuthModal, navigate]);

  const createOrder = useMutation({
    mutationFn: (expectedTotalCents: number) =>
      api.createOrder(
        {
          items: items.map(({ productId, quantity }) => ({ productId, quantity })),
          customer,
          shippingAddress: address,
          paymentMethod: PAYMENT_OPTIONS.find((option) => option.value === payment)!.method,
          expectedTotalCents,
        },
        idempotencyKey.current,
      ),
    onSuccess: ({ order }) => {
      queryClient.invalidateQueries({ queryKey: qk.products.all });
      if (order.payment.status === 'DECLINED') {
        idempotencyKey.current = crypto.randomUUID();
        setError('Pagamento recusado. Tente outro método de pagamento.');
        return;
      }
      queryClient.invalidateQueries({ queryKey: qk.orders.all });
      setConfirmedOrder(order);
      setCurrentStep(CONFIRMATION_STEP);
      clearCart();
    },
    onError: (err) => {
      console.error('Erro ao criar pedido:', err);
      // Preço ou estoque mudou: nova chave e cotação atualizada para a próxima tentativa
      if (err instanceof ApiError && err.status === 409) {
        idempotencyKey.current = crypto.randomUUID();
        quote.refetch();
      }
      setError(err.message || 'Erro ao processar pedido. Tente novamente.');
    },
  });

  const setCustomerField = (field: keyof CustomerInfo) => (value: string) =>
    setCustomer((prev) => ({ ...prev, [field]: value }));

  const setAddressField = (field: keyof ShippingAddressInput) => (value: string) =>
    setAddress((prev) => ({ ...prev, [field]: value }));

  // Avança de etapa se os dados da etapa atual forem válidos
  const submitStep = (validate: () => string | null, nextStep: number) => (e: React.FormEvent) => {
    e.preventDefault();
    const message = validate();
    setError(message);
    if (!message) setCurrentStep(nextStep);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quote.data) return;
    setError(null);
    createOrder.mutate(quote.data.totalCents);
  };

  if (sessionLoading || (!user && !confirmedOrder)) {
    return <LoadingSpinner />;
  }

  if (items.length === 0 && currentStep !== CONFIRMATION_STEP) {
    return (
      <div className="checkout">
        <div className="empty-checkout">
          <h2>Finalizar Compra</h2>
          <p>Seu carrinho está vazio</p>
          <button className="back-to-cart-btn" onClick={() => navigate('/cart')}>
            Voltar para o Carrinho
          </button>
        </div>
      </div>
    );
  }

  const lines = quote.data?.lines ?? [];

  return (
    <div className="checkout">
      <div className="checkout-header">
        <h2>Finalizar Compra</h2>
        <div className="checkout-steps">
          {STEP_LABELS.map((label, index) => (
            <div key={label} className={`step ${currentStep >= index + 1 ? 'active' : ''}`}>
              <span>{index + 1}</span>
              <small>{label}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="checkout-content">
        {/* Step 1: Informações do Cliente */}
        {currentStep === 1 && (
          <div className="checkout-step">
            <h3>Informações Pessoais</h3>
            <form
              onSubmit={submitStep(() => firstIssue(customerInfoSchema.safeParse(customer)), 2)}
            >
              <Field
                id="name"
                label="Nome completo *"
                value={customer.name}
                onChange={setCustomerField('name')}
              />

              <div className="form-row">
                <Field
                  id="email"
                  type="email"
                  label="Email *"
                  value={customer.email}
                  onChange={setCustomerField('email')}
                />
                <Field
                  id="phone"
                  type="tel"
                  label="Telefone *"
                  value={customer.phone}
                  onChange={setCustomerField('phone')}
                />
              </div>

              {error && (
                <div className="error-message" style={errorStyle}>
                  {error}
                </div>
              )}

              <div className="checkout-actions">
                <button type="button" className="back-btn" onClick={() => navigate('/cart')}>
                  Voltar ao Carrinho
                </button>
                <button
                  type="submit"
                  className="next-btn"
                  disabled={!allFilled(customer, REQUIRED_CUSTOMER_FIELDS)}
                >
                  Continuar para Entrega
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Endereço de Entrega */}
        {currentStep === 2 && (
          <div className="checkout-step">
            <h3>Endereço de Entrega</h3>
            <form
              onSubmit={submitStep(() => firstIssue(shippingAddressSchema.safeParse(address)), 3)}
            >
              <div className="form-row">
                <Field
                  id="street"
                  size="large"
                  label="Rua *"
                  value={address.street}
                  onChange={setAddressField('street')}
                />
                <Field
                  id="number"
                  size="small"
                  label="Número *"
                  value={address.number}
                  onChange={setAddressField('number')}
                />
              </div>

              <Field
                id="complement"
                label="Complemento"
                required={false}
                value={address.complement}
                onChange={setAddressField('complement')}
              />

              <div className="form-row">
                <Field
                  id="neighborhood"
                  label="Bairro *"
                  value={address.neighborhood}
                  onChange={setAddressField('neighborhood')}
                />
                <Field
                  id="city"
                  label="Cidade *"
                  value={address.city}
                  onChange={setAddressField('city')}
                />
              </div>

              <div className="form-row">
                <Field
                  id="state"
                  label="Estado *"
                  value={address.state}
                  onChange={setAddressField('state')}
                />
                <Field
                  id="zipCode"
                  label="CEP *"
                  value={address.zipCode}
                  onChange={setAddressField('zipCode')}
                />
              </div>

              {error && (
                <div className="error-message" style={errorStyle}>
                  {error}
                </div>
              )}

              <div className="checkout-actions">
                <button
                  type="button"
                  className="back-btn"
                  onClick={() => {
                    setError(null);
                    setCurrentStep(1);
                  }}
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="next-btn"
                  disabled={!allFilled(address, REQUIRED_ADDRESS_FIELDS)}
                >
                  Continuar para Pagamento
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Pagamento */}
        {currentStep === 3 && (
          <div className="checkout-step">
            <h3>Método de Pagamento</h3>
            <form onSubmit={handleSubmit}>
              <div className="payment-methods">
                {PAYMENT_OPTIONS.map((option) => (
                  <label key={option.value} className="payment-option">
                    <input
                      type="radio"
                      name="payment"
                      value={option.value}
                      checked={payment === option.value}
                      onChange={() => setPayment(option.value)}
                    />
                    <span className="checkmark"></span>
                    <div className="payment-info">
                      <span>{option.label}</span>
                      <small>{option.description}</small>
                    </div>
                  </label>
                ))}
              </div>

              <div className="order-summary">
                <h4>Resumo do Pedido</h4>
                {lines.map((line) => (
                  <div key={line.productId} className="order-item">
                    <div className="item-info">
                      <span>{line.name}</span>
                      <small>Qtd: {line.quantity}</small>
                    </div>
                    <span>{formatPrice(line.lineTotalCents)}</span>
                  </div>
                ))}
                <div className="order-total">
                  <span>Total:</span>
                  <span>{formatPrice(quote.data?.totalCents ?? 0)}</span>
                </div>
              </div>

              {error && (
                <div className="error-message" style={errorStyle}>
                  {error}
                </div>
              )}

              <div className="checkout-actions">
                <button
                  type="button"
                  className="back-btn"
                  onClick={() => {
                    setError(null);
                    setCurrentStep(2);
                  }}
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="confirm-btn"
                  disabled={createOrder.isPending || !quote.data || quote.data.hasIssues}
                >
                  {createOrder.isPending ? 'Processando...' : 'Confirmar Pedido'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 4: Confirmação */}
        {currentStep === CONFIRMATION_STEP && (
          <div className="checkout-step confirmation">
            <div className="confirmation-content">
              <div className="success-icon">✅</div>
              <h3>Pedido Confirmado!</h3>
              <p>Obrigado pela sua compra. Seu pedido foi processado com sucesso.</p>
              {confirmedOrder && <p>Número do pedido: {confirmedOrder.orderNumber}</p>}
              {confirmedOrder?.payment.pixCode && (
                <p>Código PIX: {confirmedOrder.payment.pixCode}</p>
              )}
              <p>Você receberá um email de confirmação em breve.</p>

              <div className="confirmation-actions">
                <button className="continue-shopping" onClick={() => navigate('/products')}>
                  Continuar Comprando
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutPage;
