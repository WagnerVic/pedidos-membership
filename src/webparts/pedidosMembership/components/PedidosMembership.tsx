import * as React from "react";
import { useEffect, useState, useMemo } from "react";
import styles from "./PedidosMembership.module.scss";
import { IPedidosMembershipProps } from "./IPedidosMembershipProps";
import { HttpClient } from "@microsoft/sp-http";

import logoEmpresaA from "../assets/empresaa.png";
import logoEmpresaB from "../assets/empresab.png";

interface PedidoItem {
  Id: number;
  Title: string;
  DetalhesdoPedido?: string;
  Grupo?: { Title: string };
  GrupoId?: number;
  DatadoPedido?: string;
  Status?: string;
}

const PedidosMembership: React.FC<IPedidosMembershipProps> = (props) => {
  const [areaAtiva, setAreaAtiva] = useState(false);
  const [pedidos, setPedidos] = useState<PedidoItem[]>([]);
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [ordenacaoData, setOrdenacaoData] = useState("desc");

  const email = props.context.pageContext.user.email;

  const grupoSimulado = useMemo(() => {
    if (!email) return "Desconhecido";
    if (email === "wagner.menezes@ceia.ufg.br") return "Empresa B";
    if (email === "geovanna@seudominio.com") return "Empresa B";
    return "Visitante";
  }, [email]);

  const logosPorGrupo: Record<string, string> = {
    "Empresa A": logoEmpresaA,
    "Empresa B": logoEmpresaB,
  };

  const getStatusClass = (status: string | undefined): string => {
    switch ((status || "").toLowerCase()) {
      case "aprovado":
        return styles.statusAprovado;
      case "recusado":
        return styles.statusRecusado;
      case "em andamento":
        return styles.statusAndamento;
      case "pendente":
        return styles.statusPendente;
      default:
        return styles.statusDesconhecido;
    }
  };

  useEffect(() => {
    if (!areaAtiva) return;

    const fetchPedidos = async () => {
      try {
        const response = await props.context.httpClient.get(
          `${props.siteUrl}/_api/web/lists/getbytitle('Pedidos de Memberships')/items?$select=Id,Title,DetalhesdoPedido,Grupo/Title,GrupoId,DatadoPedido,Status&$expand=Grupo`,
          HttpClient.configurations.v1,
          {
            headers: {
              Accept: "application/json;odata=nometadata",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const pedidosFiltrados = data.value.filter(
          (item: PedidoItem) => item.Grupo?.Title === grupoSimulado
        );
        setPedidos(pedidosFiltrados);
      } catch (error) {
        console.error("Erro ao buscar pedidos:", error);
      }
    };

    fetchPedidos();
  }, [areaAtiva, grupoSimulado]);

  const formatarData = (dataISO: string | undefined) => {
    if (!dataISO) return "-";
    const data = new Date(dataISO);
    return data.toLocaleDateString("pt-BR");
  };

  const pedidosFiltradosOrdenados = pedidos
    .filter((pedido) =>
      filtroStatus === "Todos"
        ? true
        : pedido.Status?.toLowerCase() === filtroStatus.toLowerCase()
    )
    .sort((a, b) => {
      const dataA = new Date(a.DatadoPedido || "").getTime();
      const dataB = new Date(b.DatadoPedido || "").getTime();
      return ordenacaoData === "desc" ? dataB - dataA : dataA - dataB;
    });

  return (
    <div className={styles.container}>
      {!areaAtiva ? (
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>🔐 Acesse sua Área de Pedidos</h1>
            <p className={styles.heroSubtitle}>
              Visualize os pedidos vinculados ao seu grupo de Membership em um
              só lugar.
            </p>
            <button
              className={styles.ctaButton}
              onClick={() => setAreaAtiva(true)}
            >
              Entrar na Área de Pedidos
            </button>
          </div>
        </section>
      ) : (
        <section className={styles.dashboard}>
          <button
            className={styles.voltarBtn}
            onClick={() => setAreaAtiva(false)}
          >
            ← Voltar
          </button>

          <header className={styles.headerBox}>
            <div className={styles.headerInfo}>
              <h2>📋 Central de Pedidos do Membership</h2>
              <p>
                Usuário: <strong>{email}</strong>
              </p>
              <p>
                Grupo do Membership: <strong>{grupoSimulado}</strong>
              </p>
            </div>
            {logosPorGrupo[grupoSimulado] && (
              <img
                src={logosPorGrupo[grupoSimulado]}
                alt={`Logo do grupo ${grupoSimulado}`}
                className={styles.logoGrupo}
              />
            )}
          </header>

          <div className={styles.filtrosContainer}>
            <label>
              Status:
              <select
                className={styles.selectFiltro}
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
              >
                <option value="Todos">Todos</option>
                <option value="Aprovado">Aprovado</option>
                <option value="Recusado">Recusado</option>
                <option value="Em andamento">Em andamento</option>
                <option value="Pendente">Pendente</option>
              </select>
            </label>

            <label>
              Ordenar por:
              <select
                className={styles.selectFiltro}
                value={ordenacaoData}
                onChange={(e) => setOrdenacaoData(e.target.value)}
              >
                <option value="desc">Mais recentes</option>
                <option value="asc">Mais antigos</option>
              </select>
            </label>
          </div>

          <div className={styles.sectionDivider}>
            Pedidos vinculados ao seu grupo:
          </div>

          {pedidosFiltradosOrdenados.length > 0 ? (
            <div className={styles.grid}>
              {pedidosFiltradosOrdenados.map((pedido) => (
                <div key={pedido.Id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h3>{pedido.Title}</h3>
                    {pedido.Status && (
                      <span
                        className={`${styles.statusBadge} ${getStatusClass(
                          pedido.Status
                        )}`}
                      >
                        {pedido.Status}
                      </span>
                    )}
                  </div>

                  <div className={styles.cardBody}>
                    <p>
                      {pedido.DetalhesdoPedido || "Sem descrição fornecida."}
                    </p>
                  </div>

                  <div className={styles.cardFooter}>
                    <span className={styles.dataLabel}>📅 Data do Pedido:</span>{" "}
                    <span className={styles.dataValue}>
                      {formatarData(pedido.DatadoPedido)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>🚫 Nenhum pedido foi encontrado para esse grupo.</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default PedidosMembership;
