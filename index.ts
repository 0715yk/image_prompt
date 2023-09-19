import Konva from "konva";
import {
  getContainSize,
  getDrawCursor,
  EventListeners,
  loadImage,
} from "./libs";

const imagePrompt = (function () {
  const output = {
    width: 0,
    height: 0,
    image: null,
  };
  let history: Konva.Line[] = [];
  let historyStep = 0;

  const brushOptions = {
    strokeWidth: 30,
    strokeColor: "#ffffff",
  } as { strokeWidth: number; strokeColor: string };

  let drawingModeOn = false;
  let drawingMode: "brush" | "eraser" | "on" | "off" = "brush";
  let scale = 1;
  let stage = null as null | Konva.Stage;
  let drawLayer = null as null | Konva.Layer;
  let imageLayer = null as null | Konva.Layer;
  let currentLine: Konva.Line | null = null;

  const containerSizeOption: {
    width: null | number;
    height: null | number;
  } = { width: null, height: null };

  const eventListener = new EventListeners();

  window.addEventListener("resize", function () {
    if (stage === null) return;
    stage.container().style.cursor = getDrawCursor(brushOptions.strokeWidth);
  });

  return {
    getStage() {
      return stage;
    },
    goTo(index: number) {
      if (drawLayer !== null) {
        history = history.filter((line, _) => {
          if (_ >= index) {
            line?.remove();
            return false;
          } else {
            if (drawLayer !== null) {
              drawLayer.add(line);
              return true;
            } else {
              return false;
            }
          }
        });

        drawLayer.batchDraw();
        historyStep = index;
        eventListener.dispatch("change", {
          cnt: historyStep,
          stage: stage?.toJSON(),
        });
      }
    },
    undo() {
      if (historyStep === 0) {
        return;
      }
      historyStep--;
      const lineToRemove = history[historyStep];
      if (lineToRemove !== undefined && drawLayer !== null) {
        lineToRemove.remove();
        drawLayer.batchDraw();
        eventListener.dispatch("change", {
          cnt: historyStep,
          stage: stage?.toJSON(),
        });
      }
    },
    redo() {
      if (historyStep === history.length) {
        return;
      }

      const lineToRedraw = history[historyStep];
      if (lineToRedraw !== undefined && drawLayer !== null) {
        drawLayer.add(lineToRedraw);
        historyStep++;
        drawLayer.batchDraw();
        eventListener.dispatch("change", {
          cnt: historyStep,
          stage: stage?.toJSON(),
        });
      }
    },

    on(eventType: string, eventCallback: (...args: any) => void) {
      eventListener.addEventListener(eventType, eventCallback);
    },

    off(eventType: string, eventCallback: (...args: any) => void) {
      eventListener.removeEventListener(eventType, eventCallback);
    },
    init: function ({
      container,
      brushOption,
      width,
      height,
      on,
      cache,
      containerSize,
    }: {
      container: string | HTMLDivElement;
      brushOption?: { strokeWidth: number; strokeColor: string };
      width?: number;
      height?: number;
      on?: {
        [eventType: string]: (arg: any) => void;
      };
      cache?: string;
      containerSize: {
        width: null | number;
        height: null | number;
      };
    }) {
      if (cache) {
        stage = Konva.Node.create(cache, container) as Konva.Stage;
        const iLayer = stage.findOne("#imageLayer") as Konva.Layer;
        const dLayer = stage.findOne("#drawLayer") as Konva.Layer;
        imageLayer = iLayer;
        drawLayer = dLayer;
      } else {
        stage = new Konva.Stage({
          container,
          width,
          height,
        });

        imageLayer = new Konva.Layer({
          id: "imageLayer",
        });
        drawLayer = new Konva.Layer({
          id: "drawLayer",
        });
      }

      stage.add(imageLayer);
      stage.add(drawLayer);

      let isPaint = false;

      if (brushOption) {
        brushOptions.strokeColor = brushOption.strokeColor;
        brushOptions.strokeWidth = brushOption.strokeWidth;
      }

      containerSizeOption.width = containerSize.width;
      containerSizeOption.height = containerSize.height;

      stage.on("mousedown", () => {
        if (!drawingModeOn) return;
        isPaint = true;

        if (stage !== null) {
          const pointerPosition = stage.getPointerPosition();
          if (drawLayer !== null && pointerPosition !== null) {
            const x = (pointerPosition.x - drawLayer.x()) / scale;
            const y = (pointerPosition.y - drawLayer.y()) / scale;
            const minValue = 0.0001;
            currentLine = new Konva.Line({
              stroke: brushOptions?.strokeColor,
              strokeWidth: brushOptions?.strokeWidth / scale,
              globalCompositeOperation:
                drawingMode === "brush" ? "source-over" : "destination-out",
              lineCap: "round",
              lineJoin: "round",
              points: [x, y, x + minValue, y + minValue],
            });

            drawLayer.add(currentLine);
          }
        }
      });

      stage.on("mousemove", ({ evt }) => {
        if (!drawingModeOn) return;
        if (!isPaint) return;

        evt.preventDefault();
        if (stage !== null) {
          const pointerPosition = stage.getPointerPosition();
          if (drawLayer !== null && pointerPosition !== null) {
            const x = (pointerPosition.x - drawLayer.x()) / scale;
            const y = (pointerPosition.y - drawLayer.y()) / scale;
            if (currentLine !== null) {
              currentLine.points(currentLine.points().concat([x, y]));
            }
          }
        }
      });

      stage.on("mouseup", () => {
        if (!drawingModeOn) return;
        if (!isPaint) return;

        isPaint = false;

        if (currentLine !== null) {
          history = history.slice(0, historyStep);
          history.push(currentLine);
          historyStep++;
          eventListener.dispatch("change", {
            cnt: historyStep,
            stage: stage?.toJSON(),
          });
        }
      });

      if (on !== undefined) {
        Object.keys(on).forEach((eventName) => {
          eventListener.addEventListener(eventName, on[eventName]);
        });
      }

      if (container instanceof HTMLDivElement) {
        const divElement = container?.firstChild;
        divElement?.addEventListener("mouseleave", function () {
          if (!isPaint) return;
          if (!drawingModeOn) return;

          isPaint = false;

          if (currentLine !== null) {
            history = history.slice(0, historyStep + 1);
            history.push(currentLine);
            historyStep++;
            eventListener.dispatch("change", {
              cnt: historyStep,
              stage: stage?.toJSON(),
            });
          }
        });
      } else {
        const divElement = document.querySelector(container)?.firstChild;
        divElement?.addEventListener("mouseleave", function () {
          if (!isPaint) return;
          if (!drawingModeOn) return;

          isPaint = false;

          if (currentLine !== null) {
            history = history.slice(0, historyStep + 1);
            history.push(currentLine);
            historyStep++;
            eventListener.dispatch("change", {
              cnt: historyStep,
              stage: stage?.toJSON(),
            });
          }
        });
      }
    },
    async importImage({
      src,
      selectedWidth,
      selectedHeight,
    }: {
      src: string;
      selectedWidth: number;
      selectedHeight: number;
    }) {
      const { width: containerWidth, height: containerHeight } =
        containerSizeOption;

      const imageElement = (await loadImage(src)) as HTMLImageElement;

      if (
        stage === null ||
        imageLayer === null ||
        drawLayer === null ||
        containerWidth === null ||
        containerHeight === null
      )
        return;

      const { width: stageW, height: stageH } = getContainSize(
        containerWidth,
        containerHeight,
        selectedWidth,
        selectedHeight
      );

      stage.width(stageW);
      stage.height(stageH);

      const { width: imageW, height: imageH } = imageElement;

      const stageRatio = stageW / stageH;
      const imageRatio = imageW / imageH;

      let width = stageW;
      let height = stageH;
      let x = 0;
      let y = 0;

      if (stageRatio < imageRatio) {
        width = stageH * imageRatio;
        x = (stageW - width) / 2;
      } else if (stageRatio > imageRatio) {
        height = stageW / imageRatio;
        y = (stageH - height) / 2;
      }

      scale = stageRatio < imageRatio ? stageH / imageH : stageW / imageW;

      imageLayer.destroyChildren();
      imageLayer.add(
        new Konva.Image({ image: imageElement, width, height, x, y })
      );
      const copyDiv = document.createElement("div");
      copyDiv.id = "app";
      document.body.appendChild(copyDiv);

      const copyStage = new Konva.Stage({
        container: "app",
        width: stageW,
        height: stageH,
      });

      copyStage.add(imageLayer.clone());
      const base64 = copyStage.toCanvas().toDataURL("image/png", 0);
      Object.assign(output, {
        width: selectedWidth,
        height: selectedHeight,
        image: base64,
      });

      copyDiv.remove();
      copyStage.remove();
      drawLayer.position({ x, y });
      drawLayer.scale({ x: scale, y: scale });
      drawLayer.moveToTop();

      return base64;
    },
    exportImage() {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      const foreground = new Image();

      canvas.width = output.width;
      canvas.height = output.height;

      return new Promise((resolve) => {
        foreground.onload = resolve;

        if (stage !== null) {
          const copyStage = stage.clone();
          const copyDrawLayer = copyStage.findOne("#drawLayer");
          copyDrawLayer.show();

          foreground.src = copyStage.toDataURL({ pixelRatio: 2 });
        }
      }).then(() => {
        if (stage !== null && context !== null) {
          context.drawImage(foreground, 0, 0, output.width, output.height);
          const pngURL = canvas.toDataURL("image/png");
          return pngURL;
        }
      });
    },
    setStrokeColor(color: string) {
      brushOptions.strokeColor = color;
      if (!drawingModeOn || drawingMode === "eraser") return;
      if (stage !== null && brushOptions.strokeWidth !== null) {
        stage.container().style.cursor = getDrawCursor(
          brushOptions.strokeWidth
        );
      }
    },
    setStrokeWidth(width: number | string) {
      if (typeof width === "string") {
        brushOptions.strokeWidth = parseInt(width);
      } else {
        brushOptions.strokeWidth = width;
      }
      if (!drawingModeOn) return;
      if (stage !== null && brushOptions.strokeColor !== null) {
        stage.container().style.cursor = getDrawCursor(
          brushOptions.strokeWidth
        );
      }
    },
    setDrawingMode(mode: "brush" | "eraser" | "on" | "off") {
      if (stage !== null && drawLayer !== null) {
        if (mode === "off") {
          drawLayer.hide();
          drawingModeOn = false;
          stage.container().style.cursor = "not-allowed";
          return;
        } else if (mode === "on") {
          this.setDrawingMode(drawingMode);
          return;
        } else if (mode === "eraser") {
          drawingModeOn = true;
          drawLayer.show();
          if (stage !== null) {
            stage.container().style.cursor = getDrawCursor(
              brushOptions.strokeWidth
            );
          }
        } else if (mode === "brush") {
          drawingModeOn = true;
          drawLayer.show();
          if (stage !== null) {
            stage.container().style.cursor = getDrawCursor(
              brushOptions.strokeWidth
            );
          }
        }

        drawingMode = mode;
      }
    },
    deleteImage() {
      if (drawLayer !== null && imageLayer !== null) {
        drawLayer.destroyChildren();
        imageLayer.destroyChildren();
        history = [];
        historyStep = 0;
      }
    },
    destroyStage() {
      if (stage !== null) {
        stage.destroyChildren();
        stage.destroy();
        stage = null;
      }
    },
  };
})();

export default imagePrompt;
