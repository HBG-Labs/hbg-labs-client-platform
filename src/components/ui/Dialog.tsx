import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Boîte de dialogue modale (§39).
 *
 * Radix fournit le piège de focus, la fermeture par Échap, le blocage du
 * défilement d'arrière-plan, le retour du focus sur l'élément déclencheur et
 * les liaisons ARIA. Une modale réécrite à la main perd presque toujours l'un
 * de ces quatre points, et la perte ne se voit qu'au clavier.
 *
 * `Dialog.Description` est exigée par Radix : son absence produit un
 * avertissement en console et prive les lecteurs d'écran du contexte.
 */

// Ces trois exports SONT des composants, mais l'analyse statique ne le voit
// pas : ce sont des réaffectations d'un objet importé, pas des déclarations.
// Le rafraîchissement à chaud n'en souffre pas ici, le fichier n'exportant
// rien d'autre que des composants.
/* eslint-disable react-refresh/only-export-components */
export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;
export const DialogClose = RadixDialog.Close;
/* eslint-enable react-refresh/only-export-components */

export function DialogContent({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/50" />

      <RadixDialog.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2',
          'max-h-[calc(100vh-4rem)] overflow-y-auto',
          'rounded-xl border border-border bg-surface p-6 shadow-xl',
          className,
        )}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <RadixDialog.Title className="text-lg font-semibold tracking-tight">
              {title}
            </RadixDialog.Title>
            <RadixDialog.Description className="mt-1 text-sm text-muted">
              {description}
            </RadixDialog.Description>
          </div>

          <RadixDialog.Close asChild>
            <button
              type="button"
              className="-mr-2 -mt-2 inline-flex size-11 shrink-0 items-center justify-center rounded-md text-muted hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              aria-label="Fermer"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </RadixDialog.Close>
        </div>

        {children}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}
