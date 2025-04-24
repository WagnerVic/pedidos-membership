import * as React from "react";
import { useEffect, useState } from "react";
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
  Solicitante?: { EMail: string };
}

const PedidosMembership: React.FC<IPedidosMembershipProps> = (props) => {
  const [isDashboardActive, setIsDashboardActive] = useState(false);
  const [orders, setOrders] = useState<PedidoItem[]>([]);
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [dateOrder, setDateOrder] = useState("desc");
  const [mostrarModal, setMostrarModal] = useState(false);

  const abrirModal = () => setMostrarModal(true);
  const fecharModal = () => setMostrarModal(false);

  const currentUserEmail = props.context.pageContext.user.email;

  const groupLogos: Record<string, string> = {
    "Empresa A": logoEmpresaA,
    "Empresa B": logoEmpresaB,
  };

  const getStatusStyle = (status: string | undefined): string => {
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
    if (!isDashboardActive) return;

    const fetchOrders = async () => {
      try {
        const response = await props.context.httpClient.get(
          `${props.siteUrl}/_api/web/lists/getbytitle('Pedidos de Memberships')/items?$select=Id,Title,DetalhesdoPedido,Grupo/Title,GrupoId,DatadoPedido,Status,Solicitante/EMail&$expand=Grupo,Solicitante`,
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

        const pedidosVisiveis = data.value.filter(
          (item: PedidoItem) =>
            item.Solicitante?.EMail?.toLowerCase() ===
            currentUserEmail.toLowerCase()
        );

        setOrders(pedidosVisiveis);
      } catch (error) {
        console.error("Erro ao buscar pedidos:", error);
      }
    };

    fetchOrders();
  }, [isDashboardActive]);

  const formatDate = (isoDate: string | undefined) => {
    if (!isoDate) return "-";
    const date = new Date(isoDate);
    return date.toLocaleDateString("pt-BR");
  };

  const visibleGroupName = orders[0]?.Grupo?.Title || "Grupo Desconhecido";
  const visibleGroupLogo = groupLogos[visibleGroupName] || null;

  const filteredAndSortedOrders = orders
    .filter((order) =>
      statusFilter === "Todos"
        ? true
        : order.Status?.toLowerCase() === statusFilter.toLowerCase()
    )
    .sort((a, b) => {
      const dateA = new Date(a.DatadoPedido || "").getTime();
      const dateB = new Date(b.DatadoPedido || "").getTime();
      return dateOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

  const renderResumoCard = () => {
    const countByStatus = (status: string) =>
      orders.filter((o) => o.Status?.toLowerCase() === status.toLowerCase())
        .length;

    const statusMap = [
      { label: "Aprovado", style: styles.statusAprovado },
      { label: "Recusado", style: styles.statusRecusado },
      { label: "Em andamento", style: styles.statusAndamento },
      { label: "Pendente", style: styles.statusPendente },
    ];

    if (statusFilter === "Todos") {
      return (
        <div className={styles.resumoStatusContainer}>
          {statusMap.map((status) => (
            <div
              key={status.label}
              className={`${styles.resumoCard} ${status.style}`}
            >
              <span>{status.label}</span>
              <strong>{countByStatus(status.label)}</strong>
            </div>
          ))}
        </div>
      );
    }

    const statusClass = getStatusStyle(statusFilter);
    return (
      <div className={styles.resumoStatusContainer}>
        <div className={`${styles.resumoCard} ${statusClass}`}>
          <span>{statusFilter}</span>
          <strong>{filteredAndSortedOrders.length}</strong>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {!isDashboardActive ? (
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>🔐 Acesse sua Área de Pedidos</h1>
            <p className={styles.heroSubtitle}>
              Aqui você acompanha os pedidos que você criou dentro do seu grupo
              de Membership.
            </p>
            <button
              className={styles.ctaButton}
              onClick={() => setIsDashboardActive(true)}
            >
              Entrar na Área de Pedidos
            </button>
          </div>
        </section>
      ) : (
        <section className={styles.dashboard}>
          <button
            className={styles.voltarBtn}
            onClick={() => setIsDashboardActive(false)}
          >
            ← Voltar
          </button>

          <header className={styles.headerBox}>
            <div className={styles.headerInfo}>
              <h2>📋 Central de Acompanhamento de Pedidos</h2>
              <p>
                Usuário: <strong>{currentUserEmail}</strong>
              </p>
              <p>
                Grupo atual: <strong>{visibleGroupName}</strong>
              </p>
            </div>
            {visibleGroupLogo && (
              <img
                src={visibleGroupLogo}
                alt={`Logo do grupo ${visibleGroupName}`}
                className={styles.logoGrupo}
              />
            )}
          </header>

          <div className={styles.filtrosEAcao}>
            <div className={styles.filtrosContainer}>
              <label>
                <select
                  className={styles.selectFiltro}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="Todos">Todos</option>
                  <option value="Aprovado">Aprovado</option>
                  <option value="Recusado">Recusado</option>
                  <option value="Em andamento">Em andamento</option>
                  <option value="Pendente">Pendente</option>
                </select>
              </label>
              <label>
                <select
                  className={styles.selectFiltro}
                  value={dateOrder}
                  onChange={(e) => setDateOrder(e.target.value)}
                >
                  <option value="desc">Mais recentes</option>
                  <option value="asc">Mais antigos</option>
                </select>
              </label>
            </div>

            <button
              className={styles.botaoNovaSolicitacao}
              onClick={abrirModal}
            >
              Nova Solicitação
            </button>
          </div>

          {mostrarModal && (
            <div className={styles.modalOverlay}>
              <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                  <h3>Nova Solicitação</h3>
                  <button onClick={fecharModal} className={styles.modalClose}>
                    ✖
                  </button>
                </div>
                <iframe
                  title="Nova Solicitação de Pedidos"
                  src="https://ceiaufg.sharepoint.com/:l:/g/FEtSwgX5xoxCu7xhfuErpyUBxQo7FAEutdQ1OWOAObFFfg?nav=ZTUwZmYzNWYtNWU3Ni00ZmY4LWE3NzItMWEzNmEwMDI2MDcy"
                  width="100%"
                  height="600px"
                  style={{ border: "none" }}
                />
              </div>
            </div>
          )}

          {renderResumoCard()}

          <div className={styles.sectionDivider}>
            Acompanhe abaixo os pedidos que você solicitou:
          </div>

          {filteredAndSortedOrders.length > 0 ? (
            <div className={styles.grid}>
              {filteredAndSortedOrders.map((order) => (
                <div key={order.Id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h3>{order.Title}</h3>
                    {order.Status && (
                      <span
                        className={`${styles.statusBadge} ${getStatusStyle(
                          order.Status
                        )}`}
                      >
                        {order.Status}
                      </span>
                    )}
                  </div>
                  <div className={styles.cardBody}>
                    <p>
                      {order.DetalhesdoPedido || "Sem descrição fornecida."}
                    </p>
                  </div>
                  <div className={styles.cardFooter}>
                    <span className={styles.dataLabel}>📅 Data do Pedido:</span>{" "}
                    <span className={styles.dataValue}>
                      {formatDate(order.DatadoPedido)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>🚫 Nenhum pedido foi encontrado.</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default PedidosMembership;
