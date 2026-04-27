import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const usuarios = await prisma.usuario.findMany({
    where: { ativo: true },
    orderBy: { nome: 'asc' },
    select: { id: true, nome: true, email: true, perfil: true, ativo: true, criadoEm: true },
  })

  return NextResponse.json({ usuarios })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.perfil !== 'DONO') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { nome, email, senha, perfil } = body

  if (!nome || !email || !senha) {
    return NextResponse.json({ error: 'Nome, email e senha são obrigatórios' }, { status: 400 })
  }

  const existe = await prisma.usuario.findUnique({ where: { email } })
  if (existe) {
    return NextResponse.json({ error: 'Email já cadastrado' }, { status: 409 })
  }

  const senhaHash = await bcrypt.hash(senha, 12)

  const usuario = await prisma.usuario.create({
    data: {
      nome,
      email,
      senha: senhaHash,
      perfil: perfil || 'CAIXA',
    },
    select: { id: true, nome: true, email: true, perfil: true },
  })

  return NextResponse.json({ usuario }, { status: 201 })
}
