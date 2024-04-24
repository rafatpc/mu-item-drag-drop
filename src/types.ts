import { Storage } from "./storage";

export type Item = {
    img: string;
    pos: Coordinates;
    size: Dimensions;
};

export type GUID = `${string}-${string}-${string}-${string}-${string}`;
export type StorageItem = { uid: GUID } & Item;

export type Dimensions = {
    x: number;
    y: number;
};

export type Coordinates = {
    x: number;
    y: number;
};

export type StorageOptions = {
    id: string;
    x?: number;
    y?: number;
    fixedItemSize?: boolean;
    autoPlaceItems?: boolean;
};

export type StorageSupervisorOptions = {
    selector: string;
    items: Item[];
} & Omit<StorageOptions, "id">;

export type StorageData = {
    item: Item;
    element: HTMLDivElement;
    mirror: HTMLCanvasElement;
};

type Listener = Parameters<typeof document.addEventListener>;

type ItemListener<T extends Listener> = T extends [infer _, infer _, ...infer C]
    ? [keyof HTMLElementEventMap, (...args: any[]) => void, ...C]
    : never;

export type StorageSupervisorData = {
    item: StorageItem;
    storage: Storage;
    element: HTMLDivElement;
    listeners: ItemListener<Listener>[];
};

export type StorageAPI = {
    moveItem(item: StorageItem, originStorage: Storage, targetStorage: Storage, slot: number): Promise<Item | void>;
    onItemCreated?(item: StorageItem, element: HTMLElement, storage: Storage): void;
    onItemDestroyed?(item: StorageItem, element: HTMLElement, storage: Storage): void;
};

export type { Storage } from "./storage";
