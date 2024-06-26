import { createElement, createDragImage } from "./helpers";
import { ITEM_FIXED_SIZE, ITEM_IMAGE_SIZE, STORAGE_DEFAULT_X, STORAGE_DEFAULT_Y } from "./settings";
import type { Coordinates, GUID, Item, StorageData, StorageItem, StorageOptions } from "./types";

export class Storage {
    #id;
    #x = 0;
    #y = 0;
    #fixedItemSize = false;
    #autoPlaceItems = false;

    #container: HTMLDivElement;
    #itemMirrors: HTMLDivElement;
    #itemShadow: HTMLDivElement;

    #itemMap: Map<GUID, StorageData> = new Map();

    constructor(
        selector: string,
        {
            id,
            x = STORAGE_DEFAULT_X,
            y = STORAGE_DEFAULT_Y,
            fixedItemSize = false,
            autoPlaceItems = false,
        }: StorageOptions,
    ) {
        this.#container = document.querySelector(selector)!;
        this.#fixedItemSize = fixedItemSize;
        this.#autoPlaceItems = autoPlaceItems;
        this.#x = x;
        this.#y = y;
        this.#id = id;

        if (!this.#container) {
            throw new Error(`Can't initialize storage with selector <${selector}>`);
        }

        this.#setDimesions();

        const shadow = createElement<HTMLDivElement>("div", { className: "item-shadow" });
        this.#itemShadow = shadow;
        this.#container.append(shadow);

        const mirrors = createElement<HTMLDivElement>("div", { className: "item-mirrors" });
        this.#itemMirrors = mirrors;
        this.#container.append(mirrors);
    }

    async addItem(uid: GUID, item: Item): Promise<HTMLDivElement> {
        const image = this.#createItemImage(uid, item);
        const mirror = await createDragImage(item);

        this.#container.append(image);
        this.#itemMirrors.append(mirror);

        this.#itemMap.set(uid, { item, element: image, mirror });

        return image;
    }

    async removeItem(item: StorageItem) {
        const { element, mirror } = this.#itemMap.get(item.uid) || {};

        element?.remove();
        mirror?.remove();
        this.#itemMap.delete(item.uid);
    }

    getMirrorImage(uid: GUID) {
        return this.#itemMap.get(uid)?.mirror;
    }

    compareWith(storage: Storage) {
        return this.#id === storage?.id;
    }

    showItemShadow(item: Item) {
        const { x: sizeX, y: sizeY } = this.#getItemSize(item);
        this.#itemShadow.style.width = `${sizeX * ITEM_IMAGE_SIZE}px`;
        this.#itemShadow.style.height = `${sizeY * ITEM_IMAGE_SIZE}px`;
        this.#itemShadow.style.gridColumn = `0 / span ${sizeX}`;
        this.#itemShadow.style.gridRow = `0 / span ${sizeY}`;
        this.#itemShadow.style.display = "block";
    }

    moveItemShadow(item: StorageItem, coordinates: Coordinates) {
        const { x, y } = this.getNewItemPosition(item, coordinates);
        const isSlotFree = this.canPlaceOnSlot(item, { x, y });

        this.#itemShadow.style.gridColumn = x.toString();
        this.#itemShadow.style.gridRow = y.toString();

        if (isSlotFree) {
            this.#itemShadow.classList.remove("red");
            return;
        }

        this.#itemShadow.classList.add("red");
    }

    hideItemShadow() {
        this.#itemShadow.style.display = "none";
    }

    canPlaceOnSlot(draggedItem: StorageItem, coordinates: Coordinates) {
        return !this.#isItemOverlapping(draggedItem, this.getNewItemPosition(draggedItem, coordinates));
    }

    getNewItemPosition(item: StorageItem, coordinates: Coordinates) {
        if (this.#autoPlaceItems) {
            return this.#getNextFreeCoordinates(item);
        }

        return coordinates;
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

    #createItemImage(uid: GUID, item: Item) {
        const itemImage = createElement<HTMLImageElement>("img", { src: item.img });
        const { x: sizeX, y: sizeY } = this.#getItemSize(item);
        const itemElement = createElement<HTMLDivElement>("div", {
            draggable: true,
            className: "item",
            dataset: { uid },
            style: {
                gridColumn: `${item.pos.x} / span ${sizeX}`,
                gridRow: `${item.pos.y} / span ${sizeY}`,
            },
            children: [itemImage],
        });

        return itemElement;
    }

    #setDimesions() {
        this.#container.style.gridTemplateColumns = `repeat(${this.#x}, ${ITEM_IMAGE_SIZE}px)`;
        this.#container.style.width = `${this.#x * ITEM_IMAGE_SIZE}px`;

        this.#container.style.gridTemplateRows = `repeat(${this.#y}, ${ITEM_IMAGE_SIZE}px)`;
        this.#container.style.height = `${this.#y * ITEM_IMAGE_SIZE}px`;
    }

    #getItemBoundingRect(item: Item, coordinates?: Coordinates) {
        const { x, y } = coordinates || item.pos;
        const { x: sizeX, y: sizeY } = this.#getItemSize(item);

        return {
            x,
            y,
            endX: x + sizeX - 1,
            endY: y + sizeY - 1,
        };
    }

    #getItemSize(item: Item) {
        return {
            x: this.#fixedItemSize ? ITEM_FIXED_SIZE : item.size.x,
            y: this.#fixedItemSize ? ITEM_FIXED_SIZE : item.size.y,
        };
    }

    #isItemOverlapping(currentItem: StorageItem, coordinates: Coordinates) {
        const {
            x: itemX,
            endX: itemEndX,
            y: itemY,
            endY: itemEndY,
        } = this.#getItemBoundingRect(currentItem, coordinates);

        if (itemEndX > this.#x || itemEndY > this.#y) {
            return true;
        }

        return Array.from(this.#itemMap).some(([uid, { item }]) => {
            if (uid === currentItem.uid) {
                return false;
            }
            const { x, endX, y, endY } = this.#getItemBoundingRect(item);
            return itemEndX >= x && itemX <= endX && itemEndY >= y && itemY <= endY;
        });
    }

    #getNextFreeCoordinates(item: StorageItem) {
        for (let y = 1; y <= this.#y; y++) {
            for (let x = 1; x <= this.#x; x++) {
                if (this.#isItemOverlapping(item, { x, y })) {
                    continue;
                }

                return { x, y };
            }
        }

        return { x: -1, y: -1 };
    }
}
