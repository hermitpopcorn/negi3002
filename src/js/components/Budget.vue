<template>
  <div class="container app-body">
    <section class="section">
      <div class="is-clearfix has-margin-bottom-10">
        <div class="is-pulled-right">
          <button class="button has-margin-bottom-5 is-primary" v-on:click="addNewProfile()"><i class="fa fa-plus"></i> Add New Profile</button>
        </div>
      </div>

      <div class="box">
        <div class="columns is-mobile is-vcentered">
          <div class="column has-text-centered has-text-weight-semibold is-one-third">
            Budgeting Profile
          </div>
          <div class="column">
            <div class="select is-fullwidth">
              <select v-model="selectedProfile" @change="loadProfile()">
                <template v-for="i in profiles">
                  <option v-bind:key="i.id" :value="i.id">{{ i.name }}</option>
                </template>
              </select>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section" v-if="form.show">
      <div class="box">
        <form>
          <div class="field has-text-right" v-if="profile">
            <a class="button is-danger" @click="deleteProfile(profile)"><i class="fa fa-remove"></i> Remove Profile</a>
          </div>
          <div class="field">
            <label class="label">Name</label>
            <div class="control">
              <input class="input" type="text" v-model="form.name">
            </div>
          </div>
          <hr>
          <div class="field" id="items">
            <div class="columns is-mobile">
              <div class="column has-text-weight-bold">Items</div>
              <div class="column is-narrow has-text-right">
                <a class="button is-primary" v-on:click="addNewItem()"><i class="fa fa-plus"></i></a>
              </div>
            </div>
            <div class="items">
              <div class="columns is-vcentered is-mobile">
                <div class="column is-2 has-text-weight-bold">Type</div>
                <div class="column is-5 has-text-weight-bold">Tag</div>
                <div class="column is-5 has-text-weight-bold">Expected</div>
              </div>
              <template v-for="(item, index) in form.items">
                <div class="columns is-vcentered is-mobile" v-bind:key="index">
                  <div class="column is-2">
                    <a class="button is-fullwidth" :class="{ 'is-success': item.type == 'i', 'is-danger': item.type == 'e' }" @click="switchType(index)">
                      <template v-if="item.type == 'i'">IN</template>
                      <template v-if="item.type == 'e'">EX</template>
                    </a>
                  </div>
                  <div class="column is-5">
                    <input class="input" type="text" v-model="item.tag">
                  </div>
                  <div class="column is-5">
                    <vue-numeric class="input numeric has-text-right" currency="" separator=" " :rawValue="item.expected"
                      v-model="item.expected" :minus="false" :precision="2"></vue-numeric>
                  </div>
                </div>
              </template>
            </div>
          </div>
          <div class="field">
            <div class="control has-text-right">
              <input class="button is-primary" type="submit" @click="submit" value="Save">
            </div>
          </div>
        </form>
      </div>
    </section>
  </div>
</template>

<script>
import VueNumeric from './input/Numeric.vue'

export default {
  name: 'budget',
  data: function () {
    return {
      profiles: [],
      selectedProfile: null,
      profile: null,
      form: {
        name: '',
        items: [{
          type: 'i',
          tag: '',
          expected: '0'
        }],
        block: false,
        show: false
      }
    }
  },
  components: {
    VueNumeric
  },
  created: function () {
    this.getProfiles()
  },
  methods: {
    getProfiles: function () {
      var self = this
      self.profiles = self.$db.getBudgetProfiles()
    },

    loadProfile: function () {
      var self = this

      self.$set(self.form, 'block', true)
      var profile = self.$db.getBudgetProfile(self.selectedProfile)
      if (!profile) {
        self.$swal({
          title: 'Not Found',
          text: 'Could not find budget profile with that identifier.',
          type: 'warning'
        })
        return
      }

      self.profile = profile
      self.$set(self.form, 'name', profile.name)
      self.$set(self.form, 'items', [])
      setTimeout(() => {
        self.$set(self.form, 'items', profile.items)
      }, 1000)
      self.$set(self.form, 'block', false)
      self.$set(self.form, 'show', true)

      for (let i of document.getElementsByClassName('numeric')) {
        if ('createEvent' in document) {
          var evt = document.createEvent('HTMLEvents')
          evt.initEvent('change', false, true)
          i.dispatchEvent(evt)
        } else {
          i.fireEvent('onchange')
        }
      }
    },

    addNewProfile: function () {
      var self = this

      self.$set(self.form, 'name', '')
      self.$set(self.form, 'items', [])
      setTimeout(() => {
        self.$set(self.form, 'items', [{
          type: 'i',
          tag: '',
          expected: '0'
        }])
      }, 1000)
      self.$set(self.form, 'show', true)
      self.profile = null
      self.selectedProfile = null
    },

    switchType: function (index) {
      var self = this

      let items = self.form.items
      items[index].type = items[index].type === 'i' ? 'e' : 'i'
      self.$set(self.form, 'items', items)
    },

    addNewItem: function () {
      var self = this

      let items = self.form.items
      items.push({
        type: 'i',
        tag: '',
        expected: '0'
      })
      self.$set(self.form, 'items', items)
    },

    deleteProfile: function (profile) {
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
          self.$set(self.form, 'block', true)
          let deleted = self.$db.deleteBudgetProfile(profile)
          if (deleted) {
            self.$swal({
              title: 'Deleted',
              text: 'Budget profile has been deleted.',
              type: 'success'
            })
            self.selectedProfile = null
            self.profile = null
            self.getProfiles()
            self.$set(self.form, 'block', false)
            self.$set(self.form, 'show', false)
          } else {
            self.$swal({
              title: 'Failure',
              text: 'Budget profile was not deleted.',
              type: 'error'
            })
            self.$set(self.form, 'block', false)
          }
        }
      })
    },

    submit: function () {
      var self = this

      if (self.form.block) {
        return false
      }

      self.$set(self.form, 'block', true)

      document.activeElement.blur()

      setTimeout(() => {
        var data = {
          name: self.form.name ? self.form.name : 'New Profile',
          items: []
        }
        for (let i of self.form.items) {
          if (i.tag.length < 1) { continue }
          if (i.expected <= 0) { continue }
          data.items.push(i)
        }

        if (data.items.length < 1) {
          self.$swal({
            title: 'Failure',
            text: 'Invalid budget items.',
            type: 'error'
          }).then(function () {
            self.$set(self.form, 'block', false)
          })
          return false
        }

        if (typeof self.profile === 'undefined' || self.profile === null) {
          let insert = self.$db.insertBudgetProfile(data)
          if (insert) {
            self.$swal({
              title: 'Success',
              text: 'Budget profile saved.',
              type: 'success'
            }).then(function () {
              self.getProfiles()
              self.selectedProfile = insert.id
              self.loadProfile()
              self.$set(self.form, 'block', false)
            })
          } else {
            self.$swal({
              title: 'Failure',
              text: 'Data not saved.',
              type: 'error'
            }).then(function () {
              self.$set(self.form, 'block', false)
            })
          }
        } else {
          let update = self.$db.updateBudgetProfile(self.profile, data)
          if (update) {
            self.$swal({
              title: 'Success',
              text: 'Account saved.',
              type: 'success'
            }).then(function () {
              self.getProfiles()
              self.$set(self.form, 'block', false)
            })
          } else {
            self.$swal({
              title: 'Failure',
              text: 'Data not saved.',
              type: 'error'
            }).then(function () {
              self.$set(self.form, 'block', false)
            })
          }
        }
      }, 1000)
    }
  }
}
</script>
