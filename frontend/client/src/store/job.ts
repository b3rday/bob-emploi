import {TFunction} from 'i18next'
import {stringify} from 'query-string'

import {prepareT} from 'store/i18n'

// Genderize a job name.
function genderizeJob(job?: bayes.bob.Job, gender?: bayes.bob.Gender): string {
  if (!job) {
    return ''
  }
  if (gender === 'FEMININE') {
    return job.feminineName || job.name || ''
  }
  if (gender === 'MASCULINE') {
    return job.masculineName || job.name || ''
  }
  return job.name || ''
}

// Return url for job name search.
function getJobSearchURL(job?: bayes.bob.Job, gender?: bayes.bob.Gender): string {
  if (!job || Object.keys(job).length === 0) {
    return ''
  }
  const searchTerms = encodeURIComponent('métier ' + genderizeJob(job, gender))
  return `https://www.google.fr/search?q=${searchTerms}`
}


// Return URL to access the IMT.
function getIMTURL(job?: {codeOgr?: string}, city?: {departementId?: string}): string {
  if (!job || !job.codeOgr || !city || !city.departementId) {
    return ''
  }
  return 'http://candidat.pole-emploi.fr/marche-du-travail/statistiques?' +
    `codeMetier=${job.codeOgr}&` +
    `codeZoneGeographique=${city.departementId}&typeZoneGeographique=DEPARTEMENT`
}


const arrondissementPatch: {[cityId: string]: {lieux: string; rayon?: number}} = {
  13055: {lieux: '13201', rayon: 20},
  69123: {lieux: '69381'},
  75056: {lieux: '75D'},
}
function getPEJobBoardURL(
  {jobGroup: {name = '', romeId = ''} = {}, name: jobName = ''}: bayes.bob.Job = {},
  {cityId = ''}: bayes.bob.FrenchCity = {},
  otherParams?: {}): string {
  if (!cityId || !(romeId || name || jobName)) {
    return ''
  }
  return `https://candidat.pole-emploi.fr/offres/recherche?${stringify({
    lieux: cityId,
    motsCles: romeId || name || jobName,
    ...arrondissementPatch[cityId],
    ...otherParams,
  })}`
}


interface JobPlaces {
  inDepartement: string
  jobGroup: string
}


// From departement stats, find a list of situation in different departements.
// For instance, it will return: [
//   {'inDepartement': 'en Savoie', 'jobGroup': 'Hôtellerie'},
//   {'inDepartement': 'en Haute Savoie', 'jobGroup': 'Animation sportive'},
// ]
function getJobPlacesFromDepartementStats(
  departementStats: readonly bayes.bob.MonthlySeasonalDepartementStats[]): readonly JobPlaces[] {
  if (!departementStats || !departementStats.length) {
    return []
  }
  const seenRomes = new Set()
  const jobPlaces: JobPlaces[] = []
  const nbDep = departementStats.length
  const currentJobGroupForDep = departementStats.map((unusedDep): number => 0)
  for (let i = 0; i < 8; ++i) {
    const depIndex = i % nbDep
    const dep = departementStats[i % nbDep]
    const {jobGroups} = departementStats[depIndex]
    if (!jobGroups) {
      continue
    }
    while (currentJobGroupForDep[depIndex] < jobGroups.length - 1 &&
      seenRomes.has(jobGroups[currentJobGroupForDep[depIndex]].romeId)) {
      currentJobGroupForDep[depIndex]++
    }
    if (currentJobGroupForDep[depIndex] >= jobGroups.length) {
      continue
    }
    const jobGroup = jobGroups[currentJobGroupForDep[depIndex]]
    seenRomes.add(jobGroup.romeId)
    jobPlaces.push({inDepartement: dep.departementInName || '', jobGroup: jobGroup.name || ''})
  }
  return jobPlaces
}


function missionLocaleUrl(
  missionLocaleData?: bayes.bob.MissionLocaleData, departementName?: string): string {
  return missionLocaleData && missionLocaleData.agenciesListLink ||
      `https://www.google.fr/search?q=${
        encodeURIComponent(`mission locale ${departementName || ''}`)}`
}

const _APPLICATION_MODES = {
  OTHER_CHANNELS: prepareT('Autre canal (réponse à une offre, concours, salon, ...)'),
  PERSONAL_OR_PROFESSIONAL_CONTACTS: prepareT('Réseau personnel ou professionnel'),
  PLACEMENT_AGENCY: prepareT('Agence de recrutement'),
  SPONTANEOUS_APPLICATION: prepareT('Candidature spontanée'),
  UNDEFINED_APPLICATION_MODE: prepareT('Réponse à une offre'),
} as const


// TODO(cyrille): Try and find the most relevant FAP for a given job in the job group.
function getApplicationModes(jobGroup: bayes.bob.JobGroup): readonly bayes.bob.ModePercentage[] {
  return (Object.values(jobGroup.applicationModes || {})[0] || {}).modes || []
}


function getApplicationModeText(translate: TFunction, mode?: bayes.bob.ApplicationMode): string {
  return translate(_APPLICATION_MODES[mode || 'UNDEFINED_APPLICATION_MODE'])
}


// Keep in increasing order, for the ApplicationWaffleChart in stats_charts.
const weeklyApplicationOptions = [
  {name: prepareT('0 ou 1 candidature par semaine'), value: 'LESS_THAN_2'},
  {name: prepareT('2 à 5 candidatures par semaine'), value: 'SOME'},
  {name: prepareT('6 à 15 candidatures par semaine'), value: 'DECENT_AMOUNT'},
  {name: prepareT('Plus de 15 candidatures par semaine'), value: 'A_LOT'},
] as const


export {genderizeJob, getIMTURL, getJobSearchURL, missionLocaleUrl, getApplicationModes,
  getJobPlacesFromDepartementStats, getApplicationModeText, getPEJobBoardURL,
  weeklyApplicationOptions}

