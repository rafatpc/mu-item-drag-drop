export type Item = {
    img: string;
    pos: [number, number];
    size: [number, number];
};

export type StorageItem = { uid: string; } & Item;

export type ItemEventDetail<T> = {
    detail: T;
};

export type ItemEvent = ItemEventDetail<Item> & Event;
export type ItemUidEvent = ItemEventDetail<string> & Event;

export type StorageOptions = {
    id: string;
    x: number;
    y: number;
};

export type Coordinates = {
    x: number;
    y: number
}

export type StorageSupervisorOptions = {
    selector: string;
    items: Item[];
} & StorageOptions;
