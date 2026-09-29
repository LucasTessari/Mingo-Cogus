# Ícones Personalizados

Esta pasta é para armazenar seus ícones personalizados.

## Formatos Suportados

- SVG (recomendado - melhor qualidade e escalabilidade)
- PNG (com fundo transparente)
- JPG (menos recomendado)

## Como Usar

### Opção 1: Colocar arquivo na pasta `assets/icons`

1. Coloque seu arquivo de ícone aqui (ex: `meu-icone.svg`)
2. No banco de dados ou dados pré-definidos, use apenas o nome do arquivo:
   ```javascript
   {
     name: 'Minha Subcategoria',
     slug: 'minha-subcategoria',
     icon: 'esporos', // chave do ícone padrão
     iconSrc: 'meu-icone.svg' // nome do arquivo na pasta assets/icons
   }
   ```

### Opção 2: Usar URL externa

```javascript
{
  name: 'Minha Subcategoria',
  slug: 'minha-subcategoria',
  icon: 'esporos', // fallback
  iconSrc: 'https://exemplo.com/icone.png' // URL completa
}
```

### Opção 3: Usar caminho relativo

```javascript
{
  name: 'Minha Subcategoria',
  slug: 'minha-subcategoria',
  icon: 'esporos', // fallback
  iconSrc: '/public/icons/meu-icone.svg' // caminho relativo
}
```

## Estrutura Recomendada

```
assets/
  icons/
    esporos/
      golden-teacher.svg
      b-plus.svg
    kits/
      iniciante.svg
      avancado.svg
```

## Dicas

- Use SVG sempre que possível para melhor qualidade
- Mantenha os ícones com tamanho similar (56x56px recomendado)
- Use cores que combinem com o tema do site
- Nomes de arquivos em minúsculas e com hífens (kebab-case)
