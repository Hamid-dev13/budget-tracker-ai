/**
 * Serveur MCP du budget tracker — c'est par ici qu'Hermes parle au budget.
 *
 * Les quatre outils appellent la même couche service que l'API HTTP : le dashboard
 * et Hermes ne peuvent donc pas annoncer deux chiffres différents.
 *
 * Chaque outil répond un résultat lisible (« 4 jours bloqués, reprise le 24 »),
 * pas un JSON brut : c'est une interface pour un agent, pas pour un développeur.
 *
 * ATTENTION : en transport stdio, stdout appartient au protocole. Tout log va sur stderr.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { initBudget, addExpense, getStatus, getHistory, todayISO } from '../lib/budget-service'
import { nbJoursPeriode, type VueBudget } from '../lib/budget-logic'
import { messageDeLErreur } from '../lib/errors'

function euros(n: number): string {
  return n.toFixed(2).replace('.', ',') + ' €'
}

function jours(n: number): string {
  return n.toFixed(1).replace('.', ',')
}

/** Réponse d'outil : un bloc de texte. */
function reponse(texte: string) {
  return { content: [{ type: 'text' as const, text: texte }] }
}

function echec(err: unknown) {
  return { isError: true, content: [{ type: 'text' as const, text: messageDeLErreur(err) }] }
}

/** La phrase qui intéresse Hermes : où en est-on, en jours. */
function resumeDette(vue: VueBudget): string {
  if (vue.joursBloques === 0) {
    return `Il te reste ${euros(vue.budgetAujourdhui)} aujourd'hui.`
  }
  return (
    `Tu es en dette de ${jours(vue.detteJours)} jours : ` +
    `${vue.joursBloques} jours bloqués, reprise le ${vue.dateReprise} avec ${euros(vue.budgetJourReprise)}.`
  )
}

export function creerServeur(chemin: string, today: () => string = todayISO): McpServer {
  const serveur = new McpServer({ name: 'budget-tracker', version: '2.0.0' })

  serveur.registerTool(
    'init_budget',
    {
      title: 'Initialiser le budget',
      description:
        "Initialise le budget d'une période : montant disponible et date de fin. " +
        'Remet les dépenses à zéro — à n\'utiliser qu\'au début d\'un nouveau mois.',
      inputSchema: {
        solde: z.number().describe('Montant total disponible sur la période, en euros'),
        date_fin: z.string().describe('Dernier jour de la période, au format AAAA-MM-JJ'),
        date_debut: z.string().optional().describe('Premier jour ; par défaut aujourd\'hui'),
      },
    },
    async ({ solde, date_fin, date_debut }) => {
      try {
        const data = initBudget(chemin, solde, date_fin, date_debut, today())
        const nb = nbJoursPeriode(data.date_debut, data.date_fin)
        return reponse(
          `Budget initialisé : ${euros(data.solde_depart)} du ${data.date_debut} au ${data.date_fin} ` +
            `(${nb} jours). Plafond : ${euros(data.solde_depart / nb)} par jour.`
        )
      } catch (err) {
        return echec(err)
      }
    }
  )

  serveur.registerTool(
    'add_expense',
    {
      title: 'Enregistrer une dépense',
      description:
        'Enregistre une dépense et répond immédiatement avec son impact : ' +
        'budget restant du jour, ou nombre de jours bloqués et date de reprise.',
      inputSchema: {
        montant: z.number().describe('Montant dépensé, en euros'),
        description: z.string().describe('Ce qui a été acheté'),
        date: z.string().optional().describe('Date de la dépense AAAA-MM-JJ ; par défaut aujourd\'hui'),
      },
    },
    async ({ montant, description, date }) => {
      try {
        const depense = addExpense(chemin, montant, description, date, today())
        const vue = getStatus(chemin, today())
        return reponse(
          `Dépense enregistrée : ${euros(depense.montant)} — ${depense.description} (${depense.date}). ` +
            resumeDette(vue)
        )
      } catch (err) {
        return echec(err)
      }
    }
  )

  serveur.registerTool(
    'get_status',
    {
      title: 'Statut du budget',
      description:
        "Où en est le budget aujourd'hui : solde restant, budget du jour, " +
        'et le cas échéant les jours bloqués et la date de reprise.',
      inputSchema: {
        today: z.string().optional().describe('Se placer à une autre date, AAAA-MM-JJ'),
      },
    },
    async ({ today: date }) => {
      try {
        const vue = getStatus(chemin, date ?? today())
        return reponse(
          `Solde restant : ${euros(vue.soldeRestant)} sur ${euros(vue.soldeDepart)} ` +
            `(plafond ${euros(vue.plafondJour)} par jour). ` +
            resumeDette(vue)
        )
      } catch (err) {
        return echec(err)
      }
    }
  )

  serveur.registerTool(
    'get_history',
    {
      title: 'Historique des dépenses',
      description: 'Liste les dépenses, de la plus récente à la plus ancienne.',
      inputSchema: {
        limit: z.number().optional().describe('Nombre maximum de dépenses à retourner'),
      },
    },
    async ({ limit }) => {
      try {
        const depenses = getHistory(chemin, limit)
        if (depenses.length === 0) return reponse('Aucune dépense enregistrée.')

        const lignes = depenses.map(d => `${d.date} · ${euros(d.montant)} · ${d.description}`)
        const total = depenses.reduce((s, d) => s + d.montant, 0)
        return reponse(`${lignes.join('\n')}\n\n${depenses.length} dépenses, ${euros(total)} au total.`)
      } catch (err) {
        return echec(err)
      }
    }
  )

  return serveur
}
