
export type Item = {
    img: string;
    pos: Coordinates;
    size: Dimensions;
};

export type GUID = `${string}-${string}-${string}-${string}-${string}`;

export type StorageItem = { uid: GUID; } & Item;

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

export type Dimensions = {
    x: number;
    y: number;
};

export type Coordinates = {
    x: number;
    y: number;
};

export type StorageSupervisorOptions = {
    selector: string;
    items: Item[];
} & Omit<StorageOptions, "id">;
