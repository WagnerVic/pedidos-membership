import * as React from "react";
import { useEffect, useState, useMemo } from "react";
import styles from "./PedidosMembership.module.scss";
import { IPedidosMembershipProps } from "./IPedidosMembershipProps";
import { HttpClient } from "@microsoft/sp-http";

import logoGlobo from "../assets/globo.png";
import logoEmpresaB from "../assets/empresab.png";

interface PedidoItem {
  Id: number;
  Title: string;
  DetalhesdoPedido?: string;
  Grupo?: { Title: string };
}

const PedidosMembership: React.FC<IPedidosMembershipProps> = (props) => {
  const [areaAtiva, setAreaAtiva] = useState(false);
  const [pedidos, setPedidos] = useState<PedidoItem[]>([]);

  const email = props.context.pageContext.user.email;

  const grupoSimulado = useMemo(() => {
    if (!email) return "Desconhecido";
    if (email === "wagner.menezes@ceia.ufg.br") return "Globo";
    if (email === "geovanna@seudominio.com") return "Empresa B";
    return "Visitante";
  }, [email]);

  const logosPorGrupo: Record<string, string> = {
    "Globo": logoGlobo,
    "Empresa B": logoEmpresaB,
  };

  useEffect(() => {
    if (!areaAtiva) return;

    const fetchPedidos = async () => {
      try {
        const response = await props.context.httpClient.get(
          `${props.siteUrl}/_api/web/lists/getbytitle('Pedidos de Memberships')/items?$select=Id,Title,DetalhesdoPedido,Grupo/Title&$expand=Grupo`,
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
          <button className={styles.voltarBtn} onClick={() => setAreaAtiva(false)}>
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

          <div className={styles.sectionDivider}>
            Pedidos vinculados ao seu grupo:
          </div>

          {pedidos.length > 0 ? (
            <div className={styles.grid}>
              {pedidos.map((pedido) => (
                <div key={pedido.Id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h3>{pedido.Title}</h3>
                  </div>
                  <div className={styles.cardBody}>
                    <p>
                      {pedido.DetalhesdoPedido || "Sem descrição fornecida."}
                    </p>
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
