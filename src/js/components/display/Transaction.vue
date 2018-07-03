<template>
  <div class="transaction" :id="'transaction-' + transaction.id">
    <div class="transaction-head">
      <span class="account" v-if="transaction.type !== 'x'">{{ transaction.account.name }}</span>
      <span class="account" v-if="transaction.type === 'x'">
        <template v-if="transaction.target">
          {{ transaction.account.name }} > {{ transaction.target.name }}
        </template>
        <template v-else>
          {{ transaction.account.name }} > ???
        </template>
      </span>
      <div class="actions">
        <router-link :to="{ path: '/transactions/edit/' + transaction.id }" class="button is-link is-inverted is-small">
          <span class="icon is-small">
            <i class="fa fa-pencil"></i>
          </span>
        </router-link>
        <a href="javascript:;" @click="deleteTransaction(transaction)" class="button is-danger is-inverted is-small">
          <span class="icon is-small">
            <i class="fa fa-remove"></i>
          </span>
        </a>
      </div>
    </div>
    <div class="transaction-body">
      <div class="transaction-note">
        <template v-if="displayDate">
          <span class="date" v-if="transaction.date">{{ $options.filters.date($moment(transaction.date).format('YYYY-MM-DD HH:mm:ss')) }}</span>
        </template>
        <template v-else>
          <span class="date" v-if="$moment(transaction.date).format('HH:mm:ss') !== '00:00:00'">at {{ $options.filters.date($moment(transaction.date).format('YYYY-MM-DD HH:mm:ss')).split(' ').slice(-2).join(' ') }}</span>
        </template>
        <p v-if="transaction.note" v-html="$options.filters.breakWhitespaces(transaction.note)"></p>
      </div>
      <h1 v-html="$options.filters.currency(transaction.amount)"/>
    </div>
    <div class="transaction-tags" v-if="transaction.tags.length > 0">
      Tags:
      <template v-for="tag in transaction.tags">
        <router-link tag="span" class="transaction-tag" :to="{ path: '/transactions/list/tagged/' + tag }" v-bind:key="transaction.id + '_' + tag">#{{ tag }}</router-link>
      </template>
    </div>
  </div>
</template>

<script>
export default {
  name: 'transaction',
  props: ['transaction', 'displayDate'],
  methods: {
    deleteTransaction: function (transaction) {
      var self = this

      self.$swal({
        title: 'Delete Confirmation',
        text: 'Are you sure?',
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#f86c6b',
        cancelButtonColor: '#1985ac',
        confirmButtonText: 'Delete'
      }).then(function (result) {
        if (result.value === true) {
          let deleted = self.$db.deleteTransaction(transaction)
          if (deleted) {
            self.$swal({
              title: 'Deleted',
              text: 'Transaction has been deleted.',
              type: 'success'
            })

            self.$emit('updated')
          } else {
            self.$swal({
              title: 'Failure',
              text: 'Transaction was not deleted.',
              type: 'error'
            })
          }
        }
      })
    }
  },
  filters: {
    breakWhitespaces: function (value) {
      return value.replace(/(?:\r\n|\r|\n)/g, '<br />')
    }
  }
}
</script>
