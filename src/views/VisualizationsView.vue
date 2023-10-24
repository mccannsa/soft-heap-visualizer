<template>
  <main>
    <h2>Visualizations</h2>
    <RouterLink to="/visualizations/softheap">Soft Heap</RouterLink>
    <ul>
      <li>
        <RouterLink to="/visualizations/softheap/percentiles"
          >Dynamic maintenance of percentiles</RouterLink
        >
      </li>
      <li><RouterLink to="/visualizations/softheap/median">Median-finding</RouterLink></li>
      <li><RouterLink to="/visualizations/softheap/sorting">Approximate sorting</RouterLink></li>
    </ul>
  </main>
</template>

<style scoped>
main {
  padding: 1rem;
  margin-left: 0;
}
</style>
