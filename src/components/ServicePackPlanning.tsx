import React, { useEffect, useState } from 'react';

type PlanningRow = {
  product: string;
  statuses: Record<string, string>;
  note?: string;
};

const statusLabel = (status: string) => {
  switch (status) {
    case 'done':
      return 'Completed';
    case 'in-progress':
      return 'In progress';
    case 'blocked':
      return 'Blocked';
    default:
      return 'Yet to start';
  }
};

const normalizeStatus = (value: string) => {
  const normalized = value?.trim().toLowerCase();
  if (normalized === 'completed') return 'done';
  if (normalized === 'in progress' || normalized === 'in-progress') return 'in-progress';
  if (normalized === 'blocked') return 'blocked';
  return 'pending';
};

const splitCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
};

const displayProductVersion = (product: string) => product.replace(/^LTSC\s*/i, '');

const ServicePackPlanning: React.FC = () => {
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<PlanningRow[]>([]);

  useEffect(() => {
    fetch('/service-pack-planning.csv')
      .then((response) => response.text())
      .then((text) => {
        const lines = text.trim().split(/\r?\n/);
        if (lines.length < 2) return;

        const headerCells = splitCsvLine(lines[0]);
        const parsedColumns = headerCells.slice(1).map((cell) => cell || '');
        const parsedRows: PlanningRow[] = [];

        let lastRow: PlanningRow | null = null;
        for (let i = 1; i < lines.length; i += 1) {
          const cells = splitCsvLine(lines[i]);
          const product = cells[0]?.trim();
          if (!product) continue;

          if (product.toLowerCase() === 'plan') {
            const note = cells.slice(1).find((cell) => cell && cell.trim())?.trim() || '';
            if (lastRow && note) {
              lastRow.note = note.replace(/^Plan\s*/i, '').replace(/^Wk\s*/i, '').trim();
            }
            continue;
          }

          const statuses: Record<string, string> = {};
          parsedColumns.forEach((column, idx) => {
            statuses[column] = normalizeStatus(cells[idx + 1] || '');
          });

          const row = { product, statuses };
          parsedRows.push(row);
          lastRow = row;
        }

        setColumns(parsedColumns);
        setRows(parsedRows);
      })
      .catch((error) => {
        console.error('Failed to load planning CSV:', error);
      });
  }, []);

  return (
    <section className="planning-board">
      <div className="planning-header">
        <h2>Service Pack Planning</h2>
      </div>

      <div className="planning-grid">
        <div className="planning-grid__cell planning-grid__cell--header">Product</div>
        {columns.map((column) => (
          <div key={column} className="planning-grid__cell planning-grid__cell--header">
            {column}
          </div>
        ))}

        {rows.map((row) => (
          <React.Fragment key={row.product}>
            <div className="planning-grid__cell planning-grid__cell--product">
              <div>{displayProductVersion(row.product)}</div>
              {row.note && <div className="planning-note">{row.note}</div>}
            </div>
            {columns.map((column) => {
              const status = row.statuses[column] || 'pending';
              return (
                <div
                  key={`${row.product}-${column}`}
                  className={`planning-grid__cell planning-cell planning-cell--${status}`}
                >
                  <span>{statusLabel(status)}</span>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      <div className="planning-legend">
        <span className="planning-legend__item planning-legend__item--done">Completed</span>
        <span className="planning-legend__item planning-legend__item--in-progress">In progress</span>
        <span className="planning-legend__item planning-legend__item--pending">Yet to start</span>
        <span className="planning-legend__item planning-legend__item--blocked">Blocked</span>
      </div>
    </section>
  );
};

export default ServicePackPlanning;
