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

export type StorageAPI = {
    moveItem(item: Item, originStorage: Storage, targetStorage: Storage, slot: number): Promise<any>;
};
