<template>
  <section>
    <h1>Revenu mensuel maximum : {{ revenu }}</h1>
    <p>Montant actuel (depuis le {{ dateMontant }}) : {{ montant }}</p>
    <p v-if="$fetchState.pending">Récupération des informations…</p>
    <p v-else-if="$fetchState.error">Une erreur est survenue</p>
	  <LineChart
	    v-else
	    :chartData="chartData"
	    :options="chartOptions"
	  />
    <p v-if="doc" v-html="doc"></p>
	</section>
</template>

<script>
  import { LineChart } from 'vue-chart-3'

	export default {
	  components: { LineChart },

		asyncData ({ params, error }) {
			const slug = params.revenu
			let revenu, apiCall, depart
	    switch (slug) {
	      case 'aah':
	        revenu = 'Allocation Adulte Handicapé'
	        depart = '2000'
	        apiCall = 'prestations_sociales.prestations_etat_de_sante.invalidite.aah.montant'
	        break
	      case 'mva':
	        revenu = 'Majoration Vie Autonome'
	        depart = '2000'
	        apiCall = 'prestations_sociales.prestations_etat_de_sante.invalidite.caah.majoration_vie_autonome'
	        break
	      case 'smic':
	        revenu = 'SMIC brut'
	        depart = '2002'
	        apiCall = 'marche_travail.salaire_minimum.smic.smic_b_mensuel'
	        break
	      default:
	        return error(404)
	    }
	    return {
	      revenu,
	      apiCall,
	      depart: new Date(depart),
	      doc: '',
	      montant: 0,
	      source: null,
	      refs: null,
	      dateMontant: depart,
	      chartData: {},
	      chartOptions: {}
	    }
		},

    async fetch () {
      const fullURL = this.$config.apiURL + 'parameter/' + this.apiCall
      await this.$axios.$get(fullURL)
        .then(data => {
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
          const labels = []
          const datasets = [{
            label: data.metadata.ux_name,
            data: []
          }]
          let lastDate = this.depart
          for (const date in data.values) {
            const dadate = new Date(date)
            if (dadate < this.depart)
              continue
            if (lastDate < dadate && dadate < new Date()) {
              this.montant = new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR'
              }).format(data.values[date])
              this.dateMontant = Intl.DateTimeFormat('fr-FR', {
                dateStyle: 'short'
              }).format(dadate)
            }
            lastDate = dadate
            labels.unshift(date)
            datasets[0].data.unshift(data.values[date])
          }
          this.chartData = {labels, datasets}
        })
    }
	}
</script>
