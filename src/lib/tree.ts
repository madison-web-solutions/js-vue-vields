import type { MessageBag } from './MessageBag';

type TreeNode<T> = {
    value?: T,
    children: Tree<T>,
};

type Tree<T> = {
    [key: string]: TreeNode<T>
};

const getOrCreateChildNode = <T,>(tree: Tree<T>, key: string): TreeNode<T> => {
    if (tree[key]) {
        return tree[key] as TreeNode<T>;
    }
    const newNode: TreeNode<T> = {children: {}};
    tree[key] = newNode;
    return newNode;
};

const getOrCreateNodeAtPath = <T,>(tree: Tree<T>, path: string[]): TreeNode<T> => {
    if (path.length == 0) {
        throw "Empty path";
    }
    const nextKey = path.shift() as string;
    const nextNode = getOrCreateChildNode(tree, nextKey);
    if (path.length == 0) {
        return nextNode;
    } else {
        return getOrCreateNodeAtPath(nextNode.children, path);
    }
};

type MessageNode = TreeNode<string[]>;
type MessageTree = Tree<string[]>;

const addMessageToTree = (tree: MessageTree, path: string, message: string) => {
    const node = getOrCreateNodeAtPath(tree, path.split('.'));
    if (! node.value) {
        node.value = [];
    }
    node.value.push(message);
};

const messageBagToTree = (bag: MessageBag): MessageTree => {
    const tree: MessageTree = {};
    for (const [path, messages] of Object.entries(bag)) {
        for (let message of messages) {
            addMessageToTree(tree, path, message);
        }
    }
    return tree;
};

const addMessagesFromNodeNodeToBag = (node: MessageNode, bag: MessageBag, prefix: string): void => {
    const value = node.value;
    if (value) {
        bag[prefix] = value.slice();
    }
    for (let key in node.children) {
        addMessagesFromNodeNodeToBag(node.children[key], bag, prefix + '.' + key);
    }
};

const messageTreeToBag = (tree: MessageTree): MessageBag => {
    const bag: MessageBag = {};
    for (let key in tree) {
        addMessagesFromNodeNodeToBag(tree[key], bag, key);
    }
    return bag;
};

const copyMessageTree = (tree: MessageTree): MessageTree => {
    const treeCopy: MessageTree = {};
    for (let key in tree) {
        treeCopy[key] = copyMessageNode(tree[key]);
    }
    return treeCopy;
};

const copyMessageNode = (node: MessageNode): MessageNode => {
    const nodeCopy: MessageNode = {
        children: copyMessageTree(node.children),
    };
    if (node.value) {
        nodeCopy.value = node.value.slice();
    }
    return nodeCopy;
};

export {
    type TreeNode, type Tree, getOrCreateChildNode, getOrCreateNodeAtPath,
    type MessageNode, type MessageTree, addMessageToTree, messageBagToTree, messageTreeToBag, copyMessageTree, copyMessageNode
};

