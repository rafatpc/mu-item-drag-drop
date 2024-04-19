import { ITEM_IMAGE_SIZE } from "./settings.js";

/**
 * Dumb way to save few lines of code and add syntax sugar to elements creation
 * @param {string} nodeType 
 * @param {Record<string, any>} params
 * @returns {HTMLElement}
 */
export const createElement = (nodeType, { style, src, draggable, dataset, className, children } = {}) => {
    const node = document.createElement(nodeType);
    node.src = src;
    draggable && (node.draggable = draggable);
    Object.keys(style || {}).forEach(key => node.style[key] = style[key]);
    Object.keys(dataset || {}).forEach(key => node.dataset[key] = dataset[key]);
    className && node.classList.add(className.split(' '));
    (children || []).forEach(child => node.append(child));
    return node;
}

/**
 * Creates a dragging image for an item
 * @param {import("./storage.js").Item} item 
 * @returns {Promise<HTMLCanvasElement>}
 */
export const createDragImage = async item => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    const [x, y] = item.size;
    canvas.width = x * ITEM_IMAGE_SIZE;
    canvas.height = y * ITEM_IMAGE_SIZE;

    const image = await loadImage(item.img);
    const imgX = (canvas.width - image.width) / 2;
    const imgY = (canvas.height - image.height) / 2;
    context.drawImage(image, imgX, imgY);

    // NOTE: Looks better without background imho
    // const background = await createDragBackground(item);
    // context.drawImage(background, 0, 0);

    canvas.style.position = 'absolute';
    canvas.style.left = '-300px';
    canvas.style.top = '-300px';
    canvas.style.zIndex = '-100';

    return canvas;
}

/**
 * Creates a background for the dragging image
 * (Currently disabled, see `createDragImage`)
 * @param {import("./storage.js").Item} item 
 * @returns {HTMLCanvasElement}
 */
export const createDragBackground = async item => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    const [x, y] = item.size;
    canvas.width = x * ITEM_IMAGE_SIZE;
    canvas.height = y * ITEM_IMAGE_SIZE;
    context.filter = "hue-rotate(280deg)";
    context.globalAlpha = 0.6;

    const img = await getSlotTakenImage();
    const repetitionsX = Math.ceil(canvas.width / ITEM_IMAGE_SIZE);
    const repetitionsY = Math.ceil(canvas.height / ITEM_IMAGE_SIZE);

    for (let y = 0; y < repetitionsY; y++) {
        for (let x = 0; x < repetitionsX; x++) {
            context.drawImage(
                img,
                x * ITEM_IMAGE_SIZE,
                y * ITEM_IMAGE_SIZE,
                ITEM_IMAGE_SIZE,
                ITEM_IMAGE_SIZE
            );
        }
    }

    return canvas;
}

/**
 * @returns {HTMLImageElement}
 */
export const getSlotTakenImage = () => loadImage("/assets/images/slot-taken.png");

/**
 * Loads an image to use in a canvas
 * @param {string} src 
 * @returns {Promise<HTMLImageElement>}
 */
export const loadImage = src => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
    });
}
