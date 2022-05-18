<template>
  <div>
    <loading :active="isLoading" :can-cancel="false"></loading>
    <b-row class="m-0 searchBar-row">
      <b-col md="10" class="mx-auto">
        <div class="d-flex">
          <vue-feather
              type="help-circle" size="18"
              class="me-2 align-self-center link-secondary" style="cursor: pointer"
              @click="$bvModal.show('searchInstructionsModal')"></vue-feather>
          <div class="w-100">
            <b-input-group>
              <template #append>
                <b-button class="d-flex align-items-center" @click="search(true, 'query')" v-b-toggle.collapse-1>
                  <vue-feather type="search" size="18"></vue-feather>
                </b-button>
              </template>
              <template #prepend>
                <div class="filterIcon" style="border-top-left-radius: 0.25rem;"
                     :style="[!filtersVisible ? 'border-bottom-left-radius: 0.25rem': '']"
                     v-b-toggle.filters>
                  <vue-feather type="sliders" size="18"
                               style="color: rgb(160, 160, 160); transform: rotate(90deg)"></vue-feather>
                </div>
              </template>
              <b-form-input v-model="searchFilters.searchString" placeholder="Vnesi niz za iskanje"
                            @keyup.enter="search(true, 'query')"
                            style="border-left: 0; padding-left: 6px"></b-form-input>
            </b-input-group>
            <div class="position-relative" style="max-width: 600px; margin-right: 43px">
              <b-collapse id="filters" class="position-absolute w-100" @hidden="filtersVisible = false"
                          @show="filtersVisible = true">
                <b-card id="filtersCard"
                        style="border-top: 0; border-radius: 0 0 0.25rem 0.25rem; border-color: rgb(206, 212, 218)">
                  <b-form-group label="Naslov" label-for="title" label-class="py-0" label-cols-md="2" label-size="sm">
                    <b-form-input id="title" v-model="searchFilters.title"></b-form-input>
                  </b-form-group>
                  <b-form-group label="Opis" label-for="description" label-class="py-0" label-cols-md="2"
                                label-size="sm">
                    <b-form-input id="description" v-model="searchFilters.description"></b-form-input>
                  </b-form-group>
                  <b-form-group label="Podnapisi" label-for="subtitles" label-class="py-0" label-cols-md="2"
                                label-size="sm">
                    <b-form-input id="subtitles" v-model="searchFilters.subtitles"></b-form-input>
                  </b-form-group>
                  <b-row class="pt-2">
                    <b-col class="d-flex justify-content-end">
                      <b-button size="sm" variant="primary" @click="search(true, 'filters')">Poišči</b-button>
                    </b-col>
                  </b-row>
                </b-card>
              </b-collapse>
            </div>
          </div>
        </div>
      </b-col>
    </b-row>
    <div class="container-fluid">
      <!--      <vue3-video-player :core="HLSCore"-->
      <!--                         :view-core="viewCore.bind(null, 'video1')"-->
      <!--                         :src="'https://vodstr.rtvslo.si/encrypted11/_definst_/2022/05/16/Poroila_ob_10h2022-05-16-100604-SLO1_1.mp4/playlist.m3u8?keylockhash=WZfRyRDTeNyrQF5wpD3uYUziG9KLy-aVfbBtKt8ILE0'"></vue3-video-player>-->
      <b-row class="mt-3">
        <b-col md="12" class="mb-4 d-flex align-items-center">
          <h4 class="mb-0">Rezultati iskanja</h4>
          <small class="ms-3" v-if="ctx.count">({{ ctx.count }} rezultatov)</small>
        </b-col>
        <b-col v-if="!ctx.count">
          <p>Ni rezultatov za prikaz...</p>
        </b-col>
        <b-col v-else v-for="item in items" :key="'item_' + item._id" class="mb-3" md="4" sm="6">
          <div class="p-2 d-flex flex-column overflow-hidden"
               style="border: 1px solid; border-radius: 8px; max-height: 350px">
            <p class="fw-bold mb-0">{{ item._source.metadata.showName }}</p>
            <p class="fw-bold mb-0">{{ item._source.metadata.title }}</p>
            <p class="mb-3 small">{{ item._source.metadata.subtitle }}</p>
            <template v-if="item.inner_hits && item.inner_hits.subtitles.hits.hits.length">
              <small class="fw-bold">Ujemajoči podnapisi: </small>
              <div class="overflow-auto">
                <div v-for="subtitle in item.inner_hits.subtitles.hits.hits" :key="'subtitle_' + subtitle._id"
                     class="d-table-row">
                  <small class="d-table-cell pe-2">
                    {{ formatOffsetTime(subtitle._source.start) }}
                  </small>
                  <p class="pb-2 d-table-cell">{{ subtitle._source.text }}</p>
                </div>
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

      <b-modal id="searchInstructionsModal" title="Navodila za iskanje" ok-only>
        <div>
          <p class="mb-0">Iskanje deluje po poljih:</p>
          <small>
            <ul>
              <li>title (naslov),</li>
              <li>subtitle (podnaslov),</li>
              <li>description (opis) in</li>
              <li>text (podnapis)</li>
            </ul>
          </small>
          <p class="mb-0 fw-bold">Iskanje po vseh poljih (relacija ALI)</p>
          <small><b>Primer vnosa: </b><em>iskalni niz</em></small>
          <p class="mb-0 mt-3 fw-bold">Iskanje po željenih poljih (relacija IN)</p>
          <small><b>Primer vnosa: </b><em>imePolja1: iskalni niz imePolja2: iskalni niz</em></small>
        </div>
      </b-modal>
    </div>
  </div>

</template>

<script>
import app from "@/main";
import moment from "moment";
import _ from 'lodash';
import Loading from 'vue3-loading-overlay';
import 'vue3-loading-overlay/dist/vue3-loading-overlay.css';
import HLSCore from '@cloudgeek/playcore-hls';

export default {
  name: "SearchScreen",

  components: {
    Loading
  },

  data() {
    return {
      isLoading: false,
      searchFilters: {
        searchString: this.$route.query.searchString ? decodeURIComponent(this.$route.query.searchString) : "",
        title: this.$route.query.title ? decodeURIComponent(this.$route.query.title) : "",
        description: this.$route.query.description ? decodeURIComponent(this.$route.query.description) : "",
        subtitles: this.$route.query.subtitles ? decodeURIComponent(this.$route.query.subtitles) : "",
      },
      prevSearch: {
        searchString: this.$route.query.searchString ? decodeURIComponent(this.$route.query.searchString) : "",
        title: this.$route.query.title ? decodeURIComponent(this.$route.query.title) : "",
        description: this.$route.query.description ? decodeURIComponent(this.$route.query.description) : "",
        subtitles: this.$route.query.subtitles ? decodeURIComponent(this.$route.query.subtitles) : "",
        searchType: this.$route.query.searchType ? this.$route.query.searchType : null,
      },
      searchString: "",
      prevSearchString: "",
      searchFields: ['title', 'subtitle', 'description', 'text'],
      autocompleteItems: [],
      items: [],
      ctx: {
        currentPage: this.$route.query.page ? parseInt(this.$route.query.page) : 1,
        perPage: 12,
        count: 0
      },
      filtersVisible: false,
      HLSCore,
      players: {}
    }
  },

  watch: {},

  mounted() {
    this.search();
  },

  methods: {
    async search(newSearch = false, searchType = null) {
      if (newSearch) {
        this.ctx.currentPage = 1;
        this.prevSearch = {..._.clone(this.searchFilters)};
        this.prevSearch.searchType = searchType;
      }
console.log(this.prevSearch)
      let query = {};
      let searchParams = [];

      query['searchType'] = this.prevSearch.searchType;

      if (this.prevSearch.searchType === 'query') {
        query['searchString'] = encodeURIComponent(this.prevSearch.searchString)
        searchParams.push(`searchQuery=${encodeURIComponent(this.prevSearch.searchString)}`);
      } else {
        searchParams = Object.keys(this.prevSearch).filter(name => this.prevSearch[name] !== null && name !== 'searchString' && name !== 'searchType').map(name => {
          query[name] = encodeURIComponent(this.prevSearch[name]);
          return `${name}=${encodeURIComponent(this.prevSearch[name])}`
        })
      }

      let params = {
        take: this.ctx.perPage,
        page: this.ctx.currentPage
      };

      let encodedParams = encodeURI(JSON.stringify(params));

      if (this.ctx.currentPage !== 1)
        query['page'] = this.ctx.currentPage;

      await this.$router.replace({query: {...query}})

      let url = `${app.config.globalProperties.api.baseUrl}search?${searchParams.join('&')}&params=${encodedParams}`;

      this.isLoading = true;

      await app.axios.get(url)
          .then(resp => {
            this.items = resp.data.data;
            this.ctx.count = resp.data.totalHits;
            this.isLoading = false;
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
      return moment.utc(time * 1000).format('HH:mm:ss.SS');
    },

    viewCore(id, player) {
      console.log(id, player);
      this.players[id] = player;
    },
  }
}
</script>

<style>
#dropdown.btn:focus {
  box-shadow: none !important;
}

.filterIcon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  background: white;
  border: 1px solid rgb(206, 212, 218);
  cursor: pointer;
}
</style>