import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import { AuthFailure } from '@/services/auth.service';

/**
 * Tests des écrans d'authentification (§9).
 *
 * L'accent porte sur ce qui a une conséquence de sécurité, pas sur la mise en
 * page : ne rien révéler sur l'existence d'un compte, ne transmettre aucun
 * rôle à l'inscription, exiger le mot de passe actuel pour en changer.
 *
 * Le service est simulé. Le chemin réel vers GoTrue est couvert par la
 * vérification manuelle décrite dans docs/SETUP.md, et l'isolation des données
 * par la suite RLS.
 */

const signIn = vi.fn(async (..._args: unknown[]) => ({}));
const signUp = vi.fn(async (..._args: unknown[]) => ({
  requiresEmailConfirmation: true,
}));
const requestPasswordReset = vi.fn(async (..._args: unknown[]) => undefined);

vi.mock('@/services/auth.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/auth.service')>();
  return {
    ...actual,
    signIn: (...args: unknown[]) => signIn(...args),
    signUp: (...args: unknown[]) => signUp(...args),
    requestPasswordReset: (...args: unknown[]) => requestPasswordReset(...args),
  };
});

const navigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => navigate };
});

beforeEach(() => {
  signIn.mockClear();
  signUp.mockClear();
  requestPasswordReset.mockClear();
  navigate.mockClear();
});

describe('Connexion', () => {
  it('exige une adresse et un mot de passe', async () => {
    const user = userEvent.setup();
    const { ConnexionPage } = await import('./ConnexionPage');
    renderWithProviders(<ConnexionPage />, { route: '/connexion' });

    await user.click(screen.getByRole('button', { name: /Se connecter/i }));

    expect(
      await screen.findByText('Renseignez votre adresse électronique.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Renseignez votre mot de passe.')).toBeInTheDocument();
    expect(signIn).not.toHaveBeenCalled();
  });

  it('ne révèle pas si le compte existe quand la connexion échoue', async () => {
    // Le message doit rester identique que l'adresse soit inconnue ou que le
    // mot de passe soit faux. Distinguer les deux donnerait un moyen de savoir
    // qui est client de HBG Labs.
    signIn.mockRejectedValueOnce(
      new AuthFailure('Adresse électronique ou mot de passe incorrect.', 'invalid_credentials'),
    );

    const user = userEvent.setup();
    const { ConnexionPage } = await import('./ConnexionPage');
    renderWithProviders(<ConnexionPage />, { route: '/connexion' });

    await user.type(screen.getByLabelText(/Adresse électronique/), 'inconnu@exemple.fr');
    await user.type(screen.getByLabelText(/Mot de passe/), 'MotDePasse123');
    await user.click(screen.getByRole('button', { name: /Se connecter/i }));

    const message = await screen.findByText(
      'Adresse électronique ou mot de passe incorrect.',
    );
    expect(message).toBeInTheDocument();

    // Aucune formulation ne doit trahir l'état du compte.
    expect(screen.queryByText(/n’existe pas/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/compte introuvable/i)).not.toBeInTheDocument();
  });

  it('propose de renvoyer la confirmation si l’adresse n’est pas vérifiée', async () => {
    signIn.mockRejectedValueOnce(
      new AuthFailure('Votre adresse n’est pas encore confirmée.', 'email_not_confirmed'),
    );

    const user = userEvent.setup();
    const { ConnexionPage } = await import('./ConnexionPage');
    renderWithProviders(<ConnexionPage />, { route: '/connexion' });

    await user.type(screen.getByLabelText(/Adresse électronique/), 'marie@exemple.fr');
    await user.type(screen.getByLabelText(/Mot de passe/), 'MotDePasse123');
    await user.click(screen.getByRole('button', { name: /Se connecter/i }));

    expect(
      await screen.findByRole('link', { name: /Renvoyer le courriel de confirmation/i }),
    ).toBeInTheDocument();
  });

  it('normalise l’adresse en minuscules avant l’envoi', async () => {
    const user = userEvent.setup();
    const { ConnexionPage } = await import('./ConnexionPage');
    renderWithProviders(<ConnexionPage />, { route: '/connexion' });

    await user.type(screen.getByLabelText(/Adresse électronique/), 'Marie@Exemple.FR');
    await user.type(screen.getByLabelText(/Mot de passe/), 'MotDePasse123');
    await user.click(screen.getByRole('button', { name: /Se connecter/i }));

    await waitFor(() => expect(signIn).toHaveBeenCalledTimes(1));
    expect(signIn).toHaveBeenCalledWith('marie@exemple.fr', 'MotDePasse123');
  });
});

describe('Inscription', () => {
  it('refuse un mot de passe trop court ou incomplet', async () => {
    const user = userEvent.setup();
    const { InscriptionPage } = await import('./InscriptionPage');
    renderWithProviders(<InscriptionPage />, { route: '/inscription' });

    await user.type(screen.getByLabelText(/Nom et prénom/), 'Marie Dupont');
    await user.type(screen.getByLabelText(/Adresse électronique/), 'marie@exemple.fr');
    await user.type(screen.getByLabelText(/^Mot de passe/), 'court');
    await user.type(screen.getByLabelText(/Confirmation du mot de passe/), 'court');
    await user.click(screen.getByRole('button', { name: /Créer mon compte/i }));

    expect(
      await screen.findByText('Votre mot de passe doit comporter au moins 10 caractères.'),
    ).toBeInTheDocument();
    expect(signUp).not.toHaveBeenCalled();
  });

  it('refuse deux mots de passe différents', async () => {
    const user = userEvent.setup();
    const { InscriptionPage } = await import('./InscriptionPage');
    renderWithProviders(<InscriptionPage />, { route: '/inscription' });

    await user.type(screen.getByLabelText(/Nom et prénom/), 'Marie Dupont');
    await user.type(screen.getByLabelText(/Adresse électronique/), 'marie@exemple.fr');
    await user.type(screen.getByLabelText(/^Mot de passe/), 'MotDePasse123');
    await user.type(screen.getByLabelText(/Confirmation du mot de passe/), 'MotDePasse456');
    // Les conditions sont cochées à dessein : une vérification croisée Zod ne
    // s'exécute que si chaque champ est valide isolément. Case décochée, le
    // schéma s'arrête avant d'avoir comparé les deux mots de passe.
    await user.click(screen.getByLabelText(/J’accepte les/));
    await user.click(screen.getByRole('button', { name: /Créer mon compte/i }));

    expect(
      await screen.findByText('Les deux mots de passe ne correspondent pas.'),
    ).toBeInTheDocument();
    expect(signUp).not.toHaveBeenCalled();
  });

  it('exige l’acceptation des conditions générales', async () => {
    const user = userEvent.setup();
    const { InscriptionPage } = await import('./InscriptionPage');
    renderWithProviders(<InscriptionPage />, { route: '/inscription' });

    await user.type(screen.getByLabelText(/Nom et prénom/), 'Marie Dupont');
    await user.type(screen.getByLabelText(/Adresse électronique/), 'marie@exemple.fr');
    await user.type(screen.getByLabelText(/^Mot de passe/), 'MotDePasse123');
    await user.type(screen.getByLabelText(/Confirmation du mot de passe/), 'MotDePasse123');
    await user.click(screen.getByRole('button', { name: /Créer mon compte/i }));

    expect(
      await screen.findByText(
        'Vous devez accepter les conditions générales pour créer un compte.',
      ),
    ).toBeInTheDocument();
    expect(signUp).not.toHaveBeenCalled();
  });

  it('ne transmet que le nom, jamais de rôle', async () => {
    // Le trigger handle_new_user ignore tout sauf full_name, mais le formulaire
    // ne doit même pas tenter d'envoyer autre chose : ce test fige l'intention.
    const user = userEvent.setup();
    const { InscriptionPage } = await import('./InscriptionPage');
    renderWithProviders(<InscriptionPage />, { route: '/inscription' });

    await user.type(screen.getByLabelText(/Nom et prénom/), 'Marie Dupont');
    await user.type(screen.getByLabelText(/Adresse électronique/), 'marie@exemple.fr');
    await user.type(screen.getByLabelText(/^Mot de passe/), 'MotDePasse123');
    await user.type(screen.getByLabelText(/Confirmation du mot de passe/), 'MotDePasse123');
    await user.click(screen.getByLabelText(/J’accepte les/));
    await user.click(screen.getByRole('button', { name: /Créer mon compte/i }));

    await waitFor(() => expect(signUp).toHaveBeenCalledTimes(1));

    const payload = signUp.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(Object.keys(payload).sort()).toEqual(['email', 'fullName', 'password']);
    expect(payload).not.toHaveProperty('platform_role');
    expect(payload).not.toHaveProperty('role');
  });

  it('redirige vers la vérification d’adresse après création', async () => {
    const user = userEvent.setup();
    const { InscriptionPage } = await import('./InscriptionPage');
    renderWithProviders(<InscriptionPage />, { route: '/inscription' });

    await user.type(screen.getByLabelText(/Nom et prénom/), 'Marie Dupont');
    await user.type(screen.getByLabelText(/Adresse électronique/), 'marie@exemple.fr');
    await user.type(screen.getByLabelText(/^Mot de passe/), 'MotDePasse123');
    await user.type(screen.getByLabelText(/Confirmation du mot de passe/), 'MotDePasse123');
    await user.click(screen.getByLabelText(/J’accepte les/));
    await user.click(screen.getByRole('button', { name: /Créer mon compte/i }));

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith('/verifier-email', {
        replace: true,
        state: { email: 'marie@exemple.fr' },
      }),
    );
  });
});

describe('Mot de passe oublié', () => {
  it('affiche la même confirmation quelle que soit l’adresse', async () => {
    // Le service absorbe l'erreur « utilisateur inconnu » : répondre
    // différemment permettrait de tester si une adresse est cliente.
    const user = userEvent.setup();
    const { MotDePasseOubliePage } = await import('./MotDePasseOubliePage');
    renderWithProviders(<MotDePasseOubliePage />, { route: '/mot-de-passe-oublie' });

    await user.type(screen.getByLabelText(/Adresse électronique/), 'inconnu@exemple.fr');
    await user.click(screen.getByRole('button', { name: /Envoyer le lien/i }));

    expect(
      await screen.findByText(/Vérifiez votre boîte de réception/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Si un compte existe pour/i)).toBeInTheDocument();
  });

  it('signale la limitation de débit', async () => {
    requestPasswordReset.mockRejectedValueOnce(
      new AuthFailure('Trop de tentatives en peu de temps.', 'over_email_send_rate_limit'),
    );

    const user = userEvent.setup();
    const { MotDePasseOubliePage } = await import('./MotDePasseOubliePage');
    renderWithProviders(<MotDePasseOubliePage />, { route: '/mot-de-passe-oublie' });

    await user.type(screen.getByLabelText(/Adresse électronique/), 'marie@exemple.fr');
    await user.click(screen.getByRole('button', { name: /Envoyer le lien/i }));

    expect(await screen.findByText(/Trop de tentatives/i)).toBeInTheDocument();
  });
});
