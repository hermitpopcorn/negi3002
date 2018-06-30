<template>
  <div class="container app-body">
    <section class="section">
      <div class="box has-text-centered" v-if="supported">
        <h2 class="has-margin-bottom-20">Database Backup</h2>
        <div class="columns">
          <div class="column">
            <button type="button" class="button is-primary" @click="selectFile()">Import</button>
            <p>Imports the database from a .db file previously exported.</p>
          </div>
          <div class="column">
            <button type="button" class="button is-primary" @click="saveBackup()">Export</button>
            <p>Exports the current database into a .db file filled with JSON data.</p>
          </div>
        </div>
      </div>
      <div class="box has-text-centered" v-if="!supported">
        Database import/export on this platform is not yet supported.
      </div>
    </section>
  </div>
</template>

<script>
export default {
  name: 'overview',
  data: function () {
    return {
      supported: true
    }
  },
  mounted: function () {
    if (typeof fileChooser === 'undefined') {
      this.supported = false
    }
  },
  methods: {
    selectFile: function () {
      var self = this

      window.fileChooser.open(function (file) {
        window.resolveLocalFileSystemURL(file.uri, function (fileEntry) {
          fileEntry.file(function (file) {
            var reader = new FileReader()
            reader.onloadend = function () {
              self.$db.database.loadJSON(this.result)
              self.$db.database.saveDatabase()
              self.$swal({
                title: 'Success',
                text: 'Database imported.',
                type: 'success'
              })
            }

            self.$swal({
              title: 'Import Confirmation',
              text: 'Are you sure? This will entirely replace the database with the one in the import file.',
              type: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#46b32c',
              cancelButtonColor: '#1985ac',
              confirmButtonText: 'Import'
            }).then(function (result) {
              if (result.value === true) {
                reader.readAsText(file)
              }
            })
          })
        }, null)
      }, function () {
        self.$swal({
          title: 'Failure',
          text: 'Failed to open file.',
          type: 'error'
        })
      })
    },

    saveBackup: function (file) {
      var self = this

      var filename = self.$appSettings.name + '_backup_' + self.$moment().format('YYYYMMDDHHmmss') + '.db'
      var data = self.$db.database.toJson()

      var failSwal = { title: 'Failure', text: 'Failed to export database.', type: 'error' }
      window.resolveLocalFileSystemURL(cordova.file.externalRootDirectory, function (directoryEntry) { // eslint-disable-line
        directoryEntry.getFile(filename, { create: true }, function (fileEntry) {
          fileEntry.createWriter(function (fileWriter) {
            fileWriter.onwriteend = function (result) {
              self.$swal({
                title: 'Success',
                text: 'Backup saved as "' + filename + '"',
                type: 'success'
              })
            }
            fileWriter.onerror = function () {
              self.$swal({
                title: 'Failure',
                text: 'Failed to write backup file.',
                type: 'error'
              })
            }
            fileWriter.write(data)
          }, function () { self.$swal(failSwal) })
        }, function () { self.$swal(failSwal) })
      }, function () { self.$swal(failSwal) })
    }
  }
}
</script>
