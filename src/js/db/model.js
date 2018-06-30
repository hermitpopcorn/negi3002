import moment from 'moment'
var _ = require('lodash')

class DatabaseError extends Error {
  constructor (code, ...params) {
    super(...params)
    this.code = code
  }
}

export default class Model {
  constructor (database) {
    this.database = database
  }

  getDatabase () {
    return this.database
  }

  getAutoIncrement (collection) {
    return this.database.getCollection('options').findOne().autoIncrements[collection]
  }

  stepAutoIncrement (collection) {
    var optionsDoc = this.database.getCollection('options').findOne()
    optionsDoc.autoIncrements[collection] = optionsDoc.autoIncrements[collection] + 1
    return this.database.getCollection('options').update(optionsDoc)
  }

  getAccounts () {
    let accounts = this.database.getCollection('accounts')
    if (!accounts) {
      return []
    }
    return _.cloneDeep(accounts.chain().find().simplesort('order', false).data())
  }

  getAccount (id) {
    let accounts = this.database.getCollection('accounts')
    if (!accounts) {
      return null
    }
    return _.clone(accounts.findOne({ 'id': id }))
  }

  getBalance (account, uptilDate) {
    var balance = 0

    // if account is unspecified / 'all', it means fetch balance for ALL regular accounts combined
    if (typeof account === 'undefined' || account === 'all') {
      var totalBalance = 0
      var accounts = this.database.getCollection('accounts').find({ 'type': 'regular' })
      for (let account of accounts) {
        totalBalance += this.getBalance(account, uptilDate)
      }
      return totalBalance
    }

    if (typeof account === 'number') {
      // fetch the account data if account isn't already an object
      account = this.getAccount(account)
      if (!account) {
        throw new DatabaseError(404, 'Account not found')
      }
    }

    if (uptilDate) {
      if (typeof uptilDate === 'object') { // if a moment object
        uptilDate = uptilDate.format('YYYY-MM-DD 23:59:59')
      } else if (typeof uptilDate === 'string') { // if string
        uptilDate = moment(uptilDate).format('YYYY-MM-DD 23:59:59')
      } else {
        throw new DatabaseError(400, 'Invalid date')
      }
    }

    var transactions
    balance = account.initialBalance
    // Calculate transactions
    var conditions = {
      '$and': [
        { account: account.id }
      ]
    }
    if (uptilDate) {
      conditions['$and'].push({ date: { '$lte': uptilDate } })
    }
    transactions = this.database.getCollection('transactions').find(conditions)
    for (let transaction of transactions) {
      balance += transaction.amount * (transaction.type === 'i' ? 1 : -1)
    }

    // Calculate transfers
    conditions = {
      '$and': [
        { target: account.id },
        { type: 'x' }
      ]
    }
    if (uptilDate) {
      conditions['$and'].push({ date: { '$lte': uptilDate } })
    }
    transactions = this.database.getCollection('transactions').find(conditions)
    for (let transaction of transactions) {
      balance += transaction.amount
    }

    return balance
  }

  getTotalIncome (params) {
    var totalIncome = 0
    var conditions = { '$and': [{
      type: { '$ne': 'e' }
    }] }
    conditions['$and'].push(whereBetweenDateConditions(params.year, params.month))
    var transactions = _.cloneDeep(this.database.getCollection('transactions').find(conditions))
    for (let transaction of transactions) {
      transaction.account = this.getAccount(transaction.account)
      if (transaction.target) {
        transaction.target = this.getAccount(transaction.target)
      }

      if (transaction.type === 'i') {
        if (transaction.account.type === 'sink') {
          continue
        }
        totalIncome += transaction.amount
      } else if (transaction.type === 'x') {
        if (transaction.account.type === 'sink' && transaction.target.type !== 'sink') {
          totalIncome += transaction.amount
        }
      }
    }

    return totalIncome
  }

  getTotalExpense (params) {
    var totalExpense = 0
    var conditions = { '$and': [{
      type: { '$ne': 'i' }
    }] }
    conditions['$and'].push(whereBetweenDateConditions(params.year, params.month))
    var transactions = _.cloneDeep(this.database.getCollection('transactions').find(conditions))
    for (let transaction of transactions) {
      transaction.account = this.getAccount(transaction.account)
      if (transaction.target) {
        transaction.target = this.getAccount(transaction.target)
      }

      if (transaction.type === 'e') {
        if (transaction.account.type === 'sink') {
          continue
        }
        totalExpense += transaction.amount
      } else if (transaction.type === 'x') {
        if (transaction.account.type !== 'sink' && transaction.target.type === 'sink') {
          totalExpense += transaction.amount
        }
      }
    }

    return totalExpense
  }

  insertAccount (data) {
    var accounts = this.database.getCollection('accounts')
    if (!accounts) {
      return null
    }

    var id = this.getAutoIncrement('accounts')

    var insert = _.clone(accounts.insert({
      id: id,
      name: data.name,
      type: data.type,
      initialBalance: data.type !== 'sink' ? data.initialBalance : null,
      order: data.order
    }))
    if (insert) {
      this.stepAutoIncrement('accounts')
    }
    return insert
  }

  updateAccount (account, data) {
    var accounts = this.database.getCollection('accounts')
    if (!accounts) {
      return null
    }

    if (typeof account === 'number') {
      account = this.getAccount(account)
    }

    account.name = data.name || account.name
    account.type = data.type || account.type
    account.initialBalance = (typeof data.initialBalance !== 'undefined' && data.initialBalance !== null) ? data.initialBalance : account.initialBalance
    account.initialBalance = data.type !== 'sink' ? account.initialBalance : null
    account.order = (typeof data.order !== 'undefined' && data.order !== null) ? data.order : account.order
    return _.clone(accounts.update(account))
  }

  deleteAccount (account) {
    if (typeof account === 'number') {
      account = this.getAccount(account)
    }
    return this.database.getCollection('accounts').remove(account)
  }

  getTransaction (id) {
    let transactions = this.database.getCollection('transactions')
    if (!transactions) {
      return null
    }
    var transaction = _.clone(transactions.findOne({ 'id': id }))
    if (!transaction) {
      return null
    }
    transaction.account = this.getAccount(transaction.account)
    if (transaction.target) {
      transaction.target = this.getAccount(transaction.target)
    }
    return transaction
  }

  getTransactions (params) {
    var conditions
    if (params) {
      conditions = { '$and': [] }
      if (params.year || params.month || params.day) {
        conditions['$and'].push(whereBetweenDateConditions(params.year, params.month, params.day))
      }
      if (typeof params.tag !== 'undefined') {
        conditions['$and'].push({ 'tags': { '$contains': params.tag } })
      } else if (typeof params.tags !== 'undefined') {
        conditions['$and'].push({ 'tags': { '$contains': params.tags } })
      }
      if (typeof params.type !== 'undefined') {
        conditions['$and'].push({ 'type': params.type })
      }
      if (typeof params.account !== 'undefined') {
        conditions['$and'].push({ 'account': params.account })
      }
      if (typeof params.target !== 'undefined') {
        conditions['$and'].push({ 'target': params.target })
      }
      if (typeof params.amount !== 'undefined' && typeof params.equality !== 'undefined') {
        let c = {}; c[params.equality] = params.amount
        conditions['$and'].push({ 'amount': c })
      }
      if (typeof params.date !== 'undefined' && typeof params.dateRange !== 'undefined') {
        let c = {}; c[params.dateRange] = params.date
        conditions['$and'].push({ 'date': c })
      }
      if (typeof params.note !== 'undefined') {
        conditions['$and'].push({ 'note': { '$contains': params.note } })
      }

      var orderBy = 'date'
      var orderArrangement = 'desc'
      if (typeof params.orderBy !== 'undefined') {
        orderBy = params.orderBy
      }
      if (typeof params.orderArrangement !== 'undefined') {
        orderArrangement = params.orderArrangement
      }
    }

    var transactions = _.cloneDeep(this.database.getCollection('transactions').chain().find(conditions).simplesort(orderBy, (orderArrangement === 'desc')).data())
    for (let transaction of transactions) {
      transaction.account = this.getAccount(transaction.account)
      if (transaction.target) {
        transaction.target = this.getAccount(transaction.target)
      }
    }
    return transactions
  }

  insertTransaction (data) {
    var transactions = this.database.getCollection('transactions')
    if (!transactions) {
      return null
    }

    if (typeof data.account === 'object') {
      data.account = data.account.id
    }
    if (data.target) {
      if (typeof data.target === 'object') {
        data.target = data.target.id
      }
    }
    if (typeof data.date !== 'string') {
      data.date = moment(data.date).format('YYYY-MM-DD HH:mm:ss')
    }

    var id = this.getAutoIncrement('transactions')

    var insert = _.clone(transactions.insert({
      id: id,
      type: data.type,
      account: data.account,
      target: data.target,
      amount: data.amount,
      note: data.note,
      date: data.date,
      tags: data.tags
    }))
    if (insert) {
      this.stepAutoIncrement('transactions')
    }
    return insert
  }

  updateTransaction (transaction, data) {
    var transactions = this.database.getCollection('transactions')
    if (!transactions) {
      return null
    }

    if (typeof transaction === 'number') {
      transaction = this.getTransaction(transaction)
    }

    if (typeof data.account === 'object') {
      data.account = data.account.id
    }
    if (data.target) {
      if (typeof data.target === 'object') {
        data.target = data.target.id
      }
    }
    if (typeof data.date !== 'string') {
      data.date = moment(data.date).format('YYYY-MM-DD HH:mm:ss')
    }

    transaction.type = data.type || transaction.type
    transaction.account = data.account || transaction.account
    transaction.target = (typeof data.target !== 'undefined') ? data.target : transaction.target
    transaction.amount = (typeof data.amount !== 'undefined' && data.amount !== null) ? data.amount : transaction.amount
    transaction.note = (typeof data.note !== 'undefined') ? data.note : transaction.note
    transaction.date = data.date || transaction.date
    transaction.tags = (typeof data.tags !== 'undefined' && data.tags !== null) ? data.tags : transaction.tags
    return _.clone(transactions.update(transaction))
  }

  deleteTransaction (transaction) {
    if (typeof transaction === 'number') {
      transaction = this.getTransaction(transaction)
    }
    return this.database.getCollection('transactions').remove(transaction)
  }
}

// Helpers
function whereBetweenDateConditions (year, month, day) {
  if (typeof year === 'undefined' && typeof month === 'undefined' && typeof day === 'undefined') {
    return {}
  } else if (typeof year !== 'undefined' && typeof month === 'undefined') {
    return {
      'date': {
        '$between': [moment([year]).format('YYYY-01-01 00:00:00'), moment([year]).format('YYYY-12-31 23:59:59')]
      }
    }
  } else if (typeof year !== 'undefined' && typeof month !== 'undefined' && typeof day === 'undefined') {
    let daysInMonth = moment([year, month - 1]).daysInMonth()
    return {
      'date': {
        '$between': [moment([year, month - 1]).format('YYYY-MM-01 00:00:00'), moment([year, month - 1, daysInMonth]).format('YYYY-MM-DD 23:59:59')]
      }
    }
  } else if (typeof year !== 'undefined' && typeof month !== 'undefined' && typeof day !== 'undefined') {
    return {
      'date': {
        '$between': [moment([year, month - 1, day]).format('YYYY-MM-DD 00:00:00'), moment([year, month - 1, day]).format('YYYY-MM-DD 23:59:59')]
      }
    }
  }

  throw new DatabaseError('Invalid query')
}
