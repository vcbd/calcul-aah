<template>
  <section>
    <h1>Revenu mensuel maximum de l’AAH</h1>
    <Viz
      :key="key"
      :viz="viz"
      :prm="prm"
      :min="min"
      :max="max"
      :pas="pas"
      :pts="pts"
    />
	  Simuler le montant de l’AAH en fonction du
	  <select v-model="param">
	    <option value="temps">temps</option>
	    <option value="salaire">salaire propre</option>
	    <option value="conjoint">salaire conjoint·e</option>
	  </select>
	</section>
</template>

<script>
	export default {
	  name: 'RevenuAAH',

    data() {
      return {
        'viz': [{
          'label': 'AAH',
          'id': 'prestations_sociales.prestations_etat_de_sante.invalidite.aah.montant',
          }],
        'prm': null,
        'min': 2000,
        'max': 2000,
        'pas': 100,
        'pts': [],
        'param': 'temps',
        'key': 0,
      }
    },

    watch: {
      param(param) {
        switch (param) {
          case 'temps':
            this.viz[0].id =  'prestations_sociales.prestations_etat_de_sante.invalidite.aah.montant'
            this.prm = null
            this.min = 2000
            break
          case 'salaire':
            this.viz[0].id = 'individus.demandeureuse.aah'
            this.prm = {
              'individus.demandeureuse.salaire_de_base': {},
              'individus.demandeureuse.taux_incapacite': {},
            }
            this.prm['individus.demandeureuse.taux_incapacite']
              [this.$ofd.now] = 60
            this.prm['individus.demandeureuse.salaire_de_base']
              [this.$ofd.pt1] = null
            this.prm['individus.demandeureuse.salaire_de_base']
              [this.$ofd.pt2] = null
            this.prm['individus.demandeureuse.salaire_de_base']
              [this.$ofd.pt3] = null
            this.prm['individus.demandeureuse.salaire_de_base']
              [this.$ofd.now] = null
            this.min = 0
            this.max = 2500
            break
        }
        this.key++
      },
    },
	}
</script>
