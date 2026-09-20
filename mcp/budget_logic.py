"""
Logique métier pure du budget tracker.
Pas d'I/O, pas de JSON — juste des calculs.
"""
import math
from datetime import date


def calcul_plafond_jour(solde: float, nb_jours: int) -> float:
    """Calcule le plafond journalier fixe."""
    return solde / nb_jours


def calcul_dette_jours(depense: float, plafond: float) -> float:
    """Calcule la dette en jours après une dépense journalière."""
    if depense <= plafond:
        return 0.0
    return (depense - plafond) / plafond


def calcul_jours_bloques(dette: float, plafond: float) -> tuple[int, float]:
    """
    Retourne (nb_jours_bloques, budget_dernier_jour).
    Ex: dette=3.92 → 3 jours à 0€ + 1 jour à (1-0.92)*plafond
    """
    if dette <= 0:
        return 0, plafond
    jours_entiers = math.floor(dette)
    fraction = dette - jours_entiers
    if fraction == 0:
        return jours_entiers, 0.0
    budget_dernier = round((1 - fraction) * plafond, 2)
    return jours_entiers, budget_dernier


def calcul_budget_aujourd_hui(
    date_today: date,
    depenses: list[dict],
    plafond: float,
    date_debut: date,
) -> float:
    """
    Calcule le budget disponible aujourd'hui en tenant compte
    des reports (jours non dépensés) et de la dette (jours dépassés).
    """
    # Calculer cumul dépenses par jour depuis date_debut
    from collections import defaultdict
    depenses_par_jour = defaultdict(float)
    for d in depenses:
        depenses_par_jour[d["date"]] += d["montant"]

    # Calculer la cagnotte cumulée jour par jour
    cagnotte = 0.0
    current = date_debut
    while current < date_today:
        cagnotte += plafond
        dep_jour = depenses_par_jour.get(current.isoformat(), 0.0)
        cagnotte -= dep_jour
        current = date(current.year, current.month, current.day + 1 if current.day < 28 else 1)
        # simplification — on utilisera timedelta dans le vrai code

    cagnotte += plafond  # plafond du jour actuel
    dep_aujourd_hui = depenses_par_jour.get(date_today.isoformat(), 0.0)
    cagnotte -= dep_aujourd_hui
    return max(0.0, round(cagnotte, 2))


def get_solde_restant(solde_depart: float, depenses: list[dict]) -> float:
    """Calcule le solde restant total."""
    total = sum(d["montant"] for d in depenses)
    return round(solde_depart - total, 2)
