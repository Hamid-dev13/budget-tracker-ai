# Spec

## Fonctionnalités core

### 1. Initialisation du budget
- L'utilisateur définit un solde de départ (ex: 248€)
- Le système calcule un plafond journalier (solde / jours restants du mois)
- Le plafond est fixe — chaque jour génère X€ disponibles

### 2. Enregistrement d'une dépense
- L'utilisateur envoie le montant + description en langage naturel
- Le système déduit du plafond du jour
- Si dépassement → les jours suivants sont bloqués ou réduits

### 3. Réponse en jours
- Après chaque dépense, le système répond avec :
  - Jours bloqués (0€ disponible)
  - Jours réduits (budget partiel)
  - Date de reprise normale
  - Solde total restant

### 4. Consultation
- "C'est quoi mon budget aujourd'hui ?" → réponse immédiate
- "Rappelle-moi mes dépenses du jour" → liste

### 5. Dashboard web
- Solde restant affiché en temps réel
- Calendrier du mois avec jours bloqués en rouge
- Historique des dépenses

## Outils MCP exposés

- `init_budget(solde, date_fin)` — initialise le budget
- `add_expense(montant, description)` — ajoute une dépense
- `get_status()` — retourne solde + jours bloqués
- `get_history()` — retourne historique du mois

## Comportement attendu

- Plafond non dépensé → reporté au lendemain
- Dépassement → dette en jours calculée au prorata
- Fin de mois → reset automatique
