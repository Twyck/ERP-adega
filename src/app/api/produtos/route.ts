import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const busca = searchParams.get('busca') || ''
  const limit = parseInt(searchParams.get('limit') || '50')
  const apenasAtivos = searchParams.get('inativos') !== 'true'

  const where: any = {}
  if (apenasAtivos) where.ativo = true
  if (busca) {
    where.OR = [
      { nome: { contains: busca, mode: 'insensitive' } },
      { marca: { contains: busca, mode: 'insensitive' } },
      { codigoBarras: { contains: busca } },
      { categoria: { contains: busca, mode: 'insensitive' } },
    ]
  }

  const produtos = await prisma.produto.findMany({
    where,
    take: limit,
    orderBy: { nome: 'asc' },
  })

  return NextResponse.json({ produtos })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['DONO', 'GERENTE'].includes(session.user.perfil)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const produto = await prisma.produto.create({
    data: {
      nome: body.nome,
      marca: body.marca || null,
      volume: body.volume || null,
      categoria: body.categoria || null,
      codigoBarras: body.codigoBarras || null,
      precoVenda: body.precoVenda,
      precoCusto: body.precoCusto || null,
      estoqueAtual: body.estoqueAtual || 0,
      estoqueMinimo: body.estoqueMinimo || 5,
    },
  })

  return NextResponse.json({ produto }, { status: 201 })
}
