import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') || '20')

  const vendas = await prisma.venda.findMany({
    take: limit,
    orderBy: { criadoEm: 'desc' },
    include: {
      usuario: { select: { nome: true } },
      itens: { include: { produto: { select: { nome: true } } } }
    }
  })

  return NextResponse.json({ vendas })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { tipoPagamento, itens, desconto = 0, observacao } = body

  if (!itens || itens.length === 0) {
    return NextResponse.json({ error: 'Itens obrigatórios' }, { status: 400 })
  }

  const total = itens.reduce(
    (sum: number, item: any) => sum + item.precoUnitario * item.quantidade,
    0
  ) - desconto

  const venda = await prisma.$transaction(async (tx) => {
    const v = await tx.venda.create({
      data: {
        usuarioId: session.user.id,
        tipoPagamento,
        total,
        desconto,
        observacao,
        itens: {
          create: itens.map((item: any) => ({
            produtoId: item.produtoId,
            quantidade: item.quantidade,
            precoUnitario: item.precoUnitario,
            subtotal: item.precoUnitario * item.quantidade,
          })),
        },
      },
    })

    // Baixa no estoque
    for (const item of itens) {
      await tx.produto.update({
        where: { id: item.produtoId },
        data: { estoqueAtual: { decrement: item.quantidade } },
      })
      await tx.movimentacaoEstoque.create({
        data: {
          produtoId: item.produtoId,
          usuarioId: session.user.id,
          tipo: 'SAIDA',
          quantidade: item.quantidade,
          observacao: `Venda #${v.id}`,
        },
      })
    }

    return v
  })

  return NextResponse.json({ venda }, { status: 201 })
}
