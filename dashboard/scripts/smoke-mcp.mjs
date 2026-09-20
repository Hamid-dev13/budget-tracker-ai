/**
 * Smoke test du serveur MCP : lance le vrai binaire en stdio, comme le fera Hermes.
 * Usage : node scripts/smoke-mcp.mjs <chemin-budget-jetable>
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

const budget = process.argv[2]
if (!budget) {
  console.error('Usage : node scripts/smoke-mcp.mjs <chemin-budget-jetable>')
  process.exit(1)
}

const transport = new StdioClientTransport({
  command: 'node',
  args: ['dist/mcp-server.mjs'],
  env: { ...process.env, BUDGET_PATH: budget },
})

const client = new Client({ name: 'smoke-hermes', version: '1.0.0' })
await client.connect(transport)

const { tools } = await client.listTools()
console.log('Outils exposés :', tools.map(t => t.name).join(', '))
console.log()

const scenario = [
  ['get_status', {}],
  ['add_expense', { montant: 12.5, description: 'Test depuis Hermes' }],
  ['get_status', {}],
  ['get_history', { limit: 3 }],
  ['add_expense', { montant: -5, description: 'Montant invalide' }],
]

for (const [nom, args] of scenario) {
  const res = await client.callTool({ name: nom, arguments: args })
  const txt = (res.content ?? []).map(c => c.text ?? '').join('\n')
  console.log(`${res.isError ? '✗' : '✓'} ${nom}(${JSON.stringify(args)})`)
  console.log(txt.split('\n').map(l => '    ' + l).join('\n'))
  console.log()
}

await client.close()
