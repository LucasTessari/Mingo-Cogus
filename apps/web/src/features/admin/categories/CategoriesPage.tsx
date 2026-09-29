import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { slugify, type AdminCategory, type CategoryInput } from '@mingo/shared';
import { api } from '../../../lib/api';
import { qk } from '../../../lib/query-keys';
import { CATEGORY_ICONS } from '../../../components/layout/categoryIcons';

const ICON_KEYS = Object.keys(CATEGORY_ICONS);

const emptyForm = (): CategoryInput => ({
  name: '',
  slug: '',
  description: '',
  iconKey: 'default',
  sortOrder: 0,
  isActive: true,
  parentId: null,
});

const toForm = (category: AdminCategory): CategoryInput => ({
  name: category.name,
  slug: category.slug,
  description: category.description ?? '',
  iconKey: category.iconKey ?? 'default',
  imageUrl: category.imageUrl,
  sortOrder: category.sortOrder,
  isActive: category.isActive,
  parentId: category.parentId,
});

const CategoriesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const categories = useQuery({ queryKey: qk.admin.categories, queryFn: api.admin.categories });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryInput | null>(null);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: qk.admin.categories });
    queryClient.invalidateQueries({ queryKey: qk.categories });
    queryClient.invalidateQueries({ queryKey: qk.products.all });
  };

  const save = useMutation({
    mutationFn: (input: CategoryInput) =>
      editingId ? api.admin.updateCategory(editingId, input) : api.admin.createCategory(input),
    onSuccess: () => {
      refresh();
      setForm(null);
      setEditingId(null);
      setMessage({ type: 'success', text: 'Categoria salva.' });
    },
    onError: (error) => setMessage({ type: 'error', text: error.message }),
  });

  const remove = useMutation({
    mutationFn: api.admin.deleteCategory,
    onSuccess: () => {
      refresh();
      setMessage({ type: 'success', text: 'Categoria excluída.' });
    },
    onError: (error) => setMessage({ type: 'error', text: error.message }),
  });

  const all = categories.data ?? [];
  const topLevel = all.filter((category) => !category.parentId);
  // Árvore: cada categoria de topo seguida das suas subcategorias
  const rows = topLevel.flatMap((parent) => [
    { category: parent, depth: 0 },
    ...all
      .filter((child) => child.parentId === parent.id)
      .map((child) => ({ category: child, depth: 1 })),
  ]);

  const startEdit = (category?: AdminCategory) => {
    setMessage(null);
    setEditingId(category?.id ?? null);
    setForm(category ? toForm(category) : emptyForm());
  };

  const update = (changes: Partial<CategoryInput>) =>
    setForm((prev) => (prev ? { ...prev, ...changes } : prev));

  return (
    <>
      <div className="admin-page-header">
        <h1>Categorias</h1>
        <button className="admin-btn" onClick={() => startEdit()}>
          + Nova categoria
        </button>
      </div>

      {message && (
        <div className={`admin-alert ${message.type === 'success' ? 'success' : ''}`}>
          {message.text}
        </div>
      )}

      {form && (
        <div className="admin-card">
          <h2>{editingId ? 'Editar categoria' : 'Nova categoria'}</h2>
          <form
            className="admin-form"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate({ ...form, slug: form.slug || undefined });
            }}
          >
            <div className="admin-form-grid">
              <div className="admin-field">
                <label htmlFor="cat-name">Nome *</label>
                <input
                  id="cat-name"
                  value={form.name}
                  onChange={(e) => update({ name: e.target.value })}
                  required
                />
              </div>
              <div className="admin-field">
                <label htmlFor="cat-slug">Slug</label>
                <input
                  id="cat-slug"
                  value={form.slug ?? ''}
                  placeholder={slugify(form.name) || 'gerado a partir do nome'}
                  onChange={(e) => update({ slug: e.target.value })}
                />
              </div>
              <div className="admin-field">
                <label htmlFor="cat-parent">Categoria mãe</label>
                <select
                  id="cat-parent"
                  value={form.parentId ?? ''}
                  onChange={(e) => update({ parentId: e.target.value || null })}
                >
                  <option value="">Nenhuma (categoria de topo)</option>
                  {topLevel
                    .filter((category) => category.id !== editingId)
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="admin-field">
                <label htmlFor="cat-order">Ordem</label>
                <input
                  id="cat-order"
                  type="number"
                  value={form.sortOrder ?? 0}
                  onChange={(e) => update({ sortOrder: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="admin-field">
              <label htmlFor="cat-description">Descrição (aparece no menu)</label>
              <input
                id="cat-description"
                value={form.description ?? ''}
                onChange={(e) => update({ description: e.target.value })}
              />
            </div>
            <div className="admin-field">
              <label>Ícone</label>
              <div className="admin-checks">
                {ICON_KEYS.map((key) => (
                  <label key={key} title={key} style={{ flexDirection: 'column', gap: 2 }}>
                    <span style={{ transform: 'scale(0.6)', display: 'block', height: 40 }}>
                      {CATEGORY_ICONS[key]}
                    </span>
                    <span>
                      <input
                        type="radio"
                        name="iconKey"
                        checked={form.iconKey === key}
                        onChange={() => update({ iconKey: key })}
                      />{' '}
                      {key}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="admin-checks">
              <label>
                <input
                  type="checkbox"
                  checked={form.isActive ?? true}
                  onChange={(e) => update({ isActive: e.target.checked })}
                />{' '}
                Ativa
              </label>
            </div>
            <div className="admin-form-actions">
              <button type="button" className="admin-btn secondary" onClick={() => setForm(null)}>
                Cancelar
              </button>
              <button type="submit" className="admin-btn" disabled={save.isPending}>
                {save.isPending ? 'Salvando...' : 'Salvar categoria'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-card admin-table-wrapper">
        {categories.isLoading ? (
          <div className="loading">Carregando categorias...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Slug</th>
                <th>Produtos</th>
                <th>Situação</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ category, depth }) => (
                <tr key={category.id}>
                  <td style={{ paddingLeft: 12 + depth * 24 }}>
                    {depth > 0 && '↳ '}
                    <strong>{category.name}</strong>
                  </td>
                  <td className="admin-muted">{category.slug}</td>
                  <td>{category.productCount}</td>
                  <td>
                    <span className={`admin-pill ${category.isActive ? 'ok' : 'off'}`}>
                      {category.isActive ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button
                        className="admin-btn secondary small"
                        onClick={() => startEdit(category)}
                      >
                        Editar
                      </button>
                      <button
                        className="admin-btn secondary small"
                        onClick={() => {
                          if (window.confirm(`Excluir a categoria "${category.name}"?`))
                            remove.mutate(category.id);
                        }}
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};

export default CategoriesPage;
