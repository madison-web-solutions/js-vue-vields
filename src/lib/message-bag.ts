import type { MessageBag } from "../types";

export const copyMessageBag = (bag: MessageBag): MessageBag => {
  const bagCopy: MessageBag = {};
  for (const key in bag) {
    bagCopy[key] = bag[key].slice();
  }
  return bagCopy;
};

export const sliceMessageBag = (
  bag: MessageBag,
  prefix: string
): MessageBag => {
  if (prefix == "") {
    return copyMessageBag(bag);
  }
  const filtered: MessageBag = {};
  const prefixLength = prefix.length + 1;
  for (const path in bag) {
    if (path === prefix) {
      filtered[""] = bag[path];
    } else if (path.startsWith(prefix + ".")) {
      filtered[path.substring(prefixLength)] = bag[path];
    }
  }
  return filtered;
};

export const spliceMessageBag = (
  bag: MessageBag,
  prefix: string,
  newSubBag: MessageBag
): MessageBag => {
  const bagCopy: MessageBag = {};
  if (prefix == "") {
    return copyMessageBag(newSubBag);
  }
  // make a copy of the errors
  for (const path in bag) {
    if (path === prefix || path.startsWith(prefix + ".")) {
      // skip
    } else {
      bagCopy[path] = bag[path];
    }
  }
  for (const path in newSubBag) {
    bagCopy[path == "" ? prefix : prefix + "." + path] = newSubBag[path];
  }
  return bagCopy;
};

export const messageBagToString = (bag: MessageBag): string => {
  return Object.entries(bag)
    .map(([key, msgs]) => {
      return key + ": " + msgs.join(", ");
    })
    .join("\n");
};
