<template>
  <div class="container app-body">
    <section class="section">
      <div class="is-clearfix has-margin-bottom-10">
        <div class="is-pulled-left" v-if="tag">
          <router-link :to="'/transactions/list'" class="button is-link has-margin-bottom-5" exact><i class="fa fa-list"></i> Back to Monthly List</router-link>
        </div>
        <div class="is-pulled-right">
          <router-link :to="'/transactions/add'" class="button is-primary" exact><i class="fa fa-pencil-square-o"></i> Add New Transaction</router-link>
          <router-link :to="'/transactions/search'" class="button is-link" exact><i class="fa fa-search"></i> Search</router-link>
        </div>
      </div>

      <div class="box" v-if="!tag">
        <div class="columns is-mobile">
          <div class="column is-paddingless is-one-quarter has-text-centered" v-on:click="previousMonth">
            <i class="fa fa-angle-left"></i>
          </div>
          <div class="column is-paddingless has-text-centered" @click="showDatepicker = true" style="cursor: pointer">
            <span class="datepicker-display">{{ dateJumper | moment("MMMM YYYY") }}</span>
          </div>
          <div class="column is-paddingless is-one-quarter has-text-centered" v-on:click="nextMonth">
            <i class="fa fa-angle-right"></i>
          </div>
        </div>
      </div>
      <datepicker v-model="dateJumper" ref="datepicker" v-if="showDatepicker"
        minimum-view='month' format='MMMM yyyy'
        input-class="datepicker" @input="changedDatepicker"
        :inline="true"
        calendar-class="calendar">
      </datepicker>

      <div class="box" v-if="!tag">
        <div class="transaction b">
          <div class="transaction-body white">
            <span>Balance</span>
            <h1 v-html="$options.filters.currency(currentBalance)"/>
          </div>
        </div>
      </div>

      <div class="box-group">
        <div class="box" v-if="!tag">
          <div class="transaction b">
            <div class="transaction-body white">
              <span>Balance at the end of the period</span>
              <h1 v-html="$options.filters.currency(periodBalance)"/>
            </div>
          </div>
        </div>
        <div class="box" v-if="tag">
          <h2 class="has-text-centered">Showing all transactions marked <span class="is-blue">#{{ tag }}</span></h2>
        </div>
        <div class="box">
          <template v-for="(transaction, index) in transactions">
            <div v-bind:key="'separator-' + index" class="transaction-separator" v-if="index == 0 || transactions[index - 1].date.split(' ')[0] !== transaction.date.split(' ')[0]">{{ transaction.date.split(' ')[0] | date }}</div>
            <transaction v-bind:key="'transaction-' + transaction.id" :class="transaction.type" :transaction="transaction" @updated="onTransactionUpdated()"></transaction>
          </template>
          <template v-if="transactions.length < 1">
            <div class="has-text-centered">
              <template v-if="!tag">
                No transactions recorded in this time frame.
              </template>
              <template v-else>
                No transactions found.
              </template>
            </div>
          </template>
        </div>
        <div class="box" v-if="!tag">
          <div class="transaction b">
            <div class="transaction-body white">
              <span>Starting balance</span>
              <h1 v-html="$options.filters.currency(initialBalance)"/>
            </div>
          </div>
        </div>
        <div class="box" v-if="tag">
          <div class="columns">
            <div class="column is-half">
              <div class="transaction i">
                <div class="transaction-body white">
                  <span>Total tagged income</span>
                  <h1 v-html="$options.filters.currency(totalIncome)"/>
                </div>
              </div>
            </div>
            <div class="column is-half">
              <div class="transaction e">
                <div class="transaction-body white">
                  <span>Total tagged expense</span>
                  <h1 v-html="$options.filters.currency(totalExpense)"/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import Transaction from './display/Transaction.vue'
import Datepicker from 'vuejs-datepicker'

export default {
  name: 'transactions-list',
  components: {
    Transaction,
    Datepicker
  },
  props: {
    year: {
      type: Number,
      default: new Date().getFullYear(),
      required: false
    },
    month: {
      type: Number,
      default: new Date().getMonth() + 1, // dunno why tf it's zero-based
      required: false
    },
    transactionID: {
      type: Number,
      default: undefined,
      required: false
    },
    tag: {
      type: String,
      default: undefined,
      required: false
    }
  },
  data: function () {
    return {
      block: false,
      transactions: [],
      initialBalance: 0,
      periodBalance: 0,
      currentBalance: 0,
      cursor: { },
      dateJumper: new Date(),
      showDatepicker: false,
      totalIncome: 0,
      totalExpense: 0
    }
  },
  watch: {
    'tag' (newValue, oldValue) {
      if (!newValue) {
        this.loadMonthly()
      } else {
        this.loadTagged(newValue)
      }
    }
  },
  created: function () {
    if (!this.tag) {
      this.loadMonthly()
    } else {
      this.loadTagged(this.tag)
    }
  },
  methods: {
    loadMonthly: function () {
      var self = this

      if (parseInt(self.year) <= 9999 && parseInt(self.year) >= 1900 && parseInt(self.month) <= 12 && parseInt(self.month) >= 1) {
        self.$set(self.cursor, 'year', self.year)
        self.$set(self.cursor, 'month', self.month)
        self.dateJumper = self.$moment([self.year, self.month - 1]).toDate()
      }

      self.getBalance()
      self.loadMonthlyData()
    },

    getBalance: function () {
      var self = this
      self.currentBalance = self.$db.getBalance()
    },

    getPeriodBalance: function (year, month, day) {
      var self = this
      self.initialBalance = 0
      self.initialBalance = self.$db.getBalance('all', self.$moment([year, month - 1, day]))
      self.calculatePeriodBalance()
    },

    loadMonthlyData: function () {
      var self = this

      let date, year, month
      date = self.$moment([this.cursor.year, this.cursor.month - 1])

      // get starting balance
      let endOfPrevious = self.$moment(date)
      endOfPrevious.subtract(1, 'months').endOf('month')
      self.getPeriodBalance(endOfPrevious.year(), endOfPrevious.month() + 1, endOfPrevious.date())

      year = self.cursor.year
      month = self.cursor.month
      self.getTransactions({ 'year': year, 'month': month })
      self.calculatePeriodBalance()
      if (typeof self.transactionID !== 'undefined') {
        setTimeout(() => { self.$scrollTo('#transaction-' + self.transactionID, 1000, { 'offset': -25 }) }, 1000)
      }
    },

    getTransactions: function (params) {
      var self = this

      self.block = true
      self.transactions = self.$db.getTransactions(params)
      self.block = false
    },

    onTransactionUpdated: function () {
      var self = this

      if (self.tag === undefined) {
        self.getBalance()
        self.loadMonthlyData()
      } else {
        self.loadTagged(self.tag)
      }
    },

    calculatePeriodBalance: function () {
      var self = this
      var balance = self.initialBalance

      if (self.transactions.length > 0) {
        for (let i = 0; i < self.transactions.length; i++) {
          if (self.transactions[i].account.type !== 'sink' && self.transactions[i].account.type !== 'noncurrent') {
            if (self.transactions[i].type === 'i') {
              balance += Number(self.transactions[i].amount)
            } else if (self.transactions[i].type === 'e') {
              balance -= Number(self.transactions[i].amount)
            } else if (self.transactions[i].type === 'x' && self.transactions[i].target === null) {
              balance -= Number(self.transactions[i].amount)
            } else if (self.transactions[i].type === 'x' && (self.transactions[i].target.type === 'sink' || self.transactions[i].target.type === 'noncurrent')) {
              balance -= Number(self.transactions[i].amount)
            }
          } else {
            if (self.transactions[i].type === 'x' && (self.transactions[i].target.type !== 'sink' && self.transactions[i].target.type !== 'noncurrent')) {
              balance += Number(self.transactions[i].amount)
            }
          }
        }
      }

      self.periodBalance = balance
    },

    previousMonth: function () {
      var self = this

      // Get the current date from self.cursor
      var date = self.$moment([self.cursor.year, self.cursor.month - 1])
      // Set it to go backwards 1 month
      date.subtract(1, 'month')

      // Set the new cursor
      self.$set(self.cursor, 'month', date.month() + 1)
      self.$set(self.cursor, 'year', date.year())

      // Apply to datepicker
      self.dateJumper = date.toDate()

      let prev = self.$moment(date)
      prev.subtract(1, 'month')
      prev.endOf('month')

      // Get the starting balance by getting the balance up to the previous month
      self.getPeriodBalance(prev.year(), prev.month() + 1, prev.date())
      // Get the transactions for the month
      self.getTransactions({ 'year': date.year(), 'month': date.month() + 1 })
      self.calculatePeriodBalance()
    },

    nextMonth: function () {
      var self = this

      // Get the current date from self.cursor
      let date = self.$moment([this.cursor.year, this.cursor.month - 1])
      // Increment month
      date.add(1, 'month')

      // Set the new cursor
      self.$set(self.cursor, 'month', date.month() + 1)
      self.$set(self.cursor, 'year', date.year())

      // Apply to datepicker
      self.dateJumper = date.toDate()

      let prev = self.$moment(date)
      prev.subtract(1, 'month')
      prev.endOf('month')

      // Get the starting balance by getting the balance up to the next month
      self.getPeriodBalance(prev.year(), prev.month() + 1, prev.date())
      // Get the transactions for the month
      self.getTransactions({ 'year': date.year(), 'month': date.month() + 1 })
      self.calculatePeriodBalance()
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

      let prev = self.$moment(date)
      prev.subtract(1, 'month')
      prev.endOf('month')

      self.showDatepicker = false

      // Get the starting balance by getting the balance up to the previous month
      self.getPeriodBalance(prev.year(), prev.month() + 1, prev.date())
      // Get the transactions for the month
      self.getTransactions({ 'year': date.year(), 'month': date.month() + 1 })
      self.calculatePeriodBalance()
    },

    loadTagged: function (tag) {
      var self = this

      self.getTransactions({ 'tag': tag })
      self.calculateIncomeAndExpenseTotals()
    },

    calculateIncomeAndExpenseTotals: function () {
      var self = this

      var income = 0
      var expense = 0

      if (self.transactions.length > 0) {
        for (let i = 0; i < self.transactions.length; i++) {
          if (self.transactions[i].type === 'i') {
            income += Number(self.transactions[i].amount)
          } else if (self.transactions[i].type === 'e') {
            expense += Number(self.transactions[i].amount)
          } else if (self.transactions[i].type === 'x') {
            if (self.transactions[i].target === null) {
              if (self.transactions[i].account.type !== 'sink') {
                expense += Number(self.transactions[i].amount)
              }
            } else if (self.transactions[i].account.type !== 'sink' && self.transactions[i].target.type === 'sink') {
              expense += Number(self.transactions[i].amount)
            } else if (self.transactions[i].account.type === 'sink' && self.transactions[i].target.type !== 'sink') {
              income += Number(self.transactions[i].amount)
            }
          }
        }
      }

      self.totalIncome = income
      self.totalExpense = expense
    }
  }
}
</script>
