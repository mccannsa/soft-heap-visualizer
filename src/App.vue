<script setup>
import { RouterLink, RouterView } from 'vue-router';
</script>

<template>
  <nav>
    <div>
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="/visualizations">Visualizations</RouterLink>
    </div>
    <div>
      <RouterLink to="/">Documentation</RouterLink>
    </div>
  </nav>
  <RouterView />
</template>
<style>
body {
  margin: 0;
  padding: 0;
  font-family: sans-serif;
}

nav {
  display: flex;
  justify-content: space-between;
  background-color: black;
  color: white;
}

nav div {
  padding: 0.75rem;
}

nav div a {
  color: white;
  text-decoration: none;
  padding: 0.5rem;
}

nav a:hover {
  background-color: gray;
}
</style>
