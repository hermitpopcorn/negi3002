<template>
  <div class="container app-body">
    <section class="section">
      <div class="columns">
        <div class="column is-half">
          <div class="box is-white has-blue-bg">
            <small>Total Balance</small>
            <div class="actions" style="float: right">
              <a @click="showTotalBalanceWithNoncurrent = !showTotalBalanceWithNoncurrent" class="button is-link is-small" :class="{ 'is-inverted': showTotalBalanceWithNoncurrent }">
                <span class="icon is-small"><i class="fa fa-anchor"></i></span>
              </a>
            </div>
            <br>
            <b class="h4" v-html="$options.filters.currency(totalBalance)" v-if="!showTotalBalanceWithNoncurrent"></b>
            <template v-if="showTotalBalanceWithNoncurrent">
              <b class="h4" v-html="$options.filters.currency(totalBalanceWithNoncurrent)"></b>
              <span class="is-size-7">
                (<span v-html="$options.filters.currency(totalBalance)"></span> + <span v-html="$options.filters.currency(totalBalanceWithNoncurrent - totalBalance)"></span>)
              </span>
            </template>
          </div>
        </div>
        <div class="column">
          <div class="box is-white has-red-bg">
            <small>Expense this month</small>
            <br>
            <b class="h4" v-html="$options.filters.currency(totalExpense)"></b>
          </div>
        </div>
        <div class="column">
          <div class="box is-white has-green-bg">
            <small>Income this month</small>
            <br>
            <b class="h4" v-html="$options.filters.currency(totalIncome)"></b>
          </div>
        </div>
      </div>

      <div class="box">
        <div class="columns is-marginless is-paddingless is-mobile">
          <div class="column has-text-left">
            <span class="is-green">income</span>
          </div>
          <div class="column has-text-centered">
            <span class="is-light">balance this month</span>
          </div>
          <div class="column has-text-right">
            <span class="is-red">expense</span>
          </div>
        </div>
        <div class="progress is-marginless is-paddingless">
          <div class="progress-bar" role="progressbar" :style="{ width: incomePercentage + '%' }" :aria-valuenow="incomePercentage" aria-valuemin="0" aria-valuemax="100"></div>
        </div>
        <div class="columns is-marginless is-paddingless is-mobile">
          <div class="column has-text-left">
            <span class="is-green">{{ incomePercentage }}%</span>
          </div>
          <div class="column has-text-centered">
            <span class="is-light" v-html="$options.filters.currency(totalIncome - totalExpense)"></span>
          </div>
          <div class="column has-text-right">
            <span class="is-red">{{ expensePercentage }}%</span>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="accounts-overview">
        <div class="box-group">
          <template v-for="account in accounts">
            <div class="box account" :class="account.type" v-bind:key="account.id">
              <div class="symbol">
                <span class="icon is-large">
                  <i class="fa fa-3x fa-bank" v-if="account.type === 'regular'"></i>
                  <i class="fa fa-3x fa-anchor" v-if="account.type === 'noncurrent'"></i>
                  <i class="fa fa-3x fa-credit-card" v-if="account.type === 'sink'"></i>
                </span>
              </div>
              <div class="info">
                <p class="type" v-if="account.type === 'regular'">Regular Account</p>
                <p class="type" v-if="account.type === 'noncurrent'">Noncurrent Account</p>
                <p class="type" v-if="account.type === 'sink'">Money Sink</p>

                <p class="name">{{ account.name }}</p>

                <p class="balance" v-if="account.type !== 'sink'">Remaining balance: <b v-html="$options.filters.currency(account.balance)"></b></p>
              </div>
            </div>
          </template>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  name: 'overview',
  data: function () {
    return {
      totalBalance: 'Loading...',
      totalBalanceWithNoncurrent: 'Loading...',
      showTotalBalanceWithNoncurrent: false,
      totalIncome: 'Loading...',
      totalExpense: 'Loading...',
      accounts: []
    }
  },
  mounted: function () {
    this.getTotalBalance()
    this.getAccountsBalance()
    this.getTotalIncome()
    this.getTotalExpense()
  },
  methods: {
    getTotalBalance: function () {
      var self = this
      self.totalBalance = self.$db.getBalance('all')
      self.totalBalanceWithNoncurrent = self.$db.getBalance('all+noncurrent')
    },

    getAccountsBalance: function () {
      var self = this
      self.accounts = self.$db.getAccounts()

      for (let index in self.accounts) {
        let balance = self.$db.getBalance(self.accounts[index].id)
        self.$set(self.accounts[index], 'balance', balance)
      }
    },

    getTotalIncome: function () {
      var self = this

      let date = self.$moment()
      let year = date.year()
      let month = date.month() + 1
      self.totalIncome = self.$db.getTotalIncome({ year, month })
    },

    getTotalExpense: function () {
      var self = this

      let date = self.$moment()
      let year = date.year()
      let month = date.month() + 1
      self.totalExpense = self.$db.getTotalExpense({ year, month })
    }
  },
  computed: {
    incomePercentage: function () {
      let income = !isNaN(this.totalIncome) ? this.totalIncome : 0
      let expense = !isNaN(this.totalExpense) ? this.totalExpense : 0
      let percentage = ((income / (income + expense)) * 100)
      return !isNaN(percentage) ? (Math.round(percentage * 100) / 100) : 50
    },
    expensePercentage: function () {
      let income = this.incomePercentage
      let percentage = (100 - income)
      return Math.round(percentage * 100) / 100
    }
  }
}
</script>
