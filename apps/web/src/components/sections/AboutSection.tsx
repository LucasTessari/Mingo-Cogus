import React from 'react';
import { Link } from 'react-router';
import '../../styles/legacy/components/sections/AboutSection.css';

const AboutSection: React.FC = () => {
  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aqui você pode adicionar a lógica de inscrição na newsletter
    alert('Obrigado por se inscrever na nossa newsletter!');
  };

  return (
    <section className="about-section">
      <div className="about-container">
        {/* Lado Esquerdo - Ilustração/Logo */}
        <div className="about-illustration">
          <img
            src="/LogoMingoCogus_conheca.png"
            alt="Mingo Cogus - Ilustração"
            className="illustration-image"
          />
        </div>

        {/* Lado Direito - Conteúdo */}
        <div className="about-content">
          {/* Botão Superior */}
          <div className="about-header">
            <Link to="/products" className="about-header-button">
              CONHEÇA O MINGO
            </Link>
          </div>

          {/* Título Principal */}
          <h2 className="about-title">O CAMINHO DO COGUMELO</h2>

          {/* Texto Descritivo */}
          <p className="about-description">
            Sou um novato no mundo da micologia, todo dia buscando melhorar e aprender com minhas
            experiencias, sendo assim passei a fornecer um pouco do que produzo em meu jardim
            mistico para ajudar outros viajantes e exploradores a entrarem nesse mundo e terem uma
            experiencia inigualavel, pensando no fazendeiro que está aqui para cultivar o caminho do
            cogumelo também forneço utensilios e meios para facilitar seus primeiros cultivos. Então
            com espírito, valorizo amizade, liberdade e boas experiências, mostrando que o cultivo
            do cogumelo é o caminho. Venha para o lado Mingo da Força!
          </p>

          {/* Botão CTA Newsletter */}
          <form className="about-newsletter-form" onSubmit={handleNewsletterSubmit}>
            <button type="submit" className="about-cta-button">
              FIQUE POR DENTRO DAS NOVIDADES
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
