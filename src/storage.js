import { createElement, createDragImage } from "./helpers.js";
import { ITEM_IMAGE_SIZE } from "./settings.js";

// @ts-check

/** @typedef {import('./typings').Item} Item */
/** @typedef {import('./typings').StorageItem} StorageItem */
/** @typedef {import('./typings').ItemEvent} ItemEvent */
/** @typedef {import('./typings').ItemUidEvent} ItemUidEvent */
/** @typedef {import('./typings').StorageOptions} StorageOptions */
/** @typedef {import('./typings').Coordinates} Coordinates */

export class Storage {
    /** @type {HTMLDivElement} */
    #container;

    #id;
    #x = 0;
    #y = 0;

    /** @type {Map<string, HTMLDivElement>} */
    #itemMap = new Map();

    /** @type {HTMLDivElement} */
    #itemMirrors;

    /** @type {Map<string, HTMLCanvasElement>} */
    #itemMirrorsMap = new Map();

    /** @type {HTMLDivElement} */
    #itemShadow;

    /**
     * @param {string} selector CSS Selector for the item storage
     * @param {StorageOptions} options Storage options
     */
    constructor(selector, { id, x, y }) {
        this.#container = document.querySelector(selector);
        this.#x = x;
        this.#y = y;
        this.#id = id;

        if (!this.#container) {
            throw new Error(`Can't initialize storage with selector <${selector}>`);
        }

        this.#setDimesions();
        this.#addShadowElements();
    }

    /**
     * Places an item in the storage
     * @param {Item} item
     * @returns {Promise<HTMLDivElement>}
     */
    async addItem(uid, item) {
        const itemImage = this.#createItemImage(uid, item);
        const mirrorImage = await createDragImage(item);

        this.#container.append(itemImage);
        this.#itemMirrors.append(mirrorImage);

        this.#itemMirrorsMap.set(uid, mirrorImage);
        this.#itemMap.set(uid, itemImage);

        return itemImage;
    }

    /**
     * Removes an item from the storage
     * @param {StorageItem} item 
     */
    async removeItem(item) {
        const itemElement = this.#itemMap.get(item.uid);

        if (!itemElement) {
            return;
        }

        itemElement.remove();
        this.#itemMap.delete(item.uid);
    }

    /**
     * Updates an item in the storage
     * @param {StorageItem} item 
     */
    async updateItem(uid, item) {
        const itemElement = this.#itemMap.get(item.uid);

        if (!itemElement) {
            return;
        }

        const { x, y } = item.pos;
        const { x: xSize, y: ySize } = item.size;

        itemElement.style.gridColumn = `${x} / span ${xSize}`;
        itemElement.style.gridRow = `${y} / span ${ySize}`;
    }

    /**
     * @param {string} uid Item ID
     * @returns {HTMLDivElement}
     */
    getMirrorImage(uid) {
        return this.#itemMirrorsMap.get(uid);
    }

    /**
     * Compares if the storage is the same as another one
     * @param {Storage} storage
     * @returns {boolean}
     */
    compareWith(storage) {
        return this.#id === storage?.id;
    }

    /**
     * Shows the "shadow" appearing below the item, when dragging it over a storage container
     * @param {Coordinates} coordinates 
     */
    showItemShadow({ x, y }) {
        this.#itemShadow.style.width = `${x * ITEM_IMAGE_SIZE}px`;
        this.#itemShadow.style.height = `${y * ITEM_IMAGE_SIZE}px`;
        this.#itemShadow.style.gridColumn = `0 / span ${x}`;
        this.#itemShadow.style.gridRow = `0 / span ${y}`;
        this.#itemShadow.style.display = 'block';
    }

    /**
     * Moves the "shadow" appearing below the item, when dragging it over a storage container
     * @param {Coordinates} coordinates 
     * @param {'free'|'taken'} state 
     */
    moveItemShadow({ x, y }, state) {
        this.#itemShadow.style.gridColumn = x;
        this.#itemShadow.style.gridRow = y;

        if (state === 'free') {
            this.#itemShadow.classList.remove('red');
            return;
        }

        this.#itemShadow.classList.add('red');
    }

    /** Hides the "shadow" appearing below the item, when dragging it over a storage container */
    hideItemShadow() {
        this.#itemShadow.style.display = 'none';
    }

    /**
     * @param {StorageItem} item 
     * @param {Coordinates} coordinates
     * @returns {boolean}
     */
    canPlaceOnSlot(item, { x: itemX, y: itemY }) {
        const itemEndX = itemX + item.size.x - 1;
        const itemEndY = itemY + item.size.y - 1;
        const isOverflowing = itemEndX > this.#x || itemEndY > this.#y;

        if (isOverflowing) {
            return false;
        }

        const items = Array.from(this.#itemMap.values());

        for (let i = 0; i < items.length; i++) {
            const currentItem = items[i];

            if (currentItem.dataset.uid === item.uid) {
                continue;
            }

            const { gridRowEnd, gridRowStart, gridColumnEnd, gridColumnStart } = getComputedStyle(currentItem);
            const rowSpan = parseInt(gridRowEnd.split(' ')[1]);
            const colSpan = parseInt(gridColumnEnd.split(' ')[1]);

            const currentItemY = parseInt(gridRowStart);
            const currentItemX = parseInt(gridColumnStart);
            const currentItemEndY = currentItemY + rowSpan - 1;
            const currentItemEndX = currentItemX + colSpan - 1;

            const areCoordinatesFree =
                itemEndX < currentItemX
                || itemX > currentItemEndX
                || itemEndY < currentItemY
                || itemY > currentItemEndY;

            if (!areCoordinatesFree) {
                return false;
            }
        };

        return true;
    }

    get id() {
        return this.#id;
    }

    get container() {
        return this.#container;
    }

    get dimensions() {
        return {
            x: this.#x,
            y: this.#y,
        };
    }

    /**
     * @param {string} uid GUID
     * @param {Item} item 
     * @returns {HTMLDivElement}
     */
    #createItemImage(uid, item) {
        const itemImage = createElement('img', { src: item.img });
        const itemElement = createElement('div', {
            draggable: true,
            className: 'item',
            dataset: { uid },
            style: {
                gridColumn: `${item.pos.x} / span ${item.size.x}`,
                gridRow: `${item.pos.y} / span ${item.size.y}`,
            },
            children: [itemImage]
        });

        return itemElement;
    }

    /** Set dimensions of the storage UI */
    #setDimesions() {
        this.#container.style.gridTemplateColumns = `repeat(${this.#x}, ${ITEM_IMAGE_SIZE}px)`;
        this.#container.style.width = `${this.#x * ITEM_IMAGE_SIZE}px`;

        this.#container.style.gridTemplateRows = `repeat(${this.#y}, ${ITEM_IMAGE_SIZE}px)`;
        this.#container.style.height = `${this.#y * ITEM_IMAGE_SIZE}px`;
    }

    /** Creates elements for the item shadow */
    #addShadowElements() {
        const shadow = createElement('div', { className: 'item-shadow' });
        this.#itemShadow = shadow;
        this.#container.append(shadow);

        const mirrors = createElement('div', { className: 'item-mirrors' });
        this.#itemMirrors = mirrors;
        this.#container.append(mirrors);
    }
}