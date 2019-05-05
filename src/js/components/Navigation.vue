<template>
  <div class="navigation">
    <nav class="navbar">
      <div class="container">
        <div class="navbar-brand">
          <router-link :to="'/'" class="navbar-item">
            <span class="is-blue">&#9679;</span>
            <span class="is-red">&#9679;</span>
            <span class="is-green">&#9679;</span>
            <b>{{ $appSettings.name }}</b>
          </router-link>
          <div class="navbar-item">
            <span class="is-grey-light">v{{ $appSettings.version }}</span>
          </div>
        </div>
      </div>
    </nav>
    <div class="tabs is-centered">
      <ul>
        <li :class="{ 'is-active': $route.name.split('.')[0] == 'overview' }"><router-link :to="'/overview'">Overview</router-link></li>
        <li :class="{ 'is-active': $route.name.split('.')[0] == 'transactions' }"><router-link :to="'/transactions'">Transactions</router-link></li>
        <li :class="{ 'is-active': $route.name.split('.')[0] == 'accounts' }"><router-link :to="'/accounts'">Accounts</router-link></li>
        <li :class="{ 'is-active': $route.name.split('.')[0] == 'budget' }"><router-link :to="'/budget'">Budget Profiles</router-link></li>
        <li :class="{ 'is-active': $route.name.split('.')[0] == 'statistics' }"><router-link :to="'/stats'">Statistics</router-link></li>
        <li :class="{ 'is-active': $route.name.split('.')[0] == 'options' }"><router-link :to="'/options'">Options</router-link></li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  name: 'navigation'
}
</script>
