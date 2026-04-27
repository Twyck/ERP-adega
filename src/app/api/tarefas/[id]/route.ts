import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const tarefa = await prisma.tarefa.findUnique({ where: { id: params.id } })
  if (!tarefa) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Apenas dono/gerente ou o próprio responsável pode concluir
  const podeAlterar =
    ['DONO', 'GERENTE'].includes(session.user.perfil) ||
    tarefa.responsavelId === session.user.id

  if (!podeAlterar) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const data: any = {}
  if (body.status) {
    data.status = body.status
    if (body.status === 'CONCLUIDA') data.concluidaEm = new Date()
  }
  if (body.titulo) data.titulo = body.titulo
  if (body.descricao !== undefined) data.descricao = body.descricao
  if (body.prioridade) data.prioridade = body.prioridade
  if (body.prazo !== undefined) data.prazo = body.prazo ? new Date(body.prazo) : null
  if (body.responsavelId) data.responsavelId = body.responsavelId

  const updated = await prisma.tarefa.update({ where: { id: params.id }, data })
  return NextResponse.json({ tarefa: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['DONO', 'GERENTE'].includes(session.user.perfil)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.tarefa.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
