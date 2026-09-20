"""
Budget Tracker MCP Server
Expose 4 outils : init_budget, add_expense, get_status, get_history
"""
import os
from mcp.server.fastmcp import FastMCP
from mcp_tools import init_budget as _init, add_expense as _add, get_status as _status, get_history as _history

BUDGET_PATH = os.environ.get("BUDGET_PATH", "/app/data/budget.json")

mcp = FastMCP("budget-tracker")


@mcp.tool()
def init_budget(solde: float, date_fin: str, date_debut: str = None) -> dict:
    """Initialise le budget du mois. solde=montant total, date_fin=YYYY-MM-DD."""
    return _init(solde, date_fin, BUDGET_PATH, date_debut)


@mcp.tool()
def add_expense(montant: float, description: str, date_str: str = None) -> dict:
    """Enregistre une dépense. montant en euros, description libre, date optionnelle YYYY-MM-DD."""
    return _add(montant, description, BUDGET_PATH, date_str)


@mcp.tool()
def get_status(today: str = None) -> dict:
    """Retourne le statut du budget : solde restant, budget aujourd'hui, jours bloqués."""
    return _status(BUDGET_PATH, today)


@mcp.tool()
def get_history(limit: int = 10) -> list:
    """Retourne l'historique des dépenses, du plus récent au plus ancien."""
    return _history(BUDGET_PATH, limit)


if __name__ == "__main__":
    mcp.run()
