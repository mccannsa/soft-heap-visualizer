<template>
  <main>
    <div id="controls">
      <div id="error">
        <label for="errorRate">Error rate: </label>
        <input id="inputErrorRate" name="errorRate" type="text" size="5" v-model="errorRate" />
        <button id="buttonErrorRate">Set</button>
        <span id="epsilon"
          >&epsi; = {{ errorRate }} &rarr; T = {{ Math.ceil(Math.log2(3 / errorRate)) }}</span
        >
      </div>
      <div id="operations" class="hide">
        <button id="makeHeap">make-heap</button>
        <input id="inputInsert" type="text" size="10" :disabled="heaps.length <= 0" />
        <button
          id="buttonInsert"
          :disabled="heaps.length <= 0 || animationsQueued > 0 || viewingSnapshot"
        >
          insert
        </button>
        <button
          id="findMin"
          :disabled="heaps.length <= 0 || animationsQueued > 0 || viewingSnapshot"
        >
          find-min
        </button>
        <button
          id="deleteMin"
          :disabled="heaps.length <= 0 || animationsQueued > 0 || viewingSnapshot"
        >
          delete-min
        </button>
        <button id="meld" disabled>meld</button>
      </div>
      <div id="playback">
        <button id="play" :disabled="!paused || viewingSnapshot">Play</button>
        <button id="pause" :disabled="paused || viewingSnapshot">Pause</button>
        <button id="step" :disabled="!paused || viewingSnapshot">Step</button>
        <button id="halve">0.5x</button>
        <button id="double">2x</button>
        <button id="current" :disabled="!viewingSnapshot">Reset to Current State</button>
      </div>
    </div>
    <div id="visualization">
      <div id="cy" class="viz" :hidden="viewingSnapshot">
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
      <div id="snapshot" class="viz" :hidden="!viewingSnapshot"></div>
      <div id="sidebar">
        <div id="sidebar-nav">
          <span class="sidebar-nav-item selected" id="sidebar-nav-pseudocode">Pseudocode</span>
          <span class="sidebar-nav-item" id="sidebar-nav-history">History</span>
        </div>
        <div id="sidebar-display">
          <div class="sidebar-item" id="history">
            <div
              v-for="item in history"
              :key="item.index"
              class="history-item"
              :id="`snapshot-${item.index}`"
              v-on:dblclick="
                () => {
                  pause();
                  viewingSnapshot = true;
                  shAnimator.restoreSnapshot(item.index);
                }
              "
            >
              {{ item.name }}
            </div>
          </div>
          <div class="sidebar-item selected" id="pseudocode">
            <div id="info">
              <h2>Soft Heaps</h2>
              <p>
                The <em>soft heap</em> is a priority queue data structure that supports the
                operations <code>insert</code>, <code>find-min</code>, <code>delete-min</code>, and
                <code>meld</code> in constant amortized time per operation.
              </p>
            </div>
            <div class="function" id="defill">
              <span class="function-header">defill(x)</span>
              <br />&nbsp;<span id="defill-fill">fill(x)</span> <br />&nbsp;<span id="defill-if"
                >if x.rank &gt; T<br />&nbsp;&nbsp;and x.rank mod 2 = 0<br />&nbsp;&nbsp;and x.left
                &ne; null<br />&nbsp;then</span
              >
              <br />&nbsp;&nbsp;<span id="defill-if-fill">fill(x)</span>
            </div>
            <div class="function" id="fill">
              <span class="function-header">fill(x)</span>
              <br />&nbsp;<span id="fill-ifswap">if x.left.key &gt; x.right.key then</span>
              <br />&nbsp;&nbsp;<span id="fill-ifswap-swap">x.left &harr; x.right</span>
              <br />&nbsp;<span id="fill-xkey">x.key &harr; x.left.key</span> <br />&nbsp;<span
                id="fill-ifset"
                >if x.set = null then</span
              >
              <br />&nbsp;&nbsp;<span id="fill-ifset-xset">x.set &larr; x.left.set</span>
              <br />&nbsp;<span id="fill-elseset">else</span> <br />&nbsp;&nbsp;<span
                id="fill-elseset-xset"
                >x.set.next &larr; x.left.set.next</span
              >
              <br />&nbsp;<span id="fill-set">x.left.set &larr; null</span> <br />&nbsp;<span
                id="fill-ifnull"
                >if x.left.left = null then</span
              >
              <br />&nbsp;&nbsp;<span id="fill-ifnull-xleft">x.left &larr; x.right</span>
              <br />&nbsp;&nbsp;<span id="fill-ifnull-xright">x.right &larr; null</span>
              <br />&nbsp;<span id="fill-elsenull">else</span> <br />&nbsp;&nbsp;<span
                id="fill-elsenull-defill"
                >defill(x.left)</span
              >
            </div>
            <div class="function" id="make-heap">
              <span class="function-header">make-heap()</span>
              <br />&nbsp;<span id="make-heap-return">return null</span>
            </div>
            <div class="function" id="find-min">
              <span class="function-header">find-min(H)</span>
              <br />&nbsp;<span id="find-min-return">return (x.set.next, H.key)</span>
            </div>
            <div class="function" id="rank-swap">
              <span class="function-header">rank-swap(H)</span>
              <br />&nbsp;<span id="rank-swap-x-hnext">x &larr; H.next</span> <br />&nbsp;<span
                id="rank-swap-if"
                >if H.rank &leq; x.rank then</span
              >
              <br />&nbsp;&nbsp;<span id="rank-swap-if-return">return H</span> <br />&nbsp;<span
                id="rank-swap-else"
                >else</span
              >
              <br />&nbsp;&nbsp;<span id="rank-swap-else-hnext">H.next &larr; x.next</span>
              <br />&nbsp;&nbsp;<span id="rank-swap-else-xnext">x.next &larr; H</span>
              <br />&nbsp;&nbsp;<span id="rank-swap-else-return">return x</span>
            </div>
            <div class="function" id="key-swap">
              <span class="function-header">key-swap(H)</span>
              <br />&nbsp;<span id="key-swap-x-hnext">x &larr; H.next</span> <br />&nbsp;<span
                id="key-swap-if"
                >if H.key &leq; x.key then</span
              >
              <br />&nbsp;&nbsp;<span id="key-swap-if-return">return H</span> <br />&nbsp;<span
                id="key-swap-else"
                >else</span
              >
              <br />&nbsp;&nbsp;<span id="key-swap-else-hnext">H.next &larr; x.next</span>
              <br />&nbsp;&nbsp;<span id="key-swap-else-xnext">x.next &larr; H</span>
              <br />&nbsp;&nbsp;<span id="key-swap-else-return">return x</span>
            </div>
            <div class="function" id="delete-min">
              <span class="function-header">delete-min(H)</span>
              <br />&nbsp;<span id="delete-min-e-hset">e &larr; H.set.next</span> <br />&nbsp;<span
                id="delete-min-if"
                >if e.next &ne; e then</span
              >
              <br />&nbsp;&nbsp;<span id="delete-min-if-delete">H.set.next &larr; e.next</span>
              <br />&nbsp;&nbsp;<span id="delete-min-if-return">return H</span> <br />&nbsp;<span
                id="delete-min-else"
                >else</span
              >
              <br />&nbsp;&nbsp;<span id="delete-min-else-hset">H.set &larr; null</span>
              <br />&nbsp;&nbsp;<span id="delete-min-else-k">k &larr; H.rank</span>
              <br />&nbsp;&nbsp;&nbsp;<span id="delete-min-else-if">H.left = null then</span>
              <br />&nbsp;&nbsp;&nbsp;<span id="delete-min-else-if-h">H &larr; H.next</span>
              <br />&nbsp;&nbsp;&nbsp;<span id="delete-min-else-else">else</span>
              <br />&nbsp;&nbsp;&nbsp;<span id="delete-min-else-else-defill">defill(H)</span>
              <br />&nbsp;&nbsp;<span id="delete-min-else-return">return reorder(H, k)</span>
            </div>
            <div class="function" id="reorder">
              <span class="function-header">reorder(H, k)</span>
              <br />&nbsp;<span id="reorder-if">if H.next.rank &lt; k then</span>
              <br />&nbsp;&nbsp;<span id="reorder-if-H">H &larr; rank-swap(H)</span>
              <br />&nbsp;&nbsp;<span id="reorder-if-Hnext">H.next &larr; reorder(H.next, k)</span>
              <br />&nbsp;<span id="reorder-return">return key-swap(H)</span>
            </div>
            <div class="function" id="insert">
              <span class="function-header">insert(e, H)</span>
              <br />&nbsp;<span id="insert-makeroot">root &larr; make-root(e)</span>
              <br />&nbsp;<span id="insert-rankswap">swap &larr; rank-swap(H)</span>
              <br />&nbsp;<span id="insert-meldable">meld &larr; meldable-insert(root, swap)</span>
              <br />&nbsp;<span id="insert-return">return key-swap(meld)</span>
            </div>
            <div class="function" i0d="meldable-insert">
              <span class="function-header">meldable-insert(e, H)</span>
              <br />&nbsp;<span id="meldable-insert-if">if x.rank &lt; H.rank then</span>
              <br />&nbsp;&nbsp;<span id="meldable-insert-if-xnext"
                >x.next &larr; keyswap-swap(H)</span
              >
              <br />&nbsp;&nbsp;<span id="meldable-insert-if-return">return x</span>
              <br />&nbsp;<span id="meldable-insert-else">else</span> <br />&nbsp;&nbsp;<span
                id="meldable-insert-else-link"
                >link &larr; link(x, H)</span
              >
              <br />&nbsp;&nbsp;<span id="meldable-insert-else-swap"
                >swap &larr; rank-swap(H.next)</span
              >
              <br />&nbsp;&nbsp;<span id="meldable-insert-else-meldable"
                >meld &larr; meldable-insert(link, swap)</span
              >
              <br />&nbsp;&nbsp;<span id="meldable-insert-else-return">return meld</span>
            </div>
            <div class="function" id="make-root">
              <span class="function-header">make-root(e)</span>
              <br />&nbsp;<span id="make-root-xnew">x &larr; new-node()</span> <br />&nbsp;<span
                id="make-root-enext"
                >e.next &larr; e</span
              >
              <br />&nbsp;<span id="make-root-xset">x.set &larr; e</span> <br />&nbsp;<span
                id="make-root-xkey"
                >x.key &larr; e.key</span
              >
              <br />&nbsp;<span id="make-root-xrank">x.rank &larr; 0</span> <br />&nbsp;<span
                id="make-root-xleft"
                >x.left &larr; null</span
              >
              <br />&nbsp;<span id="make-root-xright">x.right &larr; null</span> <br />&nbsp;<span
                id="make-root-xnext"
                >x.next &larr; null</span
              >
              <br />&nbsp;<span id="make-root-return">return x</span>
            </div>
            <div class="function" id="link">
              <span class="function-header">link(x, y)</span>
              <br />&nbsp;<span id="link-znew">z &larr; new-node()</span> <br />&nbsp;<span
                id="link-zset"
                >z.set &larr; null</span
              >
              <br />&nbsp;<span id="link-zrank">z.rank &larr; x.rank + 1</span> <br />&nbsp;<span
                id="link-zleft"
                >z.left &larr; x</span
              >
              <br />&nbsp;<span id="link-zright">z.right &larr; y</span> <br />&nbsp;<span
                id="link-defill"
                >defill(z)</span
              >
              <br />&nbsp;<span id="link-return">return z</span>
            </div>
            <div class="function" id="meld">
              <span class="function-header">meld(H1, H2)</span>
              <br />&nbsp;<span id="meld-swapH1">H1 &larr; rank-swap(H1)</span> <br />&nbsp;<span
                id="meld-swapH2"
                >H2 &larr; rank-swap(H2)</span
              >
              <br />&nbsp;<span id="meld-meldable">meld &larr; meldable-insert(H1, H2)</span>
              <br />&nbsp;<span id="meld-return">return key-swap(meld)</span>
            </div>
            <div class="function" id="meldable-meld">
              <span class="function-header">meldable-meld(H1, H2)</span>
              <br />&nbsp;<span id="meldable-meld-ifrank">H1.rank &gt; H2.rank</span>
              <br />&nbsp;&nbsp;<span id="meldable-meld-ifrank-swap">H1 &harr; H2</span>
              <br />&nbsp;<span id="meldable-meld-ifnull">if H2 = null</span>
              <br />&nbsp;&nbsp;<span id="meldable-meld-ifnull-return">return H1</span>
              <br />&nbsp;<span id="meldable-meld-else">else</span> <br />&nbsp;&nbsp;<span
                id="meldable-meld-else-swap"
                >swap &larr; rank-swap(H1.next)</span
              >
              <br />&nbsp;&nbsp;<span id="meldable-meld-else-meld"
                >meld &larr; meldable-meld(swap, H2)</span
              >
              <br />&nbsp;&nbsp;<span id="meldable-meld-else-return"
                >return meldable-insert(H1, meld)</span
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Item as Item, SoftHeap as SoftHeap } from '../scripts/animatedsoftheap';
import { Animator } from '../scripts/animator';

const errorRate = ref(0.5);
const shAnimator = ref(null);
const softHeap = ref(null);
const heaps = ref([]);
const selected = ref(null);
const history = ref([]);
const paused = ref(false);
const viewingSnapshot = ref(false);
const selectedNode = ref(null);
const animationsQueued = ref(0);

// the function setErrorRate updates the error rate and disables the Set button and input field
const setErrorRate = () => {
  // if the error rate is not a number, alert the user and return
  if (isNaN(errorRate.value)) {
    alert('Error rate must be a number between 0 and 1.');
    return;
  }
  // if the error rate is not between 0 and 1, alert the user and return
  if (errorRate.value < 0 || errorRate.value > 1) {
    alert('Error rate must be a number between 0 and 1.');
    return;
  }
  const newErrorRate = document.getElementById('inputErrorRate').value;
  errorRate.value = newErrorRate;
  document.getElementById('inputErrorRate').disabled = true;
  document.getElementById('buttonErrorRate').disabled = true;
  // unhide the operations div
  document.getElementById('operations').classList.remove('hide');
  registerListeners();
  softHeap.value = new SoftHeap(errorRate.value, shAnimator.value);
  // give focus to the make-heap button
  document.getElementById('makeHeap').focus();
};

const draw = () => {
  shAnimator.value = new Animator('cy', 'snapshot');
  history.value = shAnimator.value.snapshots;
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
  draw();
  // add the setErrorRate function to the Set button
  document.getElementById('buttonErrorRate').addEventListener('click', setErrorRate);
  // register the setErrorRate function with the error rate input field when
  // the enter key is pressed
  document.getElementById('inputErrorRate').addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
      setErrorRate();
    }
  });
  document.getElementById('inputErrorRate').focus();
  // register the history sidebar item with the history sidebar item
  document.getElementById('sidebar-nav-history').addEventListener('click', () => {
    // remove the selected class from the currently selected sidebar item
    document.querySelector('.sidebar-nav-item.selected').classList.remove('selected');
    document.querySelector('.sidebar-item.selected').classList.remove('selected');
    document.querySelector('#history.sidebar-item').classList.add('selected');
    document.querySelector('#sidebar-nav-history').classList.add('selected');
  });

  // register the pseudocode sidebar item with the pseudocode sidebar item
  document.getElementById('sidebar-nav-pseudocode').addEventListener('click', () => {
    // remove the selected class from the currently selected sidebar item
    document.querySelector('.sidebar-nav-item.selected').classList.remove('selected');
    document.querySelector('.sidebar-item.selected').classList.remove('selected');
    document.querySelector('#pseudocode.sidebar-item').classList.add('selected');
    document.querySelector('#sidebar-nav-pseudocode').classList.add('selected');
  });

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

  //register the current button with a function that resets the animation to the current state
  document.getElementById('current').addEventListener('click', () => {
    viewingSnapshot.value = false;
    shAnimator.value.resume();
    paused.value = shAnimator.value.paused;
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
function insert(keys) {
  ///////////////////////////////////////////////////////////////////////////////
  // really good at showing reordering: 14 6 0 19 61 73 77 43 25 3 26 72 68 60 40
  ///////////////////////////////////////////////////////////////////////////////

  // Cleaning keys
  const keysArray = keys.trim().split(' ');
  const keysFiltered = keysArray.filter((key) => !isNaN(key) && key !== '');
  const keysInt = keysFiltered.map((key) => parseInt(key));

  // Adding DOM elements for each key
  const status = document.getElementById('status');
  status.innerHTML = '';
  status.appendChild(document.createElement('span')).innerHTML = 'inserting&nbsp;';
  keysInt.forEach((key, i) => {
    const child = status.appendChild(document.createElement('span'));
    child.id = `status-${i}`;
    child.innerHTML = key;
    status.innerHTML += '&nbsp;';
  });

  // Inserting keys
  keysInt.forEach((key, i) => {
    shAnimator.value.highlightDOMElements(`status-${i}`);
    heaps.value[selected.value] = SoftHeap.insert(heaps.value[selected.value], new Item(key));
    shAnimator.value.unhighlightDOMElements(`status-${i}`);
  });
}

function deleteMin() {
  document.getElementById('status').innerHTML = 'deleting min';
  heaps.value[selected.value] = SoftHeap.deleteMin(heaps.value[selected.value]);
}

function registerListeners() {
  // register the insert function with the insert button
  document.getElementById('buttonInsert').addEventListener('click', () => {
    const keys = document.getElementById('inputInsert').value;
    insert(keys);
    document.getElementById('inputInsert').value = '';
  });

  // register the insert function with the insert input field when
  // the enter key is pressed
  document.getElementById('inputInsert').addEventListener('keyup', (event) => {
    if (event.key === 'Enter' && animationsQueued.value <= 0) {
      const keys = document.getElementById('inputInsert').value;
      insert(keys);
      document.getElementById('inputInsert').value = '';
    }
  });

  // register the deleteMin function with the delete-min button
  document.getElementById('deleteMin').addEventListener('click', deleteMin);

  // register the makeHeap function with the make-heap button
  document.getElementById('makeHeap').addEventListener('click', makeHeap);
}

function makeHeap() {
  heaps.value.push(SoftHeap.makeHeap());
  selected.value = heaps.value.length - 1;
  // give focus to the insert input field
  document.getElementById('inputInsert').focus();
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
  overflow: scroll;
  width: 84%;
  position: absolute;
  top: 0;
  z-index: 1;
}
</style>
