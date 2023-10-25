<template>
  <v-menu>
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        variant="outlined"
      >
        {{ currentUser.firstName || currentUser.uid }}
      </v-btn>
    </template>
    <v-list class="pt-3">
      <v-list-item-action
        v-for="option in options"
        :key="option.id"
      >
        <v-btn
          :id="option.id"
          variant="plain"
          @click="option.onClick"
        >
          {{ option.label }}
        </v-btn>
      </v-list-item-action>
    </v-list>
  </v-menu>
</template>

<script>
import Context from '@/mixins/Context.vue'
import {logOut} from '@/api/auth'

export default {
  name: 'AppBarMenu',
  mixins: [Context],
  data: () => ({
    options: []
  }),
  created() {
    this.addOption('my-profile', 'My Profile', this.goProfile)
    if (this.currentUser.isAdmin) {
      this.addOption('acheron-lv-426', 'Acheron (LV-426)', this.goAcheron)
    }
    const canvasSiteId = this.currentUser.canvasSiteId
    if (canvasSiteId) {
      this.addOption('current-user-canvas-site', `Canvas Site ${canvasSiteId}`, this.goCanvasSiteSummary)
    }
    this.addOption('log-out', 'Log Out', this.logOut)
  },
  methods: {
    addOption(id, label, onClick) {
      this.options.push({id, label, onClick})
    },
    goAcheron() {
      this.$router.push({path: '/acheron'})
    },
    goCanvasSiteSummary() {
      this.$router.push({path: `/canvas_site/${this.currentUser.canvasSiteId}`})
    },
    goProfile() {
      this.$router.push({path: `/profile/${this.currentUser.uid}`})
    },
    logOut() {
      this.loadingStart()
      logOut().then(data => window.location.href = data.casLogoutUrl)
    },
  }
}
</script>
