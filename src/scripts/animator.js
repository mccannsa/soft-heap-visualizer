import * as cytoscape from 'cytoscape';
/**
 * The Animation class represents an animation that can be played
 * by the animator. It contains a function that is called when the
 * animation is played.
 */
class Animation {
    /**
     * The constructor takes an animation function and an optional
     * number of steps. The animation function is called when the
     * animation is played. The steps parameter is used to specify
     * how many steps the animation should take. If the steps
     * parameter is null, the animation will take one step by default.
     *
     * @param animation the animation function
     * @param steps the number of steps the animation takes
     */
    constructor(animation, steps = null) {
        this.steps = 1;
        this.animation = animation;
        if (steps) {
            this.steps = steps;
        }
    }
    /**
     * The play method plays the animation function. Since Cytoscape
     * animations may be added directly to an animator queue, and
     * they require a call to their play() function, this function
     * serves as a wrapper function for non-Cytoscape animations.
     * This allows us to add Cytoscape animations and non-Cytoscape
     * to the same queue, and play either by simply calling the
     * play() function.
     */
    play() {
        this.animation();
    }
}
/**
 * The AnimatedElement class represents an element that can be
 * animated by the animator. It contains a group, an id, a list
 * of classes, and a reference to the animator.
 *
 * AnimatedElements belong to a specific group. This allows an
 * animator to quickly filter all elements of a specific type.
 *
 * AnimatedElements may have classes that determine how the
 * appear in the animation. Each class is a string that can be
 * used to style the element.
 *
 * AnimatedElements have a reference to the animator that created
 * them. This allows ID generation to be handled as a new element
 * is created.
 */
class AnimatedElement {
    /**
     * The constructor takes an animator, a group, and an optional
     * id. If the id parameter is null, an id unique to the passed
     * animator will be generated.
     *
     * @param animator the animator which this element belongs to
     * @param group the group of elements this element belongs to
     * @param id an optional identifier for this element
     */
    constructor(animator, group, id = null) {
        this.cy = null;
        this.classes = [];
        this.animator = animator;
        this.group = group;
        if (!id) {
            id = this.animator.generateUniqueId();
        }
        this.id = id;
    }
    /**
     * The getClassString method returns a string containing all
     * classes of this element separated by spaces. This allows
     * us to easily add classes to the element in the cytoscape
     * instance.
     *
     * @returns a string containing all classes of this element
     */
    getClassString() {
        return this.classes.join(' ');
    }
    /**
     * The copy method returns a copy of this element. This is
     * useful for creating snapshots of the animator, as it allows
     * us to create a deep copy of this element, preventing any
     * modifications to the original element when observing
     * the visualization history.
     *
     * @returns a copy of this element
     */
    copy() {
        let copy = new AnimatedElement(this.animator, this.group, this.id);
        copy.cy = this.cy ? this.cy.clone() : null;
        copy.classes = [...this.classes];
        return copy;
    }
    setCy(cy) {
        this.cy = cy;
    }
}
/**
 * The AnimatedNode class represents a node that can be animated
 * by the animator. It contains a label and a position, and
 * a reference to its corresponding cytoscape node in the
 * cytoscape data model.
 */
class AnimatedNode extends AnimatedElement {
    /**
     * The constructor takes an animator, a label, and a position.
     *
     * @param animator the animator which this element belongs to
     * @param label the label the node has in the visualization
     * @param x the initial x position
     * @param y the initial y position
     */
    constructor(animator, label, x, y) {
        super(animator, 'nodes');
        this.label = label;
        this.position = { x, y };
    }
    /**
     * Creates a deep copy of this node.
     *
     * @returns a copy of this node
     */
    copy() {
        let copy = super.copy();
        copy.label = this.label;
        copy.position = { x: this.position.x, y: this.position.y };
        return copy;
    }
    setCy(cy) {
        this.cy = cy;
        cy.on('select', () => {
            this.animator.setSelectedNode(this);
        });
        cy.on('unselect', () => {
            this.animator.setSelectedNode(null);
        });
        cy.on('remove', () => {
            // if this node is the selected node, unselect it
            if (this.animator.selectedNode === this) {
                this.animator.setSelectedNode(null);
            }
        });
    }
}
AnimatedNode.size = 30;
/**
 * The AnimatedEdge class represents an edge that can be animated
 * by the animator. It contains a source and a target, and
 * a reference to its corresponding cytoscape edge in the
 * cytoscape data model.
 */
class AnimatedEdge extends AnimatedElement {
    /**
     * The constructor takes an animator, an id, a source, and a target.
     *
     * @param animator the animator which this element belongs to
     * @param id the id of this edge
     * @param source the source node of this edge
     * @param target the target node of this edge
     */
    constructor(animator, id, source, target) {
        super(animator, 'edges', id);
        this.source = source;
        this.target = target;
    }
    /**
     * Creates a deep copy of this edge.
     *
     * @returns a copy of this edge
     */
    copy() {
        let copy = super.copy();
        copy.source = this.source;
        copy.target = this.target;
        return copy;
    }
}
/**
 * The AnimatorEventBus class is used to emit and listen to events
 * that are fired by the animator. It contains a dictionary of
 * events and listeners. The events are strings and the listeners
 * are functions that take a CustomEvent as a parameter.
 */
class AnimatorEventBus {
    /**
     * The constructor initializes the events dictionary.
     */
    constructor() {
        this.events = {};
    }
    /**
     * The eventExists method checks if an event exists in the events
     * dictionary.
     *
     * @param eventName the name of the event
     * @returns true if the event exists, false otherwise
     */
    eventExists(eventName) {
        return this.events.hasOwnProperty(eventName);
    }
    /**
     * The on method adds a listener to an event. If the event does
     * not exist, it is created.
     *
     * @param eventName the name of the event
     * @param listener the listener function
     */
    on(eventName, listener) {
        if (!this.eventExists(eventName)) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(listener);
    }
    /**
     * The off method removes a listener from an event. If the event
     * does not exist, nothing happens. If the listener is null, all
     * listeners are removed from the event.
     *
     * @param eventName the name of the event
     * @param listener the listener function
     */
    off(eventName, listener = null) {
        if (!this.eventExists(eventName)) {
            return;
        }
        if (listener === null) {
            this.events[eventName] = [];
            return;
        }
        this.events[eventName] = this.events[eventName].filter((l) => l !== listener);
    }
    /**
     * The emit method emits an event.
     *
     * @param event the event to emit
     */
    emit(event) {
        if (this.eventExists(event.type)) {
            this.events[event.type].forEach((listener) => {
                listener.call(this, event);
            });
        }
    }
}
/**
 * The State class represents a state of the animator. It contains
 * a list of elements and a reference to the cytoscape instance
 * used to display those elements.
 */
class State {
    constructor(elements, cy) {
        this.elements = [...elements];
        this.cy = cy;
    }
}
/**
 * The Snapshot class represents a snapshot of the animator. It
 * contains a state, an index, and a history index. The state
 * is the state of the animator at the time the snapshot was
 * taken. The index is the index of the snapshot in the list
 * of snapshots. The history index is used to determine what
 * animations in the history of animations are associated with
 * the snapshot.
 */
class Snapshot {
    /**
     * Creates a new snapshot with the passed state and history index. If
     * the name parameter is null, a default name is generated.
     *
     * @param state the state of the animator at the time the snapshot was taken
     * @param historyIndex the index of the first animation in the history that
     *                    is associated with this snapshot
     * @param name optional, the name of the snapshot
     */
    constructor(state, historyIndex, name) {
        this.index = Snapshot.num++;
        if (!name) {
            name = `Snapshot ${this.index}`;
        }
        else {
            this.name = name;
        }
        this.state = state;
        this.historyIndex = historyIndex;
    }
}
Snapshot.num = 0;
/**
 * The Animator class performs animations using a cytoscape
 * instance.
 *
 * It maintains a separate data model of the graph
 * that is being animated. This allows us to animate the graph
 * asynchronous to the actual operations that are performed.
 * Doing so results in a smoother animation.
 *
 * An Animator maintains a queue of animations that
 * are to be performed. When an animation is queued, the
 * Animator class emits an event. If no animation is currently
 * being performed, the Animator class will play the next
 * animation in the queue. Otherwise, the Animator class will
 * wait until the current animation is finished before playing
 * the next animation. Appropriate events are emitted when
 * animations are started, finished, and paused.
 *
 * When an animation is paused, the animator catches the next
 * event emitted by the animator and stores it. This haults
 * the visualization until the user chooses to resume. When
 * the animation is resumed, the animator emits the stored
 * event and continues playing animations. Pausing the
 * visualization also allows the user to step through the
 * queued animations one at a time.
 *
 * An Animator also maintains a history of animations
 * that have been performed. The goal of this is to allow
 * animations to be undone and redone. This is not yet
 * totally implemented, though a snapshot feature (used to
 * save the state of the animator) is implemented. The
 * current iteration of the history feature allows the
 * user to view static snapshots of the animator at
 * various points in time.
 *
 * The Animator also has a global animation duration and
 * delay (as opposed to duration and delay values on for
 * each individual animation). The animation duration is
 * the duration of each animation in milliseconds. The
 * animation delay is the delay between animations in
 * milliseconds. These may bechanged at any time, and once
 * changed, will affect all animations played from that
 * point on until they are changed again.
 *
 * For a better animation experience with finer control,
 * this should be refactored to use a queue of animations
 * for each element. This would allow us to animate
 * multiple elements at once, and would allow us to
 * animate elements asynchronously. Each animation should
 * also have a duration and delay, allowing us to animate
 * elements at different speeds. The animator should
 * still have global control of animation duration and delay
 * though it should simply multiply each animation's duration
 * and delay by some global factor.
 */
class Animator {
    /**
     * The constructor initializes a cytoscape instance and
     * sets up the event bus. The cytoscape instance is
     * initialized with an empty graph and a predefined
     * style. The style is used to style the nodes and edges
     * in the graph.
     *
     * @param container the id of the DOM element in which
     *                  the visualization will be displayed
     */
    constructor(container, historyContainer = null) {
        this.queue = [];
        this.elements = [];
        this.history = [];
        this.animationDuration = 250;
        this.animationDelay = 500;
        this.currentAnimation = null;
        this.idle = true;
        this.eventBus = new AnimatorEventBus();
        // synchronizedAnimators: Array<Animator> = [];
        this.delayId = null;
        this.paused = false;
        this.pausedEvent = null;
        this.snapshots = [];
        this.selectedNode = null;
        if (!document.getElementById(container)) {
            return;
        }
        if (historyContainer && document.getElementById(historyContainer)) {
            this.historyContainer = cytoscape({
                container: document.getElementById(historyContainer),
                elements: [],
                style: [
                    {
                        selector: 'node',
                        style: {
                            'background-color': 'pink',
                            'border-color': '#000',
                            'border-width': 1,
                            'line-color': '#000',
                            label: 'data(label)',
                            'text-valign': 'center',
                            'text-halign': 'center'
                        }
                    },
                    {
                        selector: '.annotation',
                        style: {
                            'background-color': 'white',
                            'border-width': 0,
                            'text-valign': 'top',
                            'text-halign': 'right',
                            'text-margin-x': -15,
                            'text-margin-y': 15
                        }
                    },
                    {
                        selector: 'edge',
                        style: {
                            width: 2,
                            'line-color': '#000',
                            'target-arrow-shape': 'none'
                        }
                    },
                    {
                        selector: 'node.highlighted',
                        style: {
                            'background-color': 'red'
                        }
                    },
                    {
                        selector: 'edge.highlighted',
                        style: {
                            'line-color': 'red'
                        }
                    }
                ]
            });
        }
        this.cy = cytoscape({
            container: document.getElementById(container),
            elements: [],
            style: [
                {
                    selector: 'node',
                    style: {
                        'background-color': 'pink',
                        'border-color': '#000',
                        'border-width': 1,
                        'line-color': '#000',
                        label: 'data(label)',
                        'text-valign': 'center',
                        'text-halign': 'center'
                    }
                },
                {
                    selector: '.annotation',
                    style: {
                        'background-color': 'white',
                        'border-width': 0,
                        'text-valign': 'top',
                        'text-halign': 'right',
                        'text-margin-x': -15,
                        'text-margin-y': 15
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        width: 2,
                        'line-color': '#000',
                        'target-arrow-shape': 'none'
                    }
                },
                {
                    selector: 'node.highlighted',
                    style: {
                        'background-color': 'red'
                    }
                },
                {
                    selector: 'edge.highlighted',
                    style: {
                        'line-color': 'red'
                    }
                }
            ]
        });
        this.startX = this.cy.width() / 2;
        this.startY = this.cy.height() / 2;
        this.eventBus.on('animationQueued', this.animationQueuedListener.bind(this));
        this.eventBus.on('animationFinished', this.animationFinishedListener.bind(this));
        this.eventBus.on('animationStarted', this.animationStartedListener.bind(this));
        this.eventBus.on('animationPaused', this.animationPausedListener.bind(this));
        this.eventBus.on('animationResumed', this.animationResumedListener.bind(this));
    }
    /**
     * Emits an event using this animators event bus. If the
     * animator is paused, the event is stored and emitted
     * when the animator is resumed.
     *
     * @param event the event to emit
     */
    emit(event) {
        if (!event)
            return;
        if (this.paused) {
            if (this.pausedEvent)
                return;
            this.pausedEvent = event;
            return;
        }
        this.eventBus.emit(event);
        // this.synchronizedAnimators.forEach((animator) => {
        //   animator.emit(event);
        // });
    }
    /*
    synchronizeWith(...animators: Array<Animator>) {
      clearTimeout(this.delayId!);
      this.synchronizedAnimators.forEach((animator) => {
        clearTimeout(animator.delayId!);
      });
      animators.forEach((animator) => {
        clearTimeout(animator.delayId!);
      });
      animators.forEach((animator) => {
        animator.animationDuration = this.animationDuration;
        animator.animationDelay = this.animationDelay;
        animator.synchronizedAnimators.push(this);
      });
      this.synchronizedAnimators.concat(animators);
      // this.synchronizedAnimators.forEach((animator) => {
      //   animator.delayId = setTimeout()
      // });
    }
    */
    /**
     * Sets the animation duration to the passed value.
     *
     * @param duration the duration in milliseconds
     */
    setAnimationDuration(duration) {
        this.animationDuration = duration;
        // this.synchronizedAnimators.forEach((animator) => {
        //   animator.animationDuration = duration;
        // });
    }
    /**
     * Sets the animation delay to the passed value.
     *
     * @param duration the delay in milliseconds
     */
    setAnimationDelay(delay) {
        this.animationDelay = delay;
        // this.synchronizedAnimators.forEach((animator) => {
        //   animator.animationDelay = delay;
        // });
    }
    /**
     * Emits an "animationPaused" event.
     */
    pause() {
        // this.paused = true;
        this.emit(new CustomEvent('animationPaused'));
    }
    /**
     * Performs a single animation step, but only if the animator
     * is paused. If the animator is not paused, nothing happens.
     */
    step() {
        if (!this.paused)
            return;
        if (this.pausedEvent)
            this.emit(this.pausedEvent);
        this.playNextAnimation();
        this.pausedEvent = null;
        this.emit(new CustomEvent('animationStep'));
    }
    /**
     * Resumes the animator if it is paused. An "animationResumed"
     * event is emitted.
     */
    resume() {
        if (!this.paused)
            return;
        this.paused = false;
        this.emit(new CustomEvent('animationResumed'));
    }
    animationQueuedListener() {
        if (this.idle && !this.paused) {
            this.playNextAnimation();
        }
    }
    animationFinishedListener(event) {
        var _a;
        let delay = this.animationDelay;
        if (((_a = event === null || event === void 0 ? void 0 : event.detail) === null || _a === void 0 ? void 0 : _a.type) !== 'snapshot') {
            this.history.push(this.currentAnimation);
        }
        else {
            delay = this.animationDelay / 100;
        }
        this.currentAnimation = null;
        if (this.paused)
            return;
        this.delayId = setTimeout(() => {
            this.idle = true;
            this.playNextAnimation();
        }, delay);
    }
    animationStartedListener() {
        this.idle = false;
    }
    animationPausedListener() {
        this.paused = true;
    }
    animationResumedListener() {
        if (this.pausedEvent)
            this.emit(this.pausedEvent);
        this.playNextAnimation();
        this.pausedEvent = null;
    }
    queueAnimation(animation) {
        this.queue.push(animation);
        this.emit(new CustomEvent('animationQueued'));
    }
    playNextAnimation() {
        if (!this.currentAnimation && this.queue.length > 0) {
            this.currentAnimation = this.queue.shift();
        }
        else if (this.queue.length === 0) {
            this.emit(new CustomEvent('animationQueueEmpty'));
        }
        if (this.currentAnimation) {
            this.currentAnimation.play();
            this.emit(new CustomEvent('animationStarted'));
            this.currentAnimation = null;
        }
    }
    fitToElements(eles) {
        let ids = eles.map((ele) => ele.id);
        let fit = this.cy.elements().filter((ele) => ids.includes(ele.id()));
        this.cy.fit(fit, 100);
    }
    fitToAllElements() {
        this.cy.fit(this.cy.elements(), 100);
    }
    awaitAnimationFinish() {
        return new Promise((resolve) => {
            this.eventBus.on('animationFinished', () => {
                resolve();
            });
        });
    }
    saveState() {
        const state = {
            elements: this.elements,
            history: this.history,
            cy: this.cy.json()
        };
        return JSON.stringify(state);
    }
    /**
     * The addNode method queues an animation to add a node to the graph
     * and returns the id of the node. If the id parameter is null,
     * a unique id will be generated.
     *
     * @param id the node id
     * @param label the node label
     * @param x the x position of the node
     * @param y the y position of the node
     */
    addNode(label, x, y, nodeData = null) {
        // Create a new node and add it to the elements array.
        const node = new AnimatedNode(this, label, x, y);
        const cyNode = {
            group: 'nodes',
            data: { id: node.id, label, node: nodeData },
            classes: node.getClassString(),
            position: { x, y }
        };
        cyNode.grabbable = false;
        this.elements.push(node);
        // Animate the addition of the node.
        const nodeAdd = () => {
            var _a;
            node.setCy(this.cy.add(cyNode));
            console.log((_a = node.cy) === null || _a === void 0 ? void 0 : _a.width());
            this.highlightCyElements(node.id);
            setTimeout(() => {
                this.unhighlightCyElements(node.id);
                this.emit(new CustomEvent('animationFinished'));
            }, this.animationDuration);
        };
        this.queueAnimation(new Animation(nodeAdd));
        return node;
    }
    removeNode(id) {
        // If the element is displayed, remove it from the graph.
        const node = this.getNode(id);
        const nodeRemove = () => {
            if (this.cy.getElementById(`annotation-${id}`).length > 0) {
                this.cy.remove(this.cy.getElementById(`annotation-${id}`));
            }
            // remove the node from the list of elements
            this.elements = this.elements.filter((e) => e.id !== node.id);
            this.cy.remove(node.cy);
            node.cy = null;
            this.emit(new CustomEvent('animationFinished'));
        };
        this.queueAnimation(new Animation(nodeRemove));
    }
    updateNodeLabel(id, label) {
        // Check if the node exists. If it doesn't, throw an error.
        if (!this.hasElement(id)) {
            throw new Error(`Element with id ${id} does not exist`);
        }
        const nodeUpdate = () => {
            const node = this.getNode(id);
            if (!node) {
                this.emit(new CustomEvent('animationFinished'));
                return;
            }
            node.label = label;
            if (node.cy) {
                this.highlightCyElements(node.id);
                node.cy.data('label', label);
                setTimeout(() => {
                    this.unhighlightCyElements(node.id);
                    this.emit(new CustomEvent('animationFinished'));
                }, this.animationDuration);
            }
        };
        this.queueAnimation(new Animation(nodeUpdate));
    }
    updateNodeData(id, data) {
        // Check if the node exists. If it doesn't, throw an error.
        if (!this.hasElement(id)) {
            throw new Error(`Element with id ${id} does not exist`);
        }
        const nodeUpdate = () => {
            const node = this.getNode(id);
            if (!node) {
                this.emit(new CustomEvent('animationFinished'));
                return;
            }
            node.cy.data('node', Object.assign({}, node.cy.data('node'), data));
            this.emit(new CustomEvent('animationFinished'));
        };
        this.queueAnimation(new Animation(nodeUpdate));
    }
    changeNodeColor(id, color) {
        // Check if the node exists. If it doesn't, throw an error.
        if (!this.hasElement(id)) {
            throw new Error(`Element with id ${id} does not exist`);
        }
        const nodeUpdate = () => {
            const node = this.getNode(id);
            if (node.cy) {
                node.cy.style('background-color', color);
                setTimeout(() => {
                    this.emit(new CustomEvent('animationFinished'));
                }, this.animationDuration);
            }
        };
        const oldColor = this.cy.getElementById(id).style('background-color');
        this.queueAnimation(new Animation(nodeUpdate));
        return oldColor;
    }
    changeEdgeColor(id, color) {
        // Check if the edge exists. If it doesn't, throw an error.
        if (!this.hasElement(id)) {
            throw new Error(`Element with id ${id} does not exist`);
        }
        const edgeUpdate = () => {
            const edge = this.getEdge(id);
            if (edge.cy) {
                edge.cy.style('line-color', color);
                setTimeout(() => {
                    this.emit(new CustomEvent('animationFinished'));
                }, this.animationDuration);
            }
        };
        const oldColor = this.cy.getElementById(id).style('line-color');
        this.queueAnimation(new Animation(edgeUpdate));
        return oldColor;
    }
    addEdge(source, target, id = null) {
        // If id is null, generate a unique id. Otherwise, check if the id
        // already exists. If it already exists, throw an error.
        if (id && this.hasElement(id)) {
            throw new Error(`Element with id ${id} already exists`);
        }
        else {
            id = this.generateUniqueId();
        }
        // Create a new edge and add it to the elements array.
        const edge = new AnimatedEdge(this, id, source, target);
        const cyEdge = {
            group: 'edges',
            data: { id, source, target },
            classes: edge.getClassString()
        };
        this.elements.push(edge);
        // Animate the addition of the edge.
        const edgeAdd = () => {
            edge.cy = this.cy.add(cyEdge);
            this.highlightCyElements(edge.id);
            setTimeout(() => {
                this.unhighlightCyElements(edge.id);
                this.emit(new CustomEvent('animationFinished'));
            }, this.animationDuration);
        };
        this.queueAnimation(new Animation(edgeAdd));
        return edge;
    }
    addEdges(...edges) {
        const addedEdges = [];
        edges.forEach((edge) => {
            // If id is null, generate a unique id. Otherwise, check if the id
            // already exists. If it already exists, throw an error.
            if (edge.id && this.hasElement(edge.id)) {
                throw new Error(`Element with id ${edge.id} already exists`);
            }
            else {
                edge.id = this.generateUniqueId();
            }
        });
        edges.forEach((edge) => {
            // Create a new edge and add it to the elements array.
            const addedEdge = new AnimatedEdge(this, edge.id, edge.source, edge.target);
            this.elements.push(addedEdge);
            addedEdges.push(addedEdge);
        });
        // Animate the addition of the edges.
        const edgeAdd = () => {
            addedEdges.forEach((edge) => {
                const cyEdge = {
                    group: 'edges',
                    data: { id: edge.id, source: edge.source, target: edge.target },
                    classes: edge.getClassString()
                };
                edge.cy = this.cy.add(cyEdge);
                this.highlightCyElements(edge.id);
            });
            setTimeout(() => {
                addedEdges.forEach((edge) => {
                    this.unhighlightCyElements(edge.id);
                }, this.animationDuration);
                this.emit(new CustomEvent('animationFinished'));
            });
        };
        this.queueAnimation(new Animation(edgeAdd));
        return addedEdges;
    }
    removeEdge(id) {
        // If the element is displayed, remove it from the graph.
        const edge = this.getEdge(id);
        const edgeRemove = () => {
            // remove the edge from the list of elements
            this.elements = this.elements.filter((e) => e.id !== edge.id);
            this.cy.remove(edge.cy);
            edge.cy = null;
            this.emit(new CustomEvent('animationFinished'));
        };
        this.queueAnimation(new Animation(edgeRemove));
    }
    moveEdge(id, source, target) {
        // Get the edge and check that it exists and is actually an edge.
        const edge = this.getEdge(id);
        if (!edge) {
            throw new Error(`Edge with id ${id} does not exist`);
        }
        const edgeMove = () => {
            edge.source = source;
            edge.target = target;
            if (edge.cy) {
                edge.cy.move({ source, target });
                this.emit(new CustomEvent('animationFinished'));
            }
        };
        this.queueAnimation(new Animation(edgeMove));
    }
    hasElement(id) {
        return this.elements.map((e) => e.id).includes(id);
    }
    elementIsDisplayed(id) {
        return this.cy.getElementById(id).length > 0;
    }
    getElement(id) {
        return this.elements.find((e) => e.id === id) || null;
    }
    getNode(id) {
        const node = this.getElement(id);
        return node instanceof AnimatedNode ? node : null;
    }
    getEdge(id) {
        const edge = this.getElement(id);
        return edge instanceof AnimatedEdge ? edge : null;
    }
    getEdgeBySource(source) {
        const edge = this.elements.find((e) => e instanceof AnimatedEdge && e.source === source);
        return edge instanceof AnimatedEdge ? edge : null;
    }
    generateId(size = 5) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let id = '';
        for (let i = 0; i < size; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
    }
    generateUniqueId() {
        let id = this.generateId();
        while (this.elements.find((e) => e.id === id)) {
            id = this.generateId();
        }
        return id;
    }
    highlightCyElements(id) {
        this.addClassToElement(id, 'highlighted');
    }
    unhighlightCyElements(id) {
        this.removeClassFromElement(id, 'highlighted');
    }
    nop() {
        const nop = () => {
            setTimeout(() => {
                this.emit(new CustomEvent('animationFinished'));
            }, this.animationDuration);
        };
        this.queueAnimation(new Animation(nop));
    }
    highlightDOMElements(...ids) {
        const highlight = () => {
            var _a, _b;
            (_b = (_a = document.getElementById(ids[0])) === null || _a === void 0 ? void 0 : _a.parentElement) === null || _b === void 0 ? void 0 : _b.scrollIntoView();
            ids.forEach((id) => {
                var _a;
                (_a = document.getElementById(id)) === null || _a === void 0 ? void 0 : _a.classList.add('highlighted');
            });
            this.emit(new CustomEvent('animationFinished', { detail: { type: 'dom-highlight' } }));
        };
        this.queueAnimation(new Animation(highlight));
    }
    unhighlightDOMElements(...ids) {
        const unhighlight = () => {
            ids.forEach((id) => {
                var _a;
                (_a = document.getElementById(id)) === null || _a === void 0 ? void 0 : _a.classList.remove('highlighted');
            });
            this.emit(new CustomEvent('animationFinished'));
        };
        this.queueAnimation(new Animation(unhighlight));
    }
    moveNodeRelativeTo(id1, id2, x, y) {
        // Get the node and check that it exists and is actually a node.
        const node1 = this.getNode(id1);
        if (!node1) {
            throw new Error(`Node with id ${id1} does not exist`);
        }
        const node2 = this.getNode(id2);
        if (!node2) {
            throw new Error(`Node with id ${id2} does not exist`);
        }
        // Update the node's position.
        node1.position = { x: node2.position.x + x, y: node2.position.y + y };
        // Animate the movement of the node.
        const nodeMove = () => {
            node1.cy.animate({
                position: { x: node2.position.x + x, y: node2.position.y + y }
            }, {
                duration: this.animationDuration,
                complete: () => {
                    this.emit(new CustomEvent('animationFinished'));
                }
            });
        };
        this.queueAnimation(new Animation(nodeMove));
        return { x: node1.position.x, y: node1.position.y };
    }
    moveNode(id, x, y) {
        // Get the node and check that it exists and is actually a node.
        const node = this.getNode(id);
        if (!node) {
            throw new Error(`Node with id ${id} does not exist`);
        }
        // Update the node's position.
        node.position = { x, y };
        // Animate the movement of the node.
        const nodeMove = () => {
            node.cy.animate({
                position: { x, y }
            }, {
                duration: this.animationDuration,
                complete: () => {
                    this.emit(new CustomEvent('animationFinished'));
                }
            });
        };
        this.queueAnimation(new Animation(nodeMove));
        return { x, y };
    }
    moveNodes(...nodesToMove) {
        const moves = [];
        nodesToMove.forEach((move) => {
            // Get the node and check that it exists and is actually a node.
            const element = this.getNode(move.id);
            if (element) {
                // Update the node's position.
                moves.push(move);
                element.position = { x: move.x, y: move.y };
            }
        });
        if (moves.length === 0) {
            console.log('no moves');
            return;
        }
        // Animate the movement of the node.
        const nodeMove = () => {
            let remainingMoves = moves.length;
            if (remainingMoves === 0) {
                this.emit(new CustomEvent('animationFinished'));
                return;
            }
            moves.forEach((node) => {
                const cyNode = this.cy.getElementById(node.id);
                if (cyNode.length === 0) {
                    remainingMoves--;
                    return;
                }
                cyNode.animate({
                    position: { x: node.x, y: node.y }
                }, {
                    duration: this.animationDuration,
                    complete: () => {
                        remainingMoves--;
                        if (remainingMoves === 0) {
                            this.emit(new CustomEvent('animationFinished'));
                        }
                    }
                });
            });
        };
        this.queueAnimation(new Animation(nodeMove));
    }
    moveNodeBy(id, dx, dy) {
        // Get the node and check that it exists and is actually a node.
        const node = this.getNode(id);
        if (!node) {
            throw new Error(`Node with id ${id} does not exist`);
        }
        // Update the node's position.
        node.position = { x: node.position.x + dx, y: node.position.y + dy };
        // Animate the movement of the node.
        const nodeMove = () => {
            const cyNode = this.cy.getElementById(id);
            cyNode.animate({
                position: { x: cyNode.position('x') + dx, y: cyNode.position('y') + dy }
            }, {
                duration: this.animationDuration,
                complete: () => {
                    this.emit(new CustomEvent('animationFinished'));
                }
            });
        };
        this.queueAnimation(new Animation(nodeMove));
        return { x: node.position.x, y: node.position.y };
    }
    moveNodesBy(ids, dx, dy) {
        // Update the position of all nodes.
        const nodes = [];
        ids.forEach((id) => {
            const element = this.getNode(id);
            if (element) {
                element.position = { x: element.position.x + dx, y: element.position.y + dy };
                nodes.push(element);
            }
        });
        if (nodes.length === 0)
            return;
        // Animate the movement of all nodes.
        const nodeMoves = () => {
            let remainingMoves = nodes.length;
            if (remainingMoves === 0) {
                this.emit(new CustomEvent('animationFinished'));
                return;
            }
            nodes.forEach((node) => {
                const cyNode = node.cy;
                if (!cyNode) {
                    remainingMoves--;
                    return;
                }
                cyNode.animate({
                    position: { x: cyNode.position('x') + dx, y: cyNode.position('y') + dy }
                }, {
                    duration: this.animationDuration,
                    complete: () => {
                        remainingMoves--;
                        if (remainingMoves === 0) {
                            this.emit(new CustomEvent('animationFinished'));
                        }
                    }
                });
            });
        };
        this.queueAnimation(new Animation(nodeMoves));
    }
    moveAllNodesBy(dx, dy) {
        this.moveNodesBy(this.elements.map((e) => e.id), dx, dy);
    }
    addClassToElement(id, className) {
        const element = this.elements.find((e) => e.id === id);
        if (element) {
            element.classes.push(className);
            if (this.elementIsDisplayed(id)) {
                this.cy.getElementById(id).addClass(className);
            }
        }
    }
    elementHasClass(id, className) {
        const element = this.elements.find((e) => e.id === id);
        return element ? element.classes.includes(className) : false;
    }
    getElementsWithClass(className) {
        return this.elements.filter((e) => e.classes.includes(className));
    }
    removeClassFromElement(id, className) {
        const element = this.elements.find((e) => e.id === id);
        if (element) {
            element.classes = element.classes.filter((c) => c !== className);
            if (this.elementIsDisplayed(id)) {
                this.cy.getElementById(id).removeClass(className);
            }
        }
    }
    swapEdges(edge1, edge2) {
        let e1src = edge1.source;
        let e1tgt = edge1.target;
        let e2src = edge2.source;
        let e2tgt = edge2.target;
        const edgeSwap = () => {
            if (edge1.cy && edge2.cy) {
                edge1.cy.move({ source: e2src, target: e2tgt });
                edge2.cy.move({ source: e1src, target: e1tgt });
            }
            this.emit(new CustomEvent('animationFinished'));
        };
        edge1.source = e2src;
        edge1.target = e2tgt;
        edge2.source = e1src;
        edge2.target = e1tgt;
        this.queueAnimation(new Animation(edgeSwap));
    }
    swapNodes(node1, node2) {
        const node1Elements = this.getElementsWithClass(node1.id);
        const node1Children = [];
        node1Elements.forEach((node) => {
            if (node instanceof AnimatedNode) {
                node1Children.push(node);
            }
        });
        const node2Elements = this.getElementsWithClass(node2.id);
        const node2Children = [];
        node2Elements.forEach((node) => {
            if (node instanceof AnimatedNode) {
                node2Children.push(node);
            }
        });
        const node1x = node1.position.x;
        const node1y = node1.position.y;
        const node2x = node2.position.x;
        const node2y = node2.position.y;
        const dx = node2x - node1x;
        const dy = node2y - node1y;
        node1Elements.forEach((node) => {
            const n = node;
            n.position = { x: n.position.x + dx, y: n.position.y + dy };
        });
        node2Elements.forEach((node) => {
            const n = node;
            n.position = { x: n.position.x - dx, y: n.position.y - dy };
        });
        const nodeSwap = () => {
            // get distance between node1 and node2
            let remainingMoves1 = node1Elements.length;
            let remainingMoves2 = node2Elements.length;
            let done = false;
            if (remainingMoves1 !== 0) {
                node1Children.forEach((node) => {
                    const cyNode = node.cy;
                    if (!cyNode) {
                        remainingMoves1--;
                        return;
                    }
                    cyNode.animate({
                        position: { x: cyNode.position('x') + dx, y: cyNode.position('y') + dy }
                    }, {
                        duration: this.animationDuration,
                        complete: () => {
                            remainingMoves1--;
                            if (remainingMoves2 === 0 && remainingMoves1 === 0 && !done) {
                                done = true;
                                this.emit(new CustomEvent('animationFinished'));
                            }
                        }
                    });
                });
            }
            if (remainingMoves2 !== 0) {
                node2Children.forEach((node) => {
                    const cyNode = node.cy;
                    if (!cyNode) {
                        remainingMoves2--;
                        return;
                    }
                    cyNode.animate({
                        position: { x: cyNode.position('x') - dx, y: cyNode.position('y') - dy }
                    }, {
                        duration: this.animationDuration,
                        complete: () => {
                            remainingMoves2--;
                            if (remainingMoves2 === 0 && remainingMoves1 === 0 && !done) {
                                done = true;
                                this.emit(new CustomEvent('animationFinished'));
                            }
                        }
                    });
                });
            }
        };
        this.queueAnimation(new Animation(nodeSwap));
    }
    annotateNode(id, text) {
        // create a compound node that contains the node. The annotation
        // is a label for the compound node.
        const node = this.getNode(id);
        if (!node) {
            throw new Error(`Node with id ${id} does not exist`);
        }
        const annotate = () => {
            // check if annotation already exists
            const annotation = this.cy.getElementById(`annotation-${id}`);
            if (annotation.length > 0) {
                // update annotation
                annotation.data('label', text);
            }
            else {
                this.cy.add({
                    group: 'nodes',
                    data: { id: `annotation-${id}`, label: text },
                    position: { x: node.position.x, y: node.position.y },
                    classes: ['annotation']
                });
                // add the node to the new compound node
                node.cy.move({ parent: `annotation-${id}` });
            }
            this.emit(new CustomEvent('animationFinished'));
        };
        this.queueAnimation(new Animation(annotate));
    }
    takeSnapshot(name = null) {
        this.queueAnimation(new Animation(() => {
            const cyCopy = this.cy.json();
            const state = new State([], cyCopy);
            const snapshot = new Snapshot(state, this.history.length, name);
            this.snapshots.push(snapshot);
            this.emit(new CustomEvent('animationFinished', { detail: { type: 'snapshot' } }));
        }));
    }
    getCurrentSnapshot() {
        const cyCopy = this.cy.json();
        const state = new State([], cyCopy);
        const snapshot = new Snapshot(state, this.history.length, null);
        return snapshot;
    }
    restoreSnapshot(snapshot) {
        if (!(snapshot instanceof Snapshot)) {
            snapshot = this.snapshots[snapshot];
        }
        this.historyContainer.json(snapshot.state.cy);
    }
    setSelectedNode(node) {
        this.selectedNode = node;
        document.dispatchEvent(new CustomEvent('selectionChanged'));
    }
}
function copyElement(e) {
    return Object.assign(Object.create(Object.getPrototypeOf(e)), e);
}
class AnimatedTreeNode {
    constructor(node) {
        this.parent = null;
        this.children = [];
        this.height = 0;
        this.node = node;
    }
    addChild(child) {
        child.parent = this;
        this.children.push(child);
    }
    removeChild(child) {
        child.parent = null;
        this.children = this.children.filter((c) => c !== child);
    }
    getRoot() {
        let root = this;
        while (root.parent) {
            root = root.parent;
        }
        return root;
    }
    getHeight() {
        let height = 0;
        let node = this;
        while (node.children.length > 0) {
            height++;
            node = node.children[0];
        }
        return height;
    }
}
class AnimatedTree {
    constructor(animator, root) {
        this.animator = animator;
        this.root = new AnimatedTreeNode(root);
    }
    getBounds() {
        const nodes = this.getNodes();
        const xs = nodes.map((node) => node.node.position.x);
        const ys = nodes.map((node) => node.node.position.y);
        const size = AnimatedNode.size / 2;
        const minX = Math.min(...xs) - size;
        const maxX = Math.max(...xs) + size;
        const minY = Math.min(...ys) - size;
        const maxY = Math.max(...ys) + size;
        return { minX, maxX, minY, maxY };
    }
    getNodes() {
        const queue = [];
        const nodes = [];
        queue.push(this.root);
        while (queue.length > 0) {
            const node = queue.shift();
            nodes.push(node);
            queue.push(...node.children);
        }
        return nodes;
    }
    moveTreeBy(dx, dy) {
        const nodes = this.getNodes();
        this.animator.moveNodesBy(nodes.map((node) => node.node.id), dx, dy);
    }
    layout() {
        const queue = [];
        queue.push(this.root);
        const moves = [];
        while (queue.length > 0) {
            const node = queue.shift();
            // remove children that are no longer in the animator
            for (let i = 0; i < node.children.length; i++) {
                const child = node.children[i];
                if (!this.animator.hasElement(child.node.id)) {
                    node.removeChild(child);
                }
            }
            node.children = node.children.sort((a, b) => a.node.position.x - b.node.position.x);
            const children = node.children;
            const x = node.node.position.x;
            const y = node.node.position.y;
            const height = node.getHeight();
            const width = Math.pow(2, height) * 50;
            const childWidth = width / children.length;
            let childX = x - width / 2 + childWidth / 2;
            let childY = y + 50;
            children.forEach((child) => {
                child.node.position = { x: childX, y: childY };
                childX += childWidth;
                moves.push({ id: child.node.id, x: child.node.position.x, y: child.node.position.y });
                queue.push(child);
            });
        }
        this.animator.moveNodes(...moves);
    }
}
export { Animator, AnimatedElement, AnimatedNode, AnimatedEdge, AnimatedTree };
