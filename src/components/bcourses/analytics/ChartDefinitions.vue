<template>
  <v-expand-transition>
    <v-card
      v-show="isExpanded"
      :id="id"
      class="w-100 pb-2"
      color="transparent"
      rounded="0"
      variant="flat"
    >
      <hr aria-hidden="true" class="mb-3" />
      <v-card-title>
        <h3 class="font-weight-medium">Chart Definitions</h3>
      </v-card-title>
      <v-card-text>
        <dl class="font-size-13">
          <template v-if="showDemographics">
            <template class="d-block my-2">
              <dt class="font-italic d-inline">Female / Male / Decline to State, Different Identity, Genderqueer/Gender Non-Conform</dt>&mdash;<dd class="d-inline">the student's gender in the student information system</dd>
            </template>
            <template class="d-block my-2">
              <dt class="font-italic d-inline">Underrepresented Minority Students</dt>&mdash;<dd class="d-inline">identified as African American, Chicano/Latino, Native American/Alaska Native, or Pacific Islander</dd>
            </template>
            <template class="d-block my-2">
              <dt class="font-italic d-inline">International Students</dt>&mdash;<dd class="d-inline">students with a valid VISA status. Includes both self-reported and verified data</dd>
            </template>
            <template class="d-block my-2">
              <dt class="font-italic d-inline">Transfer Students</dt>&mdash;<dd class="d-inline">students who completed coursework during a regular session at another college or university after high school</dd>
            </template>
            <template class="d-block my-2">
              <dt class="font-italic d-inline">Student Athletes</dt>&mdash;<dd class="d-inline">data is only available for active students, so these values may change over time</dd>
            </template>
            <template class="d-block my-2">
              <dt class="font-italic d-inline">Grade Scales</dt>&mdash;
              <dd class="d-inline">
                <OutboundLink href="https://registrar.berkeley.edu/faculty-staff/grading/grading-policies-reports">grade definitions</OutboundLink> as described by the Office of the Registrar (excluding P, NP, I, S, U, IP, NR, M, and RD grades)
              </dd>
            </template>
          </template>
          <template v-else>
            <template class="d-block my-2">
              <dt class="font-italic d-inline">Grade Scales</dt>&mdash;
              <dd class="d-inline">
                <OutboundLink href="https://registrar.berkeley.edu/faculty-staff/grading/grading-policies-reports">grade definitions</OutboundLink> as described by the Office of the Registrar (excluding S, U, IP, NR, M, and RD grades)
              </dd>
            </template>
          </template>
        </dl>
      </v-card-text>
    </v-card>
  </v-expand-transition>
</template>

<script>
import OutboundLink from '@/components/utils/OutboundLink'

export default {
  name: 'ChartDefinitions',
  components: {OutboundLink},
  props: {
    id: {
      default: 'grade-distribution-chart-definitions',
      required: true,
      type: String
    },
    isExpanded: {
      required: false,
      type: Boolean
    },
    showDemographics: {
      required: false,
      type: Boolean
    }
  }
}
</script>
