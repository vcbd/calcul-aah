<template>
  <section>
    <p v-if="$fetchState.pending">Récupération des informations…</p>
    <p v-else-if="$fetchState.error">Une erreur est survenue</p>
    <p v-if="prm === null">
      Montant actuel (depuis le {{ montantRef }}) : {{ montantMax }}
    </p>
	  <LineChart
	    :chartData="chartData"
	    :options="chartOptions"
	  />
    <p v-if="doc" v-html="doc"></p>
	</section>
</template>

<script>
  import { LineChart } from 'vue-chart-3'
  import _ from 'lodash'

  function apiReq(params) {
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
    return requete
  }

	export default {
	  name: 'VizComponent',
	  components: { LineChart },

	  props: {
	    'viz': { 'type': Array, 'default': [{label: '', id: ''}] },
	    'prm': { 'type': Object, 'default': null },
	    'min': { 'type': Number, 'default': 0 },
	    'max': { 'type': Number, 'default': 2000 },
	    'pas': { 'type': Number, 'default': 100 },
	    'pts': { 'type': Array, 'default': [1] },
	    'upd': { 'type': Number, 'default': 0},
	  },

		data() {
		  return {
		    'labels': null,
		    'datasets': null,
		    'chartOptions': null,
		    'doc': null,
		    'montantRef': '',
		    'montantMax': '0€',
		  }
		},

    async fetch() {
      let fullURL = this.$config.apiURL
      this.labels = []
      this.datasets = []
      for (const vz of this.viz)
        this.datasets.push({
          'label': vz.label,
          'data': [],
        })
      if (this.prm === null) {
        fullURL += 'parameter/' + this.viz[0].id
        const data = await this.$axios.$get(fullURL)
        this.datasets[0].label = data.metadata.ux_name
        let doc = data.documentation
        if (process.client) {
          doc = new DOMParser().parseFromString(doc, 'text/html')
          doc = doc.body.textContent || ''
        } else {
          doc = new global.jsdom.JSDOM(doc)
          doc = doc.window.document.querySelector('*').textContent
        }
        this.doc = doc
          .replace(/(?:\r\n|\r|\n)/g, '<br>')
          .replace(/(http(s)?:\/\/[^\s]*)/g,
            '<a rel="nofollow noopener" href="$1">$1</a>')
        let lastDate = this.min.toString()
        for (const date in data.values) {
          const dadate = new Date(date)
          if (dadate < this.min.toString())
            continue
          if (lastDate < dadate && dadate < new Date()) {
            this.montantMax = new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'EUR'
            }).format(data.values[date])
            this.montantRef = Intl.DateTimeFormat('fr-FR', {
              dateStyle: 'short'
            }).format(dadate)
          }
          lastDate = dadate
          this.labels.unshift(date)
          this.datasets[0].data.unshift(data.values[date])
        }
      } else {
        fullURL += 'calculate'
        const xAxis = [...this.pts]
        for (let i = this.min; i <= this.max; i += this.pas)
          xAxis.push(i)
        xAxis.sort((a, b) => a - b)
        this.labels.push(...xAxis)
        for (const xSlice of xAxis) {
          const now = new Date().getFullYear() + '-' +
            (new Date().getMonth() + 1)
          const params = {}
          for (const vz of this.viz)
            params[vz.id + '["' + now + '"]'] = null
          for (const param in this.prm)
            for (const prd in this.prm[param])
              if (this.prm[param][prd] === null)
                params[param + '["' + prd + '"]'] = xSlice
              else
                params[param + '["' + prd + '"]'] = this.prm[param][prd]
          const slice = await this.$axios.$post(fullURL, apiReq(params))
          this.viz.forEach((el, i) => {
            this.datasets[i].data.push(
              _.get(slice, el.id + '["' + now + '"]')
            )
          })
        }
      }
    },

    computed: {
      chartData() {
        return {'labels': this.labels, 'datasets': this.datasets}
      },
    },
	}
</script>
