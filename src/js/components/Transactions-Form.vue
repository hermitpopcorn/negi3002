<template>
  <div class="container app-body">
    <section class="section">
      <div class="is-clearfix has-margin-bottom-10">
        <div class="is-pulled-left">
          <router-link :to="'/transactions/list'" class="button is-link" exact><i class="fa fa-list"></i> Back to Transactions List</router-link>
        </div>
      </div>

      <div class="box" :class="accentType">
        <form>
          <div class="field">
            <label class="label">Type</label>
            <div class="switch-field">
              <input id="type-i" type="radio" name="switch_3" value="i" v-model="form.type"/>
              <label class="i" for="type-i">Income</label>
              <input id="type-e" type="radio" name="switch_3" value="e" v-model="form.type"/>
              <label class="e" for="type-e">Expense</label>
              <input id="type-x" type="radio" name="switch_3" value="x" v-model="form.type"/>
              <label class="x" for="type-x">Transfer</label>
            </div>
          </div>
          <div class="columns">
            <div class="column is-half">
              <div class="field">
                <label class="label">Account</label>
                <div class="control is-expanded">
                  <div class="select is-fullwidth">
                    <select v-model="form.account">
                      <template v-for="i in accounts">
                        <option v-bind:key="i.id" :value="i.id">{{ i.name }}</option>
                      </template>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div class="column is-half" v-if="form.type === 'x'">
              <div class="field">
                <label class="label">Transfer to</label>
                <div class="control is-expanded">
                  <div class="select is-fullwidth">
                    <select v-model="form.target">
                      <template v-for="i in accounts">
                        <option v-bind:key="i.id" :value="i.id">{{ i.name }}</option>
                      </template>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="field">
            <label class="label">Amount</label>
            <div class="control">
              <vue-numeric class="input has-text-right" currency="" separator=" " :rawValue="form.amount"
                v-model="form.amount" :minus="false" :precision="2" name="amount"></vue-numeric>
            </div>
          </div>
          <div class="field">
            <label class="label">Note</label>
            <div class="control">
              <textarea class="textarea" v-model="form.note"></textarea>
            </div>
          </div>
          <div class="field">
            <label class="label">Date</label>
            <div class="control">
              <input class="input" type="text" v-model="form.date">
            </div>
          </div>
          <div class="field">
            <label class="label">Tags</label>
            <div class="control">
              <input-tag class="input" :tags="form.tags"></input-tag>
            </div>
          </div>
          <div class="field">
            <div class="control has-text-right">
              <button class="button is-primary" @click="submit">Save</button>
            </div>
          </div>
        </form>
      </div>
    </section>
  </div>
</template>

<script>
import VueNumeric from './input/Numeric.vue'
import InputTag from './input/InputTag.vue'

export default {
  name: 'transactions-form',
  props: {
    transactionID: {
      default: null,
      required: false,
      type: Number
    }
  },
  data: function () {
    return {
      accounts: [],
      transaction: null,
      form: {
        type: 'i',
        account: null,
        target: null,
        tags: [],
        amount: 0,
        note: '',
        date: this.$moment().format('YYYY-MM-DD HH:mm'),
        block: false
      },
      temp: {
        account: null,
        target: null
      }
    }
  },
  components: {
    VueNumeric,
    InputTag
  },
  created: function () {
    var self = this

    // Fetch accounts
    self.accounts = self.$db.getAccounts()
    if (self.temp.account === null) {
      self.$set(self.form, 'account', self.accounts[0].id)
    } else {
      self.$set(self.form, 'account', self.temp.account)
      self.$set(self.form, 'target', self.temp.target)
    }

    // Fetch transaction if edit
    if (typeof self.transactionID !== 'undefined' && self.transactionID !== null) {
      self.$set(self.form, 'block', true)
      var transaction = self.$db.getTransaction(self.transactionID)
      if (!transaction) {
        self.$swal({
          title: 'Not Found',
          text: 'Could not find a transaction with that identifier.',
          type: 'warning'
        }).then(function () {
          self.$router.push('/transactions/list')
        })
        return false
      }

      self.transaction = transaction
      self.$set(self.form, 'type', transaction.type)
      self.$set(self.form, 'account', transaction.account.id)
      self.$set(self.temp, 'account', transaction.account.id)
      self.$set(self.form, 'target', transaction.target ? transaction.target.id : null)
      self.$set(self.temp, 'target', transaction.target ? transaction.target.id : null)
      self.$set(self.form, 'tags', transaction.tags)
      self.$set(self.form, 'amount', transaction.amount)
      self.$set(self.form, 'note', transaction.note)
      self.$set(self.form, 'date', self.$moment(transaction.date).format('YYYY-MM-DD HH:mm'))
      self.$set(self.form, 'block', false)
    }
  },
  computed: {
    accentType: function () {
      if (this.form.type === 'i') {
        return 'box-success'
      } else if (this.form.type === 'e') {
        return 'box-danger'
      } else if (this.form.type === 'x') {
        return 'box-primary'
      }
    }
  },
  methods: {
    submit: function (e) {
      e.preventDefault()
      var self = this

      if (self.form.block) {
        return false
      }

      self.$set(self.form, 'block', true)

      var data = {
        type: self.form.type,
        account: self.form.account,
        target: self.form.type === 'x' ? self.form.target : null,
        amount: self.form.amount,
        note: self.form.note,
        date: self.form.date,
        tags: self.form.tags
      }

      if (data.account === data.target) {
        self.$swal({
          title: 'Invalid Data',
          text: 'You cannot transfer from and to the same account.',
          type: 'warning'
        })
        self.$set(self.form, 'block', false)
        return false
      }

      if (typeof self.transaction === 'undefined' || self.transaction === null) {
        // Insert
        var transaction = self.$db.insertTransaction(data)
        if (transaction) {
          self.$swal({
            title: 'Success',
            text: 'Transaction saved.',
            type: 'success'
          }).then(function () {
            self.goToList(transaction)
          }, function () {
            self.goToList(transaction)
          })
        } else {
          self.$swal({
            title: 'Failure',
            text: 'Data not saved.',
            type: 'error'
          })
          self.$set(self.form, 'block', false)
        }
      } else {
        // Update
        var update = self.$db.updateTransaction(self.transaction, data)
        if (update) {
          self.$swal({
            title: 'Success',
            text: 'Transaction saved.',
            type: 'success'
          }).then(function () {
            self.goToList(self.transaction)
          }, function () {
            self.goToList(self.transaction)
          })
          self.$set(self.form, 'block', false)
        } else {
          self.$swal({
            title: 'Failure',
            text: 'Data not saved.',
            type: 'error'
          })
          self.$set(self.form, 'block', false)
        }
      }
    },

    goToList: function (transaction) {
      this.$router.push('/transactions/list/' + this.$moment(transaction.date).format('YYYY/MM') + '/' + transaction.id)
    }
  }
}
</script>
