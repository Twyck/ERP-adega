import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function calcularMargem(precoVenda: number, precoCusto: number): number {
  if (!precoCusto || precoCusto === 0) return 0
  return ((precoVenda - precoCusto) / precoVenda) * 100
}

export function diasParaVencer(dataValidade: Date | string): number {
  const hoje = new Date()
  const validade = new Date(dataValidade)
  const diff = validade.getTime() - hoje.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export const PERFIL_LABELS: Record<string, string> = {
  DONO: 'Dono',
  GERENTE: 'Gerente',
  ESTOQUISTA: 'Estoquista',
  CAIXA: 'Caixa',
}

export const PRIORIDADE_LABELS: Record<string, string> = {
  URGENTE: 'Urgente',
  HOJE: 'Hoje',
  SEM_PRAZO: 'Sem prazo',
}

export const STATUS_TAREFA_LABELS: Record<string, string> = {
  PENDENTE: 'Pendente',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDA: 'Concluída',
}

export const TIPO_OCORRENCIA_LABELS: Record<string, string> = {
  AMASSADO: 'Amassado',
  VENCIDO: 'Vencido',
  QUEBRADO: 'Quebrado',
  DANIFICADO: 'Danificado',
  OUTRO: 'Outro',
}
