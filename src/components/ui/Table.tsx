import { cn } from '@/lib/utils';

/**
 * Tableau de données, transformé en cartes sur mobile (§40).
 *
 * Un tableau à six colonnes sur un écran de 375 pixels ne se lit pas : soit il
 * déborde, soit ses colonnes deviennent illisibles. La bascule en cartes est
 * donc structurelle, pas décorative.
 *
 * Le tableau reste rendu en `<table>` sur grand écran, avec ses en-têtes
 * associés aux cellules : c'est ce qui permet à un lecteur d'écran d'annoncer
 * « Client : Boulangerie Martin » plutôt que de réciter des valeurs isolées.
 *
 * Usage :
 *
 *   <DataTable caption="Clients">
 *     <DataTableHead>
 *       <DataTableHeader>Client</DataTableHeader>
 *       <DataTableHeader align="right">Sites</DataTableHeader>
 *     </DataTableHead>
 *     <DataTableBody>
 *       {rows.map((row) => (
 *         <DataTableRow key={row.id}>
 *           <DataTableCell label="Client">{row.name}</DataTableCell>
 *           <DataTableCell label="Sites" align="right">{row.count}</DataTableCell>
 *         </DataTableRow>
 *       ))}
 *     </DataTableBody>
 *   </DataTable>
 */

export function DataTable({
  caption,
  className,
  children,
}: {
  /** Décrit le contenu pour les lecteurs d'écran. Obligatoire. */
  caption: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    // `overflow-x-auto` sur grand écran : une colonne de trop fait défiler le
    // tableau, jamais la page entière.
    <div className={cn('md:overflow-x-auto', className)}>
      <table className="w-full border-collapse text-sm max-md:block">
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  );
}

export function DataTableHead({ children }: { children: React.ReactNode }) {
  // Masqué sur mobile : chaque cellule porte alors son propre libellé.
  return (
    <thead className="max-md:hidden">
      <tr className="border-b border-border text-left">{children}</tr>
    </thead>
  );
}

export function DataTableHeader({
  children,
  align = 'left',
  className,
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={cn(
        'whitespace-nowrap px-4 py-3 font-medium text-muted first:pl-0 last:pr-0',
        align === 'right' && 'text-right',
        className,
      )}
    >
      {children}
    </th>
  );
}

export function DataTableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="max-md:block max-md:space-y-3">{children}</tbody>;
}

export function DataTableRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <tr
      className={cn(
        'border-b border-border last:border-b-0',
        'max-md:block max-md:rounded-lg max-md:border max-md:bg-surface max-md:p-4',
        className,
      )}
    >
      {children}
    </tr>
  );
}

export function DataTableCell({
  children,
  label,
  align = 'left',
  className,
}: {
  children: React.ReactNode;
  /**
   * Libellé de la colonne, affiché en regard de la valeur sur mobile.
   * Sans lui, la carte n'est qu'une liste de valeurs sans signification.
   */
  label: string;
  align?: 'left' | 'right';
  className?: string;
}) {
  return (
    <td
      className={cn(
        'px-4 py-3 align-middle first:pl-0 last:pr-0',
        align === 'right' && 'md:text-right',
        'max-md:flex max-md:items-baseline max-md:justify-between max-md:gap-4 max-md:px-0 max-md:py-1.5',
        className,
      )}
    >
      <span className="text-muted md:hidden" aria-hidden="true">
        {label}
      </span>
      <span className="max-md:text-right">{children}</span>
    </td>
  );
}
