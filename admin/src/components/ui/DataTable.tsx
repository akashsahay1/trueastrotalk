'use client';

import React from 'react';

export interface Column<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  className?: string;
  responsive?: 'always' | 'sm' | 'md' | 'lg' | 'xl';
  render?: (value: any, item: T, index: number) => React.ReactNode;
}

export interface TableAction<T = any> {
  label: string;
  icon?: string;
  className?: string;
  onClick: (item: T) => void;
  condition?: (item: T) => boolean;
}

interface DataTableProps<T = any> {
  data: T[];
  columns: Column<T>[];
  actions?: TableAction<T>[];
  loading?: boolean;
  selectable?: boolean;
  selectedItems?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  idField?: string;
  emptyMessage?: string;
  className?: string;
  responsive?: boolean;
  striped?: boolean;
  bordered?: boolean;
  hover?: boolean;
}

export default function DataTable<T extends Record<string, any>>({
  data,
  columns,
  actions = [],
  loading = false,
  selectable = false,
  selectedItems = [],
  onSelectionChange,
  idField = '_id',
  emptyMessage = 'No data available',
  className = '',
  responsive = true,
  striped = true,
  bordered = false,
  hover = false
}: DataTableProps<T>) {
  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    
    if (selectedItems.length === data.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(data.map(item => item[idField]));
    }
  };

  const handleSelectItem = (itemId: string) => {
    if (!onSelectionChange) return;
    
    if (selectedItems.includes(itemId)) {
      onSelectionChange(selectedItems.filter(id => id !== itemId));
    } else {
      onSelectionChange([...selectedItems, itemId]);
    }
  };

  const getResponsiveClass = (responsive?: string) => {
    switch (responsive) {
      case 'sm': return 'd-none d-sm-table-cell';
      case 'md': return 'd-none d-md-table-cell';
      case 'lg': return 'd-none d-lg-table-cell';
      case 'xl': return 'd-none d-xl-table-cell';
      default: return '';
    }
  };

  const tableClasses = [
    'table',
    'table-sm',
    striped && 'table-striped',
    bordered && 'table-bordered',
    hover && 'table-hover',
    className
  ].filter(Boolean).join(' ');

  const TableContent = () => (
    <table className={tableClasses}>
      <thead className="bg-light">
        <tr>
          {selectable && (
            <th className="text-center" style={{ width: '40px' }}>
              <input
                type="checkbox"
                checked={data.length > 0 && selectedItems.length === data.length}
                onChange={handleSelectAll}
                className="table-checkbox"
              />
            </th>
          )}
          {columns.map((column) => (
            <th
              key={column.key}
              className={`${column.className || ''} ${getResponsiveClass(column.responsive)}`}
              style={{ width: column.width }}
            >
              {column.label}
              {column.sortable && (
                <i className="fas fa-sort text-muted ml-1" style={{ fontSize: '0.8em' }}></i>
              )}
            </th>
          ))}
          {actions.length > 0 && (
            <th className="text-center" style={{ width: '100px' }}>
              Actions
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {loading ? (
          <tr>
            <td colSpan={columns.length + (selectable ? 1 : 0) + (actions.length > 0 ? 1 : 0)} className="text-center py-4">
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Loading...
            </td>
          </tr>
        ) : data.length > 0 ? (
          data.map((item, index) => (
            <tr key={item[idField] || index}>
              {selectable && (
                <td className="text-center">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item[idField])}
                    onChange={() => handleSelectItem(item[idField])}
                    className="table-checkbox"
                  />
                </td>
              )}
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`${column.className || ''} ${getResponsiveClass(column.responsive)}`}
                  data-label={column.label}
                >
                  {column.render ? 
                    column.render(item[column.key], item, index) :
                    item[column.key]
                  }
                </td>
              ))}
              {actions.length > 0 && (
                <td className="text-center">
                  <div className="btn-group btn-group-sm" role="group">
                    {actions
                      .filter(action => !action.condition || action.condition(item))
                      .map((action, actionIndex) => (
                        <button
                          key={actionIndex}
                          type="button"
                          className={`btn ${action.className || 'btn-outline-secondary'}`}
                          onClick={() => action.onClick(item)}
                          title={action.label}
                        >
                          {action.icon && <i className={action.icon}></i>}
                          {!action.icon && action.label}
                        </button>
                      ))}
                  </div>
                </td>
              )}
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={columns.length + (selectable ? 1 : 0) + (actions.length > 0 ? 1 : 0)} className="text-center py-4 text-muted">
              {emptyMessage}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );

  if (responsive) {
    return (
      <div className="table-responsive">
        <TableContent />
      </div>
    );
  }

  return <TableContent />;
}