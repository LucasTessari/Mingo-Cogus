import React, { useState } from 'react';
import { parseBRL } from '@mingo/shared';

interface MoneyInputProps {
  id?: string;
  value: number | null | undefined; // centavos
  onChange: (cents: number | null) => void;
  placeholder?: string;
}

const toText = (cents: number | null | undefined) =>
  cents == null ? '' : (cents / 100).toFixed(2).replace('.', ',');

// Campo em reais ("89,90") que entrega centavos (8990) ao formulário
const MoneyInput: React.FC<MoneyInputProps> = ({ id, value, onChange, placeholder = '0,00' }) => {
  const [text, setText] = useState(toText(value));
  const [emitted, setEmitted] = useState(value);

  // O valor mudou por fora (ex.: produto carregado): mostra o novo valor
  if (value !== emitted) {
    setEmitted(value);
    setText(toText(value));
  }

  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      placeholder={placeholder}
      value={text}
      onChange={(e) => {
        const cents = e.target.value.trim() ? parseBRL(e.target.value) : null;
        setText(e.target.value);
        setEmitted(cents);
        onChange(cents);
      }}
    />
  );
};

export default MoneyInput;
