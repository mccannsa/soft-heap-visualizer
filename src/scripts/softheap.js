// compile with: tsc ./src/scripts/softheap.ts --target es2015
class Item {
    constructor(key) {
        this.key = key;
        this.next = this;
    }
}
class Vertex {
    constructor(elem) {
        this.set = elem;
        if (elem) {
            this.key = elem.key;
            this.rank = 0;
            this.left = Vertex.nil;
            this.right = Vertex.nil;
            this.next = Vertex.nil;
        }
        else {
            this.key = Infinity;
            this.rank = Infinity;
            this.left = this;
            this.right = this;
            this.next = this;
        }
    }
    static getNil() {
        if (!this.nil) {
            this.nil = new Vertex(null);
        }
        return this.nil;
    }
}
class SoftHeap {
    constructor(epsilon) {
        SoftHeap.threshold = Math.ceil(Math.log2(3 / epsilon));
    }
    static makeHeap() {
        return Vertex.getNil();
    }
    static findMin(heap) {
        let item = null;
        if (heap.set) {
            item = heap.set;
        }
        return { key: heap.key, item };
    }
    static deleteMin(heap) {
        let elem = heap.set ? heap.set : null;
        if (!elem)
            return Vertex.nil;
        if (elem.next !== elem) {
            heap.set.next = elem.next;
            return heap;
        }
        else {
            heap.set = null;
            let k = heap.rank;
            if (heap.left === Vertex.nil) {
                heap = heap.next;
            }
            else {
                this.defill(heap, false);
            }
            heap = this.reorder(heap, k);
            return heap;
        }
    }
    static insert(heap, elem) {
        heap = this.keySwap(this.meldableInsert(this.makeRoot(elem), this.rankSwap(heap)));
        return heap;
    }
    static defill(x, inserting) {
        this.fill(x, inserting);
        if (inserting && x.rank > this.threshold && x.rank % 2 === 0) {
            this.fill(x, inserting);
        }
    }
    static fill(x, inserting) {
        if (x.left !== Vertex.nil && x.right !== Vertex.nil && x.left.key > x.right.key) {
            let temp = x.left;
            x.left = x.right;
            x.right = temp;
        }
        x.key = x.left.key;
        if (x.set == null) {
            x.set = x.left.set;
        }
        else {
            let temp = x.set.next;
            x.set.next = x.left.set.next;
            x.left.set.next = temp;
        }
        x.left.set = null;
        if (x.left.left === Vertex.nil) {
            x.left = x.right;
            x.right = Vertex.nil;
        }
        else {
            this.defill(x.left, inserting);
        }
    }
    static rankSwap(heap) {
        let x = heap.next;
        if (heap.rank <= x.rank) {
            return heap;
        }
        heap.next = x.next;
        x.next = heap;
        return x;
    }
    static keySwap(heap) {
        let x = heap.next;
        if (heap.key < x.key) {
            return heap;
        }
        heap.next = x.next;
        x.next = heap;
        return x;
    }
    static reorder(heap, k) {
        if (heap.next.rank < k) {
            heap = this.rankSwap(heap);
            heap.next = this.reorder(heap.next, k);
        }
        return this.keySwap(heap);
    }
    static makeRoot(elem) {
        elem.next = elem;
        return new Vertex(elem);
    }
    static link(x, y) {
        let z = new Vertex(null);
        z.set = null;
        z.rank = x.rank + 1;
        z.left = x;
        z.right = y;
        this.defill(z, true);
        return z;
    }
    static meldableInsert(x, heap) {
        if (x.rank < heap.rank) {
            x.next = this.keySwap(heap);
            return x;
        }
        return this.meldableInsert(this.link(x, heap), this.rankSwap(heap.next));
    }
    static meldableMeld(x, y) {
        if (x.rank > y.rank) {
            let temp = x;
            x = y;
            y = temp;
        }
        if (y === Vertex.nil) {
            return x;
        }
        return this.meldableInsert(x, this.meldableMeld(this.rankSwap(x), y));
    }
}
class MaxSoftHeap extends SoftHeap {
    static fill(x, inserting) {
        if (x.left !== Vertex.nil && x.right !== Vertex.nil && x.left.key < x.right.key) {
            let temp = x.left;
            x.left = x.right;
            x.right = temp;
        }
        x.key = x.left.key;
        if (x.set == null) {
            x.set = x.left.set;
        }
        else {
            let temp = x.set.next;
            x.set.next = x.left.set.next;
            x.left.set.next = temp;
        }
        x.left.set = null;
        if (x.left.left === Vertex.nil) {
            x.left = x.right;
            x.right = Vertex.nil;
        }
        else {
            this.defill(x.left, inserting);
        }
    }
    static keySwap(heap) {
        let x = heap.next;
        if (heap.key > x.key) {
            return heap;
        }
        heap.next = x.next;
        x.next = heap;
        return x;
    }
    static findMax(heap) {
        let item = null;
        if (heap.set) {
            item = heap.set;
        }
        return { key: heap.key, item };
    }
    static deleteMax(heap) {
        let elem = heap.set ? heap.set : null;
        if (!elem)
            return Vertex.nil;
        if (elem.next !== elem) {
            heap.set.next = elem.next;
            return heap;
        }
        else {
            heap.set = null;
            let k = heap.rank;
            if (heap.left === Vertex.nil) {
                heap = heap.next;
            }
            else {
                this.defill(heap, false);
            }
            heap = this.reorder(heap, k);
            return heap;
        }
    }
}
export default { Item, Vertex, SoftHeap, MaxSoftHeap };
