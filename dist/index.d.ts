declare const imagePrompt: {
    getStage(): import("konva/lib/Stage").Stage | null;
    goTo(index: number): void;
    undo(): void;
    redo(): void;
    on(eventType: string, eventCallback: (...args: any) => void): void;
    off(eventType: string, eventCallback: (...args: any) => void): void;
    init: ({ container, brushOption, width, height, on, cache, containerSize, }: {
        container: string | HTMLDivElement;
        brushOption?: {
            strokeWidth: number;
            strokeColor: string;
        } | undefined;
        width?: number | undefined;
        height?: number | undefined;
        on?: {
            [eventType: string]: (arg: any) => void;
        } | undefined;
        cache?: string | undefined;
        containerSize: {
            width: null | number;
            height: null | number;
        };
    }) => void;
    importImage({ src, selectedWidth, selectedHeight, }: {
        src: string;
        selectedWidth: number;
        selectedHeight: number;
    }): Promise<string | undefined>;
    exportImage(): Promise<string | undefined>;
    setStrokeColor(color: string): void;
    setStrokeWidth(width: number | string): void;
    setDrawingMode(mode: "brush" | "eraser" | "on" | "off"): void;
    deleteImage(): void;
    resetDrawLayer(): void;
    resetHistory(): void;
};
export default imagePrompt;
