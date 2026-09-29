import React from 'react';
import { useNavigate, useParams } from 'react-router';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CULTIVATION_METHODS,
  CULTIVATION_METHOD_LABELS,
  POTENCIES,
  POTENCY_LABELS,
  PRODUCT_TAGS,
  TAG_META,
  productInput,
  slugify,
  toTitleCase,
  type AdminProduct,
  type ProductInput,
} from '@mingo/shared';
import type { z } from 'zod';
import { api } from '../../../lib/api';
import { qk } from '../../../lib/query-keys';
import MoneyInput from './MoneyInput';

type FormValues = z.input<typeof productInput>;
type ParsedValues = z.output<typeof productInput>;

const EMPTY_PRODUCT: FormValues = {
  name: '',
  slug: '',
  description: '',
  categoryId: '',
  priceCents: 0,
  salePriceCents: null,
  stock: 0,
  featured: false,
  awardWinning: false,
  isActive: true,
  tags: [],
  species: '',
  strain: '',
  potency: null,
  cultivationMethod: null,
  quantityLabel: '',
  origin: '',
  images: [],
};

const toFormValues = (product: AdminProduct): FormValues => ({
  name: product.name,
  slug: product.slug,
  description: product.description,
  categoryId: product.categoryId,
  priceCents: product.priceCents,
  salePriceCents: product.salePriceCents,
  stock: product.stock,
  featured: product.featured,
  awardWinning: product.awardWinning,
  isActive: product.isActive,
  tags: product.tags,
  species: product.species ?? '',
  strain: product.strain ?? '',
  potency: product.potency,
  cultivationMethod: product.cultivationMethod,
  quantityLabel: product.quantityLabel ?? '',
  origin: product.origin ?? '',
  images: product.images.map((image) => ({ url: image.url, alt: image.alt ?? '' })),
});

const FieldError: React.FC<{ message?: string }> = ({ message }) =>
  message ? <span className="admin-field-error">{message}</span> : null;

const ProductFormPage: React.FC = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const product = useQuery({
    queryKey: qk.admin.product(id ?? ''),
    queryFn: () => api.admin.product(id!),
    enabled: isEditing,
  });
  const categories = useQuery({ queryKey: qk.admin.categories, queryFn: api.admin.categories });

  const form = useForm<FormValues, unknown, ParsedValues>({
    resolver: zodResolver(productInput),
    defaultValues: EMPTY_PRODUCT,
    values: product.data ? toFormValues(product.data) : undefined,
  });
  const { register, control, handleSubmit, formState } = form;
  const images = useFieldArray({ control, name: 'images' });
  const nameValue = useWatch({ control, name: 'name' });
  const imageValues = useWatch({ control, name: 'images' });
  const errors = formState.errors;

  const save = useMutation({
    mutationFn: (values: ParsedValues) => {
      const input = values as ProductInput;
      return isEditing ? api.admin.updateProduct(id!, input) : api.admin.createProduct(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.admin.all });
      queryClient.invalidateQueries({ queryKey: qk.products.all });
      navigate('/admin/products');
    },
  });

  // Subcategorias aparecem logo abaixo da categoria mãe
  const categoryOptions = (categories.data ?? [])
    .filter((category) => !category.parentId)
    .flatMap((parent) => [
      { id: parent.id, label: parent.name },
      ...(categories.data ?? [])
        .filter((child) => child.parentId === parent.id)
        .map((child) => ({ id: child.id, label: `${parent.name} › ${child.name}` })),
    ]);

  if (isEditing && product.isLoading) return <div className="loading">Carregando produto...</div>;

  return (
    <>
      <div className="admin-page-header">
        <h1>{isEditing ? 'Editar produto' : 'Novo produto'}</h1>
        <button className="admin-btn secondary" onClick={() => navigate('/admin/products')}>
          Voltar
        </button>
      </div>

      {save.error && <div className="admin-alert">{save.error.message}</div>}

      <form className="admin-form" onSubmit={handleSubmit((values) => save.mutate(values))}>
        <div className="admin-card">
          <h2>Informações</h2>
          <div className="admin-form">
            <div className="admin-form-grid">
              <div className="admin-field">
                <label htmlFor="name">Nome *</label>
                <input id="name" {...register('name')} />
                <FieldError message={errors.name?.message} />
              </div>
              <div className="admin-field">
                <label htmlFor="slug">Slug (endereço)</label>
                <input
                  id="slug"
                  placeholder={slugify(nameValue || '') || 'gerado a partir do nome'}
                  {...register('slug')}
                />
                <FieldError message={errors.slug?.message} />
              </div>
              <div className="admin-field">
                <label htmlFor="categoryId">Categoria *</label>
                <select id="categoryId" {...register('categoryId')}>
                  <option value="">Selecione...</option>
                  {categoryOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <FieldError message={errors.categoryId?.message} />
              </div>
            </div>
            <div className="admin-field">
              <label htmlFor="description">Descrição *</label>
              <textarea id="description" {...register('description')} />
              <FieldError message={errors.description?.message} />
            </div>
          </div>
        </div>

        <div className="admin-card">
          <h2>Preço e estoque</h2>
          <div className="admin-form-grid">
            <div className="admin-field">
              <label htmlFor="priceCents">Preço (R$) *</label>
              <Controller
                control={control}
                name="priceCents"
                render={({ field }) => (
                  <MoneyInput id="priceCents" value={field.value} onChange={field.onChange} />
                )}
              />
              <FieldError message={errors.priceCents?.message} />
            </div>
            <div className="admin-field">
              <label htmlFor="salePriceCents">Preço promocional (R$)</label>
              <Controller
                control={control}
                name="salePriceCents"
                render={({ field }) => (
                  <MoneyInput
                    id="salePriceCents"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="sem promoção"
                  />
                )}
              />
              <FieldError message={errors.salePriceCents?.message} />
            </div>
            <div className="admin-field">
              <label htmlFor="stock">Estoque *</label>
              <input
                id="stock"
                type="number"
                min="0"
                {...register('stock', { valueAsNumber: true })}
              />
              <FieldError message={errors.stock?.message} />
            </div>
          </div>
        </div>

        <div className="admin-card">
          <h2>Vitrine</h2>
          <div className="admin-form">
            <div className="admin-checks">
              <label>
                <input type="checkbox" {...register('isActive')} /> Ativo (visível na loja)
              </label>
              <label>
                <input type="checkbox" {...register('featured')} /> Destaque
              </label>
              <label>
                <input type="checkbox" {...register('awardWinning')} /> Premiado
              </label>
            </div>
            <div className="admin-field">
              <label>Tags</label>
              <div className="admin-checks">
                {PRODUCT_TAGS.map((tag) => (
                  <label key={tag}>
                    <input type="checkbox" value={tag} {...register('tags')} />{' '}
                    {toTitleCase(TAG_META[tag].label)}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="admin-card">
          <h2>Informações do cogumelo</h2>
          <div className="admin-form-grid">
            <div className="admin-field">
              <label htmlFor="species">Espécie</label>
              <input id="species" {...register('species')} />
            </div>
            <div className="admin-field">
              <label htmlFor="strain">Strain</label>
              <input id="strain" {...register('strain')} />
            </div>
            <div className="admin-field">
              <label htmlFor="potency">Potência</label>
              <select
                id="potency"
                {...register('potency', { setValueAs: (value) => value || null })}
              >
                <option value="">—</option>
                {POTENCIES.map((potency) => (
                  <option key={potency} value={potency}>
                    {POTENCY_LABELS[potency]}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-field">
              <label htmlFor="cultivationMethod">Método de cultivo</label>
              <select
                id="cultivationMethod"
                {...register('cultivationMethod', { setValueAs: (value) => value || null })}
              >
                <option value="">—</option>
                {CULTIVATION_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {CULTIVATION_METHOD_LABELS[method]}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-field">
              <label htmlFor="quantityLabel">Quantidade (ex.: 10ml)</label>
              <input id="quantityLabel" {...register('quantityLabel')} />
            </div>
            <div className="admin-field">
              <label htmlFor="origin">Origem</label>
              <input id="origin" {...register('origin')} />
            </div>
          </div>
        </div>

        <div className="admin-card">
          <h2>Imagens</h2>
          <p className="admin-muted">
            URLs https:// ou caminhos do site (ex.: /placeholders/seringa-esporos.svg). A primeira é
            a capa.
          </p>
          <div className="admin-form">
            {images.fields.map((field, index) => (
              <div key={field.id} className="admin-image-row">
                <img src={imageValues?.[index]?.url || undefined} alt="" />
                <input
                  className="admin-input"
                  placeholder="URL da imagem"
                  {...register(`images.${index}.url`)}
                />
                <input
                  className="admin-input"
                  placeholder="Texto alternativo"
                  {...register(`images.${index}.alt`)}
                />
                <button
                  type="button"
                  className="admin-btn secondary small"
                  disabled={index === 0}
                  onClick={() => images.move(index, index - 1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="admin-btn secondary small"
                  disabled={index === images.fields.length - 1}
                  onClick={() => images.move(index, index + 1)}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="admin-btn secondary small"
                  onClick={() => images.remove(index)}
                >
                  Remover
                </button>
              </div>
            ))}
            <FieldError
              message={
                errors.images?.message ?? errors.images?.find?.((image) => image?.url)?.url?.message
              }
            />
            <div>
              <button
                type="button"
                className="admin-btn secondary small"
                disabled={images.fields.length >= 8}
                onClick={() => images.append({ url: '', alt: '' })}
              >
                + Adicionar imagem
              </button>
            </div>
          </div>
        </div>

        <div className="admin-form-actions">
          <button
            type="button"
            className="admin-btn secondary"
            onClick={() => navigate('/admin/products')}
          >
            Cancelar
          </button>
          <button type="submit" className="admin-btn" disabled={save.isPending}>
            {save.isPending ? 'Salvando...' : 'Salvar produto'}
          </button>
        </div>
      </form>
    </>
  );
};

export default ProductFormPage;
