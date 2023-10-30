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
          <button id="deleteMin" :disabled="animationsQueued > 0">delete</button>
        </div>
        <div id="playback">
          <button id="play" :disabled="!paused">Play</button>
          <button id="pause" :disabled="paused">Pause</button>
          <button id="step" :disabled="!paused">Step</button>
          <button id="halve">0.5x</button>
          <button id="double">2x</button>
        </div>
        <div id="removedItems">
            <span v-for="(n, idx) in removedItems"><span :id="`removed-${n}`" class="number">{{ n }}</span></span>
        </div>
      </div>
      <div id="visualization">
        <div id="cy" class="viz">
          <div id="status"></div>
        </div>
        <div id="sidebar">
          <div id="sidebar-display">
            <h3>Approximate Sorting</h3>
            <p>We use a soft heap to find the median item of a list. 
               Error rate &epsi; is set to <sup>1</sup>/<sub>2</sub>, meaning no more 
               than 50% of the items will be corrupted. By inserting 50 numbers, then deleting
               each of them, there will be at most &epsi;m = 25 corrupted items.
            </p>
            <p>
              Take some number <em>x</em>, and let <em>k</em> its rank in the list of items
              removed from the soft heap. Take the number <em>I<sub>k</sub></em>,
              which is the number of items with true keys larger than that of <em>x</em>.
              This is the number of inversions required to sort <em>x</em> into its correct place.
              The number of corrupted keys is at most &epsi;m = 25, so the number of inversions
              is at most &epsi;m<sup>2</sup> = 625.
            </p>
            <span id="numbers">
              <span v-for="(n, idx) in numbers"><span :id="`num-${idx + 1}`" class="number">{{ n }}</span></span>
            </span>
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
  const maxHeap = ref(null);
  const heap = ref(null);
  const paused = ref(false);
  const selectedNode = ref(null);
  const animationsQueued = ref(0);
  const numbers = ref([]);
  const removedItems = ref([]);
  
  
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
    maxHeap.value = new SoftHeap(errorRate.value, shAnimator.value);
    heap.value = SoftHeap.makeHeap();
  
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
    const shuffle = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Create an array from 1 to 50
    const keys = Array.from({ length: 50 }, (_, index) => index + 1);

    // Randomize the array
    shuffle(keys);
    
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
      heap.value = SoftHeap.insert(heap.value, new Item(key));
      shAnimator.value.unhighlightDOMElements(`status-${i}`);
    });
  }
  
  function deleteMin() {
    document.getElementById('status').innerHTML = `deleting all items`;
    for (let i = 0; i < 50; i++)
    {
        const min = SoftHeap.findMin(heap.value);
        removedItems.value.push(min.item.key);
        if (min.item.key !== min.key) {
            shAnimator.value.highlightDOMElements(`removed-${min.item.key}`);
        }
        heap.value = SoftHeap.deleteMin(heap.value);
    }
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

  .corrupted {
    background-color: palevioletred;
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
  