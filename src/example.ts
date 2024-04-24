import tippy, { Instance as TippyInstance } from "tippy.js";
import "tippy.js/dist/tippy.css";

import { StorageSupervisor } from "./storage-supervisor";
import { GUID } from "./types";

const items = [
    { img: "/assets/items/1x1.png", pos: { x: 5, y: 10 }, size: { x: 1, y: 1 } },
    { img: "/assets/items/1x2.png", pos: { x: 3, y: 1 }, size: { x: 1, y: 2 } },
    { img: "/assets/items/2x2.png", pos: { x: 5, y: 4 }, size: { x: 2, y: 2 } },
    { img: "/assets/items/1x4.png", pos: { x: 1, y: 1 }, size: { x: 1, y: 4 } },
    { img: "/assets/items/2x3.png", pos: { x: 5, y: 1 }, size: { x: 2, y: 3 } },
    { img: "/assets/items/2x4.png", pos: { x: 3, y: 5 }, size: { x: 2, y: 4 } },
    { img: "/assets/items/4x3.png", pos: { x: 1, y: 12 }, size: { x: 4, y: 3 } },
];

const tooltips = new Map<GUID, TippyInstance>();

const supervisor = new StorageSupervisor({
    moveItem(item, originStorage, targetStorage, slot) {
        const isSameStorage = originStorage.compareWith(targetStorage);
        const isWebStorage = targetStorage.id === "web-storage";
        const { uid, ...newItem } = item;

        console.log({
            newItem,
            slot,
            from: originStorage.id,
            to: targetStorage.id,
            isWebStorage,
            isOriginatingStorage: isSameStorage,
        });

        // TODO: Implement API call to move the item
        return Promise.resolve(newItem);
    },
    onItemCreated(item, element, storage) {
        const instance = tippy(element, {
            content: `
                ID: ${item.uid}<br />
                Size: ${item.size.x}x${item.size.y}<br />
                Storage: ${storage.id}
            `,
            allowHTML: true,
        });

        tooltips.set(item.uid, instance);
    },
    onItemDestroyed(item) {
        const instance = tooltips.get(item.uid);

        if (!instance) {
            return;
        }

        instance.destroy();
        tooltips.delete(item.uid);
    },
});

await supervisor.addStorage("game-storage", { selector: "#game-wh", items });
await supervisor.addStorage("web-storage", { selector: "#web-wh", items, fixedItemSize: true, autoPlaceItems: true });
