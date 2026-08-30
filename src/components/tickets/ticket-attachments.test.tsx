import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import type { TicketAttachment } from '@/services/attachments.service';
import type { PlatformRole } from '@/types/domain';

/**
 * Pièces jointes d'une demande (§35).
 *
 * Ce fichier couvre l'AFFICHAGE et rien d'autre. Qui peut lire, déposer ou
 * supprimer un fichier est décidé par les policies `ticket_attachments_*` et
 * par les policies Storage de la migration 15, vérifiées contre une vraie base
 * par `tests/rls/04-support-confidentiality.test.ts`.
 *
 * Les deux comptent, et pour une raison précise : le bouton de suppression
 * n'apparaît qu'aux administrateurs, mais ce n'est pas lui qui protège. S'il
 * s'affichait à tort, un client cliquerait sur une action que la base refuse —
 * il ne détruirait rien, il obtiendrait un message d'erreur incompréhensible.
 * C'est ce défaut d'affichage que l'on couvre ici.
 */

const state: {
  attachments: TicketAttachment[];
  role: PlatformRole | null;
} = { attachments: [], role: null };

const upload = vi.fn(async (..._args: unknown[]) => undefined);
const open = vi.fn();
const remove = vi.fn();

vi.mock('@/features/tickets/useAttachments', () => ({
  useTicketAttachments: () => ({
    data: state.attachments,
    isPending: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useUploadAttachment: () => ({
    mutateAsync: (...args: unknown[]) => upload(...args),
    isPending: false,
    isError: false,
    error: null,
  }),
  useDeleteAttachment: () => ({
    mutate: remove,
    isPending: false,
    isError: false,
    error: null,
  }),
  useOpenAttachment: () => ({
    mutate: open,
    isPending: false,
    isError: false,
    error: null,
  }),
}));

vi.mock('@/features/auth/useProfile', () => ({
  useProfile: () => ({ data: state.role ? { platform_role: state.role } : null }),
}));

function attachment(overrides: Partial<TicketAttachment> = {}): TicketAttachment {
  return {
    id: 'att-1',
    ticket_id: 'ticket-1',
    storage_path: 'org-1/ticket-1/8f14e45f-capture.png',
    file_name: 'capture.png',
    mime_type: 'image/png',
    size_bytes: 524_288,
    created_at: '2026-08-30T09:00:00.000Z',
    uploaded_by: 'user-1',
    author: { full_name: 'Marie Dupont', email: 'marie@exemple.fr' },
    ...overrides,
  };
}

beforeEach(() => {
  state.attachments = [];
  state.role = null;
  upload.mockClear();
  open.mockClear();
  remove.mockClear();
});

async function render(props: Partial<{ readOnly: boolean }> = {}) {
  const { TicketAttachments } = await import('./TicketAttachments');
  renderWithProviders(
    <TicketAttachments ticketId="ticket-1" organizationId="org-1" {...props} />,
  );
}

describe('Liste', () => {
  it('affiche le nom, la taille et l’auteur', async () => {
    state.attachments = [attachment()];
    await render();

    expect(screen.getByText('capture.png')).toBeInTheDocument();
    expect(screen.getByText(/512(\s|,)?[0-9]*\s*Kio/)).toBeInTheDocument();
    expect(screen.getByText(/Marie Dupont/)).toBeInTheDocument();
  });

  it('annonce l’absence de pièce jointe avec le plafond', async () => {
    await render();

    expect(screen.getByText(/Aucune pièce jointe/)).toBeInTheDocument();
    expect(screen.getByText(/25 Mo par fichier/)).toBeInTheDocument();
  });

  it('demande une URL signée au clic plutôt qu’un lien permanent', async () => {
    // Le bucket est privé : aucune adresse n'est affichée dans la page, et le
    // lien n'existe qu'après le clic, pour une minute.
    state.attachments = [attachment()];
    await render();

    expect(screen.queryByRole('link', { name: /capture\.png/ })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Télécharger/ }));
    expect(open).toHaveBeenCalledWith(state.attachments[0]);
  });
});

describe('Suppression', () => {
  it('n’est pas proposée à un client', async () => {
    state.attachments = [attachment()];
    state.role = null;
    await render();

    expect(
      screen.queryByRole('button', { name: /Supprimer/ }),
    ).not.toBeInTheDocument();
  });

  it('n’est pas proposée à un membre du personnel sans droit d’administration', async () => {
    // `ticket_attachments_delete_staff` exige `is_platform_admin`, c'est-à-dire
    // OWNER ou ADMIN. Un rôle SUPPORT verrait le bouton échouer.
    state.attachments = [attachment()];
    state.role = 'SUPPORT';
    await render();

    expect(
      screen.queryByRole('button', { name: /Supprimer/ }),
    ).not.toBeInTheDocument();
  });

  it('est proposée à un administrateur plateforme', async () => {
    state.attachments = [attachment()];
    state.role = 'ADMIN';
    await render();

    await userEvent.click(screen.getByRole('button', { name: /Supprimer/ }));
    expect(remove).toHaveBeenCalledWith(state.attachments[0]);
  });
});

describe('Dépôt', () => {
  it('n’est pas proposé sur une demande close', async () => {
    state.attachments = [attachment()];
    await render({ readOnly: true });

    expect(
      screen.queryByRole('button', { name: /Ajouter un fichier/ }),
    ).not.toBeInTheDocument();

    // Les pièces déjà versées restent lisibles : clore une demande n'efface
    // pas son dossier.
    expect(screen.getByRole('button', { name: /Télécharger/ })).toBeInTheDocument();
  });

  it('transmet le fichier avec son organisation et sa demande', async () => {
    await render();

    const file = new File(['contenu'], 'devis.pdf', { type: 'application/pdf' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await userEvent.upload(input, file);

    expect(upload).toHaveBeenCalledWith({
      ticketId: 'ticket-1',
      organizationId: 'org-1',
      file,
    });
  });
});
