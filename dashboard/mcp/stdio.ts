/**
 * Point d'entrée stdio — c'est ce binaire qu'Hermes lance.
 * Le chemin du budget vient de BUDGET_PATH.
 */
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { creerServeur } from './server'
import { cheminBudget } from '../lib/budget-store'

async function main() {
  const serveur = creerServeur(cheminBudget())
  await serveur.connect(new StdioServerTransport())
  // stdout appartient au protocole : on trace sur stderr.
  console.error(`[budget-mcp] prêt sur ${cheminBudget()}`)
}

main().catch(err => {
  console.error('[budget-mcp] échec au démarrage :', err)
  process.exit(1)
})
