function isitHDRReady() {
    const mediaCheck = window.matchMedia("(dynamic-range: high) and (color-gamut: p3)").matches;
    const supportCheck = window.CSS && window.CSS.supports("color", "color(display-p3 1 1 1)");
    if (mediaCheck && supportCheck) {
        return true;
    }
    return false;
}
export function getDrawCursor(strokeWidth) {
    strokeWidth *= isitHDRReady() ? 1 : window.devicePixelRatio;
    const circle = `
  <svg
    height="${strokeWidth + 12}"
    width="${strokeWidth + 12}"
    viewBox="0 0 ${(strokeWidth + 12) * 2} ${(strokeWidth + 12) * 2}"
    xmlns="http://www.w3.org/2000/svg"
    >
        <circle
            cx="50%"
            cy="50%"
            r="${strokeWidth + 6}"
            stroke="#fff"
            stroke-width="6"
            fill="none"
        />
    </svg>
    `;
    return `url(data:image/svg+xml;base64,${window.btoa(circle)}) ${Math.ceil((strokeWidth + 12) / 2)} ${Math.ceil((strokeWidth + 12) / 2)}, pointer`;
}
export function getContainSize(containerWidth, containerHeight, outputWidth, outputHeight) {
    const containerRatio = containerWidth / containerHeight;
    const outputRatio = outputWidth / outputHeight;
    return containerRatio < outputRatio
        ? { width: containerWidth, height: containerWidth / outputRatio }
        : { width: containerHeight * outputRatio, height: containerHeight };
}
export class EventListeners {
    constructor() {
        this._listeners = {};
    }
    addEventListener(event, callback) {
        var _a;
        if (!(event in this._listeners)) {
            this._listeners[event] = [];
        }
        (_a = this._listeners[event]) === null || _a === void 0 ? void 0 : _a.push(callback);
    }
    removeEventListener(event, callback) {
        var _a;
        this._listeners[event] = (_a = this._listeners[event]) === null || _a === void 0 ? void 0 : _a.filter((fn) => fn !== callback);
    }
    dispatch(event, ...args) {
        var _a;
        (_a = this._listeners[event]) === null || _a === void 0 ? void 0 : _a.forEach((fn) => fn(...args));
    }
}
export function loadImage(path) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = path;
        img.onload = () => {
            resolve(img);
        };
        img.onerror = (e) => {
            reject(e);
        };
    });
}
