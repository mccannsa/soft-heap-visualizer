// compile with: tsc ./src/scripts/softheap.ts --target es2015

import { Animator, AnimatedNode, AnimatedEdge, AnimatedTree } from './animator';

class Item {
  key: number;
  next: Item;
  constructor(key: number) {
    this.key = key;
    this.next = this;
  }
}

class Vertex {
  static nil: Vertex | null = null;

  corrupted: boolean = false;
  key: any;
  rank: number;
  set: Item | null;
  left: Vertex;
  right: Vertex;
  next: Vertex;
  elements: {
    tree: AnimatedTree | null;
    node: AnimatedNode | null;
    edges: {
      left: AnimatedEdge | null;
      right: AnimatedEdge | null;
      next: AnimatedEdge | null;
    };
  };

  constructor(elem: Item | null) {
    this.set = elem;
    this.elements = {
      tree: null,
      node: null,
      edges: {
        left: null,
        right: null,
        next: null
      }
    };
    if (elem) {
      this.key = elem.key;
      this.rank = 0;
      this.left = Vertex.getNil();
      this.right = Vertex.getNil();
      this.next = Vertex.getNil();
    } else {
      this.key = Infinity;
      this.rank = Infinity;
      this.left = this;
      this.right = this;
      this.next = this;
    }
  }

  setToString(truncate: boolean = true) {
    let str: string = '';
    if (!this.set) return str;
    let x: Item = this.set.next;
    if (!x) return str;
    if (truncate) {
      let count = 0;
      do {
        str += x.key.toString() + ' ';
        x = x.next;
        count++;
      } while (x !== this.set!.next && count < 3);
      if (count >= 3) str += '...';
    } else {
      do {
        str += x.key.toString() + ' ';
        x = x.next;
      } while (x !== this.set!.next);
    }
    return str;
  }

  static getNil(): Vertex {
    if (!this.nil) {
      this.nil = new Vertex(null);
    }
    return this.nil;
  }
}

class SoftHeap {
  static H: Vertex | null = null;
  static threshold: number;
  static animator: Animator;
  static inserting: boolean = false;
  constructor(epsilon: number, animator: Animator) {
    SoftHeap.threshold = Math.ceil(Math.log2(3 / epsilon));
    SoftHeap.animator = animator;
  }

  static makeHeap(): Vertex {
    this.animator!.highlightDOMElements('make-heap');
    this.animator!.unhighlightDOMElements('make-heap');
    // this.animator!.highlightDOMElements('make-heap-return');
    // this.animator!.unhighlightDOMElements('make-heap-return');
    return Vertex.getNil();
  }

  static findMin(heap: Vertex): { key: number; item: Item | null } {
    let item: null | Item = null;
    if (heap.set) {
      item = heap.set;
    }
    return { key: heap.key, item };
  }

  static deleteMin(heap: Vertex): Vertex {
    let elem: Item = heap.set!.next;
    if (!elem) return Vertex.getNil();

    this.animator.highlightCyElements(heap.elements.node!.id);
    this.animator.nop();

    if (elem.next !== elem) {
      heap.set!.next = elem.next;
      this.animator.annotateNode(heap.elements.node!.id, heap.setToString());
      this.animator.unhighlightCyElements(heap.elements.node!.id);
      this.animator.takeSnapshot(`delete min ${elem.key}`);
      this.animator.updateNodeData(heap.elements.node!.id, {
        key: heap.key,
        rank: heap.rank,
        set: heap.setToString(false)
      });
      return heap;
    } else {
      heap.set = null;
      this.animator.unhighlightCyElements(heap.elements.node!.id);
      let k: number = heap.rank;
      if (heap.left.rank === Vertex.getNil().rank) {
        this.animator.removeNode(heap.elements.node!.id);
        if (heap.next.rank !== Vertex.getNil().rank) {
          this.animator.moveAllNodesBy(
            heap.elements.tree!.getBounds().maxX - heap.next.elements.tree!.getBounds().minX,
            0
          );
        }
        heap = heap.next;
      } else {
        this.defill(heap);
      }
      heap = this.reorder(heap, k);
      this.H = heap;
      this.animator.takeSnapshot(`delete min ${elem.key}`);
      return this.H;
    }
  }

  static insert(heap: Vertex, elem: Item): Vertex {
    this.inserting = true;
    const makeRoot = this.makeRoot(elem);
    const rankSwap = this.rankSwap(heap);
    const meld = this.meldableInsert(makeRoot, rankSwap);
    let ret = this.keySwap(meld);
    this.tightenRootList(ret);
    const dx = this.animator.startX / 2 - ret.elements.tree?.getBounds().minX!;

    this.animator.moveAllNodesBy(dx, 0);
    this.H = ret;
    this.inserting = false;
    this.animator.takeSnapshot(`insert ${elem.key}`);
    return ret;
  }

  static defill(x: Vertex) {
    this.fill(x);
    if (this.inserting && x.rank > this.threshold && x.rank % 2 === 0) {
      this.fill(x);
      x.corrupted = true;
      this.animator.changeNodeColor(x.elements.node!.id, 'orchid');
      this.animator.annotateNode(x.elements.node!.id, x.setToString());
    }
  }

  static fill(x: Vertex) {
    if (x.left.key > x.right.key) {
      let temp: Vertex = x.left;
      this.animator.swapEdges(x.elements.edges.left!, x.elements.edges.right!);
      this.animator.swapNodes(x.left.elements.node!, x.right.elements.node!);
      x.left = x.right;
      x.right = temp;
    }

    x.key = x.left.key;

    if (x.set == null) {
      x.set = x.left.set;
    } else {
      let temp: Item = x.set.next;
      x.set.next = x.left.set!.next;
      x.left.set!.next = temp;
    }

    x.left.set = null;

    if (x.left.corrupted) {
      x.corrupted = true;
      this.animator.changeNodeColor(x.elements.node!.id, 'orchid');
      this.animator.annotateNode(x.elements.node!.id, x.setToString());
      this.animator.annotateNode(x.left.elements.node!.id, x.left.setToString());
    }

    this.animator.updateNodeLabel(x.left.elements.node!.id, '');
    this.animator.updateNodeLabel(x.elements.node!.id, x.key.toString());

    if (!x.left.corrupted && x.rank > this.threshold) {
      this.animator.changeNodeColor(x.elements.node!.id, 'pink');
      this.animator.annotateNode(x.elements.node!.id, '');
    }

    if (x.left.left.rank === Vertex.getNil().rank) {
      const left = x.left.elements.node!;
      this.animator.removeNode(left.id);
      x.elements.tree!.root.removeChild(x.left.elements.tree!.root);
      x.left = x.right;
      x.right = Vertex.getNil();
      this.animator.updateNodeData(x.elements.node!.id, {
        key: x.key,
        rank: x.rank,
        set: x.setToString(false)
      });
    } else {
      this.animator.updateNodeData(x.elements.node!.id, {
        key: x.key,
        rank: x.rank,
        set: x.setToString(false)
      });
      this.defill(x.left);
    }
    x.elements.tree!.layout();
  }

  static rankSwap(heap: Vertex): Vertex {
    let x: Vertex = heap.next;

    if (heap.rank <= x.rank) {
      return heap;
    }

    if (heap.elements.node && x.elements.node) {
      if (heap.elements.edges.next) this.animator.removeEdge(heap.elements.edges.next.id);
      if (x.elements.edges.next) this.animator.removeEdge(x.elements.edges.next.id);

      this.animator.swapNodes(heap.elements.node, x.elements.node);
      const xNext = { source: x.elements.node.id, target: heap.elements.node.id, id: null };
      if (x.next.elements.node) {
        const heapNext = {
          source: heap.elements.node.id,
          target: x.next.elements.node?.id,
          id: null
        };
        const edges = this.animator.addEdges(xNext, heapNext);
        x.elements.edges.next = edges[0];
        heap.elements.edges.next = edges[1];
      } else {
        const edges = this.animator.addEdges(xNext);
        x.elements.edges.next = edges[0];
        heap.elements.edges.next = null;
      }
    }

    heap.next = x.next;
    x.next = heap;
    return x;
  }

  static keySwap(heap: Vertex): Vertex {
    let x: Vertex = heap.next;
    if (heap.key < x.key) {
      return heap;
    }

    if (heap.rank !== Vertex.getNil().rank && x.rank !== Vertex.getNil().rank) {
      this.animator.swapNodes(heap.elements.node!, x.elements.node!);
    }

    heap.next = x.next;
    x.next = heap;
    return x;
  }

  static reorder(heap: Vertex, k: number): Vertex {
    if (heap.next.rank < k) {
      heap = this.rankSwap(heap);
      heap.next = this.reorder(heap.next, k);
      this.animator.removeEdge(heap.elements.edges.next!.id);
      heap.elements.edges.next = this.animator.addEdge(
        heap.elements.node!.id,
        heap.next.elements.node!.id
      );
    }
    this.H = this.keySwap(heap);
    return this.H;
  }

  static tightenRootList(heap: Vertex) {
    const moves: any = [];
    while (heap.rank !== Vertex.getNil().rank) {
      let x: Vertex = heap.next;
      if (heap.elements.edges.next && heap.elements.tree && x.elements.tree) {
        const heapMax = heap.elements.tree!.getBounds().maxX;
        const xMin = x.elements.tree!.getBounds().minX;
        const dx = heapMax - xMin + 50;
        const nodes = this.animator.getElementsWithClass(x.elements.node!.id);
        nodes.forEach((node) => {
          const n = node as AnimatedNode;
          moves.push({ id: n.id, x: n.position.x + dx, y: n.position.y });
        });
      }
      heap = heap.next;
    }
    this.animator.moveNodes(moves);
  }

  static makeRoot(elem: Item): Vertex {
    // this.animator!.highlightDOMElements('make-root');
    elem.next = elem;
    const node = new Vertex(elem);
    this.animator.moveAllNodesBy(50, 0);
    node.elements.node = this.animator.addNode(
      elem.key.toString(),
      this.animator.startX / 2,
      this.animator.startY / 2,
      {
        key: node.key,
        rank: node.rank,
        set: node.setToString()
      }
    );
    this.animator.addClassToElement(node.elements.node.id, 'root');
    this.animator.addClassToElement(node.elements.node.id, node.elements.node.id);
    node.elements.tree = new AnimatedTree(this.animator, node.elements.node);
    // this.animator!.unhighlightDOMElements('make-root');
    return node;
  }

  static link(x: Vertex, y: Vertex): Vertex {
    let z: Vertex = new Vertex(null);
    z.set = null;
    z.rank = x.rank + 1;
    z.left = x;
    z.right = y;

    const xNode = x.elements.node!;
    const yNode = y.elements.node!;

    const xPos = (xNode.position.x + yNode.position.x) / 2;
    const yPos = xNode.position.y - 50;

    // x and y nodes are no longer root nodes, so remove the root class
    // and the next edge from both
    this.animator.removeClassFromElement(xNode.id, 'root');
    this.animator.removeClassFromElement(yNode.id, 'root');
    if (x.elements.edges.next) this.animator.removeEdge(x.elements.edges.next!.id);
    if (y.elements.edges.next) this.animator.removeEdge(y.elements.edges.next!.id);

    // add the linking node and make it a tree
    z.elements.node = this.animator.addNode('', xPos, yPos, {
      key: z.key,
      rank: z.rank,
      set: z.setToString()
    });
    this.animator.addClassToElement(z.elements.node!.id, 'root');
    this.animator.addClassToElement(z.elements.node!.id, z.elements.node!.id);
    z.elements.tree = new AnimatedTree(this.animator, z.elements.node);
    z.elements.tree.root.addChild(x.elements.tree!.root);
    z.elements.tree.root.addChild(y.elements.tree!.root);

    let descendents = this.animator.getElementsWithClass(xNode.id);
    descendents = descendents.concat(this.animator.getElementsWithClass(yNode.id));
    descendents.forEach((node) => this.animator.addClassToElement(node.id, z.elements.node!.id));

    const leftEdge = { source: z.elements.node.id, target: x.elements.node!.id, id: null };
    const rightEdge = { source: z.elements.node.id, target: y.elements.node!.id, id: null };
    const edges = this.animator.addEdges(leftEdge, rightEdge);
    z.elements.edges.left = edges[0];
    z.elements.edges.right = edges[1];

    // apply tree layout to the newly link tree
    z.elements.tree.layout();

    const zNodes = this.animator.getElementsWithClass(z.elements.node.id).map((node) => node.id);
    this.animator.moveNodesBy(zNodes, 0, 50);

    this.defill(z);
    return z;
  }

  static meldableInsert(x: Vertex, heap: Vertex): Vertex {
    if (x.rank < heap.rank) {
      x.next = this.keySwap(heap);
      if (x.next.rank !== Vertex.getNil().rank) {
        x.elements.edges.next = this.animator.addEdge(
          x.elements.node!.id,
          x.next.elements.node!.id
        );
      }
      return x;
    }
    const link = this.link(x, heap);
    const rankSwap = this.rankSwap(heap.next);
    this.H = this.meldableInsert(link, rankSwap);
    return this.H;
  }

  static meldableMeld(x: Vertex, y: Vertex): Vertex {
    if (x.rank > y.rank) {
      let temp: Vertex = x;
      x = y;
      y = temp;
    }
    if (y.rank === Vertex.getNil().rank) {
      return x;
    }
    this.H = this.meldableInsert(x, this.meldableMeld(this.rankSwap(x), y));
    return this.H;
  }

  static fixLayout(heap: Vertex) {
    let x = heap.next;
    while (x.rank !== Vertex.getNil().rank) {
      x.elements.tree!.layout();
      x = x.next;
    }
  }
}

class MaxSoftHeap {
  static H: Vertex | null = null;
  static threshold: number;
  static animator: Animator;
  static inserting: boolean = false;
  
  constructor(epsilon: number, animator: Animator) {
    MaxSoftHeap.threshold = Math.ceil(Math.log2(3 / epsilon));
    MaxSoftHeap.animator = animator;
  }

  static makeHeap(): Vertex {
    const nil = Vertex.getNil();
    nil.key = -Infinity;
    return nil;
  }

  static insert(heap: Vertex, elem: Item): Vertex {
    this.inserting = true;
    const makeRoot = this.makeRoot(elem);
    const rankSwap = this.rankSwap(heap);
    const meld = this.meldableInsert(makeRoot, rankSwap);
    let ret = this.keySwap(meld);
    this.tightenRootList(ret);
    const dx = this.animator.startX / 2 - ret.elements.tree?.getBounds().minX!;

    this.animator.moveAllNodesBy(dx, 0);
    this.H = ret;
    this.inserting = false;
    this.animator.takeSnapshot(`insert ${elem.key}`);
    return ret;
  }

  static defill(x: Vertex) {
    this.fill(x);
    if (this.inserting && x.rank > this.threshold && x.rank % 2 === 0) {
      this.fill(x);
      x.corrupted = true;
      this.animator.changeNodeColor(x.elements.node!.id, 'orchid');
      this.animator.annotateNode(x.elements.node!.id, x.setToString());
    }
  }

  static rankSwap(heap: Vertex): Vertex {
    let x: Vertex = heap.next;

    if (heap.rank <= x.rank) {
      return heap;
    }

    if (heap.elements.node && x.elements.node) {
      if (heap.elements.edges.next) this.animator.removeEdge(heap.elements.edges.next.id);
      if (x.elements.edges.next) this.animator.removeEdge(x.elements.edges.next.id);

      this.animator.swapNodes(heap.elements.node, x.elements.node);
      const xNext = { source: x.elements.node.id, target: heap.elements.node.id, id: null };
      if (x.next.elements.node) {
        const heapNext = {
          source: heap.elements.node.id,
          target: x.next.elements.node?.id,
          id: null
        };
        const edges = this.animator.addEdges(xNext, heapNext);
        x.elements.edges.next = edges[0];
        heap.elements.edges.next = edges[1];
      } else {
        const edges = this.animator.addEdges(xNext);
        x.elements.edges.next = edges[0];
        heap.elements.edges.next = null;
      }
    }

    heap.next = x.next;
    x.next = heap;
    return x;
  }

  static reorder(heap: Vertex, k: number): Vertex {
    if (heap.next.rank < k) {
      heap = this.rankSwap(heap);
      heap.next = this.reorder(heap.next, k);
      this.animator.removeEdge(heap.elements.edges.next!.id);
      heap.elements.edges.next = this.animator.addEdge(
        heap.elements.node!.id,
        heap.next.elements.node!.id
      );
    }
    this.H = this.keySwap(heap);
    return this.H;
  }

  static tightenRootList(heap: Vertex) {
    const moves: any = [];
    while (heap.rank !== Vertex.getNil().rank) {
      let x: Vertex = heap.next;
      if (heap.elements.edges.next && heap.elements.tree && x.elements.tree) {
        const heapMax = heap.elements.tree!.getBounds().maxX;
        const xMin = x.elements.tree!.getBounds().minX;
        const dx = heapMax - xMin + 50;
        const nodes = this.animator.getElementsWithClass(x.elements.node!.id);
        nodes.forEach((node) => {
          const n = node as AnimatedNode;
          moves.push({ id: n.id, x: n.position.x + dx, y: n.position.y });
        });
      }
      heap = heap.next;
    }
    this.animator.moveNodes(moves);
  }

  static makeRoot(elem: Item): Vertex {
    elem.next = elem;
    const node = new Vertex(elem);
    this.animator.moveAllNodesBy(50, 0);
    node.elements.node = this.animator.addNode(
      elem.key.toString(),
      this.animator.startX / 2,
      this.animator.startY / 2,
      {
        key: node.key,
        rank: node.rank,
        set: node.setToString()
      }
    );
    this.animator.addClassToElement(node.elements.node.id, 'root');
    this.animator.addClassToElement(node.elements.node.id, node.elements.node.id);
    node.elements.tree = new AnimatedTree(this.animator, node.elements.node);
    return node;
  }

  static link(x: Vertex, y: Vertex): Vertex {
    let z: Vertex = new Vertex(null);
    z.set = null;
    z.rank = x.rank + 1;
    z.left = x;
    z.right = y;

    const xNode = x.elements.node!;
    const yNode = y.elements.node!;

    const xPos = (xNode.position.x + yNode.position.x) / 2;
    const yPos = xNode.position.y - 50;

    // x and y nodes are no longer root nodes, so remove the root class
    // and the next edge from both
    this.animator.removeClassFromElement(xNode.id, 'root');
    this.animator.removeClassFromElement(yNode.id, 'root');
    if (x.elements.edges.next) this.animator.removeEdge(x.elements.edges.next!.id);
    if (y.elements.edges.next) this.animator.removeEdge(y.elements.edges.next!.id);

    // add the linking node and make it a tree
    z.elements.node = this.animator.addNode('', xPos, yPos, {
      key: z.key,
      rank: z.rank,
      set: z.setToString()
    });
    this.animator.addClassToElement(z.elements.node!.id, 'root');
    this.animator.addClassToElement(z.elements.node!.id, z.elements.node!.id);
    z.elements.tree = new AnimatedTree(this.animator, z.elements.node);
    z.elements.tree.root.addChild(x.elements.tree!.root);
    z.elements.tree.root.addChild(y.elements.tree!.root);

    let descendents = this.animator.getElementsWithClass(xNode.id);
    descendents = descendents.concat(this.animator.getElementsWithClass(yNode.id));
    descendents.forEach((node) => this.animator.addClassToElement(node.id, z.elements.node!.id));

    const leftEdge = { source: z.elements.node.id, target: x.elements.node!.id, id: null };
    const rightEdge = { source: z.elements.node.id, target: y.elements.node!.id, id: null };
    const edges = this.animator.addEdges(leftEdge, rightEdge);
    z.elements.edges.left = edges[0];
    z.elements.edges.right = edges[1];

    // apply tree layout to the newly link tree
    z.elements.tree.layout();

    const zNodes = this.animator.getElementsWithClass(z.elements.node.id).map((node) => node.id);
    this.animator.moveNodesBy(zNodes, 0, 50);

    this.defill(z);
    return z;
  }

  static meldableInsert(x: Vertex, heap: Vertex): Vertex {
    if (x.rank < heap.rank) {
      x.next = this.keySwap(heap);
      if (x.next.rank !== Vertex.getNil().rank) {
        x.elements.edges.next = this.animator.addEdge(
          x.elements.node!.id,
          x.next.elements.node!.id
        );
      }
      return x;
    }
    const link = this.link(x, heap);
    const rankSwap = this.rankSwap(heap.next);
    this.H = this.meldableInsert(link, rankSwap);
    return this.H;
  }

  static meldableMeld(x: Vertex, y: Vertex): Vertex {
    if (x.rank > y.rank) {
      let temp: Vertex = x;
      x = y;
      y = temp;
    }
    if (y.rank === Vertex.getNil().rank) {
      return x;
    }
    this.H = this.meldableInsert(x, this.meldableMeld(this.rankSwap(x), y));
    return this.H;
  }

  static fixLayout(heap: Vertex) {
    let x = heap.next;
    while (x.rank !== Vertex.getNil().rank) {
      x.elements.tree!.layout();
      x = x.next;
    }
  }
  
  static findMax(heap: Vertex): { key: number; item: Item | null } {
    let item: null | Item = null;
    if (heap.set) {
      item = heap.set;
    }
    return { key: heap.key, item };
  }

  static deleteMax(heap: Vertex): Vertex {
    let elem: Item = heap.set!.next;
    if (!elem) return this.makeHeap();

    this.animator.highlightCyElements(heap.elements.node!.id);
    this.animator.nop();

    if (elem.next !== elem) {
      heap.set!.next = elem.next;
      this.animator.annotateNode(heap.elements.node!.id, heap.setToString());
      this.animator.unhighlightCyElements(heap.elements.node!.id);
      this.animator.takeSnapshot(`delete min ${elem.key}`);
      this.animator.updateNodeData(heap.elements.node!.id, {
        key: heap.key,
        rank: heap.rank,
        set: heap.setToString(false)
      });
      return heap;
    } else {
      heap.set = null;
      this.animator.unhighlightCyElements(heap.elements.node!.id);
      let k: number = heap.rank;
      if (heap.left.rank === Vertex.getNil().rank) {
        this.animator.removeNode(heap.elements.node!.id);
        if (heap.next.rank !== Vertex.getNil().rank) {
          this.animator.moveAllNodesBy(
            heap.elements.tree!.getBounds().maxX - heap.next.elements.tree!.getBounds().minX,
            0
          );
        }
        heap = heap.next;
      } else {
        this.defill(heap);
      }
      heap = this.reorder(heap, k);
      this.H = heap;
      this.animator.takeSnapshot(`delete min ${elem.key}`);
      return this.H;
    }
  }

  static fill(x: Vertex) {
    if (x.left.key < x.right.key) {
      let temp: Vertex = x.left;
      this.animator.swapEdges(x.elements.edges.left!, x.elements.edges.right!);
      this.animator.swapNodes(x.left.elements.node!, x.right.elements.node!);
      x.left = x.right;
      x.right = temp;
    }

    x.key = x.left.key;

    if (x.set == null) {
      x.set = x.left.set;
    } else {
      let temp: Item = x.set.next;
      x.set.next = x.left.set!.next;
      x.left.set!.next = temp;
    }

    x.left.set = null;

    if (x.left.corrupted) {
      x.corrupted = true;
      this.animator.changeNodeColor(x.elements.node!.id, 'orchid');
      this.animator.annotateNode(x.elements.node!.id, x.setToString());
      this.animator.annotateNode(x.left.elements.node!.id, x.left.setToString());
    }

    this.animator.updateNodeLabel(x.left.elements.node!.id, '');
    this.animator.updateNodeLabel(x.elements.node!.id, x.key.toString());

    if (!x.left.corrupted && x.rank > this.threshold) {
      this.animator.changeNodeColor(x.elements.node!.id, 'pink');
      this.animator.annotateNode(x.elements.node!.id, '');
    }

    if (x.left.left.rank === Vertex.getNil().rank) {
      const left = x.left.elements.node!;
      this.animator.removeNode(left.id);
      x.elements.tree!.root.removeChild(x.left.elements.tree!.root);
      x.left = x.right;
      x.right = this.makeHeap();
      this.animator.updateNodeData(x.elements.node!.id, {
        key: x.key,
        rank: x.rank,
        set: x.setToString(false)
      });
    } else {
      this.animator.updateNodeData(x.elements.node!.id, {
        key: x.key,
        rank: x.rank,
        set: x.setToString(false)
      });
      this.defill(x.left);
    }
    x.elements.tree!.layout();
  }

  static keySwap(heap: Vertex): Vertex {
    let x: Vertex = heap.next;
    if (heap.key > x.key) {
      return heap;
    }

    if (heap.rank !== Vertex.getNil().rank && x.rank !== Vertex.getNil().rank) {
      this.animator.swapNodes(heap.elements.node!, x.elements.node!);
    }

    heap.next = x.next;
    x.next = heap;
    return x;
  }
}

export { Item, SoftHeap, MaxSoftHeap };
