<template>
  <div v-if="!contextStore.isLoading" class="pb-4">
    <v-container v-if="appState === 'error'">
      <Header1 class="grade-export-header my-3" text="Error" />
      <div aria-live="polite">
        <v-alert
          v-if="error"
          class="my-2"
          density="compact"
          role="none"
          :text="error"
          type="warning"
        >
          <div v-if="contactSupport" class="py-1">
            Contact
            <OutboundLink class="text-white text-decoration-underline" href="https://rtl.berkeley.edu/services-programs/bcourses">bCourses support</OutboundLink>
            if you need assistance.
          </div>
        </v-alert>
      </div>
      <div v-if="showRetryOption" class="py-6 text-center">
        <v-btn
          id="retry-selection-btn"
          class="px-10"
          color="primary"
          @click="retrySelection"
        >
          Retry
        </v-btn>
      </div>
    </v-container>
    <v-container v-if="appState === 'preselection'">
      <v-row no-gutters>
        <v-col>
          <BackToGradebook />
          <Header1 class="grade-export-header my-3" text="Before exporting your E-Grades:" />
          <div id="egrades-export-step-grading-scheme">
            <h2 class="grade-export-sub-header">1. Select a grading scheme</h2>
            <div class="pb-4 pl-5 pt-2">
              <span v-if="!noGradingStandardEnabled">
                You have already set a grading scheme.
                You can view your grading scheme or select an alternate grading scheme in
                <a
                  id="canvas-course-settings-href"
                  :href="`${config.canvasApiUrl}/courses/${currentUser.canvasSiteId}/settings#tab-details`"
                  target="_top"
                >Course Settings</a>.
              </span>
              <span v-if="noGradingStandardEnabled">
                <a
                  id="canvas-course-settings-href"
                  :href="`${config.canvasApiUrl}/courses/${currentUser.canvasSiteId}/settings#tab-details`"
                  target="_top"
                >Set a grading scheme in Course Settings</a>
                and return once completed.
              </span>
              <div class="pt-1">
                For detailed instructions, see:
                <OutboundLink href="https://community.instructure.com/en/kb/articles/661121-how-do-i-enable-a-grading-scheme-for-a-course">How do I enable a grading scheme for a course?</OutboundLink>
              </div>
            </div>
          </div>
          <div id="egrades-export-step-post-grades">
            <h2 class="grade-export-sub-header">2. Post all assignment grades:</h2>
            <div class="pb-8 pl-5 pt-2">
              <div>
                All assignment grades must be posted (published/unmuted) to ensure that your E-Grades export matches what you see in the <span aria-hidden="true">gradebook</span><span class="sr-only">grade book</span>. To confirm that all grades have been posted,
                <a
                  :href="`${config.canvasApiUrl}/courses/${currentUser.canvasSiteId}/grades`"
                  target="_top"
                >
                  review all columns in your <span aria-hidden="true">gradebook</span><span class="sr-only">grade book</span> for unposted assignment grades</a>
                indicated by a crossed-out eye icon
                <span class="nowrap">
                  (<img class="grade-export-image-inline" src="@/assets/images/crossed_out_eye.png" alt="Crossed-out eye">)
                </span>
                .
              </div>
              <div class="pt-2">
                To post unposted grades:
              </div>
              <ol class="ml-6 mb-3 mt-1">
                <li>
                  Mouse over the assignment name and select the three vertical dot menu
                  <span class="nowrap">(<img class="grade-export-image-inline" src="@/assets/images/three_vertical_dots.png" alt="Three vertical dots">)</span>
                </li>
                <li>Select "Post grades"</li>
                <li>Select whether you wish to post grades for "Everyone," or only "Graded" students and click "Post"</li>
              </ol>
              <div>
                <span>
                  For detailed instructions, see: <OutboundLink href="https://community.instructure.com/en/kb/articles/660846-how-do-i-post-grades-for-an-assignment-in-the-gradebook">How do I post grades for an assignment?</OutboundLink>
                </span>
              </div>
              <div class="py-2">
                <strong>
                  In order to avoid errors, we suggest cross-checking final grades in the bCourses <span aria-hidden="true">gradebook</span><span class="sr-only">grade book</span> with the
                  output CSV to confirm grades were exported as expected.
                </strong>
              </div>
              <div>
                If you have used the
                <OutboundLink href="https://community.canvaslms.com/t5/Instructor-Guide/How-do-I-override-a-student-s-final-grade-in-the-Gradebook/ta-p/946">Final Grade Override</OutboundLink>
                feature to set student grades, the override grades will be included in the export.
              </div>
            </div>
          </div>
          <div class="d-flex flex-wrap justify-end">
            <v-btn
              id="cancel-button"
              class="mt-4 ml-3 w-100 w-sm-auto"
              variant="tonal"
              @click="goToGradebook"
            >
              Cancel<span class="sr-only"> and return to grade book</span>
            </v-btn>
            <v-btn
              id="continue-button"
              :aria-disabled="noGradingStandardEnabled ? 'true' : undefined"
              :aria-describedby="noGradingStandardEnabled ? 'egrades-export-step-grading-scheme egrades-export-step-post-grades' : undefined"
              color="primary"
              class="mt-4 ml-3 w-100 w-sm-auto"
              :class="{'v-btn--disabled': noGradingStandardEnabled}"
              @click="onContinueClick"
            >
              Continue
            </v-btn>
          </div>
        </v-col>
      </v-row>
    </v-container>
    <v-container v-if="appState === 'selection'">
      <v-row no-gutters>
        <v-col>
          <BackToGradebook />
          <Header1
            id="grade-export-header"
            class="grade-export-header my-3"
            text="Export E-Grades"
          />
        </v-col>
      </v-row>
      <v-row v-if="officialSections.length > 1" no-gutters>
        <v-col>
          <h2 class="pb-2">Select section</h2>
          <select
            id="course-sections"
            v-model="selectedSection"
            aria-label="Select Section"
            autocomplete="off"
            class="mb-3 w-fit-content"
          >
            <option :value="null">Choose...</option>
            <option v-for="section in officialSections" :key="section.canvasName" :value="section">
              {{ section.canvasName }}
            </option>
          </select>
        </v-col>
      </v-row>
      <v-row class="py-4" no-gutters>
        <v-col>
          <h2>Configure P/NP grade options</h2>
          <v-radio-group v-model="enablePnpConversion">
            <div class="my-1" :class="{'bg-surface-light': enablePnpConversion}">
              <v-radio
                id="input-enable-pnp-conversion-true"
                class="align-start pa-4"
                density="compact"
                :value="true"
              >
                <template #label>
                  <div class="grade-export-label">
                    Automatically convert letter grades in the E-Grades export to the student-selected grading option.
                  </div>
                </template>
              </v-radio>
              <div class="pb-4 pt-2 pl-8r">
                <label class="d-block" for="select-pnp-grade-cutoff">Please select the lowest passing letter grade.</label>
                <select
                  id="select-pnp-grade-cutoff"
                  v-model="selectedPnpCutoffGrade"
                  aria-label="Select the Lowest Passing Letter Grade"
                  autocomplete="off"
                  class="bg-white pr-8 w-fit-content"
                  :disabled="enablePnpConversion !== true"
                >
                  <option :value="null">Choose grade...</option>
                  <option
                    v-for="grade in ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F']"
                    :key="grade"
                    :value="grade"
                  >
                    {{ grade.replace('-', '&minus;').replace('+', '&plus;') }}
                  </option>
                </select>
              </div>
            </div>
            <div class="my-1" :class="{'bg-surface-light': !enablePnpConversion}">
              <v-radio
                id="input-enable-pnp-conversion-false"
                class="align-start pa-4"
                density="compact"
                :value="false"
              >
                <template #label>
                  <div class="grade-export-label">
                    Do not automatically convert any letter grades to P/NP. I have applied a P/NP grading scheme to
                    all grades in this course, or will manually adjust the grades in the E-Grades Export CSV to
                    reflect the student-selected grading option.
                  </div>
                </template>
              </v-radio>
            </div>
          </v-radio-group>
        </v-col>
      </v-row>
      <v-row no-gutters>
        <v-col>
          <h2>What would you like to download?</h2>
          <div class="pl-2 pt-1">
            <h3>Current Grades</h3>
            <div>
              Current grades download ignores unsubmitted assignments when calculating grades.
              Use this download when you want to excuse unsubmitted assignments.
            </div>
            <div class="py-2">
              <v-btn
                id="download-current-grades-button"
                :disabled="!selectedSection || (!!enablePnpConversion && !selectedPnpCutoffGrade)"
                color="primary"
                @click="preloadGrades('current')"
              >
                Download Current Grades
              </v-btn>
            </div>
          </div>
          <div class="pl-2 pt-1">
            <h3>Final Grades</h3>
            <div>
              Final grades download counts unsubmitted assignments as zeroes when calculating grades.
              Use this download when you want to include all unsubmitted assignments as part of the grade.
            </div>
            <div class="py-2">
              <v-btn
                id="download-final-grades-button"
                color="primary"
                :disabled="!selectedSection || (!!enablePnpConversion && !selectedPnpCutoffGrade)"
                @click="preloadGrades('final')"
              >
                Download Final Grades
              </v-btn>
            </div>
          </div>
          <div class="pb-4 pl-2 pt-3">
            For more information, see
            <OutboundLink href="https://berkeley.service-now.com/kb?id=kb_article_view&sysparm_article=KB0010659&sys_kb_id=8b7818e11b1837ccbc27feeccd4bcbbe">From bCourses to E-Grades</OutboundLink>
          </div>
        </v-col>
      </v-row>
      <v-row no-gutters>
        <v-col v-if="currentUser.canvasSiteId" class="grade-export-grade-link">
          <BackToGradebook />
        </v-col>
      </v-row>
    </v-container>
    <v-container v-if="appState === 'loading'">
      <v-row no-gutters>
        <v-col>
          <Header1 class="grade-export-header mb-3 mt-2" text="Preparing E-Grades for Download" />
        </v-col>
      </v-row>
      <div class="align-center d-flex ma-3">
        <v-progress-circular
          class="mr-3"
          color="primary"
          indeterminate
          size="small"
        />
        <div aria-atomic="true" aria-live="polite" class="job-progress text-subtitle-1">The job {{ jobStatus === 'started' ? 'has' : 'is' }} {{ jobStatus }}</div>
      </div>
    </v-container>
  </div>
</template>

<script setup>
import {onBeforeUnmount, onMounted, ref} from 'vue'
import BackToGradebook from '@/components/bcourses/egrades/BackToGradebook.vue'
import Header1 from '@/components/utils/Header1.vue'
import OutboundLink from '@/components/utils/OutboundLink'
import {alertScreenReader, getTermName, iframeParentLocation, iframeScrollToTop, isInIframe, putFocusNextTick} from '@/utils'
import {downloadGradeCsv, getExportJobStatus, getExportOptions, prepareGradesCacheJob} from '@/api/egrades-export'
import {useContextStore} from '@/stores/context'

const contextStore = useContextStore()
const config = contextStore.config
const currentUser = contextStore.currentUser
const appState = ref(null)
const error = ref(null)
const backgroundJobId = ref(null)
const contactSupport = ref(false)
const enablePnpConversion = ref(false)
const exportTimer = ref(null)
const filenameDownloaded = ref(false)
const jobStatus = ref(null)
const noGradingStandardEnabled = ref(false)
const officialSections = ref([])
const selectedPnpCutoffGrade = ref(null)
const selectedSection = ref(null)
const selectedType = ref(null)
const showRetryOption = ref(null)

onBeforeUnmount(() => {
  clearInterval(exportTimer.value)
})
onMounted(() => {
  loadExportOptions().then(() => {
    contextStore.loadingComplete()
  })
})

const downloadGrades = () => {
  const termId = selectedSection.value.termId
  const termName = getTermName(termId).toLowerCase().replace(' ', '-')
  filenameDownloaded.value = `egrades-${selectedType.value}-${selectedSection.value.id}-${termName}-${currentUser.canvasSiteId}.csv`
  downloadGradeCsv(filenameDownloaded.value, backgroundJobId.value).then(() => {
    setTimeout(() => {
      filenameDownloaded.value = null
      alertScreenReader('File download is complete.')
    }, 30000)
  })
}

const goToGradebook = () => {
  const gradebookUrl = `${config.canvasApiUrl}/courses/${currentUser.canvasSiteId}/grades`
  if (isInIframe) {
    iframeParentLocation(gradebookUrl)
  } else {
    window.location.href = gradebookUrl
  }
}

const onContinueClick = () => {
  if (noGradingStandardEnabled.value) {
    return
  }
  switchToSelection()
}

const initializePnpCutoffGrades = () => {
  enablePnpConversion.value = true
  selectedPnpCutoffGrade.value = null
}

const loadExportOptions = () => {
  return getExportOptions(false).then(
    data => {
      loadSectionTerms(data.sectionTerms)
      if (appState.value !== 'error') {
        loadOfficialSections(data.officialSections)
      }
      if (appState.value !== 'error') {
        appState.value = 'preselection'
        if (!data.gradingStandardEnabled) {
          noGradingStandardEnabled.value = true
        }
        initializePnpCutoffGrades()
      }
    },
    errorMessage => {
      appState.value = 'error'
      error.value = errorMessage
    }
  )
}

const loadOfficialSections = officialSectionsResponse => {
  if (!officialSectionsResponse || !officialSectionsResponse.length) {
    appState.value = 'error'
    error.value = 'None of the sections within this course site are associated with UC Berkeley course catalog sections.'
    contactSupport.value = true
  } else {
    officialSections.value = officialSectionsResponse
    if (officialSectionsResponse.length === 1) {
      selectedSection.value = officialSectionsResponse[0]
    } else {
      selectedSection.value = null
    }
  }
}

const loadSectionTerms = sectionTerms => {
  if (!sectionTerms.length) {
    appState.value = 'error'
    error.value = 'No sections found in this course representing a currently maintained campus term.'
    contactSupport.value = true
  } else if (sectionTerms.length > 1) {
    appState.value = 'error'
    error.value = 'This course site contains sections from multiple terms. Only sections from a single term should be present.'
    contactSupport.value = true
  }
}

const preloadGrades = type => {
  filenameDownloaded.value = null
  selectedType.value = type
  alertScreenReader('Preparing E-Grades for download.', 'assertive')
  appState.value = 'loading'
  jobStatus.value = 'started'
  iframeScrollToTop()
  const pnpCutoff = !enablePnpConversion.value ? 'ignore' : encodeURIComponent(selectedPnpCutoffGrade.value)
  prepareGradesCacheJob(
    selectedType.value,
    pnpCutoff,
    selectedSection.value.id,
    selectedSection.value.termId
  ).then(
    data => {
      backgroundJobId.value = data.jobId
      startExportJob()
    },
    errorMessage => {
      appState.value = 'error'
      error.value = errorMessage || 'E-Grades job preparation failed.'
      showRetryOption.value = true
      contactSupport.value = true
    }
  )
}

const retrySelection = () => {
  appState.value = 'selection'
  contactSupport.value = false
  error.value = null
  showRetryOption.value = false
}

const startExportJob = () => {
  exportTimer.value = setInterval(() => {
    getExportJobStatus(backgroundJobId.value).then(
      data => {
        jobStatus.value = data.jobStatus
        if (['canceled', 'deferred', 'failed', 'stopped'].includes(jobStatus.value)) {
          clearInterval(exportTimer.value)
          switchToSelection()
          error.value = `Sorry, the eGrades download ${jobStatus.value === 'failed' ? 'has' : 'was'} ${jobStatus.value}.`
          contactSupport.value = true
          appState.value = 'error'
        } else if (jobStatus.value === 'finished') {
          clearInterval(exportTimer.value)
          switchToSelection()
          alertScreenReader('Downloading export. Export form options presented for an additional download.')
          downloadGrades()
        } else if (config.isVueAppDebugMode) {
          // eslint-disable-next-line no-console
          console.log(`[DEBUG] jobStatus: ${jobStatus.value}`)
        }
      },
      errorMessage => {
        error.value = errorMessage
      }
    )
  }, 2000)
}

const switchToSelection = () => {
  iframeScrollToTop()
  appState.value = 'selection'
  putFocusNextTick('grade-export-header')
}
</script>

<style scoped lang="scss">
.grade-export-header {
  font-size: 1.438rem;
  font-weight: 400;
}
.grade-export-label {
  padding: 0.1rem 0 0 0.5rem;
}
.grade-export-sub-header {
  font-size: 1.25rem;
  font-weight: 400;
}
.grade-export-image-inline {
  height: 1rem;
  vertical-align: text-bottom;
}
.job-progress:after {
  animation: ellipsis steps(4,end) 1800ms infinite;
  content: "\2026";
  display: inline-block;
  overflow: hidden;
  vertical-align: bottom;
  width: 0;
  -webkit-animation: ellipsis steps(4,end) 1800ms infinite;
}
@keyframes ellipsis {
  to {
    width: 1.25em;
  }
}
</style>
