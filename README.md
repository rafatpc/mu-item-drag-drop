# Mu Item Dragging

A JavaScript library to enable drag & drop functionality in Mu Online Webs. It simulates game-like behaviour, giving the users the ability to move and sort items in their warehouses, displayed in the Web interface.

<p align="center">
  <img src="https://github.com/rafatpc/mu-item-drag-drop/blob/master/demo.gif" alt="Demo" />
</p>

Thanks to Dea7h for the idea, send him salad.
Created for [darksteam.net](https://darksteam.net/)

## Usage

```ts
// Array of items to be placed in the in-game warehouse
const gameItems = [
    { img: "/assets/items/1x4.png", pos: { x: 1, y: 1 }, size: { x: 1, y: 4 } },
    { img: "/assets/items/2x3.png", pos: { x: 5, y: 1 }, size: { x: 2, y: 3 } },
    { img: "/assets/items/2x4.png", pos: { x: 3, y: 5 }, size: { x: 2, y: 4 } },
    { img: "/assets/items/4x3.png", pos: { x: 1, y: 12 }, size: { x: 4, y: 3 } },
];

// Array of items to be placed in the web warehouse
const webItems = [
    { img: "/assets/items/1x1.png", pos: { x: 5, y: 10 }, size: { x: 1, y: 1 } },
    { img: "/assets/items/1x2.png", pos: { x: 3, y: 1 }, size: { x: 1, y: 2 } },
    { img: "/assets/items/2x2.png", pos: { x: 5, y: 4 }, size: { x: 2, y: 2 } },
];

// Create Storage Supervisor instance that will manage a group of warehouses
const supervisor = new StorageSupervisor({
    moveItem(item, originStorage, targetStorage, slot) {
        const isSameStorage = originStorage.compareWith(targetStorage);

        // TODO: Make an API call to your web's back end to move the item.
        // Reject the promise to prevent moving the item in the UI.
        return Promise.resolve({
            item,
            slot,
            from: originStorage.id,
            to: targetStorage.id,
            isOriginatingStorage: isSameStorage,
        });
    },
});

// Add a warehouse to the supervisor
await supervisor.addStorage("game-storage", { selector: "#game-wh", items: gameItems });
await supervisor.addStorage("web-storage", { selector: "#web-wh", items: webItems });
```
