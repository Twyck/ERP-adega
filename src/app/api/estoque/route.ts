import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const produtoId = searchParams.get('produtoId')
  const limit = parseInt(searchParams.get('limit') || '50')

  const movimentacoes = await prisma.movimentacaoEstoque.findMany({
    where: produtoId ? { produtoId } : {},
    take: limit,
    orderBy: { criadoEm: 'desc' },
    include: {
      produto: { select: { nome: true } },
      usuario: { select: { nome: true } },
    },
  })

  return NextResponse.json({ movimentacoes })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['DONO', 'GERENTE', 'ESTOQUISTA'].includes(session.user.perfil)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()

  const mov = await prisma.$transaction(async (tx) => {
    const m = await tx.movimentacaoEstoque.create({
      data: {
        produtoId: body.produtoId,
        usuarioId: session.user.id,
        tipo: body.tipo,
        quantidade: body.quantidade,
        observacao: body.observacao || null,
      },
    })

    const delta = body.tipo === 'ENTRADA' ? body.quantidade : -body.quantidade
    await tx.produto.update({
      where: { id: body.produtoId },
      data: { estoqueAtual: { increment: delta } },
    })

    return m
  })

  return NextResponse.json({ movimentacao: mov }, { status: 201 })
}
