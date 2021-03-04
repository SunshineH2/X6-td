import { Graph, Addon, FunctionExt, Shape, Node } from "@antv/x6";
import "./shape";
import graphData from "./data";

export default class FlowGraph {
  public static graph: Graph;
  private static stencil: Addon.Stencil;

  public static init() {
    this.graph = new Graph({
      container: document.getElementById("container")!,
      width: 1000,
      height: 800,
      grid: {
        size: 10,
        visible: true,
        type: "doubleMesh",
        args: [
          {
            color: "#cccccc",
            thickness: 1,
          },
          {
            color: "#5F95FF",
            thickness: 1,
            factor: 4,
          },
        ],
      },
      selecting: {
        enabled: true,
        multiple: true,
        rubberband: true,
        movable: true,
        showNodeSelectionBox: true,
      },
      connecting: {
        anchor: "center",
        connectionPoint: "anchor",
        allowBlank: false, // 是否允许连接到画布空白位置
        allowMulti: false, // 是否允许在相同的起始和终止节点之间创建多条边
        allowLoop: false, // 是否允许创建循环连线，即起始和终止节点是否是同一个节点
        highlight: true,
        snap: true, // 距离为50px时自动吸附
        createEdge() {
          return new Shape.Edge({
            attrs: {
              line: {
                stroke: "#5F95FF",
                strokeWidth: 1,
                targetMarker: {
                  name: "classic",
                  size: 8,
                },
              },
            },
            router: {
              name: "manhattan",
            },
            label: "",
            zIndex: 0,
          });
        },
        validateConnection({
          sourceView,
          targetView,
          sourceMagnet,
          targetMagnet,
          targetPort: targetPortId,
          sourcePort: sourcePortId,
        }) {
          // 不允许连接到自己
          if (sourceView === targetView) {
            return false;
          }
          // 只能从输出链接桩创建连接
          if (
            !sourceMagnet ||
            ["in", "in1"].includes(
              sourceMagnet.getAttribute("port-group") || ""
            )
          ) {
            return false;
          }
          // 只能连接到输入链接桩
          if (
            !targetMagnet ||
            ["out", "out1"].includes(
              targetMagnet.getAttribute("port-group") || ""
            )
          ) {
            return false;
          }
          // 判断源链接桩是否可连接
          const sourceNode = (sourceView?.cell as unknown) as Node;
          const sourcePort = sourceNode.getPort(sourcePortId ?? "");
          // 判断目标链接桩是否可连接
          // const portId: string = targetMagnet.getAttribute('port')!
          const targetNode = (targetView?.cell as unknown) as Node;
          const targetPort = targetNode.getPort(targetPortId ?? "");

          return !(sourcePort?.connected || targetPort?.connected);
        },
      },
      highlighting: {
        magnetAvailable: {
          name: "stroke",
          args: {
            padding: 4,
            attrs: {
              strokeWidth: 4,
              stroke: "rgba(223,234,255)",
            },
          },
        },
      },
      snapline: true,
      history: true,
      clipboard: {
        enabled: true,
      },
      keyboard: {
        enabled: true,
      },
      embedding: {
        enabled: true,
        findParent({ node }) {
          const bbox = node.getBBox();
          return this.getNodes().filter((node) => {
            // 只有 data.parent 为 true 的节点才是父节点
            const data = node.getData<any>();
            if (data && data.parent) {
              const targetBBox = node.getBBox();
              return bbox.isIntersectWithRect(targetBBox);
            }
            return false;
          });
        },
      },
    });
    this.initStencil();
    this.initShape();
    this.initGraphShape();
    this.initEvent();
    return this.graph;
  }

  private static initStencil() {
    // 提供了一个类似侧边栏的UI组件，支持分组、折叠和搜索
    this.stencil = new Addon.Stencil({
      target: this.graph, // 目标画布
      stencilGraphWidth: 280, // 模板画布宽度
      search: { rect: true }, // 支持搜索
      collapsable: true, // 是否显示展开/折叠按钮
      groups: [
        {
          name: "basic",
          title: "基础节点",
          graphHeight: 270,
        },
        {
          name: "combination",
          title: "组合节点",
          layoutOptions: {
            columns: 1,
            marginX: 60,
          },
          graphHeight: 260,
        },
      ],
    });
    const stencilContainer = document.querySelector("#stencil");
    stencilContainer?.appendChild(this.stencil.container);
  }

  private static initShape() {
    const { graph } = this;
    const r1 = graph.createNode({
      shape: "flow-chart-rect",
      attrs: {
        body: {
          rx: 24,
          ry: 24,
        },
        text: {
          textWrap: {
            text: "起始节点",
          },
        },
      },
    });
    const r2 = graph.createNode({
      shape: "flow-chart-rect",
      attrs: {
        text: {
          textWrap: {
            text: "流程节点",
          },
        },
      },
    });
    const r3 = graph.createNode({
      shape: "flow-chart-rect",
      width: 52,
      height: 52,
      angle: 45,
      attrs: {
        "edit-text": {
          style: {
            transform: "rotate(-45deg)",
          },
        },
        text: {
          textWrap: {
            text: "判断节点",
          },
          transform: "rotate(-45deg)",
        },
      },
      ports: {
        groups: {
          in: {
            position: {
              name: "top",
              args: {
                dx: -26,
              },
            },
          },
          out: {
            position: {
              name: "right",
              args: {
                dy: -26,
              },
            },
          },
          out1: {
            position: {
              name: "bottom",
              args: {
                dx: 26,
              },
            },
          },
          in1: {
            position: {
              name: "left",
              args: {
                dy: 26,
              },
            },
          },
        },
      },
    });
    const r4 = graph.createNode({
      shape: "flow-chart-rect",
      width: 70,
      height: 70,
      attrs: {
        body: {
          rx: 35,
          ry: 35,
        },
        text: {
          textWrap: {
            text: "链接节点",
          },
        },
      },
    });
    const r5 = graph.createNode({
      shape: "flow-chart-rect",
      attrs: {
        body: {
          rx: 24,
          ry: 24,
        },
        text: {
          textWrap: {
            text: "结束节点",
          },
        },
      },
      ports: {
        items: [
          {
            group: "in",
            connected: false,
          },
          {
            group: "out",
            connected: false,
          },
          {
            group: "out1",
            connected: false,
          },
          {
            group: "in1",
            connected: false,
          },
        ],
      },
    });

    const c1 = graph.createNode({
      shape: "flow-chart-image-rect",
    });
    const c2 = graph.createNode({
      shape: "flow-chart-title-rect",
    });
    const c3 = graph.createNode({
      shape: "flow-chart-animate-text",
    });

    this.stencil.load([r1, r2, r3, r4, r5], "basic");
    this.stencil.load([c1, c2, c3], "combination");
  }

  private static initGraphShape() {
    this.graph.fromJSON(graphData as any);
  }

  private static showPorts(ports: NodeListOf<SVGAElement>, show: boolean) {
    for (let i = 0, len = ports.length; i < len; i = i + 1) {
      ports[i].style.visibility = show ? "visible" : "hidden";
    }
  }

  private static initEvent() {
    const { graph } = this;
    const container = document.getElementById("container")!;

    /** 上下文菜单/右键点击 */
    graph.on("node:dblclick", ({ cell, view }) => {
      const oldText = cell.attr("text/textWrap/text") as string;
      const elem = view.container.querySelector(".x6-edit-text") as HTMLElement;
      if (elem == null) {
        return;
      }
      cell.attr("text/style/display", "none");
      if (elem) {
        elem.style.display = "";
        elem.contentEditable = "true";
        elem.innerText = oldText;
        elem.focus();
      }
      const onBlur = () => {
        cell.attr("text/textWrap/text", elem.innerText);
        cell.attr("text/style/display", "");
        elem.style.display = "none";
        elem.contentEditable = "false";
      };
      elem.addEventListener("blur", () => {
        onBlur();
        elem.removeEventListener("blur", onBlur);
      });
    });

    /** 鼠标移入 */
    graph.on(
      "node:mouseenter",
      FunctionExt.debounce(() => {
        const ports = container.querySelectorAll(
          ".x6-port-body"
        ) as NodeListOf<SVGAElement>;
        this.showPorts(ports, true);
      }),
      500
    );

    /** 鼠标移出 */
    graph.on("node:mouseleave", () => {
      const ports = container.querySelectorAll(
        ".x6-port-body"
      ) as NodeListOf<SVGAElement>;
      this.showPorts(ports, false);
    });

    // graph.on("node:collapse", ({ node, e }) => {
    //   e.stopPropagation();
    //   node.toggleCollapse();
    //   const collapsed = node.isCollapsed();
    //   const cells = node.getDescendants();
    //   cells.forEach((n) => {
    //     if (collapsed) {
    //       n.hide();
    //     } else {
    //       n.show();
    //     }
    //   });
    // });

    /** 删除节点/边 */
    graph.bindKey("backspace", () => {
      const cells = graph.getSelectedCells();
      if (cells.length) {
        graph.removeCells(cells);
      }
    });

    /** 边连接 */
    graph.on("edge:connected", ({ isNew, edge, currentPort, currentView }) => {
      if (isNew) {
        const sourcePortId = edge.getSourcePortId()!;
        const sourceNode = edge.getSourceNode();
        sourceNode?.setPortProp(sourcePortId, "connected", true);
        const currentNode = (currentView?.cell as unknown) as Node;
        currentNode.setPortProp(currentPort!, "connected", true);
      }
    });
  }
}
