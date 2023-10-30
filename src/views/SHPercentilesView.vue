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
        <button id="deleteMax" :disabled="animationsQueued > 0">delete-max</button>
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
        <!-- <div id="nodeview">
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
        </div> -->
      </div>
      <div id="sidebar">
        <div id="sidebar-display">
          <h3>Dynamic Percentile Maintenance</h3>
          <p>We use a max soft heap to select a single item in the 90th percentile. 
             Error rate &epsi; is set to <sup>1</sup>/<sub>10</sub>, meaning no more 
             than 10% of the items will be corrupted. By inserting 100 random numbers 
             (between 1 and 100), then performing a single delete-max operation, we 
             know the item must be in the 90th percentile, as it is no more than 10
             items away from its true position.
          </p>
          <p>
            Once items are inserted, a list of the items in sorted order will appear below.
            The 90th percentile item is colored black. When delete-max is performed, the
            item returned is highlighted in red. This item will always be within the top 90%.
          </p>
          <span id="numbers">
            <span v-for="(n, idx) in numbers"><span :id="`perc-${idx + 1}`" class="number">{{ n }}</span></span>
          </span>
        </div>
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
const numbers = ref([]);
const removedItem = ref('');


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
  shAnimator.value.setAnimationDuration(62);
  shAnimator.value.setAnimationDelay(25);
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
  // Create a list of random numbers between 1 and 100
  const keys = [];
  for (let i = 1; i <= 100; i++) {
    keys.push(Math.floor(Math.random() * 100) + 1);
  }

  numbers.value = [].concat(keys).sort((a, b) => a - b);

  // Adding DOM elements for each key
  const status = document.getElementById('status');
  status.innerHTML = '';
  status.appendChild(document.createElement('span')).innerHTML = 'inserting&nbsp;';
  keys.forEach((key, i) => {
    const child = status.appendChild(document.createElement('span'));
    child.id = `status-${i}`;
    child.innerHTML = key;
    status.innerHTML += '&nbsp;';
  });

  // Inserting keys
  keys.forEach((key, i) => {
    shAnimator.value.highlightDOMElements(`status-${i}`);
    heap.value = MaxSoftHeap.insert(heap.value, new Item(key));
    shAnimator.value.unhighlightDOMElements(`status-${i}`);
  });
}

function highlightNintieth() {
  let ele = document.getElementById(`perc-90`);
  let interval = setInterval(() =>
    {
      if (!ele)
      {
        ele = document.getElementById('perc-90');
      }
      else
      {
        ele.classList.add('nintieth');
        clearInterval(interval);
      }
    }, 100);
}

function deleteMax() {
  const max = MaxSoftHeap.findMax(heap.value);
  removedItem.value = max.item.key;
  heap.value = MaxSoftHeap.deleteMax(heap.value);
  document.getElementById('status').innerHTML = `delete max returns ${removedItem.value}`;
  const idx = numbers.value.lastIndexOf(removedItem.value);
  document.getElementById(`perc-${idx + 1}`).classList.add('highlighted');
}

function registerListeners() {
  // register the insert function with the insert button
  document.getElementById('buttonInsert').addEventListener('click', () => {
    insert();
    highlightNintieth();
  });

  // register the deleteMax function with the delete-min button
  document.getElementById('deleteMax').addEventListener('click', deleteMax);
}
</script>

<style>
#sidebar h3 {
  margin-top: 0;
  padding-bottom: 0.5rem;
  border-bottom: black 2px solid;
}

main {
  display: flex;
  flex-direction: column;
  align-items: center;
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

#status span.highlighted, .number.highlighted {
  background-color: palevioletred;
  color: white;
  border-radius: 2px;
  padding: 2px;
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

#numbers {
  overflow-wrap: break-word;
}

.number {
  margin-right: 0.5em;
}

.nintieth {
  background-color: black;
  color: white;
  border-radius: 2px;
  padding: 2px;
}

#status {
  margin: 5px;
  overflow: scroll;
  width: 99%;
  position: absolute;
  top: 0;
  z-index: 1;
}
</style>
