import utils from '@/api/api-utils'
import _ from 'lodash'

export function downloadGradeCsv(canvasSiteId: number, ccn: string, termCode: string, termYear: string, type: string, pnpCutoff: string) {
  const queryParams = [
    `ccn=${ccn}`,
    `term_cd=${termCode}`,
    `term_yr=${termYear}`,
    `type=${type}`,
    `pnp_cutoff=${pnpCutoff}`
  ].join('&')
  const filename = `egrades-${type}-${ccn}-${utils.termCodeToName(termCode)}-${termYear}-${canvasSiteId}.csv`
  return utils.downloadViaGet(`/api/canvas_site/${canvasSiteId}/egrade_export/download?${queryParams}`, filename, true)
}

export function getExportOptions(canvasSiteId: number) {
  return utils.get(`/api/canvas_site/${canvasSiteId}/egrade_export/options`, true)
}

export function getExportJobStatus(canvasSiteId: number, jobId: string) {
  return utils.get(`/api/canvas_site/${canvasSiteId}/egrade_export/status?jobId=${jobId}`, true)
}

export function prepareGradesCacheJob(canvasSiteId: number) {
  return utils.post(`/api/canvas_site/${canvasSiteId}/egrade_export/prepare`, {}, true)
}

export function getCanvasSite(canvasSiteId: number) {
  return utils.get(`/api/canvas_site/${canvasSiteId}`, false)
}

export function getRoster(canvasSiteId: number, redirectOnError?: boolean) {
  return utils.get(`/api/canvas_site/${canvasSiteId}/roster`, redirectOnError)
}

export function getRosterCsv(canvasSiteId: number) {
  return utils.downloadViaGet(
    `/api/canvas_site/${canvasSiteId}/roster_csv`,
    `course_${canvasSiteId}_rosters.csv`
  )
}

export function getCourseProvisioningMetadata() {
  return utils.get('/api/canvas_site/provision')
}

export function courseCreate(
  adminActingAs: string,
  adminByCcns: string[],
  adminTermSlug: string,
  ccns: string[],
  siteAbbreviation: string,
  siteName: string,
  termSlug: string
) {
  return utils.post('/api/canvas_site/provision/create', {
    admin_acting_as: adminActingAs,
    admin_by_ccns: adminByCcns,
    admin_term_slug: adminTermSlug,
    ccns,
    siteAbbreviation,
    siteName,
    termSlug
  })
}

export function createProjectSite(name: string) {
  return utils.post('/api/canvas_site/project_provision/create',{name})
}

export function courseProvisionJobStatus(jobId: number) {
  return utils.get(`/api/canvas_site/provision/status?jobId=${jobId}`)
}

export function getCourseSections(canvasSiteId: number) {
  return utils.get(`/api/canvas_site/${canvasSiteId}/provision/sections`)
}

export function getSections(
  adminActingAs: string,
  adminByCcns: number[],
  adminMode: string,
  currentSemester: string,
  isAdmin: boolean
) {
  let feedUrl = '/api/canvas_site/provision'
  if (isAdmin) {
    if (adminMode === 'act_as' && adminActingAs) {
      feedUrl = '/api/canvas_site/provision_as/' + adminActingAs
    } else if ((adminMode !== 'act_as') && adminByCcns) {
      feedUrl = `/api/canvas_site/provision?admin_term_slug=${currentSemester}`
      _.each(adminByCcns, ccn => feedUrl += `&admin_by_ccns[]=${ccn}`)
    }
  }
  return utils.get(feedUrl)
}

export function updateSiteSections(
  canvasSiteId: string,
  addCcns: string[],
  deleteCcns: string[],
  updateCcns: string[]
) {
  return utils.post(`/api/canvas_site/${canvasSiteId}/provision/edit_sections`, {
    ccns_to_remove: deleteCcns,
    ccns_to_add: addCcns,
    ccns_to_update: updateCcns
  })
}