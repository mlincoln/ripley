<template>
  <v-img
    :id="`student-photo-${student.id}`"
    :alt="`Photo of ${student.firstName} ${student.lastName}`"
    :aria-label="`Photo of ${student.firstName} ${student.lastName}`"
    class="photo"
    :class="`photo-${showOnePhotoPerPage ? 1 : 'all'}`"
    cover
    eager
    :lazy-src="photoPlaceholder"
    width="72"
    transition="none"
    :src="photoUrl"
    @error="imageError"
    @load="onLoad"
  >
  </v-img>
</template>

<script setup>
import photoPlaceholder from '@/assets/images/roster_photo_placeholder.svg'
import photoUnavailable from '@/assets/images/photo_unavailable.svg'
</script>

<script>
import Context from '@/mixins/Context'

export default {
  name: 'RosterPhoto',
  mixins: [Context],
  props: {
    onLoad: {
      default: () => {},
      required: false,
      type: Function
    },
    photoUrl: {
      default: undefined,
      required: false,
      type: String
    },
    showOnePhotoPerPage: {
      required: true,
      type: Boolean
    },
    student: {
      required: true,
      type: Object
    }
  },
  data: () => ({
    imageErrored: false
  }),
  computed: {
    photoSrc() {
      if (this.imageErrored) {
        return photoUnavailable
      } else {
        return this.photoUrl
      }
    }
  },
  methods: {
    imageError() {
      this.onLoad()
      this.imageErrored = true
    }
  }
}
</script>

<style scoped>
.photo {
  margin: 0 auto;
  min-height: 96px;
}
@media print {
  .photo-all {
    height: 72px;
  }
  .photo-1 {
    height: 250px !important;
    width: 250px !important;
  }
}
</style>
