import React from 'react';

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

const AdminPagination: React.FC<AdminPaginationProps> = ({ page, totalPages, onChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="admin-pagination">
      <button
        className="admin-btn secondary small"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        ← Anterior
      </button>
      <span className="admin-muted">
        Página {page} de {totalPages}
      </span>
      <button
        className="admin-btn secondary small"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Próxima →
      </button>
    </div>
  );
};

export default AdminPagination;
