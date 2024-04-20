import { StorageSupervisor } from './storage-supervisor.js';

const items = [
    { img: "/assets/items/1x1.png", pos: [5, 10], size: [1, 1] },
    { img: "/assets/items/1x2.png", pos: [3, 1], size: [1, 2] },
    { img: "/assets/items/2x2.png", pos: [5, 4], size: [2, 2] },
    { img: "/assets/items/1x4.png", pos: [1, 1], size: [1, 4] },
    { img: "/assets/items/2x3.png", pos: [5, 1], size: [2, 3] },
    { img: "/assets/items/2x4.png", pos: [3, 5], size: [2, 4] },
    { img: "/assets/items/4x3.png", pos: [1, 12], size: [4, 3] },
];

const supervisor = new StorageSupervisor();

await supervisor.addStorage('game-storage', {
    selector: '#game-wh',
    items,
    x: 8,
    y: 15
});

await supervisor.addStorage('web-storage', {
    selector: '#web-wh',
    items,
    x: 8,
    y: 15
});