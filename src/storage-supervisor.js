import { Storage } from './storage.js';
import { ITEM_IMAGE_SIZE } from "./settings.js";
import { Api } from './api.js';

/** @typedef {import('./typings').StorageSupervisorOptions} StorageSupervisorOptions */
/** @typedef {import('./typings').StorageOptions} StorageOptions */
/** @typedef {import('./typings').StorageItem} StorageItem */
/** @typedef {import('./typings').Item} Item */

export class StorageSupervisor {
    /** @type {Map<string, Storage>} */
    #storageMap = new Map();

    /** @type {Map<string, Item>} */
    #itemMap = new Map();

    /** @type {Map<string, string>} */
    #itemStorageMap = new Map();

    /** @type {StorageItem} */
    #draggedItem = null;

    /** @type {Api} */
    #api;

    constructor() {
        this.#api = new Api();
    }

    /**
     * Adds a storage to the supervisor
     * @param {string} id 
     * @param {StorageSupervisorOptions} options
     */
    async addStorage(id, { selector, items, x, y }) {
        const storage = new Storage(selector, { x, y, id });
        this.#storageMap.set(id, storage);
        items.forEach(async (item) => await this.#addItem(storage, item));
        this.#attachStorageListeners(storage);
    }

    /**
     * @param {Storage} storage
     * @param {StorageItem} item
     */
    async #moveItem(storage, item) {
        const { uid, ...itemData } = item;
        const itemStorage = this.#getStorageByItemId(uid);
        const result = await this.#api.moveItem(itemData, itemStorage, storage);

        console.log(result);

        this.#removeItem(itemStorage, item);
        await this.#addItem(storage, itemData);
    }

    /**
     * @param {Storage} storage
     * @param {Item} item 
     */
    async #addItem(storage, item) {
        const uid = crypto.randomUUID();
        const itemImage = await storage.addItem(uid, item);

        this.#attachItemListeners(uid, itemImage);

        this.#itemStorageMap.set(uid, storage.id);
        this.#itemMap.set(uid, { uid, ...item });
    }

    /**
     * @param {Storage} storage
     * @param {StorageItem} item
     */
    #removeItem(storage, item) {
        this.#itemStorageMap.delete(item.uid);
        this.#itemMap.set(item.uid);
        storage.removeItem(item);
    }

    /**
     * Container drag & drop events
     * @param {Storage} storage 
     */
    #attachStorageListeners(storage) {
        const { container } = storage;

        container.addEventListener('dragenter', this.#showItemShadowFactory(storage));
        container.addEventListener('dragleave', this.#hideItemShadowFactory(storage));
        container.addEventListener('dragover', this.#moveItemShadowFactory(storage));
        container.addEventListener('drop', this.#updateItemPositionFactory(storage));
    }

    /**
     * Item drag & drop events
     * @param {string} uid 
     * @param {HTMLDivElement} item
     */
    #attachItemListeners(uid, item) {
        item.addEventListener("dragstart", this.#setDraggedItemFactory(uid));
        item.addEventListener("dragend", this.#clearDraggedItem.bind(this));
    }

    /**
     * @param {string} uid 
     */
    #setDraggedItemFactory(uid) {
        /** @param {DragEvent} event */
        return (event) => {
            const mirrorImage = this.#getMirrorImage(uid);
            const item = this.#itemMap.get(uid);

            this.#draggedItem = { uid, ...item };

            if (mirrorImage) {
                event.dataTransfer.setDragImage(mirrorImage, 0, 0);
            }
        }
    }

    #clearDraggedItem() {
        this.#draggedItem = null;
    }

    /**
     * @param {Storage} storage 
     */
    #updateItemPositionFactory(storage) {
        /** @param {DragEvent} event */
        return async (event) => {
            const { x, y } = this.#getCoordinatesByPosition(storage, event.clientX, event.clientY);

            storage.hideItemShadow();

            if (!storage.canPlaceOnSlot(this.#draggedItem, { x, y })) {
                return;
            }

            const newItem = { ...this.#draggedItem, pos: [x, y] };
            await this.#moveItem(storage, newItem);
        }
    }

    /** @param {Storage} storage */
    #showItemShadowFactory(storage) {
        /** @param {DragEvent} event */
        return event => {
            event.preventDefault();
            this.#showItemShadow(storage);
        }
    }

    /** @param {Storage} storage */
    #hideItemShadowFactory(storage) {
        /** @param {DragEvent} event */
        return () => this.#hideItemShadow(storage);
    }

    /** @param {Storage} storage */
    #moveItemShadowFactory(storage) {
        /** @param {DragEvent} event */
        return event => {
            event.preventDefault();
            const coordinates = this.#getCoordinatesByPosition(storage, event.clientX, event.clientY);
            const state = storage.canPlaceOnSlot(this.#draggedItem, coordinates) ? 'free' : 'taken';

            storage.moveItemShadow(coordinates, state);
        }
    }

    /**
     * @param {Storage} storage
     * @param {number} x Storage X
     * @param {number} y Storage Y
     * @returns {{x: number, y: number}}
     */
    #getCoordinatesByPosition(storage, x, y) {
        const { left, top } = storage.container.getBoundingClientRect();

        return {
            x: Math.ceil((x - left) / ITEM_IMAGE_SIZE),
            y: Math.ceil((y - top) / ITEM_IMAGE_SIZE),
        };
    }

    /**
     * Gets mirror item for an item
     * @param {string} uid 
     * @returns {HTMLDivElement}
     */
    #getMirrorImage(uid) {
        const storage = this.#getStorageByItemId(uid);

        if (!storage) {
            return;
        }

        return storage.getMirrorImage(uid);
    }

    /**
     * Gets storage by item UID
     * @param {string} uid Item UID
     * @returns {Storage}
     */
    #getStorageByItemId(uid) {
        const storageId = this.#itemStorageMap.get(uid);
        return this.#storageMap.get(storageId);
    }

    /**
     * Hides the shadow items on inactive storages
     * @param {Storage} activeStorage 
     */
    #hideItemShadow(activeStorage) {
        this.#storageMap.forEach((storage) => {
            if (activeStorage.compareWith(storage)) {
                return;
            }

            storage.hideItemShadow();
        });
    }

    /**
     * Shows the shadow item on the storage the user is currently over
     * @param {Storage} activeStorage 
     */
    #showItemShadow(activeStorage) {
        this.#storageMap.forEach((storage) => {
            if (activeStorage.compareWith(storage)) {
                const [x, y] = this.#draggedItem.size;
                activeStorage.showItemShadow({ x, y });
                return;
            }

            storage.hideItemShadow();
        });
    }
}