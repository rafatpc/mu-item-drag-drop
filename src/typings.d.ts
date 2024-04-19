export type Item = {
    img: string;
    pos: [number, number];
    size: [number, number];
};

export type ItemEventDetail<T> = {
    detail: T;
};

export type ItemEvent = ItemEventDetail<Item> & Event;
export type ItemUidEvent = ItemEventDetail<string> & Event;

export type StorageOptions = {
    x: number;
    y: number;
};
