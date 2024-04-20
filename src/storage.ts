import { createElement, createDragImage } from "./helpers";
import { ITEM_IMAGE_SIZE } from "./settings";
import { Coordinates, GUID, Item, StorageItem, StorageOptions } from "./types";

export class Storage {
    #id;
    #x = 0;
    #y = 0;

    #container: HTMLDivElement;
    #itemMirrors: HTMLDivElement;
    #itemShadow: HTMLDivElement;

    #itemMap: Map<string, HTMLDivElement> = new Map();
    #itemMirrorsMap: Map<string, HTMLCanvasElement> = new Map();

    constructor(selector: string, { id, x, y }: StorageOptions) {
        this.#container = document.querySelector(selector)!;
        this.#x = x;
        this.#y = y;
        this.#id = id;

        if (!this.#container) {
            throw new Error(`Can't initialize storage with selector <${selector}>`);
        }

        this.#setDimesions();

        const shadow = createElement<HTMLDivElement>('div', { className: 'item-shadow' });
        this.#itemShadow = shadow;
        this.#container.append(shadow);

        const mirrors = createElement<HTMLDivElement>('div', { className: 'item-mirrors' });
        this.#itemMirrors = mirrors;
        this.#container.append(mirrors);
    }

    async addItem(uid: GUID, item: Item): Promise<HTMLDivElement> {
        const itemImage = this.#createItemImage(uid, item);
        const mirrorImage = await createDragImage(item);

        this.#container.append(itemImage);
        this.#itemMirrors.append(mirrorImage);

        this.#itemMirrorsMap.set(uid, mirrorImage);
        this.#itemMap.set(uid, itemImage);

        return itemImage;
    }

    async removeItem(item: StorageItem) {
        const itemElement = this.#itemMap.get(item.uid);

        if (!itemElement) {
            return;
        }

        itemElement.remove();
        this.#itemMap.delete(item.uid);
    }

    async updateItem(item: StorageItem) {
        const itemElement = this.#itemMap.get(item.uid);

        if (!itemElement) {
            return;
        }

        const { x, y } = item.pos;
        const { x: xSize, y: ySize } = item.size;

        itemElement.style.gridColumn = `${x} / span ${xSize}`;
        itemElement.style.gridRow = `${y} / span ${ySize}`;
    }

    getMirrorImage(uid: GUID) {
        return this.#itemMirrorsMap.get(uid);
    }

    compareWith(storage: Storage) {
        return this.#id === storage?.id;
    }

    showItemShadow({ x, y }: Coordinates) {
        this.#itemShadow.style.width = `${x * ITEM_IMAGE_SIZE}px`;
        this.#itemShadow.style.height = `${y * ITEM_IMAGE_SIZE}px`;
        this.#itemShadow.style.gridColumn = `0 / span ${x}`;
        this.#itemShadow.style.gridRow = `0 / span ${y}`;
        this.#itemShadow.style.display = 'block';
    }

    moveItemShadow({ x, y }: Coordinates, state: 'free' | 'taken') {
        this.#itemShadow.style.gridColumn = x.toString();
        this.#itemShadow.style.gridRow = y.toString();;

        if (state === 'free') {
            this.#itemShadow.classList.remove('red');
            return;
        }

        this.#itemShadow.classList.add('red');
    }

    hideItemShadow() {
        this.#itemShadow.style.display = 'none';
    }

    canPlaceOnSlot(item: StorageItem, { x: itemX, y: itemY }: Coordinates): boolean {
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

    #createItemImage(uid: GUID, item: Item) {
        const itemImage = createElement<HTMLImageElement>('img', { src: item.img });
        const itemElement = createElement<HTMLDivElement>('div', {
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

    #setDimesions() {
        this.#container.style.gridTemplateColumns = `repeat(${this.#x}, ${ITEM_IMAGE_SIZE}px)`;
        this.#container.style.width = `${this.#x * ITEM_IMAGE_SIZE}px`;

        this.#container.style.gridTemplateRows = `repeat(${this.#y}, ${ITEM_IMAGE_SIZE}px)`;
        this.#container.style.height = `${this.#y * ITEM_IMAGE_SIZE}px`;
    }
}