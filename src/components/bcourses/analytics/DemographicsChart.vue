<template>
  <div class="grade-distribution-demographics pa-5">
    <h2 id="grade-distribution-demographics-header">Grade Average by Demographics</h2>
    <div>
      The grade average chart displays the class average grade point equivalent at the end of the current
      and prior semesters. Select a demographic to compare average grade point trends.
    </div>
    <v-row no-gutters>
      <v-col
        class="pr-4"
        cols="12"
        md="4"
        sm="6"
      >
        <select
          id="grade-distribution-demographics-select"
          v-model="selectedDemographic"
          class="grade-distribution-demographics-select justify-center w-100 my-4"
          :disabled="!size(gradeDistribution)"
          @change="onSelectDemographic"
        >
          <option :value="null">Select Demographic</option>
          <template v-for="(group, key) in demographicOptions" :key="key">
            <option
              :id="`grade-distribution-demographics-option-${key}`"
              :disabled="!size(group.options) || (!config.newtShowOtherGender && key === 'genders.other')"
              :value="{'group': key, 'option': get(group.options, 0)}"
            >
              {{ group.label }}
            </option>
          </template>
        </select>
      </v-col>
      <v-col
        class="align-self-end d-flex justify-center px-2"
        cols="12"
        md="4"
        sm="6"
      >
        <v-btn
          id="grade-distribution-demographics-show-defs-btn"
          aria-controls="grade-distribution-demographics-definitions"
          :aria-expanded="showChartDefinitions"
          aria-haspopup="true"
          class="font-weight-medium text-no-wrap my-2"
          color="primary"
          :prepend-icon="showChartDefinitions ? mdiArrowUpCircle : mdiArrowDownCircle"
          size="large"
          variant="text"
          @click="showChartDefinitions = !showChartDefinitions"
        >
          {{ showChartDefinitions ? 'Hide' : 'Show' }} Chart Definitions
        </v-btn>
      </v-col>
    </v-row>
    <v-row class="d-flex justify-center" no-gutters>
      <ChartDefinitions id="grade-distribution-demographics-definitions" :is-expanded="showChartDefinitions" :show-demographics="true" />
    </v-row>
    <hr aria-hidden="true" class="mb-3" />
    <highcharts :options="chartSettings"></highcharts>
    <v-row class="d-flex justify-center">
      <v-btn
        id="grade-distribution-demographics-show-btn"
        aria-controls="grade-distribution-demo-table-container"
        :aria-expanded="showTable"
        aria-haspopup="true"
        class="font-weight-medium text-no-wrap my-2"
        color="primary"
        :disabled="!size(gradeDistribution)"
        :prepend-icon="showTable ? mdiArrowUpCircle : mdiArrowDownCircle"
        size="large"
        variant="text"
        @click="showTable = !showTable"
      >
        {{ showTable ? 'Hide' : 'Show' }} Data Table
      </v-btn>
    </v-row>
    <v-row class="d-flex justify-center">
      <v-expand-transition>
        <v-card
          v-show="showTable"
          id="grade-distribution-demo-table-container"
          class="pb-2"
          width="700"
        >
          <table id="grade-distribution-demo-table" class="border-0 border-t">
            <caption class="font-weight-bold font-size-16 py-3">Class Grade Average by Semester</caption>
            <thead class="bg-grey-lighten-4">
              <tr>
                <th class="font-weight-bold pl-4 py-2" scope="col">Semester</th>
                <th class="grade-distribution-table-border font-weight-bold py-2" scope="col">Class Grade Average</th>
                <th class="text-right font-weight-bold py-2" scope="col">Class Grade Count</th>
                <th
                  v-if="size(chartSettings.series) > 1"
                  class="grade-distribution-table-border font-weight-bold py-2"
                  scope="col"
                >
                  {{ selectedDemographicLabel }} Grade Average
                </th>
                <th
                  v-if="size(chartSettings.series) > 1"
                  class="text-right font-weight-bold py-2"
                  scope="col"
                >
                  {{ selectedDemographicLabel }} Grade Count
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(term, index) in chartSettings.xAxis.categories"
                :id="`grade-distribution-demo-table-row-${index}`"
                :key="index"
              >
                <td
                  :id="`grade-distro-demo-table-row-${index}-term`"
                  class="text-no-wrap pl-4 py-1"
                  scope="row"
                >
                  {{ gradeDistribution[index].termName }}
                </td>
                <td :id="`grade-distro-demo-table-row-${index}-grade-0`" class="py-1">{{ chartSettings.series[0]['data'][index].y }}</td>
                <td :id="`grade-distro-demo-table-row-${index}-count-0`" class="text-right py-1">{{ chartSettings.series[0]['data'][index].custom.count }}</td>
                <td
                  v-if="size(chartSettings.series) > 1"
                  :id="`grade-distro-demo-table-row-${index}-grade-1`"
                  class="py-1"
                >
                  {{ chartSettings.series[1]['data'][index].y || 'No data' }}
                </td>
                <td
                  v-if="size(chartSettings.series) > 1"
                  :id="`grade-distro-demo-table-row-${index}-count-1`"
                  class="text-right py-1"
                >
                  {{ chartSettings.series[1]['data'][index].custom.count || 'No data' }}
                </td>
              </tr>
            </tbody>
          </table>
        </v-card>
      </v-expand-transition>
    </v-row>
  </div>
</template>

<script setup>
import {mdiArrowDownCircle, mdiArrowUpCircle} from '@mdi/js'
</script>

<script>
import {Chart} from 'highcharts-vue'
import ChartDefinitions from '@/components/bcourses/analytics/ChartDefinitions'
import Context from '@/mixins/Context'
import {cloneDeep, each, get, replace, round, size} from 'lodash'

export default {
  name: 'DemographicsChart',
  components: {
    highcharts: Chart,
    ChartDefinitions
  },
  mixins: [Context],
  props: {
    chartDefaults: {
      required: true,
      type: Object
    },
    colors: {
      required: true,
      type: Object
    },
    courseName: {
      required: true,
      type: String
    },
    gradeDistribution: {
      required: true,
      type: Object
    },
    isDemoMode: {
      required: false,
      type: Boolean
    }
  },
  data: () => ({
    chartSettings: {},
    demographicOptions: {
      divider1: {
        label: '─────',
        options: []
      },
      'genders.female': {
        label: 'Female Students',
        options: []
      },
      'genders.male': {
        label: 'Male Students',
        options: []
      },
      'genders.other': {
        label: 'Gender: Decline to State, Different Identity, or Genderqueer/Gender Non-Conform',
        options: []
      },
      divider2: {
        label: '─────',
        options: []
      },
      underrepresentedMinorityStatus: {
        label: 'Underrepresented Minority Students',
        options: []
      },
      internationalStatus: {
        label: 'International Students',
        options: []
      },
      transferStatus: {
        label: 'Transfer Students',
        options: []
      },
      athleteStatus: {
        label: 'Student Athletes',
        options: []
      },
    },
    selectedDemographic: null,
    showChartDefinitions: false,
    showTable: false
  }),
  computed: {
    selectedDemographicLabel() {
      const group = get(this.selectedDemographic, 'group')
      const option = get(this.demographicOptions, group)
      return get(option, 'label')
    }
  },
  watch: {
    isDemoMode() {
      this.setTooltipFormatter()
    }
  },
  created() {
    this.chartSettings = cloneDeep(this.chartDefaults)
    this.chartSettings.chart.type = 'line'
    this.chartSettings.legend.squareSymbol = false
    this.chartSettings.legend.symbolHeight = 3
    this.chartSettings.plotOptions.series.lineWidth = 3
    this.chartSettings.title.text = 'Class Grade Average by Semester'
    this.chartSettings.tooltip.distance = 20
    this.chartSettings.yAxis.labels.format = '{value:.1f}'
    this.chartSettings.yAxis.max = 4
    this.chartSettings.yAxis.min = 0
    this.chartSettings.yAxis.tickInterval = 1
    this.collectDemographicOptions()
    this.setTooltipFormatter()
    this.loadPrimarySeries()
  },
  methods: {
    collectDemographicOptions() {
      each(this.gradeDistribution, item => {
        each(item, (values, category) => {
          let option = get(this.demographicOptions, category)
          if (option && !size(option['options'])) {
            option['options'] = ['true']
          } else if (category === 'genders') {
            each(values, (vals, subcategory) => {
              option = get(this.demographicOptions, `${category}.${subcategory}`)
              if (option && !size(option['options'])) {
                option['options'] = ['true']
              }
            })
          }
        })
      })
    },
    get,
    getSeriesMarker(series) {
      return {
        'fillColor': 'white',
        'lineColor': series.color,
        'lineWidth': 3,
        'radius': 5,
        'symbol': 'circle'
      }
    },
    loadPrimarySeries() {
      this.chartSettings.colors = [this.colors.primary, this.colors.secondary]
      this.chartSettings.legend.enabled = size(this.gradeDistribution)
      this.chartSettings.series[0].color = this.colors.primary
      this.chartSettings.series[0].legendSymbol = 'rectangle'
      this.chartSettings.series[0].marker = this.getSeriesMarker(this.chartSettings.series[0])
      this.chartSettings.series[0].name = 'Overall Class Avg Grade'
      each(this.gradeDistribution, item => {
        this.chartSettings.series[0].data.push({
          color: this.colors.primary,
          custom: {count: item.count},
          y: round(item.averageGradePoints, 1)
        })
        this.chartSettings.xAxis.categories.push(this.shortTermName(item.termName))
      })
    },
    onSelectDemographic() {
      if (this.selectedDemographic) {
        const group = get(this.selectedDemographic, 'group')
        const option = get(this.selectedDemographic, 'option')
        const secondarySeries = {
          color: this.colors.secondary,
          data: [],
          legendSymbol: 'rectangle',
          marker: this.getSeriesMarker(this.colors.secondary),
          name: `${this.selectedDemographicLabel} Avg Grade`
        }
        each(this.gradeDistribution, item => {
          const value = get(item, `${group}.${option}`) || get(item, `${group}`)
          const count = get(value, 'count', 0)
          secondarySeries.data.push({
            custom: {
              count: count === null ? 'Small sample size' : count
            },
            dataLabels: {
              enabled: false
            },
            y: round(get(value, 'averageGradePoints', 0), 1)
          })
        })
        this.chartSettings.series[1] = secondarySeries
      } else if (this.chartSettings.series.length > 1) {
        this.chartSettings.series.pop()
      }
    },
    setTooltipFormatter() {
      const courseName = this.courseName
      const isDemoMode = this.isDemoMode
      this.chartSettings.tooltip.formatter = function () {
        const header = `<div id="grade-dist-demo-tooltip-term" class="font-weight-bold font-size-15">${this.x}</div>
            <div id="grade-dist-demo-tooltip-course" class="font-size-13 text-grey-darken-1 ${isDemoMode ? 'demo-mode-blur' : ''}">${courseName}</div>
            <hr aria-hidden="true" class="mt-1 grade-dist-tooltip-hr" />`
        return (this.points || []).reduce((tooltipText, point, index) => {
          return`${tooltipText}<div id="grade-dist-demo-tooltip-series-${index}" class="font-size-13 mt-1">
            <span aria-hidden="true" class="font-size-16" style="color:${point.color}">\u25AC</span>
            ${point.series.name}: <span class="font-weight-bold">${point.y}</span>
          </div>`
        }, header)
      }
    },
    shortTermName(termName) {
      return replace(termName, /[\d]{4}/g, year => {
        return `'${year.substring(2, 4)}`
      })
    },
    size
  }
}
</script>

<!-- eslint-disable-next-line vue-scoped-css/enforce-style-type  -->
<style lang="scss">
.grade-distribution-demographics .highcharts-legend .highcharts-point {
  y: 12;
}
</style>

<style scoped>
.grade-distribution-demographics-select {
  min-width: 180px;
}
</style>
