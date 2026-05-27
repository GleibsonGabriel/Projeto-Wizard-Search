import { useEffect, useState, useMemo, useCallback } from 'react'

// ============================
// CONSTANTES
// ============================

const MOCK_DATA = {
  conta: {
    titular: 'Ótica Vision Prime LTDA',
    cnpj: '12.456.889/0001-77',
    ramo: 'Ótica e comércio varejista',
    capital: 'R$ 80.000,00',
    faturamento: 'R$ 1.240.000,00',
    banco: 'Banco Alpha'
  },
  score: 85,
  variaveis: [
    {
      categoria: 'Subjetiva',
      descricao: 'Endereço cadastrado diverge do registrado na Receita Federal.',
      peso: 15,
      alerta: 'warning'
    },
    {
      categoria: 'Subjetiva',
      descricao: 'Telefone cadastrado diverge do registro bancário principal.',
      peso: 15,
      alerta: 'warning'
    },
    {
      categoria: 'Crítica',
      descricao: 'Contas beneficiárias possuem marcações de fraude na DICT.',
      peso: 35,
      alerta: 'danger'
    },
    {
      categoria: 'Crítica',
      descricao: 'Movimentações incompatíveis com o faturamento declarado.',
      peso: 20,
      alerta: 'danger'
    }
  ],
  transacoes: [
    {
      horario: '02:13',
      tipo: 'PIX Saída',
      valor: 'R$ 48.200,00',
      destino: 'Conta PF - Banco Delta',
      status: 'Suspeita'
    },
    {
      horario: '02:41',
      tipo: 'PIX Saída',
      valor: 'R$ 51.900,00',
      destino: 'Empresa sem vínculo aparente',
      status: 'Suspeita'
    },
    {
      horario: '03:02',
      tipo: 'PIX Entrada',
      valor: 'R$ 87.000,00',
      destino: 'Recebimento pulverizado',
      status: 'Crítica'
    }
  ],
  resumo: {
    subjetivas: '30',
    criticas: '55',
    dict: '3'
  }
}

const STATUS_CONFIG = {
  Crítica: { class: 'danger' },
  Suspeita: { class: 'warning' },
  Normal: { class: 'success' }
}

// ============================
// HELPERS
// ============================

const getScoreClass = (score) => {
  if (typeof score !== 'number' || isNaN(score)) return 'secondary'
  if (score >= 70) return 'danger'
  if (score >= 40) return 'warning'
  return 'success'
}

const getStatusBadgeClass = (status) => {
  return STATUS_CONFIG[status]?.class || 'secondary'
}

// ============================
// COMPONENTES REUTILIZÁVEIS
// ============================

const Info = ({ titulo, valor, testId }) => (
  <div className="mb-3" data-testid={testId}>
    <small className="text-light-emphasis">{titulo}</small>
    <div className="text-break">{valor || 'Não informado'}</div>
  </div>
)

const Resumo = ({ titulo, valor, cor }) => (
  <div className="col-md-4 mb-3">
    <div className="bg-dark rounded p-3 h-100">
      <h5 className={`text-${cor}`}>{titulo}</h5>
      <div className="display-6">{valor}</div>
    </div>
  </div>
)

const LoadingScreen = () => (
  <div className="bg-dark text-light min-vh-100 d-flex justify-content-center align-items-center">
    <div className="text-center">
      <div
        className="spinner-border text-danger mb-4"
        role="status"
        aria-label="Carregando"
        style={{ width: '5rem', height: '5rem' }}
      >
        <span className="visually-hidden">Carregando...</span>
      </div>
      <h1 className="fw-bold display-4 mb-3">Wizard Search</h1>
      <p className="text-secondary fs-5">Inicializando mecanismos AML...</p>
      <div className="progress mt-4" style={{ height: '30px', width: '400px', maxWidth: '100%' }}>
        <div
          className="progress-bar progress-bar-striped progress-bar-animated bg-danger"
          style={{ width: '100%' }}
          role="progressbar"
          aria-valuenow="100"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          Consumindo API / JSON / DICT
        </div>
      </div>
    </div>
  </div>
)

const ContaCard = ({ conta }) => (
  <div className="card bg-secondary text-light border-0 h-100">
    <div className="card-body">
      <h4 className="mb-4">Conta Analisada</h4>
      <Info titulo="Titular" valor={conta.titular} testId="info-titular" />
      <Info titulo="CNPJ" valor={conta.cnpj} testId="info-cnpj" />
      <Info titulo="Ramo" valor={conta.ramo} testId="info-ramo" />
      <Info titulo="Capital Declarado" valor={conta.capital} testId="info-capital" />
      <Info titulo="Faturamento Mensal" valor={conta.faturamento} testId="info-faturamento" />
      <Info titulo="Instituição" valor={conta.banco} testId="info-banco" />
    </div>
  </div>
)

const ScoreCard = ({ score, classeRisco, resumo }) => {
  const safeScore = typeof score === 'number' && !isNaN(score) ? score : 0
  
  return (
    <div className="card bg-secondary text-light border-0 mb-4">
      <div className="card-body">
        <h4 className="mb-3">Score de Risco</h4>
        <div className="progress mb-4" style={{ height: '35px' }}>
          <div
            className={`progress-bar bg-${classeRisco}`}
            style={{ width: `${safeScore}%` }}
            role="progressbar"
            aria-valuenow={safeScore}
            aria-valuemin="0"
            aria-valuemax="100"
          >
            {safeScore}%
          </div>
        </div>
        <div className="row text-center">
          <Resumo titulo="Subjetivas" valor={resumo?.subjetivas || '0'} cor="warning" />
          <Resumo titulo="Críticas" valor={resumo?.criticas || '0'} cor="danger" />
          <Resumo titulo="DICT" valor={resumo?.dict || '0'} cor="info" />
        </div>
      </div>
    </div>
  )
}

const VariaveisList = ({ variaveis }) => (
  <div className="card bg-secondary text-light border-0">
    <div className="card-body">
      <h4 className="mb-4">Variáveis Interpretadas</h4>
      {variaveis && variaveis.length > 0 ? (
        variaveis.map((item, index) => (
          <div key={`variavel-${index}`} className={`alert alert-${item.alerta}`}>
            <div className="d-flex justify-content-between">
              <div>
                <strong>{item.categoria}</strong>
                <div>{item.descricao}</div>
              </div>
              <span className="badge bg-dark fs-6">+{item.peso}</span>
            </div>
          </div>
        ))
      ) : (
        <p className="text-secondary">Nenhuma variável identificada</p>
      )}
    </div>
  </div>
)

const TransacoesTable = ({ transacoes }) => (
  <div className="card bg-secondary text-light border-0 mt-4">
    <div className="card-body">
      <h4 className="mb-4">Dados Consumidos via API</h4>
      <div className="table-responsive">
        <table className="table table-dark table-hover">
          <thead>
            <tr>
              <th>Horário</th>
              <th>Tipo</th>
              <th>Valor</th>
              <th>Destino</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {transacoes && transacoes.length > 0 ? (
              transacoes.map((item, index) => (
                <tr key={`transacao-${index}`}>
                  <td>{item.horario || '-'}</td>
                  <td>{item.tipo || '-'}</td>
                  <td>{item.valor || '-'}</td>
                  <td className="text-break">{item.destino || '-'}</td>
                  <td>
                    <span className={`badge bg-${getStatusBadgeClass(item.status)}`}>
                      {item.status || 'Desconhecido'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center text-secondary">
                  Nenhuma transação encontrada
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)

const ParecerCard = () => (
  <div className="card bg-white border-danger mt-4">
    <div className="card-body">
      <h4 className="text-danger mb-3">Parecer Automatizado</h4>
      <p>
        O Wizard Search identificou incompatibilidade entre o faturamento declarado 
        e o volume transacional da conta analisada.
      </p>
      <p>
        Foram detectadas relações transacionais recorrentes com contas previamente 
        sinalizadas na DICT.
      </p>
      <div className="alert alert-danger mt-3 mb-0" role="alert">
        Recomendação: Conferir transacionalidade na DICT comparado aos birôs de vínculo societário/laboral.
      </div>
    </div>
  </div>
)

const Dashboard = ({ dados }) => {
  const { conta, score, variaveis, transacoes, resumo } = dados
  
  const classeRisco = useMemo(() => getScoreClass(score), [score])

  return (
    <div className="bg-dark text-light min-vh-100 py-4">
      <div className="container">
        <header className="mb-4 d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <h1 className="fw-bold">Wizard Search</h1>
            <p className="text-secondary mb-0">Plataforma de Automação em Prevenção à Fraudes</p>
          </div>
          <span className={`badge bg-${classeRisco} fs-5 p-3`}>
            SCORE {typeof score === 'number' ? score : '?'}/100
          </span>
        </header>

        <div className="row g-4">
          <div className="col-lg-4">
            <ContaCard conta={conta} />
          </div>
          <div className="col-lg-8">
            <ScoreCard score={score} classeRisco={classeRisco} resumo={resumo} />
            <VariaveisList variaveis={variaveis} />
          </div>
        </div>

        <TransacoesTable transacoes={transacoes} />
        <ParecerCard />
      </div>
    </div>
  )
}

// ============================
// COMPONENTE PRINCIPAL
// ============================

export default function App() {
  const [carregando, setCarregando] = useState(true)
  const [dados, setDados] = useState(null)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    let isMounted = true
    let timer = null

    const carregarDados = async () => {
      try {
        setCarregando(true)
        setErro(null)
        
        // Simula carregamento de dados
        timer = setTimeout(() => {
          if (isMounted) {
            setDados(MOCK_DATA)
            setCarregando(false)
          }
        }, 3000)
      } catch (error) {
        if (isMounted) {
          console.error('Erro ao carregar dados:', error)
          setErro('Falha ao carregar os dados. Tente novamente.')
          setCarregando(false)
        }
      }
    }

    carregarDados()

    return () => {
      isMounted = false
      if (timer) clearTimeout(timer)
    }
  }, [])

  // Tratamento de erro
  if (erro) {
    return (
      <div className="bg-dark text-light min-vh-100 d-flex justify-content-center align-items-center">
        <div className="text-center">
          <div className="alert alert-danger" role="alert">
            {erro}
          </div>
          <button 
            className="btn btn-danger"
            onClick={() => window.location.reload()}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  if (carregando) {
    return <LoadingScreen />
  }

  if (!dados) {
    return null
  }

  return <Dashboard dados={dados} />
}