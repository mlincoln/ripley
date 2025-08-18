<template>
  <div class="grade-distribution pa-5">
    <div v-if="!contextStore.isLoading">
      <div class="d-flex justify-space-between">
        <Header1 text="Grade Distribution" class="mb-0" />
        <div>
          <v-switch
            v-if="currentUser.isAdmin"
            v-model="isDemoMode"
            color="primary"
            density="comfortable"
            hide-details
            label="Demo mode"
            :ripple="false"
          />
        </div>
      </div>
      <v-alert
        v-if="errorMessage"
        class="font-weight-medium my-3"
        role="alert"
        :text="errorMessage"
        type="warning"
      />
      <div v-if="gradeDistribution">
        <div
          v-if="gradeDistribution"
          class="course-header mb-1"
        >
          <span :class="{'demo-mode-blur': isDemoMode}">{{ gradeDistribution.courseName }}</span> &mdash; {{ gradeDistribution.canvasSite.term.name }}
        </div>
        <div v-html="contextStore.config.newtInformationBlock" />
        <v-card class="container mb-4" elevation="0">
          <DemographicsChart
            :course-name="gradeDistribution.courseName"
            :grade-distribution="gradeDistribution.demographics"
            :is-demo-mode="isDemoMode"
          />
        </v-card>
        <v-card class="container mb-4" elevation="0">
          <PriorEnrollmentChart
            :course-name="gradeDistribution.courseName"
            :grade-distribution="gradeDistribution.enrollments"
            :is-demo-mode="isDemoMode"
            :terms="orderBy(gradeDistribution.terms, ['id'], ['desc'])"
          />
        </v-card>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import DemographicsChart from '@/components/bcourses/analytics/DemographicsChart.vue'
import Header1 from '@/components/utils/Header1.vue'
import PriorEnrollmentChart from '@/components/bcourses/analytics/PriorEnrollmentChart.vue'
import {getGradeDistribution} from '@/api/grade-distribution'
import {onMounted, ref, watch} from 'vue'
import {orderBy, toString} from 'lodash'
import {useContextStore} from '@/stores/context'

const contextStore = useContextStore()
const currentUser = contextStore.currentUser
const errorMessage = ref()
const gradeDistribution = ref()
const isDemoMode = ref<boolean>(currentUser.isAdmin && localStorage.getItem('isDemoMode') === 'true')

watch(isDemoMode, (value: boolean) => {
  if (currentUser.isAdmin) {
    localStorage.setItem('isDemoMode', toString(value))
  }
})

contextStore.loadingStart()

onMounted(() => {
  getGradeDistribution(currentUser.canvasSiteId).then(
    data => {
      gradeDistribution.value = data
    },
    error => {
      errorMessage.value = error
    }
  ).catch(error => {
    errorMessage.value = error
  }).finally(() => contextStore.loadingComplete())
})
</script>

<!-- eslint-disable-next-line vue-scoped-css/enforce-style-type  -->
<style lang="scss">
.grade-distribution {
  .course-header {
    color: $color-nobel;
    font-size: 17px;
    font-weight: 400;
  }
  .demo-mode-blur {
    color: transparent !important;
    text-shadow: 0 0 15px rgba(0, 0, 0, 0.7) !important;
  }
  .grade-distribution-table-border {
    border-left: solid 1px $color-container-grey-border;
  }
  .pilot-notice {
    font-size: 15px;
    font-weight: 600;
  }
  h2 {
    font-weight: 500;
  }
  hr {
    border-color: $color-grey !important;
    border-style: solid none solid none !important;
    color: $color-grey !important;
  }
  table {
    caption {
      color: $color-body-black !important;
    }
    tbody tr:hover {
      background-color: $color-table-cell-bg-grey;
    }
    th {
      vertical-align: bottom;
    }
  }
}
</style>
