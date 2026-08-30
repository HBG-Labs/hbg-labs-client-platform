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
    'rounded-full font-medium transition-all duration-200 ease-out',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
    'disabled:pointer-events-none disabled:opacity-50',
    // Empêche les icônes de rétrécir quand le libellé est long.
    '[&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        primary:
          'bg-ink text-white hover:opacity-[0.88] hover:scale-[1.02] active:scale-[0.98]',
        secondary:
          'bg-surface-muted text-foreground hover:bg-border border border-border',
        outline:
          'border border-ink/20 bg-transparent text-foreground hover:bg-ink/5 hover:border-ink',
        accent:
          'bg-accent text-white hover:opacity-[0.88] hover:scale-[1.02]',
        ghost: 'bg-transparent text-foreground hover:bg-ink/5',
        danger: 'bg-danger text-white hover:opacity-90',
        link: 'bg-transparent text-accent underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-10 px-5 text-[14px] [&_svg]:size-4',
        md: 'h-11 px-6 text-sm [&_svg]:size-4',
        lg: 'h-14 px-10 text-[15px] [&_svg]:size-5',
        xl: 'h-16 px-12 text-base [&_svg]:size-5',
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
