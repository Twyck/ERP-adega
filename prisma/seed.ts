// @ts-ignore
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Criando dados iniciais...')

  // Cria usuário dono
  const senhaHash = await bcrypt.hash('admin123', 12)
  
  const dono = await prisma.usuario.upsert({
    where: { email: 'dono@adega.com' },
    update: {},
    create: {
      nome: 'Dono da Adega',
      email: 'dono@adega.com',
      senha: senhaHash,
      perfil: 'DONO',
    },
  })

  console.log('✅ Usuário dono criado:', dono.email)

  // Cria alguns produtos de exemplo
  const produtos = [
    { nome: 'Heineken Long Neck', marca: 'Heineken', volume: '330ml', categoria: 'Cerveja', precoVenda: 8.50, precoCusto: 4.20, estoqueAtual: 48, estoqueMinimo: 24 },
    { nome: 'Skol Lata', marca: 'Skol', volume: '350ml', categoria: 'Cerveja', precoVenda: 4.50, precoCusto: 2.10, estoqueAtual: 72, estoqueMinimo: 48 },
    { nome: 'Brahma Duplo Malte', marca: 'Brahma', volume: '350ml', categoria: 'Cerveja', precoVenda: 5.00, precoCusto: 2.50, estoqueAtual: 60, estoqueMinimo: 36 },
    { nome: 'Budweiser Long Neck', marca: 'Budweiser', volume: '330ml', categoria: 'Cerveja', precoVenda: 9.00, precoCusto: 4.50, estoqueAtual: 36, estoqueMinimo: 24 },
    { nome: 'Stella Artois Long Neck', marca: 'Stella Artois', volume: '330ml', categoria: 'Cerveja', precoVenda: 10.00, precoCusto: 5.20, estoqueAtual: 24, estoqueMinimo: 12 },
    { nome: 'Absolut Vodka', marca: 'Absolut', volume: '750ml', categoria: 'Vodka', precoVenda: 89.90, precoCusto: 52.00, estoqueAtual: 8, estoqueMinimo: 4 },
    { nome: 'Smirnoff Vodka', marca: 'Smirnoff', volume: '998ml', categoria: 'Vodka', precoVenda: 54.90, precoCusto: 31.00, estoqueAtual: 6, estoqueMinimo: 3 },
    { nome: 'Jack Daniels', marca: "Jack Daniel's", volume: '1L', categoria: 'Whisky', precoVenda: 149.90, precoCusto: 89.00, estoqueAtual: 5, estoqueMinimo: 2 },
    { nome: 'Johnnie Walker Red Label', marca: 'Johnnie Walker', volume: '1L', categoria: 'Whisky', precoVenda: 129.90, precoCusto: 75.00, estoqueAtual: 4, estoqueMinimo: 2 },
    { nome: 'Vinho Miolo Sérico Merlot', marca: 'Miolo', volume: '750ml', categoria: 'Vinho', precoVenda: 45.90, precoCusto: 24.00, estoqueAtual: 12, estoqueMinimo: 6 },
    { nome: 'Água Mineral Crystal 500ml', marca: 'Crystal', volume: '500ml', categoria: 'Água', precoVenda: 2.50, precoCusto: 0.90, estoqueAtual: 96, estoqueMinimo: 48 },
    { nome: 'Red Bull Energy Drink', marca: 'Red Bull', volume: '250ml', categoria: 'Energético', precoVenda: 12.00, precoCusto: 6.50, estoqueAtual: 24, estoqueMinimo: 12 },
  ]

  for (const p of produtos) {
    await prisma.produto.upsert({
      where: { codigoBarras: undefined as any },
      update: {},
      create: p,
    }).catch(() => prisma.produto.create({ data: p }))
  }

  console.log(`✅ ${produtos.length} produtos criados`)
  console.log('\n📋 Acesso inicial:')
  console.log('   Email: dono@adega.com')
  console.log('   Senha: admin123')
  console.log('\n⚠️  Troque a senha após o primeiro login!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
