<template>
  <main>
    <div id="controls">
      <div id="error">
        <span id="epsilon"
          >&epsi; = {{ errorRate }} &rarr; T = {{ Math.ceil(Math.log2(3 / errorRate)) }}</span
        >
      </div>
      <div id="operations">
        <button id="buttonInsert" :disabled="animationsQueued > 0">insert</button>
        <button id="findMin" :disabled="animationsQueued > 0">find-min</button>
        <button id="deleteMin" :disabled="animationsQueued > 0">delete-min</button>
      </div>
      <div id="playback">
        <button id="play" :disabled="!paused">Play</button>
        <button id="pause" :disabled="paused">Pause</button>
        <button id="step" :disabled="!paused">Step</button>
        <button id="halve">0.5x</button>
        <button id="double">2x</button>
      </div>
    </div>
    <div id="visualization">
      <div id="cy" class="viz">
        <div id="status"></div>
        <div id="nodeview">
          <div id="node-info" v-if="selectedNode != null && selectedNode.cy != null">
            <div id="node-info-1">
              <div id="node-key" class="node-item">Key: {{ selectedNode.cy.data('node.key') }}</div>
              <div id="node-rank" class="node-item">
                Rank: {{ selectedNode.cy.data('node.rank') }}
              </div>
            </div>
            <div id="node-set" class="node-item">Set: {{ selectedNode.cy.data('node.set') }}</div>
          </div>
          <div v-else><em>Select a node to view its data.</em></div>
        </div>
      </div>
      <div id="sidebar">
        <div id="sidebar-display"></div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Item as Item, MaxSoftHeap as MaxSoftHeap } from '../scripts/animatedsoftheap';
import { Animator } from '../scripts/animator';

const errorRate = ref(0.1);
const shAnimator = ref(null);
const maxHeap = ref(null);
const heap = ref(null);
const paused = ref(false);
const selectedNode = ref(null);
const animationsQueued = ref(0);

const draw = () => {
  registerListeners();
  selectedNode.value = shAnimator.value.selectedNode;
  shAnimator.value.eventBus.on(
    'animationQueueEmpty',
    () => (animationsQueued.value = shAnimator.value.queue.length)
  );
  shAnimator.value.eventBus.on(
    'animationQueued',
    () => (animationsQueued.value = shAnimator.value.queue.length)
  );
  shAnimator.value.eventBus.on(
    'animationStep',
    () => (animationsQueued.value = shAnimator.value.queue.length)
  );
};

onMounted(() => {
  shAnimator.value = new Animator('cy');
  maxHeap.value = new MaxSoftHeap(errorRate.value, shAnimator.value);
  heap.value = MaxSoftHeap.makeHeap();

  draw();

  // register the pseudocode sidebar item with the pseudocode sidebar item
  //   document.getElementById('sidebar-nav-pseudocode').addEventListener('click', () => {
  //     // remove the selected class from the currently selected sidebar item
  //     document.querySelector('.sidebar-nav-item.selected').classList.remove('selected');
  //     document.querySelector('.sidebar-item.selected').classList.remove('selected');
  //     document.querySelector('#pseudocode.sidebar-item').classList.add('selected');
  //     document.querySelector('#sidebar-nav-pseudocode').classList.add('selected');
  //   });

  // register the halfSpeed button with a function that halves the animation speed
  // and halves the animation delay
  document.getElementById('halve').addEventListener('click', () => {
    shAnimator.value.setAnimationDuration(shAnimator.value.animationDuration * 2);
    shAnimator.value.setAnimationDelay(shAnimator.value.animationDelay * 2);
  });

  // register the doubleSpeed button with a function that doubles the animation speed
  // and doubles the animation delay
  document.getElementById('double').addEventListener('click', () => {
    shAnimator.value.setAnimationDuration(shAnimator.value.animationDuration / 2);
    shAnimator.value.setAnimationDelay(shAnimator.value.animationDelay / 2);
  });

  // register the play button with a function that plays the animation
  document.getElementById('play').addEventListener('click', () => {
    shAnimator.value.resume();
    paused.value = shAnimator.value.paused;
  });

  // register the pause button with a function that pauses the animation
  document.getElementById('pause').addEventListener('click', () => {
    pause();
  });

  //register the step button with a function that performs a single step of the animation
  document.getElementById('step').addEventListener('click', () => {
    shAnimator.value.step();
  });

  // register a listener to listen to a selected node change
  document.addEventListener('selectionChanged', () => {
    selectedNode.value = shAnimator.value.selectedNode;
  });
});

function pause() {
  shAnimator.value.pause();
  paused.value = shAnimator.value.paused;
}

/**
 * The insert function adds new items to the soft heap. It takes a string of
 * space-separated keys as input and inserts each key into the soft heap.
 *
 * @param keys the keys of the items to be inserted
 */
function insert() {
  // Generate random keys
  const randomGPA = () => (Math.random() * 4).toFixed(2);
  const keys = [];
  for (let i = 0; i < 100; i++) {
    keys.push(randomGPA());
  }
  console.log(keys);

  // Adding DOM elements for each key
  //   const status = document.getElementById('status');
  //   status.innerHTML = '';
  //   status.appendChild(document.createElement('span')).innerHTML = 'inserting&nbsp;';
  //   keys.forEach((key, i) => {
  //     const child = status.appendChild(document.createElement('span'));
  //     child.id = `status-${i}`;
  //     child.innerHTML = key;
  //     status.innerHTML += '&nbsp;';
  //   });

  // Inserting keys
  keys.forEach((key, i) => {
    // shAnimator.value.highlightDOMElements(`status-${i}`);
    heap.value = MaxSoftHeap.insert(heap.value, new Item(key));
    // shAnimator.value.unhighlightDOMElements(`status-${i}`);
  });
}

function deleteMin() {
  document.getElementById('status').innerHTML = 'deleting min';
  heap.value = MaxSoftHeap.deleteMin(heap.value);
}

function registerListeners() {
  // register the insert function with the insert button
  document.getElementById('buttonInsert').addEventListener('click', () => {
    insert();
  });

  // register the deleteMin function with the delete-min button
  document.getElementById('deleteMin').addEventListener('click', deleteMin);
}
</script>

<style>
main {
  display: flex;
  flex-direction: column;
  align-items: center;
}

#info {
  width: 90vw;
  display: inline;
}

#info p {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

#info code {
  font-family: 'Courier New', Courier, monospace;
  background-color: #eee;
}

#info h2 {
  margin-top: 0;
  margin-bottom: 0;
}

#controls {
  width: 90vw;
  display: inline-flex;
  flex-direction: column;
  justify-content: space-between;
  margin-bottom: 1rem;
  background-color: lightgray;
  border-radius: 5px;
  padding: 0.5rem;
  margin-top: 1rem;
}

.hide {
  opacity: 0;
}

.hide-no-space {
  display: none;
}

#visualization {
  display: flex;
  flex-direction: row;
  width: 90vw;
  padding: 0.25rem;
  position: relative;
}

.viz {
  width: 70%;
  height: 77vh;
  border: 2px solid black;
  border-radius: 5px;
  margin-right: 5px;
  /* padding: 0.5rem; */
}

.function {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  background-color: #eee;
  border-radius: 3px;
  padding: 0.5rem;
}

#pseudocode .highlighted {
  background-color: palevioletred;
}

#status span.highlighted {
  background-color: palevioletred;
  color: white;
  border-radius: 2px;
  padding: 2px;
}

#history.sidebar-item {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.function .function-header {
  font-weight: bold;
}

#pseudocode .function {
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.85rem;
}

#pseudocode .pseudo-info {
  font-style: italic;
  font-family: Arial, Helvetica, sans-serif;
}

#epsilon {
  margin-left: 1rem;
}

#sidebar {
  height: 77vh;
  width: 30%;
  border: 2px solid black;
  border-radius: 5px;
  display: flex;
  flex-direction: column;
}

#sidebar-display {
  overflow: scroll;
  padding: 0.5rem;
}

#sidebar-nav {
  background-color: lightgray;
  color: black;
  display: flex;
  flex-direction: row;
  width: 100%;
}

#sidebar-nav .sidebar-nav-item {
  padding: 0.25rem;
  cursor: pointer;
  background-color: darkgray;
  border-right: black 2px solid;
  border-bottom: black 2px solid;
}

#sidebar .sidebar-item {
  margin-top: 0.5rem;
  border-radius: 3px;
  display: none;
}

#sidebar .sidebar-item.selected {
  display: block;
  height: 100%;
}

#sidebar-nav .sidebar-nav-item:hover {
  background-color: #fff;
}

#sidebar-nav .sidebar-nav-item.selected {
  background-color: #fff;
  border-bottom: none;
}

#history :nth-child(odd) {
  background-color: #ddd;
}

#history * {
  padding: 0.125rem;
}

#nodeview {
  width: 10vw;
  height: 2.5rem;
  padding: 0.25rem;
  border-left: 2px solid black;
  border-bottom: 2px solid black;
  border-bottom-left-radius: 5px;
  position: absolute;
  top: 0;
  right: 0;
  background-color: lightgray;
  overflow: scroll;
}

#node-info-1 {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  height: 100%;
}

#status {
  margin: 5px;
}
</style>
