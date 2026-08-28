import { cva } from 'class-variance-authority';

/**
 * Variantes visuelles du bouton, dans un module distinct du composant.
 *
 * Deux raisons :
 *   - le rafraîchissement à chaud de React n'opère que sur un fichier
 *     n'exportant que des composants ; y mêler une constante le désactive
 *     pour tout le fichier ;
 *   - un élément qui doit ressembler à un bouton sans en être un (un lien de
 *     navigation, par exemple) peut reprendre ces classes sans importer le
 *     composant.
 */
export const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'rounded-md font-medium transition-colors',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
    'disabled:pointer-events-none disabled:opacity-50',
    // Empêche les icônes de rétrécir quand le libellé est long.
    '[&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary-hover',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-surface-muted border border-border',
        outline:
          'border border-input bg-transparent text-foreground hover:bg-surface-muted',
        ghost: 'bg-transparent text-foreground hover:bg-surface-muted',
        danger: 'bg-danger text-white hover:opacity-90',
        link: 'bg-transparent text-primary underline-offset-4 hover:underline',
      },
      size: {
        // 44 px de haut : la cible tactile minimale recommandée pour un usage
        // au doigt (§40, §43).
        sm: 'h-9 px-3 text-sm [&_svg]:size-4',
        md: 'h-11 px-4 text-sm [&_svg]:size-4',
        lg: 'h-12 px-6 text-base [&_svg]:size-5',
        icon: 'h-11 w-11 [&_svg]:size-5',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);
