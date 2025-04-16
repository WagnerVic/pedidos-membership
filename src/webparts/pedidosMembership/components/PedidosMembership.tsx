import * as React from "react";
import { useEffect, useState, useMemo } from "react";
import styles from "./PedidosMembership.module.scss";
import { IPedidosMembershipProps } from "./IPedidosMembershipProps";
import { HttpClient } from "@microsoft/sp-http";

// 🔧 Tipagem dos itens da lista
interface PedidoItem {
  Id: number;
  Title: string;
  DetalhesdoPedido?: string;
  Grupo?: string;
}

const PedidosMembership: React.FC<IPedidosMembershipProps> = (props) => {
  const [areaAtiva, setAreaAtiva] = useState(false);
  const [pedidos, setPedidos] = useState<PedidoItem[]>([]);

  const email = props.context.pageContext.user.email;

  // 🔐 Grupo simulado baseado no e-mail do usuário
  const grupoSimulado = useMemo(() => {
    if (!email) return "Desconhecido";
    if (email === "wagner.menezes@ceiaufg.onmicrosoft.com") return "Globo";
    if (email === "geovanna@seudominio.com") return "Empresa B";
    return "Visitante";
  }, [email]);

  // 📡 Carrega os pedidos da lista ao acessar a área restrita
  useEffect(() => {
    if (!areaAtiva) return;

    const fetchPedidos = async () => {
      try {
        const response = await props.context.httpClient.get(
          `${props.siteUrl}/_api/web/lists/getbytitle('Pedidos de Memberships')/items?$select=Id,Title,DetalhesdoPedido,Grupo`,
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
          (item: PedidoItem) => item.Grupo === grupoSimulado
        );

        setPedidos(pedidosFiltrados);
      } catch (error) {
        console.error("❌ Erro ao buscar pedidos:", error);
      }
    };

    fetchPedidos();
  }, [areaAtiva, grupoSimulado]);

  return (
    <div className={styles.pedidosMembership}>
      {!areaAtiva ? (
        <div className={styles.entrada}>
          <h2>Bem-vindo ao sistema de Memberships</h2>
          <p>Essa área é exclusiva para membros autenticados.</p>
          <button className={styles.botao} onClick={() => setAreaAtiva(true)}>
            Acessar Área Restrita
          </button>
        </div>
      ) : (
        <div className={styles.areaRestrita}>
          <h2>Área do Membership</h2>
          <p>
            Usuário: <strong>{email}</strong>
          </p>
          <p>
            Grupo identificado: <strong>{grupoSimulado}</strong>
          </p>

          <h3 style={{ marginTop: "20px" }}>Pedidos encontrados:</h3>
          {pedidos.length > 0 ? (
            <ul>
              {pedidos.map((pedido) => (
                <li key={pedido.Id}>
                  <strong>{pedido.Title}</strong>:{" "}
                  {pedido.DetalhesdoPedido || "(sem descrição)"}
                </li>
              ))}
            </ul>
          ) : (
            <p>Nenhum pedido encontrado para esse grupo.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default PedidosMembership;
