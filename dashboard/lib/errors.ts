/**
 * Erreurs métier typées — elles portent leur code HTTP pour que l'API
 * n'ait pas à deviner la cause en inspectant les messages.
 */

export class BudgetIntrouvable extends Error {
  readonly status = 404
}

/** Le fichier existe mais son contenu n'est pas exploitable — c'est un incident, pas une erreur d'appel. */
export class BudgetCorrompu extends Error {
  readonly status = 500
}

/** Entrée refusée : montant, description, date ou solde invalide. */
export class DonneeInvalide extends Error {
  readonly status = 400
}

export function statusDeLErreur(err: unknown): number {
  if (err instanceof BudgetIntrouvable || err instanceof BudgetCorrompu || err instanceof DonneeInvalide) {
    return err.status
  }
  return 500
}

export function messageDeLErreur(err: unknown): string {
  return err instanceof Error ? err.message : 'Erreur inattendue'
}
