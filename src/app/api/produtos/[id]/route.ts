import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['DONO', 'GERENTE', 'ESTOQUISTA'].includes(session.user.perfil)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const produto = await prisma.produto.update({
    where: { id: params.id },
    data: {
      nome: body.nome,
      marca: body.marca || null,
      volume: body.volume || null,
      categoria: body.categoria || null,
      codigoBarras: body.codigoBarras || null,
      precoVenda: parseFloat(body.precoVenda),
      precoCusto: body.precoCusto ? parseFloat(body.precoCusto) : null,
      estoqueAtual: parseInt(body.estoqueAtual),
      estoqueMinimo: parseInt(body.estoqueMinimo),
      ativo: body.ativo !== undefined ? body.ativo : undefined,
    },
  })

  return NextResponse.json({ produto })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.perfil !== 'DONO') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.produto.update({
    where: { id: params.id },
    data: { ativo: false },
  })

  return NextResponse.json({ ok: true })
}
