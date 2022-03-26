export type MessageBag = { [path: string]: string[] };

export const copyMessageBag = (bag: MessageBag): MessageBag => {
    const bagCopy: MessageBag = {};
    for (let key in bag) {
        bagCopy[key] = bag[key].slice();
    }
    return bagCopy;
};

export const sliceMessageBag = (bag: MessageBag, prefix: string): MessageBag => {
    if (prefix == '') {
        return copyMessageBag(bag);
    }
    const filtered: MessageBag = {};
    const prefixLength = prefix.length + 1;
    for (let path in bag) {
        if (path === prefix) {
            filtered[''] = bag[path];
        } else if (path.startsWith(prefix + '.')) {
            filtered[path.substring(prefixLength)] = bag[path];
        }
    }
    return filtered;
};

export const spliceMessageBag = (bag: MessageBag, prefix: string, newSubBag: MessageBag): MessageBag => {
    const bagCopy: MessageBag = {};
    if (prefix == '') {
        return copyMessageBag(newSubBag);
    }
    // make a copy of the errors
    for (let path in bag) {
        if (path === prefix || path.startsWith(prefix + '.')) {
            // skip
        } else {
            bagCopy[path] = bag[path];
        }
    }
    for (let path in newSubBag) {
        bagCopy[path == '' ? prefix : prefix + '.' + path] = newSubBag[path];
    }
    return bagCopy;
};