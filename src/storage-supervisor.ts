import { Storage } from "./storage";
import { ITEM_IMAGE_SIZE } from "./settings";
import { createGUID } from "./helpers";
import type {
    Coordinates,
    GUID,
    Item,
    StorageAPI,
    StorageItem,
    StorageSupervisorData,
    StorageSupervisorOptions,
} from "./types";

export class StorageSupervisor {
    #storageMap: Map<string, Storage> = new Map();
    #itemMap: Map<GUID, StorageSupervisorData> = new Map();

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
        const newItem = (await this.#api.moveItem(item, itemStorage, storage, newSlot)) ?? itemData;

        this.#removeItem(item);
        await this.#addItem(storage, newItem);
    }

    async #addItem(storage: Storage, itemData: Item) {
        const uid = createGUID();
        const item: StorageItem = { uid, ...itemData };
        const element = await storage.addItem(uid, itemData);

        this.#itemMap.set(uid, { item, storage, element, listeners: [] });

        this.#attachItemListeners(item, storage, element);
    }

    #removeItem(item: StorageItem) {
        const { storage, element } = this.#itemMap.get(item.uid) || {};

        if (!storage || !element) {
            return;
        }

        this.#detachItemListeners(item, storage, element);
        this.#itemMap.delete(item.uid);

        storage.removeItem(item);
    }

    #attachStorageListeners(storage: Storage) {
        const { container } = storage;

        container.addEventListener("dragenter", this.#showItemShadowFactory(storage));
        container.addEventListener("dragleave", this.#hideItemShadowFactory(storage));
        container.addEventListener("dragover", this.#moveItemShadowFactory(storage));
        container.addEventListener("drop", this.#updateItemPositionFactory(storage));
    }

    #attachItemListeners(item: StorageItem, storage: Storage, element: HTMLDivElement) {
        const { listeners = [] } = this.#itemMap.get(item.uid) || {};

        listeners.push(
            ["dragstart", this.#setDraggedItemFactory(item.uid)],
            ["dragend", this.#clearDraggedItem.bind(this)],
        );

        listeners.forEach((listener) => element.addEventListener(...listener));

        if (this.#api.onItemCreated) {
            this.#api.onItemCreated(item, element, storage);
        }
    }

    #detachItemListeners(item: StorageItem, storage: Storage, element: HTMLDivElement) {
        const { listeners = [] } = this.#itemMap.get(item.uid) || {};

        listeners.forEach((listener) => element.removeEventListener(...listener));

        if (this.#api.onItemDestroyed) {
            this.#api.onItemDestroyed(item, element, storage);
        }
    }

    #setDraggedItemFactory(uid: GUID) {
        return (event: DragEvent) => {
            const mirrorImage = this.#getMirrorImage(uid);
            const { item } = this.#itemMap.get(uid) || {};

            if (!item) {
                return;
            }

            this.#draggedItem = item;

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
            const coordinates = this.#getCoordinatesByMousePosition(storage, event.clientX, event.clientY);

            storage.hideItemShadow();

            if (!this.#draggedItem || !storage.canPlaceOnSlot(this.#draggedItem, coordinates)) {
                return;
            }

            const pos = storage.getNewItemPosition(this.#draggedItem, coordinates);
            const newItem = { ...this.#draggedItem, pos };

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
            const coordinates = this.#getCoordinatesByMousePosition(storage, event.clientX, event.clientY);
            storage.moveItemShadow(this.#draggedItem!, coordinates);
        };
    }

    #getCoordinatesByMousePosition(storage: Storage, x: number, y: number): Coordinates {
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
        const { storage } = this.#itemMap.get(uid) || {};
        return storage;
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
