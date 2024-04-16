import { createElement, createDragImage } from "./helpers.js";
import { ITEM_IMAGE_SIZE } from "./settings.js";

/**
 * @typedef Item
 * @property {string} img Image source
 * @property {[number, number]} pos [x, y]
 * @property {[number, number]} size [x, y]
 */

export class Storage {
    /** @type {HTMLDivElement} */
    #container;

    #x = 0;
    #y = 0;

    /** @type {HTMLDivElement} */
    #itemMirrors;

    /** @type {Record<string, HTMLCanvasElement>} */
    #itemMirrorsMap = {};

    /** @type {HTMLDivElement} */
    #itemShadow;

    /** @type {string} */
    #draggedItemId = null;

    /** @type {Item} */
    #draggedItem = null;

    /** @type {Record<string, Item>} */
    #itemMap = {};

    constructor(selector, { x, y }) {
        this.#container = document.querySelector(selector);
        this.#x = x;
        this.#y = y;

        if (!this.#container) {
            throw new Error(`Can't initialize storage with selector <${selector}>`);
        }

        this.#setDimesions();
        this.#attachListeners();
        this.#addShadowElements();
    }

    async addItem(item) {
        await this.#createItem(item);
    }

    #setDimesions() {
        this.#container.style.gridTemplateColumns = `repeat(${this.#x}, ${ITEM_IMAGE_SIZE}px)`;
        this.#container.style.width = `${this.#x * ITEM_IMAGE_SIZE}px`;

        this.#container.style.gridTemplateRows = `repeat(${this.#y}, ${ITEM_IMAGE_SIZE}px)`;
        this.#container.style.height = `${this.#y * ITEM_IMAGE_SIZE}px`;
    }

    #attachListeners() {
        this.#container.addEventListener('drop', event => {
            const { left, top } = this.#container.getBoundingClientRect();
            const x = Math.ceil((event.clientX - left) / ITEM_IMAGE_SIZE);
            const y = Math.ceil((event.clientY - top) / ITEM_IMAGE_SIZE);
            const newSlot = (x - 1) + ((y - 1) * this.#x);

            this.#hideItemShadow();

            if (!this.#canPlaceOnSlot(x, y)) {
                return;
            }

            console.log({
                itemId: this.#draggedItemId,
                item: this.#draggedItem,
                newSlot,
            });

            this.addItem({
                ...this.#draggedItem,
                pos: [x, y]
            });

            const movedEvent = new CustomEvent('itemMoved', { detail: this.#draggedItemId });
            document.dispatchEvent(movedEvent);
        });

        this.#container.addEventListener('dragenter', event => {
            event.preventDefault();

            if (event.relatedTarget === null) {
                return;
            }

            const [x, y] = this.#draggedItem.size;
            this.#showItemShadow(x, y);
        });

        this.#container.addEventListener('dragleave', event => {
            const origin = event.relatedTarget?.closest('.item-storage');
            const destination = event.target?.closest('.item-storage');

            if (origin === destination) {
                return;
            }

            this.#hideItemShadow();
            this.#draggedItemId = null;
        });

        this.#container.addEventListener('dragover', event => {
            event.preventDefault();

            const { left, top } = this.#container.getBoundingClientRect();
            const x = Math.ceil((event.clientX - left) / ITEM_IMAGE_SIZE);
            const y = Math.ceil((event.clientY - top) / ITEM_IMAGE_SIZE);
            this.#moveItemShadow(x, y);
        });

        document.addEventListener('itemDragStart', event => {
            const { uid, ...item } = event.detail;
            this.#draggedItemId = uid;
            this.#draggedItem = item;
        });

        document.addEventListener('itemDragEnd', () => {
            requestAnimationFrame(() => {
                this.#draggedItem = null;
                this.#draggedItemId = null;
            });
        });

        document.addEventListener('itemMoved', event => {
            const uid = event.detail;

            if (!this.#itemMap[uid]) {
                return;
            }

            const itemElement = this.#container.querySelector(`[data-uid="${uid}"]`);

            if (!itemElement) {
                return;
            }

            itemElement.remove();
            delete this.#itemMap[uid];
        });
    }

    #addShadowElements() {
        const shadow = createElement('div', { className: 'item-shadow' });
        this.#itemShadow = shadow;
        this.#container.append(shadow);

        const mirrors = createElement('div', { className: 'item-mirrors' });
        this.#itemMirrors = mirrors;
        this.#container.append(mirrors);
    }

    #showItemShadow(x, y) {
        this.#itemShadow.style.width = `${x * ITEM_IMAGE_SIZE}px`;
        this.#itemShadow.style.height = `${y * ITEM_IMAGE_SIZE}px`;
        this.#itemShadow.style.gridColumn = `0 / span ${x}`;
        this.#itemShadow.style.gridRow = `0 / span ${y}`;
        this.#itemShadow.style.display = 'block';
    }

    #moveItemShadow(x, y) {
        this.#itemShadow.style.gridColumn = x;
        this.#itemShadow.style.gridRow = y;

        if (this.#canPlaceOnSlot(x, y)) {
            this.#itemShadow.classList.remove('red');
            return;
        }

        this.#itemShadow.classList.add('red');
    }

    #hideItemShadow() {
        this.#itemShadow.style.display = 'none';
    }

    #attachImageListeners(item) {
        item.addEventListener("dragstart", event => {
            const uid = item.dataset.uid;
            const data = this.#itemMap[uid];
            const dragStartEvent = new CustomEvent('itemDragStart', {
                detail: { uid, ...data }
            });

            document.dispatchEvent(dragStartEvent);
            event.dataTransfer.setDragImage(this.#itemMirrorsMap[uid], 0, 0);
        });

        item.addEventListener("dragend", () => {
            const event = new CustomEvent('itemDragEnd');
            document.dispatchEvent(event);
        })
    }

    async #createItem(item) {
        const uid = crypto.randomUUID();
        const itemImage = this.#createItemImage(item, uid);
        const mirrorImage = await createDragImage(item);

        this.#itemMap[uid] = item;
        this.#itemMirrorsMap[uid] = mirrorImage;
        this.#attachImageListeners(itemImage);

        this.#container.append(itemImage);
        this.#itemMirrors.append(mirrorImage);
    }

    #createItemImage(item, uid) {
        const [x, y] = item.pos;
        const [xSize, ySize] = item.size;
        const itemImage = createElement('img', { src: item.img });
        const itemElement = createElement('div', {
            draggable: true,
            className: 'item',
            dataset: { uid },
            style: {
                gridColumn: `${x} / span ${xSize}`,
                gridRow: `${y} / span ${ySize}`,
            },
            children: [itemImage]
        });

        return itemElement;
    }

    #canPlaceOnSlot(x, y) {
        const [itemX, itemY] = this.#draggedItem.size;
        const itemEndX = x + itemX - 1;
        const itemEndY = y + itemY - 1;
        const items = this.#container.querySelectorAll('.item');

        const isOverflowing = itemEndX > this.#x || itemEndY > this.#y;

        if (isOverflowing) {
            return false;
        }

        for (let i = 0; i < items.length; i++) {
            const item = items[i];

            if (item.dataset.uid === this.#draggedItemId) continue;

            const { gridRowEnd, gridRowStart, gridColumnEnd, gridColumnStart } = getComputedStyle(item);
            const rowSpan = parseInt(gridRowEnd.split(' ')[1]);
            const colSpan = parseInt(gridColumnEnd.split(' ')[1]);

            const currentItemY = parseInt(gridRowStart);
            const currentItemX = parseInt(gridColumnStart);
            const currentItemEndY = currentItemY + rowSpan - 1;
            const currentItemEndX = currentItemX + colSpan - 1;

            const isIntersectingY = (y >= currentItemY && y <= currentItemEndY)
                || (itemEndY >= currentItemY && itemEndY <= currentItemEndY);
            const isIntersectingX = (x >= currentItemX && x <= currentItemEndX)
                || (itemEndX >= currentItemX && itemEndX <= currentItemEndX);
            const isIntersecting = isIntersectingX && isIntersectingY;

            if (isIntersecting) {
                return false;
            }
        };

        return true;
    }
}