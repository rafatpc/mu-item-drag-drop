/** @typedef {import('./typings').Item} Item */
/** @typedef {import('./storage').Storage} Storage */
/** @typedef {import('./typings').Coordinates} Coordinates */

export class Api {
    /**
     * Moves the item between 2 storages
     * @param {Item} item 
     * @param {Storage} originStorage 
     * @param {Storage} targetStorage 
     * @returns 
     */
    moveItem(item, originStorage, targetStorage) {
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

    /**
     * @param {Storage} storage 
     * @param {Coordinates} coordinates
     * @returns {number} Slot number
     */
    #getSlotByCoordinates(storage, coordinates) {
        return (coordinates.x - 1) + ((coordinates.y - 1) * storage.dimensions.x);
    }
}