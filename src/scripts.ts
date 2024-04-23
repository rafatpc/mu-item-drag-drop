import { StorageSupervisor } from "./storage-supervisor";

const items = [
    { img: "/assets/items/1x1.png", pos: { x: 5, y: 10 }, size: { x: 1, y: 1 } },
    { img: "/assets/items/1x2.png", pos: { x: 3, y: 1 }, size: { x: 1, y: 2 } },
    { img: "/assets/items/2x2.png", pos: { x: 5, y: 4 }, size: { x: 2, y: 2 } },
    { img: "/assets/items/1x4.png", pos: { x: 1, y: 1 }, size: { x: 1, y: 4 } },
    { img: "/assets/items/2x3.png", pos: { x: 5, y: 1 }, size: { x: 2, y: 3 } },
    { img: "/assets/items/2x4.png", pos: { x: 3, y: 5 }, size: { x: 2, y: 4 } },
    { img: "/assets/items/4x3.png", pos: { x: 1, y: 12 }, size: { x: 4, y: 3 } },
];

const supervisor = new StorageSupervisor({
    moveItem(item, originStorage, targetStorage, slot) {
        const isSameStorage = originStorage.compareWith(targetStorage);

        // TODO: Implement API call to move the item
        return Promise.resolve({
            gg: true,
            item,
            slot,
            from: originStorage.id,
            to: targetStorage.id,
            isOriginatingStorage: isSameStorage,
        });
    },
});

await supervisor.addStorage("game-storage", { selector: "#game-wh", items });
await supervisor.addStorage("web-storage", { selector: "#web-wh", items, fixedItemSize: true });
