import Vue from 'vue'
import Loki from 'lokijs'
import LokiCordovaFSAdapter from '@/db/cordova-file-system-adapter'
import Model from '@/db/model'

export default (params) => {
  return new Promise(function (resolve, reject) {
    // If cordova is defined, use filesystem adapter. Else, use memory adapter
    let adapter
    if (typeof cordova !== 'undefined') {
      adapter = new LokiCordovaFSAdapter({ prefix: 'loki' })
    } else {
      adapter = new Loki.LokiLocalStorageAdapter()
    }

    var db = new Loki(params.dbname + '.db', {
      adapter: adapter,
      autoload: true,
      autoloadCallback: setupDatabase,
      autosave: true,
      autosaveInterval: 2000
    })

    function setupDatabase () {
      if (!db.getCollection('accounts')) {
        // Create collections
        var accounts = db.addCollection('accounts')
        var transactions = db.addCollection('transactions')
        var budgets = db.addCollection('budgets')
        var options = db.addCollection('options')

        // Initialize with default data
        var data = require('@/db/defaultData.json')
        for (let account of data.accounts) {
          accounts.insert(account)
        }
        for (let transaction of data.transactions) {
          transactions.insert(transaction)
        }
        for (let budget of data.budgets) {
          budgets.insert(budget)
        }
        options.insert({
          autoIncrements: {
            accounts: data.autoIncrements.accounts,
            transactions: data.autoIncrements.transactions,
            budgets: data.autoIncrements.budgets
          }
        })
      }

      Vue.prototype.$db = new Model(db)
      window.Vue = Vue
      resolve()
    }
  })
}
