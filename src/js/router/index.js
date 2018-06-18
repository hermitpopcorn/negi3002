import Vue from 'vue'
import VueRouter from 'vue-router'

import Overview from '@/components/Overview.vue'
import TransactionsList from '@/components/Transactions-List.vue'
import TransactionsForm from '@/components/Transactions-Form.vue'
import TransactionsSearch from '@/components/Transactions-Search.vue'
import Accounts from '@/components/Accounts.vue'
import Statistics from '@/components/Statistics.vue'
import Options from '@/components/Options.vue'
import ErrorNotFound from '@/components/Error-NotFound.vue'

Vue.use(VueRouter)

export default new VueRouter({
  routes: [
    {
      path: '/',
      name: 'home',
      redirect: '/overview'
    },
    {
      path: '/overview',
      name: 'overview',
      component: Overview
    },
    {
      path: '/transactions',
      redirect: '/transactions/list',
      name: 'transactions',
      component: {
        render (c) { return c('router-view') }
      },
      children: [
        {
          path: 'list',
          name: 'transactions.list',
          component: TransactionsList
        },
        {
          path: 'list/:year(\\d+)/:month(\\d+)',
          name: 'transactions.list.jump',
          component: TransactionsList,
          props: (route) => {
            return {
              year: parseInt(route.params.year),
              month: parseInt(route.params.month)
            }
          }
        },
        {
          path: 'list/:year(\\d+)/:month(\\d+)/:transactionID',
          name: 'transactions.list.jumpscroll',
          component: TransactionsList,
          props: (route) => {
            return {
              year: parseInt(route.params.year),
              month: parseInt(route.params.month),
              transactionID: parseInt(route.params.transactionID)
            }
          }
        },
        {
          path: 'list/tagged/:tag',
          name: 'transactions.list.tagged',
          component: TransactionsList,
          props: true
        },
        {
          path: 'add',
          name: 'transactions.add',
          component: TransactionsForm,
          props: { transactionID: null }
        },
        {
          path: 'edit/:transactionID',
          name: 'transactions.edit',
          component: TransactionsForm,
          props: (route) => { return { transactionID: parseInt(route.params.transactionID) } }
        },
        {
          path: 'search',
          name: 'transactions.search',
          component: TransactionsSearch
        }
      ]
    },
    {
      path: '/accounts',
      name: 'accounts',
      component: Accounts
    },
    {
      path: '/stats',
      name: 'statistics',
      component: Statistics
    },
    {
      path: '/options',
      name: 'options',
      component: Options
    },
    {
      path: '*',
      name: '404',
      component: ErrorNotFound
    }
  ]
})
