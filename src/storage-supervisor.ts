import { Storage } from "./storage";
import { ITEM_IMAGE_SIZE } from "./settings";
import { createGUID } from "./helpers";
import type { Coordinates, GUID, Item, StorageAPI, StorageItem, StorageSupervisorOptions } from "./types";

export class StorageSupervisor {
    #storageMap: Map<string, Storage> = new Map();
    #itemMap: Map<GUID, StorageItem> = new Map();
    #itemStorageMap: Map<GUID, string> = new Map();
    #draggedItem: StorageItem | null = null;
    #api: StorageAPI;

    constructor(storageApi: StorageAPI) {
        this.#api = storageApi;
    }

    async addStorage(id: string, { selector, items, ...storageOptions }: StorageSupervisorOptions) {
        const storage = new Storage(selector, { id, ...storageOptions });
        this.#storageMap.set(id, storage);
        items.forEach(async (item) => await this.#addItem(storage, item));
        this.#attachStorageListeners(storage);
    }

    async #moveItem(storage: Storage, item: StorageItem) {
        const { uid, ...itemData } = item;
        const itemStorage = this.#getStorageByItemId(uid);

        if (!itemStorage) {
            console.error(`Couldn't find ${uid} in any storage.`, { item });
            return;
        }

        const newSlot = this.#getSlotByCoordinates(storage, item.pos);
        const result = await this.#api.moveItem(itemData, itemStorage, storage, newSlot);

        console.log(result);

        this.#removeItem(itemStorage, item);
        await this.#addItem(storage, itemData);
    }

    async #addItem(storage: Storage, item: Item) {
        const uid = createGUID();
        const itemImage = await storage.addItem(uid, item);

        this.#attachItemListeners(uid, itemImage);

        this.#itemStorageMap.set(uid, storage.id);
        this.#itemMap.set(uid, { uid, ...item });
    }

    #removeItem(storage: Storage, item: StorageItem) {
        this.#itemStorageMap.delete(item.uid);
        this.#itemMap.set(item.uid, item);
        storage.removeItem(item);
    }

    #attachStorageListeners(storage: Storage) {
        const { container } = storage;

        container.addEventListener("dragenter", this.#showItemShadowFactory(storage));
        container.addEventListener("dragleave", this.#hideItemShadowFactory(storage));
        container.addEventListener("dragover", this.#moveItemShadowFactory(storage));
        container.addEventListener("drop", this.#updateItemPositionFactory(storage));
    }

    #attachItemListeners(uid: GUID, item: HTMLDivElement) {
        item.addEventListener("dragstart", this.#setDraggedItemFactory(uid));
        item.addEventListener("dragend", this.#clearDraggedItem.bind(this));
    }

    #setDraggedItemFactory(uid: GUID) {
        return (event: DragEvent) => {
            const mirrorImage = this.#getMirrorImage(uid);
            const item = this.#itemMap.get(uid);

            if (!item) {
                return;
            }

            this.#draggedItem = { ...item, uid };

            if (mirrorImage) {
                event.dataTransfer?.setDragImage(mirrorImage, 0, 0);
            }
        };
    }

    #clearDraggedItem() {
        this.#draggedItem = null;
    }

    #updateItemPositionFactory(storage: Storage) {
        return async (event: DragEvent) => {
            const coordinates = this.#getCoordinatesByPosition(storage, event.clientX, event.clientY);

            storage.hideItemShadow();

            if (!this.#draggedItem || !storage.canPlaceOnSlot(this.#draggedItem, coordinates)) {
                return;
            }

            const newItem = { ...this.#draggedItem, pos: coordinates };
            await this.#moveItem(storage, newItem);
        };
    }

    #showItemShadowFactory(storage: Storage) {
        return (event: DragEvent) => {
            event.preventDefault();
            this.#showItemShadow(storage);
        };
    }

    #hideItemShadowFactory(storage: Storage) {
        return () => this.#hideItemShadow(storage);
    }

    #moveItemShadowFactory(storage: Storage) {
        return (event: DragEvent) => {
            event.preventDefault();

            const coordinates = this.#getCoordinatesByPosition(storage, event.clientX, event.clientY);
            const state = storage.canPlaceOnSlot(this.#draggedItem!, coordinates) ? "free" : "taken";

            storage.moveItemShadow(coordinates, state);
        };
    }

    #getCoordinatesByPosition(storage: Storage, x: number, y: number): Coordinates {
        const { left, top } = storage.container.getBoundingClientRect();

        return {
            x: Math.ceil((x - left) / ITEM_IMAGE_SIZE),
            y: Math.ceil((y - top) / ITEM_IMAGE_SIZE),
        };
    }

    #getMirrorImage(uid: GUID) {
        const storage = this.#getStorageByItemId(uid);

        if (!storage) {
            return null;
        }

        return storage.getMirrorImage(uid);
    }

    #getStorageByItemId(uid: GUID) {
        const storageId = this.#itemStorageMap.get(uid);
        return this.#storageMap.get(storageId!);
    }

    #hideItemShadow(activeStorage: Storage) {
        this.#storageMap.forEach((storage) => {
            if (activeStorage.compareWith(storage)) {
                return;
            }

            storage.hideItemShadow();
        });
    }

    #showItemShadow(activeStorage: Storage) {
        this.#storageMap.forEach((storage) => {
            if (activeStorage.compareWith(storage) && this.#draggedItem) {
                activeStorage.showItemShadow(this.#draggedItem);
                return;
            }

            storage.hideItemShadow();
        });
    }

    #getSlotByCoordinates(storage: Storage, coordinates: Coordinates) {
        return coordinates.x - 1 + (coordinates.y - 1) * storage.dimensions.x;
    }
}
