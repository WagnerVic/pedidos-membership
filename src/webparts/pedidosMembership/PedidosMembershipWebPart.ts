import * as React from "react";
import * as ReactDom from "react-dom";
import { Version } from "@microsoft/sp-core-library";
import { IPropertyPaneConfiguration } from "@microsoft/sp-property-pane";
import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";

import PedidosMembership from "./components/PedidosMembership";
import { IPedidosMembershipProps } from "./components/IPedidosMembershipProps";

export interface IPedidosMembershipWebPartProps {}

export default class PedidosMembershipWebPart extends BaseClientSideWebPart<IPedidosMembershipWebPartProps> {
  public render(): void {
    const element: React.ReactElement<IPedidosMembershipProps> =
      React.createElement(PedidosMembership, {
        context: this.context,
        siteUrl: this.context.pageContext.web.absoluteUrl,
      });

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse("1.0");
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [],
    };
  }
}
