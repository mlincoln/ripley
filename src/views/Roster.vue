<template>
  <div>
    <Header1 id="page-title" class="sr-only" text="Roster Photos" />
    <div class="display-none-when-print">
      <v-alert
        v-if="error"
        class="ma-2"
        :closable="false"
        density="compact"
        role="alert"
        type="warning"
      >
        {{ error }}
      </v-alert>
    </div>
    <div v-if="!isLoading && roster">
      <v-alert
        v-if="success"
        class="ma-2"
        :closable="true"
        density="compact"
        role="alert"
        type="success"
      >
        {{ success }}
      </v-alert>
      <v-container v-if="!error" fluid>
        <v-row align-v="center" class="display-none-when-print">
          <v-col
            class="pr-2 roster-column-when-print"
            md="3"
            sm="12"
          >
            <label for="roster-search" class="sr-only">Input automatically searches upon text entry</label>
            <v-text-field
              id="roster-search"
              v-model="search"
              aria-label="Search people by name or S I D"
              density="compact"
              hide-details
              placeholder="Search People"
              type="search"
              variant="outlined"
            />
          </v-col>
          <v-col md="5" sm="12">
            <div v-if="roster.sections">
              <select
                id="section-select"
                v-model="selectedSectionId"
                aria-label="Search specific section (defaults to all sections)"
                @change="onSelectSection"
              >
                <option :value="null">All Sections</option>
                <option
                  v-for="(section, index) in roster.sections"
                  :key="index"
                  :value="section.id"
                >
                  {{ section.name }}
                </option>
              </select>
            </div>
          </v-col>
          <v-col class="pt-3" md="4" sm="12">
            <div class="d-flex flex-wrap float-right">
              <div class="pr-2">
                <v-btn
                  id="download-csv"
                  :disabled="isDownloading || !students.length"
                  size="large"
                  variant="outlined"
                  @click="downloadCsv"
                >
                  <v-icon class="pr-2" :icon="mdiDownload" />
                  Export<span class="sr-only"> CSV file</span>
                </v-btn>
              </div>
              <div>
                <v-tooltip
                  v-model="showPrintButtonTooltip"
                  :attach="true"
                  :eager="false"
                  location="top"
                  :open-on-focus="true"
                  :text="printButtonTooltip"
                >
                  <template #activator="{props}">
                    <v-btn
                      id="print-roster"
                      color="primary"
                      :disabled="disablePrintButton"
                      size="large"
                      v-bind="props"
                      @click="printRoster"
                    >
                      <v-icon class="pr-2 text-white" :icon="mdiPrinter" />
                      Print<span class="sr-only"> roster of students</span>
                    </v-btn>
                  </template>
                </v-tooltip>
              </div>
            </div>
          </v-col>
        </v-row>
        <v-row no-gutters class="display-none-when-print" justify="end">
          <div class="d-flex flex-wrap float-right pr-2">
            <v-checkbox
              v-model="showOnePhotoPerPage"
              label="Print one student per page"
              density="comfortable"
            >
            </v-checkbox>
          </div>
        </v-row>
        <v-row v-if="students.length">
          <v-col role="alert" aria-live="polite" class="py-1 display-none-when-print">{{ pluralize('student', students.length, {0: 'No', 1: 'One'}) }} found</v-col>
        </v-row>
        <v-row no-gutters>
          <v-col sm="12">
            <RosterPhotos
              v-if="students.length"
              :students="students"
              :show-one-photo-per-page="showOnePhotoPerPage"
            />
            <div v-if="!roster.students.length" role="alert" aria-live="polite">
              <v-icon class="icon-gold" :icon="mdiAlertCircleOutline" />
              Students have not yet signed up for this class.
            </div>
            <div v-if="roster.students.length && !students.length" role="alert" aria-live="polite">
              <v-icon class="icon-gold" :icon="mdiAlertCircleOutline" />
              No students found matching your query.
            </div>
          </v-col>
        </v-row>
      </v-container>
    </div>
  </div>
</template>

<script setup>
import Header1 from '@/components/utils/Header1.vue'
import RosterPhotos from '@/components/bcourses/roster/RosterPhotos'
import {mdiAlertCircleOutline, mdiDownload, mdiPrinter} from '@mdi/js'
</script>

<script>
import Context from '@/mixins/Context'
import {each, filter, map, size, trim} from 'lodash'
import {exportRoster, getRoster} from '@/api/canvas-site'
import {printPage, pluralize} from '@/utils'

export default {
  name: 'Roster',
  mixins: [Context],
  data: () => ({
    error: undefined,
    isDownloading: false,
    showOnePhotoPerPage: false,
    printButtonTooltip: 'You can print once student images have loaded.',
    roster: undefined,
    search: undefined,
    selectedSectionId: null,
    showTooltip: true,
    students: undefined,
    success: undefined
  }),
  computed: {
    disablePrintButton() {
      return !size(this.students) || !!this.students.find(s => !s.hasRosterPhotoLoaded)
    },
    showPrintButtonTooltip: {
      get() {
        return !this.isLoading && this.showTooltip && this.disablePrintButton
      },
      set(value) {
        if (!value) {
          this.showTooltip = false
        }
      }
    }
  },
  watch: {
    search() {
      this.recalculateStudents()
    }
  },
  created() {
    if (this.currentUser.isTeaching || this.currentUser.isAdmin) {
      getRoster(this.currentUser.canvasSiteId).then(
        data => {
          this.roster = data
          this.students = this.roster.students
          each(this.students, s => s.idx = this.idx(`${s.firstName} ${s.lastName} ${s.studentId}`))
          // If student count is low then tooltip is not necessary.
          const threshold = 36
          this.showPrintButtonTooltip = (this.students.length >= threshold) && this.disablePrintButton
        },
        error => this.error = error
      ).finally(() => this.$ready())
    } else {
      this.error = 'You must be a teacher in this bCourses course to view official student rosters.'
      this.$ready()
    }
  },
  methods: {
    downloadCsv() {
      this.isDownloading = true
      exportRoster(this.currentUser.canvasSiteId).then(() => {
        this.alertScreenReader(`${this.roster.canvasSiteName} CSV downloaded`)
        setTimeout(() => this.isDownloading = false, 1500)
      })
    },
    onSelectSection() {
      this.recalculateStudents()
    },
    recalculateStudents() {
      const normalizedPhrase = this.idx(this.search)
      if (normalizedPhrase || this.selectedSectionId) {
        this.students = filter(this.roster.students, student => {
          let showStudent = !normalizedPhrase || student.idx.includes(normalizedPhrase)
          if (this.selectedSectionId) {
            showStudent = showStudent && map(student.sections || [], 'id').includes(this.selectedSectionId)
          }
          return showStudent
        })
        this.alertScreenReader(`${this.students.length} student${this.students.length === 1 ? '' : 's'} shown.`)
      } else {
        this.students = this.roster.students
      }
    },
    idx(value) {
      return value && trim(value).replace(/[^\w\s]/gi, '').toLowerCase()
    },
    pluralize,
    printRoster() {
      printPage(`${this.idx(this.currentUser.canvasSiteName).replace(/\s/g, '-')}_roster`)
    }
  }
}
</script>

<style scoped lang="scss">
select {
  height: 44px;
}
@media print {
  .roster-column-when-print {
    padding: 0;
  }
}
</style>
