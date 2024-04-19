import { createElement, createDragImage } from "./helpers.js";
import { ITEM_IMAGE_SIZE } from "./settings.js";

/**
 * @typedef Item
 * @property {string} [uid] Item GUID
 * @property {string} img Image source
 * @property {[number, number]} pos [x, y]
 * @property {[number, number]} size [x, y]
 */

/**
 * @template T
 * @typedef ItemEventDetail
 * @property {T} detail  Event data
 */

/** @typedef {ItemEventDetail<Item> & Event} ItemEvent */
/** @typedef {ItemEventDetail<string> & Event} ItemUidEvent */

/**
 * @typedef StorageOptions
 * @property {number} x
 * @property {number} y
 */

/** @enum {number} */
const StorageOperation = {
    Add: 0,
    Delete: 1,
    Update: 2,
}

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
    #draggedItemUid = null;

    /** @type {Item} */
    #draggedItem = null;

    /** @type {Record<string, Item>} */
    #itemMap = {};

    /**
     * @param {string} selector CSS Selector for the item storage
     * @param {StorageOptions} options Storage options
     */
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

    /**
     * Places an item in the storage
     * @param {Item} item 
     */
    async placeItem(item) {
        await this.#createItem(item);
    }

    /**
     * Adds an item in the storage
     * @param {Item} item
     */
    async addItem(item) {
        // TODO: Add item in storage
        console.log("Add item", item);
        await this.placeItem(item);
    }

    /**
     * Removes an item from the storage
     * @param {string} uid 
     * @param {Item} item 
     */
    async removeItem(uid, item) {
        console.log("Delete item", item);
        // TODO: Delete item from storage
        this.#removeItem(uid);
    }

    /**
     * Updates an item in the storage
     * @param {string} uid 
     * @param {Item} newItem 
     */
    async updateItem(uid, newItem) {
        // TODO: Update item position
        console.log("Update item", newItem);
        this.#updateItem(uid, newItem);
    }

    #setDimesions() {
        this.#container.style.gridTemplateColumns = `repeat(${this.#x}, ${ITEM_IMAGE_SIZE}px)`;
        this.#container.style.width = `${this.#x * ITEM_IMAGE_SIZE}px`;

        this.#container.style.gridTemplateRows = `repeat(${this.#y}, ${ITEM_IMAGE_SIZE}px)`;
        this.#container.style.height = `${this.#y * ITEM_IMAGE_SIZE}px`;
    }

    #attachListeners() {
        // Container drag & drop events
        this.#container.addEventListener('drop', this.#onItemDropped.bind(this));
        this.#container.addEventListener('dragenter', this.#onDragEnter.bind(this));
        this.#container.addEventListener('dragleave', this.#onDragLeave.bind(this));
        this.#container.addEventListener('dragover', this.#onDragOver.bind(this));

        // Item drag events
        document.addEventListener('itemDragStart', this.#onItemDragStart.bind(this));
        document.addEventListener('itemDragEnd', this.#onItemDragEnd.bind(this));
        document.addEventListener('itemMoved', this.#onItemMoved.bind(this));
    }

    /** @param {HTMLDivElement} item */
    #attachImageListeners(item) {
        item.addEventListener("dragstart", this.#onItemDragStartFactory(item));
        item.addEventListener("dragend", this.#onItemDragEndFactory(item));
    }

    /** @param {HTMLDivElement} item */
    #onItemDragStartFactory(item) {
        /** @param {DragEvent} event */
        return (event) => {
            const uid = item.dataset.uid;
            const data = this.#itemMap[uid];

            this.#dispatchEvent('itemDragStart', { uid, ...data });
            event.dataTransfer.setDragImage(this.#itemMirrorsMap[uid], 0, 0);
        }
    }

    /** @param {HTMLDivElement} item */
    #onItemDragEndFactory(item) {
        /** @param {DragEvent} event */
        return (_) => {
            this.#dispatchEvent('itemDragEnd', item.dataset.uid)
        }
    }

    /** @param {DragEvent} event */
    #onItemDropped(event) {
        const { x, y } = this.#getCoordinatesByPosition(event.clientX, event.clientY);
        const newSlot = this.#getSlotByCoordinates(x, y);

        this.#hideItemShadow();

        if (!this.#canPlaceOnSlot(x, y)) {
            return;
        }

        const item = this.#draggedItem;
        const uid = this.#draggedItemUid;
        const newItem = {...item, pos: [x, y]};
        const isOriginatingStorage = !!this.#itemMap[uid];

        console.log({ newSlot, isOriginatingStorage});

        if (isOriginatingStorage) {
            this.updateItem(uid, newItem);
            return;
        }

        this.addItem(newItem)
            .then(() => {
                // TODO: Not ideal... it's quite easy to cancel the API call
                // which removes the item from the other storage...
                this.#dispatchEvent('itemMoved', uid);
            })
            .catch(() => {
                // TODO: Something went wrong
            });
    }

    /** @param {DragEvent} event */
    #onDragEnter(event) {
        event.preventDefault();

        if (event.relatedTarget === null) {
            return;
        }

        const [x, y] = this.#draggedItem.size;
        this.#showItemShadow(x, y);
    }

    /** @param {DragEvent} event */
    #onDragLeave(event) {
        const origin = event.relatedTarget?.closest('.item-storage');
        const destination = event.target?.closest('.item-storage');

        if (origin === destination) {
            return;
        }

        this.#hideItemShadow();
        this.#draggedItemUid = null;
    }

    /** @param {DragEvent} event */
    #onDragOver(event) {
        event.preventDefault();
        const { x, y } = this.#getCoordinatesByPosition(event.clientX, event.clientY);
        this.#moveItemShadow(x, y);
    }

    /** @param {ItemEvent} event */
    #onItemDragStart(event) {
        const { uid, ...item } = event.detail;
        this.#draggedItemUid = uid;
        this.#draggedItem = item;
    }

    #onItemDragEnd() {
        requestAnimationFrame(() => {
            this.#draggedItem = null;
            this.#draggedItemUid = null;
        });
    }

    /** @param {ItemUidEvent} event */
    async #onItemMoved(event) {
        const uid = event.detail;
        const item = this.#itemMap[uid];
        const itemElement = this.#getItemElement(uid);

        if (!itemElement || !item) {
            return;
        }

        itemElement.remove();
        await this.removeItem(uid, item);
        delete this.#itemMap[uid];
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

    /**
     * Shows the "shadow" appearing below the item, when dragging it over a storage container
     * @param {number} x 
     * @param {number} y 
     */
    #showItemShadow(x, y) {
        this.#itemShadow.style.width = `${x * ITEM_IMAGE_SIZE}px`;
        this.#itemShadow.style.height = `${y * ITEM_IMAGE_SIZE}px`;
        this.#itemShadow.style.gridColumn = `0 / span ${x}`;
        this.#itemShadow.style.gridRow = `0 / span ${y}`;
        this.#itemShadow.style.display = 'block';
    }

    /**
     * Moves the "shadow" appearing below the item, when dragging it over a storage container
     * @param {number} x 
     * @param {number} y 
     */
    #moveItemShadow(x, y) {
        this.#itemShadow.style.gridColumn = x;
        this.#itemShadow.style.gridRow = y;

        if (this.#canPlaceOnSlot(x, y)) {
            this.#itemShadow.classList.remove('red');
            return;
        }

        this.#itemShadow.classList.add('red');
    }

    /** Hides the "shadow" appearing below the item, when dragging it over a storage container */
    #hideItemShadow() {
        this.#itemShadow.style.display = 'none';
    }

    /**
     * Places an `Item` into the storage.
     * @param {Item} item 
     */
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
    
    /**
     * Removes an item from the storage
     * @param {string} uid 
     */
    #removeItem(uid) {
        const itemElement = this.#getItemElement(uid);

        if (!itemElement) {
            return;
        }

        itemElement.remove();
        delete this.#itemMap[uid];
    }

    /**
     * Updates an item in the storage
     * @param {string} uid 
     * @param {Item} item 
     */
    #updateItem(uid, item) {
        const itemElement = this.#getItemElement(uid);

        if (!itemElement) {
            return;
        }


        const [x, y] = item.pos;
        const [xSize, ySize] = item.size;

        itemElement.style.gridColumn = `${x} / span ${xSize}`;
        itemElement.style.gridRow = `${y} / span ${ySize}`;
        this.#itemMap[uid] = item;
    }

    /**
     * Get an item element by UID
     * @param {string} uid 
     * @returns {HTMLDivElement}
     */
    #getItemElement(uid) {
        return this.#container.querySelector(`[data-uid="${uid}"]`);
    }

    /**
     * @param {Item} item 
     * @param {string} uid GUID
     * @returns {HTMLDivElement}
     */
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

    /**
     * @param {number} x 
     * @param {number} y 
     * @returns {boolean}
     */
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

            if (item.dataset.uid === this.#draggedItemUid) continue;

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

    /**
     * @param {number} x Storage X
     * @param {number} y Storage Y
     * @returns {{x: number, y: number}}
     */
    #getCoordinatesByPosition(x, y) {
        const { left, top } = this.#container.getBoundingClientRect();

        return {
            x: Math.ceil((x - left) / ITEM_IMAGE_SIZE),
            y: Math.ceil((y - top) / ITEM_IMAGE_SIZE),
        };
    }

    /**
     * @param {number} x Storage X
     * @param {number} y Storage Y
     * @returns {number} Slot number
     */
    #getSlotByCoordinates(x, y) {
        return (x - 1) + ((y - 1) * this.#x);
    }

    /**
     * Dispatches DOM event
     * @template T
     * @param {string} name 
     * @param {T} detail
     */
    #dispatchEvent(name, detail) {
        const event = new CustomEvent(name, { detail });
        document.dispatchEvent(event);
    }
}