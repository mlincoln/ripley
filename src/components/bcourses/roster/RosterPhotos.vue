<template>
  <ul class="pa-0 photo-list text-center">
    <li
      v-for="student in students"
      :key="student.studentId"
      class="photo-wrapper"
      :class="showOnePhotoPerPage ? 'photo-wrapper-one-per-page' : ''"
    >
      <v-card
        :border="false"
        class="avoid-break-inside-when-print mb-2 text-center v-card-roster-photo"
        elevation="0"
      >
        <a
          :id="`student-profile-url-${student.studentId}`"
          class="text-decoration-none"
          :href="student.profileUrl || `${config.apiBaseUrl}/redirect/canvas/${currentUser.canvasSiteId}/user/${student.uid}`"
          target="_top"
        >
          <RosterPhoto
            :on-load="() => student.hasRosterPhotoLoaded = true"
            :photo-url="photoUrls[student.studentId]"
            :show-one-photo-per-page="showOnePhotoPerPage"
            :student="student"
          />
        </a>
        <v-card-title class="py-0 text-subtitle-2">
          <div v-if="!student.email" :id="`student-without-email-${student.studentId}`">
            <div class="page-roster-student-name font-weight-regular">{{ student.firstName }} </div>
            <div class="page-roster-student-name">{{ student.lastName }}</div>
          </div>
          <div v-if="student.email" class="pt-2">
            <OutboundLink :id="`student-email-${student.studentId}`" :href="`mailto:${student.email}`">
              <div class="sr-only">Email </div>
              <div class="page-roster-student-name font-weight-regular">{{ student.firstName }}</div>
              <span class="sr-only">&NonBreakingSpace;</span><div class="page-roster-student-name">{{ student.lastName }}</div>
            </OutboundLink>
          </div>
        </v-card-title>
        <v-card-text>
          <div :id="`student-id-${student.studentId}`">
            <span class="sr-only">Student ID: </span>
            {{ student.studentId }}
          </div>
          <div
            v-if="student.terms_in_attendance"
            :id="`student-terms-in-attendance-${student.studentId}`"
            class="page-roster-student-terms print-hide"
          >
            Terms: {{ student.terms_in_attendance }}
          </div>
          <div
            v-if="student.majors"
            :id="`student-majors-${student.studentId}`"
            class="page-roster-student-majors print-hide"
          >
            {{ truncate(student.majors.join(', '), {length: 50}) }}
          </div>
        </v-card-text>
      </v-card>
    </li>
  </ul>
</template>

<script>
import Context from '@/mixins/Context'
import OutboundLink from '@/components/utils/OutboundLink'
import RosterPhoto from '@/components/bcourses/roster/RosterPhoto'
import {each, trim, truncate} from 'lodash'

export default {
  name: 'RosterPhotos',
  components: {OutboundLink, RosterPhoto},
  mixins: [Context],
  props: {
    showOnePhotoPerPage: {
      required: true,
      type: Boolean
    },
    students: {
      required: true,
      type: Array
    }
  },
  data: () => ({
    context: 'canvas',
    photoUrls: {}
  }),
  watch: {
    students() {
      this.reloadPhotos()
    }
  },
  mounted() {
    this.reloadPhotosDelayed()
  },
  methods: {
    loadPhoto(student) {
      const photoUrl = trim(student.photoUrl || '')
      if (photoUrl) {
        this.photoUrls[student.studentId] = photoUrl.startsWith('http') ? photoUrl : `${this.config.apiBaseUrl}${photoUrl}`
      } else {
        this.imageError()
      }
    },
    reloadPhotos() {
      each(this.students, this.loadPhoto)
    },
    reloadPhotosDelayed() {
      // Distribute photo loading requests with a slight delay so as not to bottleneck the browser.
      let interval = 0
      each(this.students, student => {
        setTimeout(() => this.loadPhoto(student), interval)
        interval = interval + 10
      })
    },
    truncate
  }
}
</script>

<style scoped lang="scss">
.page-roster-student-name {
  display: block;
  line-height: 24px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.photo-list {
  display: block;
  margin-left: 1rem;
  padding-top: 1rem;
  width: 100%;
}
.photo-wrapper {
  display: inline-block;
  float: left;
  padding: 5px;
  width: 173px;
}

@media print {
  a[href]::after {
    content: none;
  }
  .page-roster-student-name {
    font-size: 18px;
    overflow: visible;
    text-overflow: ellipsis;
  }
  *.v-card-roster-photo {
    margin: 0 !important;
  }
  .photo-wrapper {
    width: 200px;
  }
  .photo-wrapper-one-per-page {
    display: block;
    float: none;
    page-break-after: always;
    width: 300px;
  }
  .photo-wrapper-one-per-page:last-child {
    page-break-after: avoid;
  }
}

</style>
