"""
Outils MCP — I/O JSON + appels à budget_logic.
"""
import json
import os
from datetime import date
from budget_logic import (
    calcul_plafond_jour,
    calcul_dette_jours,
    calcul_jours_bloques,
    calcul_budget_aujourd_hui,
    get_solde_restant,
)


def _load(path: str) -> dict:
    with open(path, "r") as f:
        return json.load(f)


def _save(path: str, data: dict):
    with open(path, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def init_budget(solde: float, date_fin: str, budget_path: str, date_debut: str = None) -> dict:
    debut = date_debut or date.today().isoformat()
    d1 = date.fromisoformat(debut)
    d2 = date.fromisoformat(date_fin)
    nb_jours = (d2 - d1).days + 1
    plafond = round(solde / nb_jours, 4)
    data = {
        "solde_depart": solde,
        "date_debut": debut,
        "date_fin": date_fin,
        "plafond_jour": plafond,
        "depenses": []
    }
    _save(budget_path, data)
    return data


def add_expense(montant: float, description: str, budget_path: str, date_str: str = None) -> dict:
    data = _load(budget_path)
    depense = {
        "date": date_str or date.today().isoformat(),
        "montant": montant,
        "description": description
    }
    data["depenses"].append(depense)
    _save(budget_path, data)
    return depense


def get_status(budget_path: str, today: str = None) -> dict:
    data = _load(budget_path)
    today_date = date.fromisoformat(today) if today else date.today()
    debut_date = date.fromisoformat(data["date_debut"])
    plafond = data["plafond_jour"]
    depenses = data["depenses"]

    # Dépenses du jour uniquement pour calcul dette
    dep_jour = sum(d["montant"] for d in depenses if d["date"] == today_date.isoformat())
    dette = calcul_dette_jours(dep_jour, plafond)
    jours_bloques, budget_dernier = calcul_jours_bloques(dette, plafond)

    budget_aujourd_hui = calcul_budget_aujourd_hui(today_date, depenses, plafond, debut_date)
    solde_restant = get_solde_restant(data["solde_depart"], depenses)

    return {
        "solde_restant": solde_restant,
        "budget_aujourd_hui": budget_aujourd_hui,
        "jours_bloques": jours_bloques,
        "budget_dernier_jour": budget_dernier,
        "plafond_jour": plafond,
    }


def get_history(budget_path: str, limit: int = None) -> list:
    data = _load(budget_path)
    depenses = sorted(data["depenses"], key=lambda d: d["date"], reverse=True)
    if limit:
        depenses = depenses[:limit]
    return depenses
