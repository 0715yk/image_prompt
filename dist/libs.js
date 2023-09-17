export function getDrawCursor(strokeWidth) {
    const circle = `
  <svg
    height="${strokeWidth}"
    width="${strokeWidth}"
    viewBox="0 0 ${strokeWidth * 2} ${strokeWidth * 2}"
    xmlns="http://www.w3.org/2000/svg"
    >
        <defs>
            <mask 
                id="maskingFrame"
            >
                <circle
                    cx="50%"
                    cy="50%"
                    r="${strokeWidth}"
                    stroke="#000000"
                    fill="#FFFFFF"
                    
                />  
                <circle
                    cx="50%"
                    cy="50%"
                    r="${strokeWidth / 1.15}"
                />
            </mask>
        </defs>
        <circle
            cx="50%"
            cy="50%"
            r="${strokeWidth * 3}"
            mask="url(#maskingFrame)"  
            fill="#FFFFFF" 
         
        />
    </svg>
    `;
    return `url(data:image/svg+xml;base64,${window.btoa(circle)}) ${Math.ceil(strokeWidth / 2)} ${Math.ceil(strokeWidth / 2)}, pointer`;
}
export function dataURItoBlob(dataURI) {
    const byteString = window.atob(dataURI.split(",")[1]);
    const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    const bb = new Blob([ab], { type: mimeString });
    return bb;
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
