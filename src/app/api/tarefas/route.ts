import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const perfil = session.user.perfil
  const where: any = {}

  // Caixa e Estoquista só veem as próprias tarefas
  if (!['DONO', 'GERENTE'].includes(perfil)) {
    where.responsavelId = session.user.id
  }

  const tarefas = await prisma.tarefa.findMany({
    where,
    orderBy: [
      { prioridade: 'asc' },
      { criadoEm: 'desc' },
    ],
    include: {
      criador: { select: { nome: true } },
      responsavel: { select: { id: true, nome: true } },
    },
  })

  return NextResponse.json({ tarefas })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['DONO', 'GERENTE'].includes(session.user.perfil)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const tarefa = await prisma.tarefa.create({
    data: {
      titulo: body.titulo,
      descricao: body.descricao || null,
      criadorId: session.user.id,
      responsavelId: body.responsavelId,
      prioridade: body.prioridade || 'SEM_PRAZO',
      prazo: body.prazo ? new Date(body.prazo) : null,
    },
  })

  return NextResponse.json({ tarefa }, { status: 201 })
}
