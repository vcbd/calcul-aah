<template>
  <section>
    <h1>Visualisation</h1>
    <p v-if="$fetchState.pending">Récupération des informations…</p>
    <p v-else-if="$fetchState.error">Une erreur est survenue</p>
	  <LineChart
	    :chartData="chartData"
	    :options="chartOptions"
	  />
  </section>
</template>

<script>
  import _ from 'lodash'
  import { LineChart } from 'vue-chart-3'

  const xAxis = (() => {
    const ret = [1, 710]
    for (let i = 0; i <= 3000; i += 100) {
      ret.push(i)
    }
    ret.sort((a, b) => a - b)
    return ret
  })()

  function apiReq(params) {
//    const api = this.$config.apiURL + 'calculate'
    const requete = {
      'individus': {
        'demandeureuse': {
          'salaire_de_base': {},
          'salaire_net': {},
          'taux_incapacite': {},
          'aah': {},
          'mva': {},
        },
      },
      'menages': {
        'menage_1': {
          'personne_de_reference': [
            'demandeureuse',
          ],
          'loyer': {},
          'statut_occupation_logement': {},
          'impots_directs': {},
        },
      },
      'familles': {
        'famille_1': {
          'parents': [
            'demandeureuse',
          ],
          'aide_logement': {},
          'ppa': {},
        },
      },
      'foyers_fiscaux': {
        'foyer_fiscal_1': {
          'declarants': [
            'demandeureuse',
          ],
        },
      }
    }
    for (const key in params)
      _.set(requete, key, params[key])
//    return this.$axios.$post(api, requete)
    return requete
  }

  export default {
    name: 'DataViz',
    components: { LineChart },
    
    data() {
      return {
        chartData: {
          'labels': xAxis,
          'datasets': [
            {
              'label': 'Impôts directs',
              'data': [],
              'borderColor': '#ff808080',
              'backgroundColor': '#ff808040',
              'fill': 'origin',
            },
            {
              'label': 'Salaire net',
              'data': [],
              'borderColor': '#75e6ff80',
              'backgroundColor': '#75e6ff40',
              'fill': 'origin',
            },
            {
              'label': 'Prime pour l’activité',
              'data': [],
              'borderColor': '#36ffc380',
              'backgroundColor': '#36ffc340',
              'fill': 'stack',
            },
            {
              'label': 'AAH',
              'data': [],
              'borderColor': '#d930ff80',
              'backgroundColor': '#d930ff40',
              'fill': 'stack',
            },
            {
              'label': 'MVA',
              'data': [],
              'borderColor': '#ffb480',
              'backgroundColor': '#ffb45e40',
              'fill': 'stack',
            },
            {
              'label': 'Aides au logement',
              'data': [],
              'borderColor': '#d9d20080',
              'backgroundColor': '#d9d20040',
              'fill': 'stack',
            },
          ],
        },
        chartOptions: {
          'responsive': true,
          'interaction': {
            'mode': 'nearest',
            'axis': 'x',
            'intersect': false,
          },
          'plugins': {
            'tooltip': {
              'callbacks': {
                'footer': (items) => {
                  return 'Total : ' + items.reduce((a, b) => a + b.parsed.y, 0)
                },
              },
            },
          },
          'scales': {
            'x': {
              'type': 'linear',
              'min': 0,
            },
            'y': {
              'stacked': 'single',
            },
          },
        },
      }
    },

    fetchOnServer: false,
    async fetch() {
      const now = new Date().getFullYear() + '-' + (new Date().getMonth() + 1)
      const lym = (new Date().getFullYear() - 1) + '-' + (new Date().getMonth() + 1)
//      const py = 'year:' + lym + ':2'
      const pm = 'month:' + lym + ':13'
      const ty = new Date().getFullYear()
      const ly = new Date().getFullYear() - 1
      const requests = []
      for (const xSlice of xAxis) {
        const params = {}
        params['individus.demandeureuse.salaire_de_base["' + pm + '"]'] = xSlice * 13
        params['individus.demandeureuse.salaire_net["' + now + '"]'] = null
        params['individus.demandeureuse.taux_incapacite["' + now + '"]'] = 60
        params['menages.menage_1.loyer["' + pm + '"]'] = 500 * 13
        params['menages.menage_1.statut_occupation_logement["' + ty + '"]'] = 'locataire_vide'
        params['menages.menage_1.impots_directs["' + ly + '"]'] = null
        params['individus.demandeureuse.aah["' + now + '"]'] = null
        params['individus.demandeureuse.mva["' + now + '"]'] = null
        params['familles.famille_1.aide_logement["' + now + '"]'] = null
        params['familles.famille_1.ppa["' + now + '"]'] = null
        
        requests.push(apiReq.bind(this)(params))
      }
//      const responses = await Promise.all(requests)
//      for (const slice of responses) {
      for (const req of requests) {
        const slice = await this.$axios.$post(this.$config.apiURL + 'calculate', req)
        this.chartData.datasets[0].data.push(
          slice.menages.menage_1.impots_directs[ly] / 12
        )
        this.chartData.datasets[1].data.push(
          slice.individus.demandeureuse.salaire_net[now]
        )
        this.chartData.datasets[2].data.push(
          slice.familles.famille_1.ppa[now]
        )
        this.chartData.datasets[3].data.push(
          slice.individus.demandeureuse.aah[now]
        )
        if (slice.individus.demandeureuse.salaire_net[now] === 0)
          this.chartData.datasets[4].data.push(
            slice.individus.demandeureuse.mva[now]
          )
        else
          this.chartData.datasets[4].data.push(0)
        this.chartData.datasets[5].data.push(
          slice.familles.famille_1.aide_logement[now]
        )
      }
    },
  }
</script>
