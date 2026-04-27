export type Perfil = 'DONO' | 'GERENTE' | 'ESTOQUISTA' | 'CAIXA'
export type Prioridade = 'URGENTE' | 'HOJE' | 'SEM_PRAZO'
export type StatusTarefa = 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA'
export type TipoOcorrencia = 'AMASSADO' | 'VENCIDO' | 'QUEBRADO' | 'DANIFICADO' | 'OUTRO'
export type TipoPagamento = 'DINHEIRO' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'PIX' | 'OUTRO'
export type TipoMovimentacao = 'ENTRADA' | 'SAIDA' | 'AJUSTE' | 'DESCARTE'

export interface UsuarioSession {
  id: string
  name: string
  email: string
  perfil: Perfil
}

export interface ProdutoComEstoque {
  id: string
  nome: string
  marca?: string | null
  volume?: string | null
  categoria?: string | null
  codigoBarras?: string | null
  precoVenda: number
  precoCusto?: number | null
  estoqueAtual: number
  estoqueMinimo: number
  ativo: boolean
  margemBruta?: number
}

export interface ItemCarrinho {
  produto: ProdutoComEstoque
  quantidade: number
  subtotal: number
}

export interface DashboardStats {
  vendasHoje: number
  faturamentoHoje: number
  produtosEstoqueBaixo: number
  produtosVencendo: number
  tarefasPendentes: number
  ocorrenciasAbertas: number
}
