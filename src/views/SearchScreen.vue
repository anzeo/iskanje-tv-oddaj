<template>
  <div class="container-fluid">

    <loading :active="isLoading" :can-cancel="false"></loading>
    <b-row class="mt-4">
      <b-col md="10" class="mx-auto">
        <b-input-group>
          <vue-feather v-tooltip="{ content: '<p>Kako deluje iskanje</p>', html: true }" type="help-circle" size="18"
                       class="me-2 align-self-center"></vue-feather>
          <template #append>
            <b-button class="d-flex align-items-center" @click="search(true)">
              <vue-feather type="search" size="18"></vue-feather>
            </b-button>
          </template>
          <b-form-input v-model="searchString" placeholder="Vnesi niz za iskanje"
                        @keyup.enter="search(true)"></b-form-input>
        </b-input-group>
      </b-col>
    </b-row>

    <b-row class="mt-5">
      <b-col md="12" class="mb-4 d-flex align-items-center">
        <h4 class="mb-0">Rezultati iskanja</h4>
        <small class="ms-3" v-if="ctx.count">({{ctx.count}} rezultatov)</small>
      </b-col>
      <b-col v-if="!ctx.count">
        <p>Ni rezultatov za prikaz...</p>
      </b-col>
      <b-col v-else v-for="item in items" :key="'item_' + item._id" class="mb-3" md="4" sm="6">
        <div class="p-2 d-flex flex-column overflow-hidden"
             style="border: 1px solid; border-radius: 8px; max-height: 350px">
          <p class="fw-bold mb-0">{{ item._source.metadata.title }}</p>
          <p class="mb-3 small">{{ item._source.metadata.subtitle }}</p>
          <template v-if="item.inner_hits && item.inner_hits.speech.hits.hits.length">
            <small class="fw-bold">Ujemajoči podnapisi: </small>
            <div v-for="subtitle in item.inner_hits.speech.hits.hits" :key="'subtitle_' + subtitle._id"
                 class="d-table-row">
              <small class="d-table-cell pe-2">
                {{ formatOffsetTime(subtitle._source.offset) }}
              </small>
              <p class="pb-2 d-table-cell">{{ subtitle._source.text }}</p>
            </div>
          </template>
          <template v-else>
            <small class="fw-bold">Čas trajanja: </small>
            <p class="mb-2"> {{ formatLength(item._source.metadata.duration) }}</p>
            <small class="fw-bold">Datum predvajanja: </small>
            <p class="mb-2">{{ formatDate(item._source.metadata.playDate) }}</p>
            <small class="fw-bold">Opis: </small>
            <p class="overflow-auto">{{ item._source.metadata.description }}</p>
          </template>
        </div>
      </b-col>

      <b-pagination
          v-if="ctx.count !== 0"
          v-model="ctx.currentPage"
          :total-rows="ctx.count"
          :per-page="ctx.perPage"
          class="my-4"
          align="center"
          @update:modelValue="search(false)">
      </b-pagination>
      <!--      <template v-else>-->
      <!--        <b-col v-if="!items.length">-->
      <!--          <p>Ni rezultatov za prikaz...</p>-->
      <!--        </b-col>-->
      <!--        <b-col v-else v-for="item in items" :key="'item_' + item._id" class="mb-3" md="4" sm="6">-->
      <!--          <div class="p-2" style="border: 1px solid; border-radius: 8px">-->
      <!--            <p class="fw-bold">{{ item._source.metadata.title }}</p>-->
      <!--            <small class="fw-bold">Podnapisi: </small>-->
      <!--            <div style="max-height: 150px; overflow-y: auto">-->
      <!--              <div v-for="(subtitle, index) in item._source.subtitles" :key="'subtitle_' + index"-->
      <!--                   class="d-table-row">-->
      <!--                <small class="d-table-cell pe-2">-->
      <!--                  {{ formatOffsetTime(subtitle.offset) }}-->
      <!--                </small>-->
      <!--                <p class="pb-2 d-table-cell">{{ subtitle.text }}</p>-->
      <!--              </div>-->
      <!--            </div>-->
      <!--          </div>-->
      <!--        </b-col>-->
      <!--      </template>-->

    </b-row>
  </div>
</template>

<script>
import app from "@/main";
import moment from "moment";
import _ from 'lodash';
import Loading from 'vue3-loading-overlay';
import 'vue3-loading-overlay/dist/vue3-loading-overlay.css';

export default {
  name: "SearchScreen",

  components: {
    Loading
  },

  data() {
    return {
      isLoading: false,
      searchString: "",
      prevSearchString: "",
      searchFields: ['title', 'subtitle', 'description', 'text'],
      autocompleteItems: [],
      items: [],
      ctx: {
        currentPage: 1,
        perPage: 12,
        count: 0
      }
    }
  },

  watch: {},

  mounted() {
    // this.search();
  },

  methods: {
    async search(newSearch = false) {
      if (newSearch) {
        this.ctx.currentPage = 1;
        this.prevSearchString = this.searchString;
      }

      console.log(this.prevSearchString)

      const fields = ['title', 'subtitle', 'description', 'text'];
      let fieldOccurrence = [];
      fields.forEach(field => {
        let search = this.prevSearchString.search(new RegExp(`\\b${field}\\b: `, 'g'))
        if (search !== -1) {
          console.log(field)
          let fieldData = {};
          fieldData.index = search;
          fieldData.field = field;
          fieldOccurrence.push(fieldData);
        }
      })

      if (fieldOccurrence.length) {
        fieldOccurrence = _.orderBy(fieldOccurrence, ['index'], ['asc']);

        let tmpSearchStr = this.prevSearchString;
        for (let i = fieldOccurrence.length - 1; i >= 0; i--) {
          let query = tmpSearchStr.split(new RegExp(`\\b${fieldOccurrence[i].field}\\b: `, 'g'));
          fieldOccurrence[i].query = query.slice(-1)[0].trim();
          tmpSearchStr = tmpSearchStr.substring(0, fieldOccurrence[i].index)
        }
      }

      let queryString = [];
      if (fieldOccurrence.length) {
        fieldOccurrence.forEach(item => {
          queryString.push(`${item.field}=${encodeURIComponent(item.query)}`);
        })
      } else {
        queryString.push(`searchQuery=${encodeURIComponent(this.prevSearchString === '' ? "" : this.searchString)}`);
      }

      let params = {
        take: this.ctx.perPage,
        page: this.ctx.currentPage
      };

      let encodedParams = encodeURIComponent(JSON.stringify(params));

      // console.log(queryString.join('&'))
      let url = `${app.config.globalProperties.api.baseUrl}search?${queryString.join('&')}&params=${encodedParams}`;

      this.isLoading = true;

      await app.axios.get(url)
          .then(resp => {
            this.items = resp.data.data;
            this.ctx.count = resp.data.totalHits;
            this.isLoading = false;
            // console.log(resp)
          })
          .catch(err => {
            console.error(err)
            this.isLoading = false;
          })
    },

    formatDate(date) {
      return moment(date).format('DD. MM. YYYY');
    },

    formatLength(time) {
      let format = time >= 3600 ? 'HH [h] mm [min] ss [s]' : 'mm [min] ss [s]'
      return moment.utc(time * 1000).format(format);
    },

    formatOffsetTime(time) {
      return moment.utc(time * 1000).format('HH:mm:ss');
    },
  }
}
</script>

<style>
#dropdown.btn:focus {
  box-shadow: none !important;
}
</style>