"""
TEST-01 — Logique budget (RED)
On teste la logique pure avant d'écrire une seule ligne de code MCP.
"""
import pytest
from datetime import date
import sys
sys.path.insert(0, "/opt/data/projects/budget-tracker-ai/mcp")

from budget_logic import (
    calcul_plafond_jour,
    calcul_dette_jours,
    calcul_jours_bloques,
    calcul_budget_aujourd_hui,
    get_solde_restant,
)


class TestCalcPlafondJour:
    def test_plafond_basique(self):
        # 248€ pour 11 jours → 22.54€/jour
        assert calcul_plafond_jour(248.0, 11) == pytest.approx(22.545, 0.01)

    def test_plafond_exact(self):
        assert calcul_plafond_jour(220.0, 10) == 22.0

    def test_plafond_un_jour(self):
        assert calcul_plafond_jour(50.0, 1) == 50.0


class TestCalcDette:
    def test_pas_de_dette_si_dans_plafond(self):
        assert calcul_dette_jours(depense=10.0, plafond=22.50) == 0.0

    def test_pas_de_dette_si_egal_plafond(self):
        assert calcul_dette_jours(depense=22.50, plafond=22.50) == 0.0

    def test_dette_un_jour_exact(self):
        # dépense = 2x plafond → 1 jour de dette
        assert calcul_dette_jours(depense=45.0, plafond=22.50) == pytest.approx(1.0)

    def test_dette_fractionnaire(self):
        # 110.70€ dépensé, plafond 22.50 → dette = (110.70-22.50)/22.50 = 3.92
        assert calcul_dette_jours(depense=110.70, plafond=22.50) == pytest.approx(3.92, 0.01)


class TestJoursBloques:
    def test_zero_dette_zero_jours(self):
        jours, budget_dernier = calcul_jours_bloques(dette=0.0, plafond=22.50)
        assert jours == 0
        assert budget_dernier == 22.50

    def test_dette_exacte_un_jour(self):
        jours, budget_dernier = calcul_jours_bloques(dette=1.0, plafond=22.50)
        assert jours == 1
        assert budget_dernier == 0.0

    def test_dette_fractionnaire(self):
        # 3.92 jours → 3 jours bloqués + 1 jour réduit à (1-0.92)*22.50 = 1.80€
        jours, budget_dernier = calcul_jours_bloques(dette=3.92, plafond=22.50)
        assert jours == 3
        assert budget_dernier == pytest.approx(1.80, 0.1)


class TestBudgetAujourdhui:
    def test_jour_normal(self):
        # Pas de dette → plafond complet
        budget = calcul_budget_aujourd_hui(
            date_today=date(2026, 9, 23),
            depenses=[],
            plafond=22.50,
            date_debut=date(2026, 9, 19),
        )
        assert budget == pytest.approx(112.50)

    def test_jour_bloque(self):
        # Jour dans la zone de dette → 0€
        depenses = [{"date": "2026-09-19", "montant": 110.70}]
        budget = calcul_budget_aujourd_hui(
            date_today=date(2026, 9, 20),
            depenses=depenses,
            plafond=22.50,
            date_debut=date(2026, 9, 19),
        )
        assert budget == 0.0

    def test_report_si_pas_depense(self):
        # Hier j'ai pas dépensé → aujourd'hui j'ai 2x le plafond
        depenses = []
        budget = calcul_budget_aujourd_hui(
            date_today=date(2026, 9, 20),
            depenses=depenses,
            plafond=22.50,
            date_debut=date(2026, 9, 19),
        )
        assert budget == pytest.approx(45.0)


class TestSoldeRestant:
    def test_solde_sans_depenses(self):
        assert get_solde_restant(solde_depart=248.0, depenses=[]) == 248.0

    def test_solde_avec_depenses(self):
        depenses = [
            {"montant": 45.12},
            {"montant": 33.0},
            {"montant": 32.58},
        ]
        assert get_solde_restant(248.0, depenses) == pytest.approx(137.30, 0.01)
