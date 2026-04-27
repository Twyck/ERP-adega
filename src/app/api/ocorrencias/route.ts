import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') || '50')

  const ocorrencias = await prisma.ocorrencia.findMany({
    take: limit,
    orderBy: { criadoEm: 'desc' },
    include: {
      produto: { select: { nome: true, marca: true } },
      usuario: { select: { nome: true } },
    },
  })

  return NextResponse.json({ ocorrencias })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const ocorrencia = await prisma.$transaction(async (tx) => {
    const oc = await tx.ocorrencia.create({
      data: {
        produtoId: body.produtoId,
        usuarioId: session.user.id,
        tipo: body.tipo,
        quantidade: body.quantidade,
        descricao: body.descricao || null,
        foto: body.foto || null,
      },
    })

    // Se vencido ou descartado, baixa no estoque
    if (['VENCIDO', 'QUEBRADO', 'DANIFICADO'].includes(body.tipo)) {
      await tx.produto.update({
        where: { id: body.produtoId },
        data: { estoqueAtual: { decrement: body.quantidade } },
      })
      await tx.movimentacaoEstoque.create({
        data: {
          produtoId: body.produtoId,
          usuarioId: session.user.id,
          tipo: 'DESCARTE',
          quantidade: body.quantidade,
          observacao: `Ocorrência: ${body.tipo}`,
        },
      })
    }

    return oc
  })

  return NextResponse.json({ ocorrencia }, { status: 201 })
}
