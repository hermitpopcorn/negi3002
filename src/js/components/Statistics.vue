<template>
  <div class="container app-body">
    <section class="section">
      <div class="is-clearfix has-margin-bottom-10">
        <div class="is-pulled-right">
          <span class="button has-margin-bottom-5">Range</span>
          <button class="button has-margin-bottom-5 is-link" v-on:click="setRange('monthly')">Monthly</button>
          <button class="button has-margin-bottom-5 is-link" v-on:click="setRange('yearly')">Yearly</button>
          <button class="button has-margin-bottom-5 is-link" v-on:click="setRange('alltime')">All time</button>
          <span class="button has-margin-bottom-5">Sorted by</span>
          <button class="button has-margin-bottom-5 is-primary" v-on:click="setSorting('date-desc')">Date</button>
          <button class="button has-margin-bottom-5 is-primary" v-on:click="setSorting('amount-desc')">Amount</button>
        </div>
      </div>

      <div class="box">
        <div class="columns is-mobile">
          <div class="column is-paddingless is-one-quarter has-text-centered" v-on:click="previousTimeFrame">
            <i class="fa fa-angle-left"></i>
          </div>
          <div class="column is-paddingless has-text-centered" @click="range !== 'alltime' ? $refs.datepicker.showCalendar() : {}" style="cursor: pointer">
            <template v-if="range === 'monthly' || range === 'yearly'">
              <datepicker v-model="dateJumper" ref="datepicker"
              :minimum-view="range === 'monthly' ? 'month' : 'year'"
              :format="range === 'monthly' ? 'MMMM yyyy' : 'yyyy'"
              input-class="datepicker" @input="changedDatepicker"
              calendar-class="calendar"></datepicker>
              <span class="datepicker-display" v-if="range === 'monthly'">{{ dateJumper | moment("MMMM YYYY") }}</span>
              <span class="datepicker-display" v-if="range === 'yearly'">{{ dateJumper | moment("YYYY") }}</span>
          </template>
          <template v-if="range === 'alltime'">
            All time
          </template>
        </div>
        <div class="column is-paddingless is-one-quarter has-text-centered" v-on:click="nextTimeFrame">
          <i class="fa fa-angle-right"></i>
        </div>
      </div>
    </div>

    <div class="box-group">
      <div class="box">
        <div class="columns">
          <div class="column">
            <div class="box is-white has-green-bg">
              <small>Income</small>
              <br>
              <b class="h4" v-html="$options.filters.currency(totalIncome)"></b>
            </div>
          </div>
          <div class="column">
            <div class="box is-white has-red-bg">
              <small>Expense</small>
              <br>
              <b class="h4" v-html="$options.filters.currency(totalExpense)"></b>
            </div>
          </div>
        </div>
      </div>

      <div class="box">
        <div class="columns is-marginless is-paddingless is-mobile">
          <div class="column has-text-left">
            <span class="is-green">income</span>
          </div>
          <div class="column has-text-centered">
            <span class="is-light">balance</span>
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

      <div class="box">
        <h2>Expense by tags</h2>
        <ul style="list-style: none; padding: 0; margin: 0; margin-bottom: 1em">
          <template v-for="(tag, tagName) in sortedExpenseTags">
            <li v-if="tag.totalExpense != 0" v-on:click="toggleTransactionsVisibility('e', tagName)" style="cursor:pointer" v-bind:key="tagName">
              <h6 style="color: #7d7b9a; margin: 0">#{{ tagName }}</h6>
              <div class="bars">
                <div class="progress has-grey-bg progress-sm stat expense">
                  <div class="progress-bar has-red-bg" role="progressbar" :style="{ width: statPercentage('e', tag.totalExpense) + '%' }" :aria-valuenow="statPercentage('e', tag.totalExpense)" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
              </div>
              <span style="color: #a83838" v-html="$options.filters.currency(tag.totalExpense)"></span>
              (<span v-text="statPercentage('e', tag.totalExpense)"></span>%)
            </li>
            <transition name="slide-fade" v-bind:key="'transition' + '_' + tagName">
              <li v-show="expenseTransactionsVisibility.includes(tagName)">
                <template v-for="(transaction, index) in tag.transactions">
                  <transaction v-bind:key="index" :class="transaction.type" :transaction="transaction" :displayDate="true" v-if="transaction.mark === 'expense'" @updated="onTransactionUpdated()"></transaction>
                </template>
              </li>
            </transition>
          </template>
          <template v-if="Object.keys(sortedExpenseTags).length < 1">
            No expense transactions recorded in this time frame.
          </template>
        </ul>

        <h2>Income by tags</h2>
        <ul style="list-style: none; padding: 0; margin: 0; margin-bottom: 1em">
          <template v-for="(tag, tagName) in sortedIncomeTags">
            <li v-if="tag.totalIncome != 0" v-on:click="toggleTransactionsVisibility('i', tagName)" style="cursor:pointer" v-bind:key="tagName">
              <h6 style="color: #7d7b9a; margin: 0">#{{ tagName }}</h6>
              <div class="bars">
                <div class="progress has-grey-bg progress-sm stat income">
                  <div class="progress-bar" role="progressbar" :style="{ width: statPercentage('i', tag.totalIncome) + '%' }" :aria-valuenow="statPercentage('i', tag.totalIncome)" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
              </div>
              <span style="color: #318a4f" v-html="$options.filters.currency(tag.totalIncome)"></span>
              (<span v-text="statPercentage('i', tag.totalIncome)"></span>%)
            </li>
            <transition name="slide-fade" v-bind:key="'transition' + '_' + tagName">
              <li v-show="incomeTransactionsVisibility.includes(tagName)">
                <template v-for="(transaction, index) in tag.transactions">
                  <transaction v-bind:key="index" :class="transaction.type" :transaction="transaction" :displayDate="true" v-if="transaction.mark === 'income'" @updated="onTransactionUpdated()"></transaction>
                </template>
              </li>
            </transition>
          </template>
          <template v-if="Object.keys(sortedIncomeTags).length < 1">
            No income transactions recorded in this time frame.
          </template>
        </ul>
      </div>
    </div>
  </section>
</div>
</template>

<style>
.slide-fade-enter-active {
  transition: all .3s ease;
}
.slide-fade-leave-active {
  transition: all .15s cubic-bezier(1.0, 0.5, 0.8, 1.0);
}
.slide-fade-enter, .slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
</style>

<script>
import Transaction from './display/Transaction.vue'
import Datepicker from 'vuejs-datepicker'

export default {
  name: 'statistics',
  components: {
    Transaction,
    Datepicker
  },
  data: function () {
    return {
      block: false,
      range: 'monthly',
      sorting: 'date-desc',
      totalIncome: 'Loading...',
      totalExpense: 'Loading...',
      tags: {},
      sortedExpenseTags: [],
      sortedIncomeTags: [],
      transactions: [],
      expenseTransactionsVisibility: [],
      incomeTransactionsVisibility: [],
      dateJumper: new Date(),
      cursor: { }
    }
  },
  mounted: function () {
    var self = this

    let date = self.$moment()

    // set cursor's default date as now
    self.$set(self.cursor, 'month', date.month() + 1)
    self.$set(self.cursor, 'year', date.year())

    self.loadData()
  },
  methods: {
    setRange: function (range) {
      if (range === 'monthly' || range === 'yearly' || range === 'alltime') {
        this.range = range

        this.loadData()
      }
    },
    setSorting: function (sorting) {
      if (sorting === 'date-desc' || sorting === 'amount-desc') {
        this.sorting = sorting

        this.loadData()
      }
    },

    getTotalIncome: function (year, month) {
      var self = this

      self.totalIncome = 'Loading...'

      var params = {}
      if (self.range === 'yearly' || self.range === 'monthly') { params.year = year }
      if (self.range === 'monthly') { params.month = month }

      self.totalIncome = self.$db.getTotalIncome(params)
    },

    getTotalExpense: function (year, month) {
      var self = this

      self.totalExpense = 'Loading...'

      var params = {}
      if (self.range === 'yearly' || self.range === 'monthly') { params.year = year }
      if (self.range === 'monthly') { params.month = month }

      self.totalExpense = self.$db.getTotalExpense(params)
    },

    getTransactions: function (year, month) {
      var self = this

      self.block = true
      self.tags = {}
      self.transactions = []

      var params = {}
      if (self.range === 'yearly' || self.range === 'monthly') { params.year = year }
      if (self.range === 'monthly') { params.month = month }

      self.transactions = self.$db.getTransactions(params)
      self.organizeTags(self.transactions)
      self.block = false
    },

    organizeTags: function (transactions) {
      var self = this

      // group transactions in tags
      for (var i of transactions) {
        if (i.tags.length > 0) {
          for (var v of i.tags) {
            if (typeof self.tags[v] === 'undefined') {
              // initialize tag's array if not defined yet
              self.tags[v] = { transactions: [] }
            }
            self.tags[v].transactions.push(i)
          }
        } else {
          if (typeof self.tags['untagged'] === 'undefined') {
            // initialize untagged array if not defined yet
            self.tags['untagged'] = { transactions: [] }
          }
          self.tags['untagged'].transactions.push(i)
        }
      }

      // make up stats
      for (i in self.tags) {
        self.tags[i].totalIncome = 0
        self.tags[i].totalExpense = 0
        self.tags[i].showExpenseTransactions = false
        self.tags[i].showIncomeTransactions = false

        for (var x of self.tags[i].transactions) {
          if (x.type === 'i') {
            self.tags[i].totalIncome += Number(x.amount)
            x.mark = 'income'
          } else if (x.type === 'e') {
            self.tags[i].totalExpense += Number(x.amount)
            x.mark = 'expense'
          } else if (x.type === 'x') {
            if (x.target === null) {
              if (x.account.type !== 'sink') {
                self.tags[i].totalExpense += Number(x.amount)
                x.mark = 'expense'
              }
            } else if (x.account.type !== 'sink' && x.target.type === 'sink') {
              self.tags[i].totalExpense += Number(x.amount)
              x.mark = 'expense'
            } else if (x.account.type === 'sink' && x.target.type !== 'sink') {
              self.tags[i].totalIncome += Number(x.amount)
              x.mark = 'income'
            }
          }
        }

        if (self.sorting === 'amount-desc') {
          self.tags[i].transactions.sort(function (a, b) { return b.amount - a.amount })
        }
      }

      self.sortedExpenseTags = self.sortTags('e', self.tags)
      self.sortedIncomeTags = self.sortTags('i', self.tags)

      return true
    },

    onTransactionUpdated: function () {
      var self = this

      self.loadData()
    },

    loadData: function () {
      this.getTotalIncome(this.cursor.year, this.cursor.month)
      this.getTotalExpense(this.cursor.year, this.cursor.month)
      this.getTransactions(this.cursor.year, this.cursor.month)
    },

    previousTimeFrame: function () {
      var self = this

      // do nothing on all time
      if (self.range === 'alltime') {
        return true
      }

      var date = self.$moment([self.cursor.year, self.cursor.month - 1])

      if (self.range === 'monthly') {
        date.subtract(1, 'month')
      } else if (self.range === 'yearly') {
        date.subtract(1, 'year')
      }

      // Set the new cursor
      self.$set(self.cursor, 'month', date.month() + 1)
      self.$set(self.cursor, 'year', date.year())

      // Apply to datepicker
      self.dateJumper = date.toDate()

      self.loadData()
    },

    nextTimeFrame: function () {
      var self = this

      // do nothing on all time
      if (self.range === 'alltime') {
        return true
      }

      var date = self.$moment([self.cursor.year, self.cursor.month - 1])

      if (self.range === 'monthly') {
        date.add(1, 'month')
      } else if (self.range === 'yearly') {
        date.add(1, 'year')
      }

      // Set the new cursor
      self.$set(self.cursor, 'month', date.month() + 1)
      self.$set(self.cursor, 'year', date.year())

      // Apply to datepicker
      self.dateJumper = date.toDate()

      self.loadData()
    },

    changedDatepicker: function (date) {
      var self = this

      if (date === null || self.range === 'alltime') {
        return false
      }

      date = self.$moment(date)

      // Set the new cursor
      self.$set(self.cursor, 'month', date.month() + 1)
      self.$set(self.cursor, 'year', date.year())

      self.loadData()
    },

    sortTags: function (type, tags) {
      var sortable = {}

      // Get all tags
      for (var t in tags) {
        if (type === 'i') {
          // Only take income
          sortable[t] = tags[t].totalIncome
        } else if (type === 'e') {
          // Only take expenses
          sortable[t] = tags[t].totalExpense
        }
      }

      // sort keys
      var keysSorted = Object.keys(sortable).sort(function (a, b) { return sortable[b] - sortable[a] })

      var sorted = {}
      for (var i of keysSorted) {
        sorted[i] = tags[i]
      }

      return sorted
    },

    statPercentage: function (type, value) {
      var self = this

      var total = 0
      if (type === 'i') {
        for (var i in self.tags) {
          total += self.tags[i].totalIncome
        }
      } else if (type === 'e') {
        for (i in self.tags) {
          total += self.tags[i].totalExpense
        }
      }

      let percentage = ((value / (total)) * 100)
      return Math.round(percentage * 100) / 100
    },

    toggleTransactionsVisibility: function (which, tagName) {
      var transactionsVisibility
      if (which === 'e') {
        transactionsVisibility = this.expenseTransactionsVisibility
      } else if (which === 'i') {
        transactionsVisibility = this.incomeTransactionsVisibility
      }
      if (!transactionsVisibility.includes(tagName)) {
        transactionsVisibility.push(tagName)
      } else {
        transactionsVisibility.splice(transactionsVisibility.indexOf(tagName), 1)
      }
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