var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Konva from "konva";
import { getContainSize, EventListeners, loadImage } from "./libs";
const imagePrompt = (function () {
    const output = {
        width: 0,
        height: 0,
        image: null,
    };
    let history = [];
    let historyStep = 0;
    const brushOptions = {
        strokeWidth: 30,
        strokeColor: "#ffffff",
    };
    let drawingModeOn = false;
    let drawingMode = "brush";
    let scale = 1;
    let stage = null;
    let drawLayer = null;
    let imageLayer = null;
    let cursorLayer = null;
    let cursorRing = null;
    let currentLine = null;
    const containerSizeOption = { width: null, height: null };
    const eventListener = new EventListeners();
    return {
        getStage() {
            return stage;
        },
        goTo(index) {
            if (drawLayer !== null && stage !== null) {
                history = history.filter((line, _) => {
                    if (_ >= index) {
                        line === null || line === void 0 ? void 0 : line.remove();
                        return false;
                    }
                    else {
                        if (drawLayer !== null) {
                            drawLayer.add(line);
                            return true;
                        }
                        else {
                            return false;
                        }
                    }
                });
                drawLayer.batchDraw();
                historyStep = index;
                const copyStage = stage.clone();
                const cLayer = copyStage.findOne("#cursorLayer");
                cLayer.remove();
                eventListener.dispatch("change", {
                    cnt: historyStep,
                    stage: copyStage === null || copyStage === void 0 ? void 0 : copyStage.toJSON(),
                });
            }
        },
        undo() {
            if (historyStep === 0 || stage === null) {
                return;
            }
            historyStep--;
            const lineToRemove = history[historyStep];
            if (lineToRemove !== undefined && drawLayer !== null) {
                lineToRemove.remove();
                drawLayer.batchDraw();
                const copyStage = stage.clone();
                const cLayer = copyStage.findOne("#cursorLayer");
                cLayer.remove();
                eventListener.dispatch("change", {
                    cnt: historyStep,
                    stage: copyStage === null || copyStage === void 0 ? void 0 : copyStage.toJSON(),
                });
            }
        },
        redo() {
            if (historyStep === history.length || stage === null) {
                return;
            }
            const lineToRedraw = history[historyStep];
            if (lineToRedraw !== undefined && drawLayer !== null) {
                drawLayer.add(lineToRedraw);
                historyStep++;
                const copyStage = stage.clone();
                const cLayer = copyStage.findOne("#cursorLayer");
                cLayer.remove();
                drawLayer.batchDraw();
                eventListener.dispatch("change", {
                    cnt: historyStep,
                    stage: copyStage === null || copyStage === void 0 ? void 0 : copyStage.toJSON(),
                });
            }
        },
        on(eventType, eventCallback) {
            eventListener.addEventListener(eventType, eventCallback);
        },
        off(eventType, eventCallback) {
            eventListener.removeEventListener(eventType, eventCallback);
        },
        init: function ({ container, brushOption, width, height, on, cache, containerSize, }) {
            var _a;
            if (cache) {
                stage = Konva.Node.create(cache, container);
                const iLayer = stage.findOne("#imageLayer");
                const dLayer = stage.findOne("#drawLayer");
                cursorLayer = new Konva.Layer({
                    id: "cursorLayer",
                });
                cursorRing = new Konva.Ring({
                    innerRadius: brushOptions.strokeWidth / 2 / scale,
                    outerRadius: (brushOptions.strokeWidth / 2 + 3) / scale,
                    fill: "#FFFFFF",
                    id: "ring",
                    stroke: "black",
                    strokeWidth: 0.6,
                });
                imageLayer = iLayer;
                drawLayer = dLayer;
            }
            else {
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
                cursorLayer = new Konva.Layer({
                    id: "cursorLayer",
                });
                cursorRing = new Konva.Ring({
                    innerRadius: brushOptions.strokeWidth / 2 / scale,
                    outerRadius: (brushOptions.strokeWidth / 2 + 3) / scale,
                    fill: "#FFFFFF",
                    id: "ring",
                    stroke: "black",
                    strokeWidth: 0.6,
                });
            }
            stage.add(imageLayer);
            stage.add(drawLayer);
            stage.add(cursorLayer);
            cursorLayer.add(cursorRing);
            cursorLayer.hide();
            let isPaint = false;
            if (brushOption) {
                brushOptions.strokeColor = brushOption.strokeColor;
                brushOptions.strokeWidth = brushOption.strokeWidth;
            }
            containerSizeOption.width = containerSize.width;
            containerSizeOption.height = containerSize.height;
            stage.container().style.cursor = "none";
            stage.on("mousedown", () => {
                if (!drawingModeOn)
                    return;
                isPaint = true;
                if (stage !== null) {
                    const pointerPosition = stage.getPointerPosition();
                    if (drawLayer !== null && pointerPosition !== null) {
                        const x = (pointerPosition.x - drawLayer.x()) / scale;
                        const y = (pointerPosition.y - drawLayer.y()) / scale;
                        currentLine = new Konva.Line({
                            stroke: brushOptions === null || brushOptions === void 0 ? void 0 : brushOptions.strokeColor,
                            strokeWidth: (brushOptions === null || brushOptions === void 0 ? void 0 : brushOptions.strokeWidth) / scale,
                            globalCompositeOperation: drawingMode === "brush" ? "source-over" : "destination-out",
                            lineCap: "round",
                            lineJoin: "round",
                            points: [x, y, x, y],
                        });
                        drawLayer.add(currentLine);
                    }
                }
            });
            stage.on("mousemove", ({ evt }) => {
                evt.preventDefault();
                if (stage !== null) {
                    const pointerPosition = stage.getPointerPosition();
                    if (drawLayer !== null &&
                        pointerPosition !== null &&
                        cursorRing !== null) {
                        const x = (pointerPosition.x - drawLayer.x()) / scale;
                        const y = (pointerPosition.y - drawLayer.y()) / scale;
                        cursorRing.x(x);
                        cursorRing.y(y);
                        if (!drawingModeOn)
                            return;
                        if (!isPaint)
                            return;
                        if (currentLine !== null) {
                            currentLine.points(currentLine.points().concat([x, y]));
                        }
                    }
                }
            });
            stage.on("mouseup", ({ evt }) => {
                evt.stopPropagation();
                if (stage === null)
                    return;
                if (!drawingModeOn)
                    return;
                if (!isPaint)
                    return;
                isPaint = false;
                if (currentLine !== null) {
                    history = history.slice(0, historyStep);
                    history.push(currentLine);
                    historyStep++;
                    const copyStage = stage.clone();
                    const cLayer = copyStage.findOne("#cursorLayer");
                    cLayer.remove();
                    eventListener.dispatch("change", {
                        cnt: historyStep,
                        stage: copyStage === null || copyStage === void 0 ? void 0 : copyStage.toJSON(),
                    });
                }
            });
            if (on !== undefined) {
                Object.keys(on).forEach((eventName) => {
                    eventListener.addEventListener(eventName, on[eventName]);
                });
            }
            if (container instanceof HTMLDivElement) {
                const divElement = container === null || container === void 0 ? void 0 : container.firstChild;
                divElement === null || divElement === void 0 ? void 0 : divElement.addEventListener("mouseenter", function () {
                    if (cursorLayer !== null) {
                        cursorLayer.show();
                        cursorLayer.moveToTop();
                    }
                });
                divElement === null || divElement === void 0 ? void 0 : divElement.addEventListener("mouseleave", function () {
                    if (cursorLayer !== null) {
                        cursorLayer.hide();
                    }
                });
                window === null || window === void 0 ? void 0 : window.addEventListener("mouseup", function () {
                    if (stage === null)
                        return;
                    if (cursorLayer !== null)
                        cursorLayer.hide();
                    if (!isPaint)
                        return;
                    if (!drawingModeOn)
                        return;
                    isPaint = false;
                    if (currentLine !== null) {
                        history = history.slice(0, historyStep + 1);
                        history.push(currentLine);
                        historyStep++;
                        const copyStage = stage.clone();
                        const cLayer = copyStage.findOne("#cursorLayer");
                        cLayer.remove();
                        eventListener.dispatch("change", {
                            cnt: historyStep,
                            stage: copyStage === null || copyStage === void 0 ? void 0 : copyStage.toJSON(),
                        });
                    }
                });
            }
            else {
                const divElement = (_a = document.querySelector(container)) === null || _a === void 0 ? void 0 : _a.firstChild;
                divElement === null || divElement === void 0 ? void 0 : divElement.addEventListener("mouseenter", function () {
                    if (cursorLayer !== null) {
                        cursorLayer.show();
                        cursorLayer.moveToTop();
                    }
                });
                divElement === null || divElement === void 0 ? void 0 : divElement.addEventListener("mouseleave", function () {
                    if (cursorLayer !== null) {
                        cursorLayer.hide();
                    }
                });
                window === null || window === void 0 ? void 0 : window.addEventListener("mouseup", function () {
                    if (stage === null)
                        return;
                    if (cursorLayer !== null)
                        cursorLayer.hide();
                    if (!isPaint)
                        return;
                    if (!drawingModeOn)
                        return;
                    isPaint = false;
                    if (currentLine !== null) {
                        history = history.slice(0, historyStep + 1);
                        history.push(currentLine);
                        historyStep++;
                        const copyStage = stage.clone();
                        const cLayer = copyStage.findOne("#cursorLayer");
                        cLayer.remove();
                        eventListener.dispatch("change", {
                            cnt: historyStep,
                            stage: copyStage === null || copyStage === void 0 ? void 0 : copyStage.toJSON(),
                        });
                    }
                });
            }
        },
        importImage({ src, selectedWidth, selectedHeight, }) {
            return __awaiter(this, void 0, void 0, function* () {
                const { width: containerWidth, height: containerHeight } = containerSizeOption;
                const imageElement = (yield loadImage(src));
                if (stage === null ||
                    imageLayer === null ||
                    drawLayer === null ||
                    containerWidth === null ||
                    containerHeight === null ||
                    cursorLayer === null)
                    return;
                const { width: stageW, height: stageH } = getContainSize(containerWidth, containerHeight, selectedWidth, selectedHeight);
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
                }
                else if (stageRatio > imageRatio) {
                    height = stageW / imageRatio;
                    y = (stageH - height) / 2;
                }
                scale = stageRatio < imageRatio ? stageH / imageH : stageW / imageW;
                imageLayer.destroyChildren();
                imageLayer.add(new Konva.Image({ image: imageElement, width, height, x, y }));
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
                cursorLayer.position({ x, y });
                cursorLayer.scale({ x: scale, y: scale });
                cursorLayer.moveToTop();
                cursorRing === null || cursorRing === void 0 ? void 0 : cursorRing.innerRadius(brushOptions.strokeWidth / 2 / scale);
                cursorRing === null || cursorRing === void 0 ? void 0 : cursorRing.outerRadius((brushOptions.strokeWidth / 2 + 3) / scale);
                return base64;
            });
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
                    const copyCursorLayer = copyStage.findOne("#cursorLayer");
                    copyCursorLayer.hide();
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
        setStrokeColor(color) {
            brushOptions.strokeColor = color;
            if (!drawingModeOn || drawingMode === "eraser")
                return;
        },
        setStrokeWidth(width) {
            if (typeof width === "string") {
                brushOptions.strokeWidth = parseInt(width);
            }
            else {
                brushOptions.strokeWidth = width;
            }
            if (!drawingModeOn)
                return;
            if (cursorRing !== null) {
                cursorRing === null || cursorRing === void 0 ? void 0 : cursorRing.innerRadius(brushOptions.strokeWidth / 2 / scale);
                cursorRing === null || cursorRing === void 0 ? void 0 : cursorRing.outerRadius((brushOptions.strokeWidth / 2 + 3) / scale);
            }
        },
        setDrawingMode(mode) {
            if (stage !== null && drawLayer !== null && cursorLayer !== null) {
                if (mode === "off") {
                    drawLayer.hide();
                    drawingModeOn = false;
                    stage.container().style.cursor = "not-allowed";
                    cursorLayer.hide();
                    return;
                }
                else if (mode === "on") {
                    this.setDrawingMode(drawingMode);
                    return;
                }
                else if (mode === "eraser") {
                    drawingModeOn = true;
                    drawLayer.show();
                    stage.container().style.cursor = "none";
                    if (cursorRing !== null) {
                        cursorRing === null || cursorRing === void 0 ? void 0 : cursorRing.innerRadius(brushOptions.strokeWidth / 2 / scale);
                        cursorRing === null || cursorRing === void 0 ? void 0 : cursorRing.outerRadius((brushOptions.strokeWidth / 2 + 3) / scale);
                    }
                }
                else if (mode === "brush") {
                    drawingModeOn = true;
                    drawLayer.show();
                    stage.container().style.cursor = "none";
                    if (cursorRing !== null) {
                        cursorRing === null || cursorRing === void 0 ? void 0 : cursorRing.innerRadius(brushOptions.strokeWidth / 2 / scale);
                        cursorRing === null || cursorRing === void 0 ? void 0 : cursorRing.outerRadius((brushOptions.strokeWidth / 2 + 3) / scale);
                    }
                }
                drawingMode = mode;
            }
        },
        deleteImage() {
            if (drawLayer !== null && imageLayer !== null && cursorLayer !== null) {
                drawLayer.destroyChildren();
                imageLayer.destroyChildren();
                cursorLayer.hide();
                history = [];
                historyStep = 0;
            }
        },
    };
})();
export default imagePrompt;
