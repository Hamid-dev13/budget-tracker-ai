"""
TEST-02 — Outils MCP (RED)
On teste les 4 outils MCP avec un vrai fichier JSON temporaire.
"""
import pytest
import json
import tempfile
import os
from datetime import date
import sys
sys.path.insert(0, "/opt/data/projects/budget-tracker-ai/mcp")

from mcp_tools import init_budget, add_expense, get_status, get_history


@pytest.fixture
def budget_file(tmp_path):
    """Fichier JSON temporaire pour les tests."""
    f = tmp_path / "budget.json"
    return str(f)


@pytest.fixture
def initialized_budget(budget_file):
    """Budget initialisé pour les tests."""
    init_budget(
        solde=248.0,
        date_fin="2026-09-30",
        budget_path=budget_file,
        date_debut="2026-09-19"
    )
    return budget_file


class TestInitBudget:
    def test_cree_le_fichier(self, budget_file):
        init_budget(248.0, "2026-09-30", budget_file, "2026-09-19")
        assert os.path.exists(budget_file)

    def test_structure_correcte(self, budget_file):
        init_budget(248.0, "2026-09-30", budget_file, "2026-09-19")
        data = json.loads(open(budget_file).read())
        assert data["solde_depart"] == 248.0
        assert data["date_debut"] == "2026-09-19"
        assert data["date_fin"] == "2026-09-30"
        assert data["plafond_jour"] == pytest.approx(20.667, 0.01)
        assert data["depenses"] == []

    def test_ecrase_si_existe(self, budget_file):
        init_budget(100.0, "2026-09-30", budget_file, "2026-09-19")
        init_budget(248.0, "2026-09-30", budget_file, "2026-09-19")
        data = json.loads(open(budget_file).read())
        assert data["solde_depart"] == 248.0


class TestAddExpense:
    def test_ajoute_depense(self, initialized_budget):
        add_expense(45.12, "Courses", initialized_budget)
        data = json.loads(open(initialized_budget).read())
        assert len(data["depenses"]) == 1
        assert data["depenses"][0]["montant"] == 45.12
        assert data["depenses"][0]["description"] == "Courses"

    def test_date_auto(self, initialized_budget):
        add_expense(10.0, "Test", initialized_budget)
        data = json.loads(open(initialized_budget).read())
        assert data["depenses"][0]["date"] == date.today().isoformat()

    def test_date_manuelle(self, initialized_budget):
        add_expense(10.0, "Test", initialized_budget, date_str="2026-09-19")
        data = json.loads(open(initialized_budget).read())
        assert data["depenses"][0]["date"] == "2026-09-19"

    def test_plusieurs_depenses(self, initialized_budget):
        add_expense(10.0, "A", initialized_budget)
        add_expense(20.0, "B", initialized_budget)
        data = json.loads(open(initialized_budget).read())
        assert len(data["depenses"]) == 2


class TestGetStatus:
    def test_retourne_solde(self, initialized_budget):
        status = get_status(initialized_budget, today="2026-09-19")
        assert status["solde_restant"] == 248.0

    def test_solde_apres_depense(self, initialized_budget):
        add_expense(110.70, "Courses", initialized_budget, "2026-09-19")
        status = get_status(initialized_budget, today="2026-09-19")
        assert status["solde_restant"] == pytest.approx(137.30, 0.01)

    def test_jours_bloques(self, initialized_budget):
        add_expense(110.70, "Courses", initialized_budget, "2026-09-19")
        status = get_status(initialized_budget, today="2026-09-19")
        assert status["jours_bloques"] == 4
        assert status["budget_aujourd_hui"] == 0.0

    def test_pas_de_dette(self, initialized_budget):
        add_expense(10.0, "Petit achat", initialized_budget, "2026-09-19")
        status = get_status(initialized_budget, today="2026-09-19")
        assert status["jours_bloques"] == 0
        assert status["budget_aujourd_hui"] > 0


class TestGetHistory:
    def test_vide(self, initialized_budget):
        history = get_history(initialized_budget)
        assert history == []

    def test_retourne_depenses(self, initialized_budget):
        add_expense(45.12, "Courses", initialized_budget, "2026-09-19")
        add_expense(33.0, "Boucherie", initialized_budget, "2026-09-19")
        history = get_history(initialized_budget)
        assert len(history) == 2

    def test_limit(self, initialized_budget):
        for i in range(10):
            add_expense(5.0, f"Achat {i}", initialized_budget)
        history = get_history(initialized_budget, limit=3)
        assert len(history) == 3

    def test_ordre_recent_en_premier(self, initialized_budget):
        add_expense(10.0, "Premier", initialized_budget, "2026-09-19")
        add_expense(20.0, "Deuxieme", initialized_budget, "2026-09-20")
        history = get_history(initialized_budget)
        assert history[0]["description"] == "Deuxieme"
