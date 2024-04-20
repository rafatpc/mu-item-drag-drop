import type { Storage } from "./storage";
import { Coordinates, Item } from "./types";

export class Api {
    moveItem(item: Item, originStorage: Storage, targetStorage: Storage) {
        const newSlot = this.#getSlotByCoordinates(targetStorage, item.pos)
        const isSameStorage = originStorage.compareWith(targetStorage);

        // TODO: Implement API call to move the item
        return Promise.resolve({
            gg: true,
            newSlot,
            from: originStorage.id,
            to: targetStorage.id,
            isOriginatingStorage: isSameStorage,
        });
    }

    #getSlotByCoordinates(storage: Storage, coordinates: Coordinates) {
        return (coordinates.x - 1) + ((coordinates.y - 1) * storage.dimensions.x);
    }
}