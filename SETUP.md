# Setup - Execute no PowerShell (um por vez)

## 0. Deletar lockfile solto no Desktop (se existir)
del C:\Users\vikitor\Desktop\package-lock.json

## 1. Instalar dependências (incluindo o adapter do Prisma)
npm install

## 2. Instalar o adapter PostgreSQL do Prisma 7
npm install @prisma/adapter-pg pg

## 3. Gerar o cliente Prisma
npx prisma generate

## 4. Criar as tabelas no banco
npx prisma migrate dev --name init

## 5. Popular com dados iniciais
npx prisma db seed

## 6. Rodar
npm run dev

## Login inicial
Email: dono@adega.com
Senha: admin123
