import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import path from 'path'

export async function GET() {
  try {
    const budgetPath = process.env.BUDGET_PATH || '/app/data/budget.json'
    const raw = readFileSync(budgetPath, 'utf-8')
    const data = JSON.parse(raw)
    return NextResponse.json(data)
  } catch (err) {
    console.error('Failed to read budget.json:', err)
    return NextResponse.json({ error: 'Failed to read budget data' }, { status: 500 })
  }
}
