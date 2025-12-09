import fs from 'fs';
import path from 'path';

const DB_DIR = path.join(process.cwd(), 'data');

if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

function save(name: string, data: any) {
    const filePath = path.join(DB_DIR, `${name}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export function getCollection(name: string) {
    const filePath = path.join(DB_DIR, `${name}.json`);
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify([]));
        return [];
    }
    try {
        const fileData = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(fileData);
    } catch (e) {
        return [];
    }
}

export function addToCollection(name: string, item: any) {
    const items = getCollection(name);
    const newItem = { id: Date.now(), createdAt: new Date().toISOString(), ...item };
    items.unshift(newItem); // Добавляем в начало
    save(name, items);
    return newItem;
}

export function deleteCollectionItem(name: string, id: number) {
    let items = getCollection(name);
    items = items.filter((i: any) => i.id !== id);
    save(name, items);
}

export function updateCollectionItem(name: string, id: number, updates: any) {
    const items = getCollection(name);
    const index = items.findIndex((i: any) => i.id === id);
    if (index !== -1) {
        items[index] = { ...items[index], ...updates };
        save(name, items);
        return items[index];
    }
    return null;
}

export function saveCollection(name: string, data: any) {
    save(name, data);
}
