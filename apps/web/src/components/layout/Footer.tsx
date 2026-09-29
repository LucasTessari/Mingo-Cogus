import React, { useState } from 'react';
import BrandLogos from '../common/BrandLogos';
import '../../styles/legacy/components/layout/Footer.css';

const EMPTY_NEWSLETTER_FORM = { nome: '', sobrenome: '', email: '' };

// Blocos de características (ícone de 24x24 desenhado por um único path)
const FEATURES = [
  {
    title: 'ESPÉCIES VARIADAS',
    description: 'Cogumelos com espécies diversas e consagradas para colecionadores exigentes.',
    iconPath:
      'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
  },
  {
    title: 'SEGURO E CONFIÁVEL',
    description: 'Envio sigiloso e proteção total dos seus dados em toda a experiência de compra.',
    iconPath:
      'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z',
  },
  {
    title: 'ENTREGA EM TODO BRASIL',
    description: 'Enviamos com rastreio e total discrição para qualquer região do Brasil.',
    iconPath:
      'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z',
  },
  {
    title: 'RAPIDEZ DE ENVIO',
    description: 'Pedidos despachados com agilidade e segurança, direto para você.',
    iconPath:
      'M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z',
  },
];

// Colunas de links do rodapé: [href, rótulo]
const ABOUT_LINKS = [
  ['#sobre', 'Sobre Nós'],
  ['#blog', 'Nosso Blog'],
  ['#bancos', 'Bancos de Semente'],
  ['#tipos', 'Tipos de Semente'],
  ['#colecao', 'Coleção Seis Pés'],
];

const INFO_LINKS = [
  ['#comprar', 'Como Comprar'],
  ['#pagamento', 'Formas de Pagamento'],
  ['#manual', 'Manual de Boas Práticas'],
  ['#faq', 'Perguntas Frequentes'],
  ['#atendimento', 'Atendimento ao Cliente'],
];

const INSTITUTIONAL_LINKS = [
  ['#termos', 'Termos e Condições'],
  ['#troca', 'Política de Troca'],
  ['#entrega', 'Política de Entrega'],
  ['#privacidade', 'Política de Privacidade'],
  ['#cookies', 'Política de Cookies'],
];

const TRUST_BADGES = [
  ['🛡️', 'Google SAFE BROWSING'],
  ['✓', 'GARANTIDO 100% QUALIDADE'],
  ['🔒', 'CERTIFICADO SSL'],
];

const LinkList: React.FC<{ links: string[][] }> = ({ links }) => (
  <ul className="footer-links">
    {links.map(([href, label]) => (
      <li key={href}>
        <a href={href}>{label}</a>
      </li>
    ))}
  </ul>
);

const Footer: React.FC = () => {
  const [newsletterForm, setNewsletterForm] = useState(EMPTY_NEWSLETTER_FORM);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aqui você pode adicionar a lógica para enviar o email
    console.log('Newsletter submitted:', newsletterForm);
    alert('Obrigado por se inscrever na nossa newsletter!');
    setNewsletterForm(EMPTY_NEWSLETTER_FORM);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewsletterForm((prev) => ({ ...prev, [name]: value }));
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="footer">
      {/* Seção Newsletter */}
      <div className="footer-newsletter">
        <div className="footer-newsletter-content">
          <h2 className="newsletter-title">CONECTE-SE CONOSCO, RECEBA NOSSA NEWSLETTER:</h2>
          <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
            <input
              type="text"
              name="nome"
              placeholder="Nome*"
              value={newsletterForm.nome}
              onChange={handleInputChange}
              required
              className="newsletter-input"
            />
            <input
              type="text"
              name="sobrenome"
              placeholder="Sobrenome*"
              value={newsletterForm.sobrenome}
              onChange={handleInputChange}
              required
              className="newsletter-input"
            />
            <input
              type="email"
              name="email"
              placeholder="Seu email *"
              value={newsletterForm.email}
              onChange={handleInputChange}
              required
              className="newsletter-input"
            />
            <button type="submit" className="newsletter-submit-btn">
              ENVIAR
            </button>
          </form>
        </div>
      </div>

      {/* Blocos de Características */}
      <div className="footer-features">
        <div className="footer-features-content">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="feature-block">
              <div className="feature-icon">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d={feature.iconPath} fill="currentColor" />
                </svg>
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Divisor Visual - Cogumelos */}
      <div className="footer-divider">
        <div className="footer-divider-content">
          <div className="mushroom-decoration"></div>
        </div>
      </div>

      {/* Rodapé Principal */}
      <div className="footer-main">
        <div className="footer-main-content">
          <div className="footer-columns">
            {/* Logo e Primeira Coluna */}
            <div className="footer-column footer-column-logo">
              <div className="footer-logo">
                <div className="footer-logos-wrapper">
                  <BrandLogos classPrefix="footer-" fallbackClassName="logo-text-fallback" />
                </div>
              </div>
              <div className="footer-column-content">
                <h4 className="footer-column-title">SOBRE A FLORA</h4>
                <LinkList links={ABOUT_LINKS} />
              </div>
            </div>

            {/* Segunda Coluna */}
            <div className="footer-column">
              <h4 className="footer-column-title">INFORMAÇÕES</h4>
              <LinkList links={INFO_LINKS} />
            </div>

            {/* Terceira Coluna */}
            <div className="footer-column">
              <h4 className="footer-column-title">INSTITUCIONAL</h4>
              <LinkList links={INSTITUTIONAL_LINKS} />
            </div>

            {/* Badges e Chat */}
            <div className="footer-column footer-column-badges">
              <div className="footer-badges">
                {TRUST_BADGES.map(([icon, text]) => (
                  <div key={text} className="footer-badge">
                    <div className="badge-icon">{icon}</div>
                    <span className="badge-text">{text}</span>
                  </div>
                ))}
              </div>
              <button className="footer-chat-btn" aria-label="Fale comigo">
                <div className="chat-icon">💬</div>
                <span className="chat-bubble">FALE COMIGO</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Barra Inferior */}
      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <p className="footer-copyright">© Mingo Cogus - Todos os direitos reservados</p>
          <div className="footer-social">
            <a href="#instagram" className="social-icon" aria-label="Instagram">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
            <a href="#telegram" className="social-icon" aria-label="Telegram">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
              </svg>
            </a>
            <button
              className="social-icon scroll-top-btn"
              onClick={scrollToTop}
              aria-label="Voltar ao topo"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
