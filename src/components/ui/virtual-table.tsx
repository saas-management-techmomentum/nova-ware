import React, { useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';

interface Column<T> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  width?: number;
}

interface VirtualTableProps<T> {
  data: T[];
  columns: Column<T>[];
  getRowId: (row: T) => string;
  onRowClick?: (row: T) => void;
  height?: number;
  className?: string;
}

export function VirtualTable<T>({
  data,
  columns,
  getRowId,
  onRowClick,
  height = 600,
  className = ''
}: VirtualTableProps<T>) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Estimated row height
    overscan: 10,
  });

  const items = virtualizer.getVirtualItems();

  return (
    <div className={`border rounded-md ${className}`}>
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow>
            {columns.map((column) => (
              <TableHead 
                key={column.id}
                style={{ width: column.width }}
                className="border-b"
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
      </Table>
      
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ height }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {items.map((virtualItem) => {
            const row = data[virtualItem.index];
            return (
              <div
                key={getRowId(row)}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <Table>
                  <TableBody>
                    <TableRow
                      onClick={() => onRowClick?.(row)}
                      className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                    >
                      {columns.map((column) => (
                        <TableCell 
                          key={column.id}
                          style={{ width: column.width }}
                          className="border-b"
                        >
                          {column.cell 
                            ? column.cell(row)
                            : column.accessorKey 
                            ? String((row as any)[column.accessorKey] || '')
                            : ''
                          }
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}