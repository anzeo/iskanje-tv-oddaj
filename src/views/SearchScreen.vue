<template>
  <div>
    <loading :active="isLoading" :can-cancel="false" loader="bars"></loading>
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
                     v-b-toggle.filters @click="rotateIcon">
                  <vue-feather type="sliders" size="18"
                               style="color: rgb(160, 160, 160); transform: rotate(90deg)"></vue-feather>
                </div>
              </template>
              <b-form-input v-model="searchFilters.searchString" placeholder="Vnesi niz za iskanje"
                            @keyup.enter="search(true, 'query')"
                            style="border-left: 0; padding-left: 6px"></b-form-input>
            </b-input-group>
            <div class="position-relative" style="max-width: 600px; margin-right: 43px; z-index: 10">
              <b-collapse id="filters" class="position-absolute w-100" @hidden="filtersVisible = false"
                          @show="filtersVisible = true">
                <b-card id="filtersCard"
                        style="border-top: 0; border-radius: 0 0 0.25rem 0.25rem; border-color: rgb(206, 212, 218)">
                  <b-form-group label="Ime oddaje" label-for="showName" label-class="py-0" label-cols-md="2"
                                label-size="sm">
                    <b-form-input id="showName" v-model="searchFilters.showName"></b-form-input>
                  </b-form-group>
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
                  <b-form-group label="Govor" label-for="speech" label-class="py-0" label-cols-md="2"
                                label-size="sm">
                    <b-form-input id="speech" v-model="searchFilters.speech"></b-form-input>
                  </b-form-group>
                  <b-row class="pt-2">
                    <b-col class="d-flex justify-content-end">
                      <b-button size="sm" variant="secondary" class="me-2" @click="clearFilters()">Počisti filtre
                      </b-button>
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
      <b-row class="mx-0 mt-3 filtersRow">
        <b-col md="12">
          <b-card no-body :header-class="{'border-bottom-0': !topFiltersVisible, 'p-0 dp__pointer': true}">
            <template #header>
              <div class="px-3 py-2 d-flex align-content-center" v-b-toggle.topFilters>
                <span class="material-icons me-2" style="font-size: 18px">filter_alt</span>
                <h6 class="m-0">Filtri</h6>
              </div>
            </template>
            <b-collapse id="topFilters" ref="topFilters" visible @hidden="topFiltersVisible = false"
                        @show="topFiltersVisible = true">
              <b-row class="text-center justify-content-center p-3 pt-2">
                <b-col md="3" class="me-md-4">
                  <span class="small">Datum predvajanja <small>(od)</small></span>
                  <DatePicker locale="sl" :enable-time-picker="false" :cancel-text="'Zapri'" :select-text="'Izberi'"
                              class="dateFilter"
                              :format="'dd. MM. yyyy'"
                              v-model="searchFilters.dateStart"
                              @update:modelValue="ctx.currentPage = 1; search(false)"></DatePicker>
                </b-col>
                <b-col md="3" class="me-md-4 mt-2 mt-md-0">
                  <span class="small">Datum predvajanja <small>(do)</small></span>
                  <DatePicker locale="sl" :enable-time-picker="false" :cancel-text="'Zapri'" :select-text="'Izberi'"
                              class="dateFilter"
                              :format="'dd. MM. yyyy'"
                              v-model="searchFilters.dateEnd"
                              @update:modelValue="ctx.currentPage = 1; search(false)"></DatePicker>
                </b-col>
                <b-col md="3" class="d-flex flex-column mt-2 mt-md-0">
                  <span class="small">Dolžina <small>(min)</small></span>
                  <div class="d-flex align-items-center flex-grow-1" style="margin-left: 7px; margin-right: 7px">
                    <vue-slider v-model="searchFilters.duration" :min="0" :max="120" :enable-cross="false"
                                :adsorb="true"
                                style="flex: 1"
                                :interval="10"
                                :marks="true"
                                :hide-label="true"
                                :tooltip-formatter="val => val === 120 ? `${val}+` : val"
                                @drag-end.capture="ctx.currentPage = 1; search(false)"
                                @click="ctx.currentPage = 1; search(false)">
                    </vue-slider>
                  </div>
                </b-col>
              </b-row>
            </b-collapse>
          </b-card>
        </b-col>
      </b-row>
      <div class="">
        <b-row class="mt-4 mx-0">
          <b-col md="12" class="mb-4 d-flex align-items-center">
            <h4 class="mb-0">Rezultati iskanja</h4>
            <small class="ms-3" v-if="ctx.count">({{ ctx.count }} rezultatov)</small>
          </b-col>
          <b-col v-if="!ctx.count">
            <p>Ni rezultatov za prikaz...</p>
          </b-col>
          <b-col v-else v-for="item in items" :key="'item_' + item._id" class="mb-3" md="3" sm="4">
            <div>
              <div class="imageContainer position-relative" :key="'image_' + item._id" @click.prevent="showVideo(item)">
                <div class="playIcon">
                  <vue-feather type="play-circle" size="28"></vue-feather>
                </div>
                <img :src="item._source.metadata.thumbnail || '../assets/images/thumbnail-unavailable.png'"
                     @error="onImageError"
                     style="position: relative; width: 100%; height: auto; z-index: -1"/>
                <div class="showDuration">
                  <vue-feather type="clock" size="13"></vue-feather>
                  <small>&nbsp;{{ formatLength(item._source.metadata.duration) }}</small>
                </div>
                <div class="matchedTranscriptsIndicator">
                  <div v-if="item._source.matchedSubtitles?.length" class="matchedSubtitlesIndicator">
                    <vue-feather type="align-center" size="16"></vue-feather>
                  </div>
                  <div v-if="item._source.matchedSpeech?.length" class="matchedSpeechIndicator">
                    <vue-feather type="mic" size="14"></vue-feather>
                  </div>
                </div>
              </div>
              <small>
                <p class="fw-bold mb-0">{{ item._source.metadata.showName }}</p>
                <p class="fw-light fst-italic mb-0" style="margin-bottom: -2px !important;">{{
                    item._source.metadata.title
                  }}</p>
                <small class="text-end">{{ formatDate(item._source.metadata.broadcastDate) }}</small>

              </small>
            </div>
          </b-col>

          <b-pagination
              v-if="ctx.count !== 0"
              v-model="ctx.currentPage"
              :total-rows="ctx.count > 9996 ? 9996 : ctx.count"
              :per-page="ctx.perPage"
              class="my-4"
              align="center"
              @update:modelValue="search(false)">
          </b-pagination>

        </b-row>

        <b-modal id="searchInstructionsModal" title="Navodila za iskanje" ok-only>
          <div>
            <p class="mb-0">Iskanje deluje po poljih:</p>
            <small>
              <ul>
                <li>Ime oddaje,</li>
                <li>Naslov</li>
                <li>Opis</li>
                <li>Podnapisi</li>
                <li>Govor</li>
              </ul>
            </small>
            <p class="mb-0 fw-bold">Iskanje po vseh poljih (relacija ALI)</p>
            <small><b>Primer vnosa: </b><em>iskalni niz</em></small>
            <p class="mb-0 mt-3 fw-bold">Iskanje po željenih poljih (relacija IN)</p>
            <small class="d-flex">Klik na ikono
              <vue-feather type="sliders" size="13"
                           style="color: rgb(160, 160, 160); transform: rotate(90deg)"></vue-feather>
            </small>
          </div>
        </b-modal>

        <TVShowModal ref="tvShowModal"></TVShowModal>
      </div>
    </div>

  </div>

</template>

<script>
import app from "@/main";
import moment from "moment";
import _ from 'lodash';
import Loading from 'vue3-loading-overlay';
import 'vue3-loading-overlay/dist/vue3-loading-overlay.css';
import TVShowModal from "@/views/TVShowModal";

export default {
  name: "SearchScreen",

  components: {
    Loading,
    TVShowModal
  },

  data() {
    return {
      isLoading: false,
      searchFilters: {
        searchType: "query",
        searchString: /*this.$route.query.searchString ? decodeURIComponent(this.$route.query.searchString) :*/ "",
        showName: /*this.$route.query.showName ? decodeURIComponent(this.$route.query.showName) :*/ "",
        title: /*this.$route.query.title ? decodeURIComponent(this.$route.query.title) :*/ "",
        description: /*this.$route.query.description ? decodeURIComponent(this.$route.query.description) :*/ "",
        subtitles: /*this.$route.query.subtitles ? decodeURIComponent(this.$route.query.subtitles) :*/ "",
        speech: "",
        duration: [0, 120],
        dateStart: null,
        dateEnd: null
      },
      prevSearch: {
        // searchString: this.$route.query.searchString ? decodeURIComponent(this.$route.query.searchString) : "",
        // showName: this.$route.query.showName ? decodeURIComponent(this.$route.query.showName) : "",
        // title: this.$route.query.title ? decodeURIComponent(this.$route.query.title) : "",
        // description: this.$route.query.description ? decodeURIComponent(this.$route.query.description) : "",
        // subtitles: this.$route.query.subtitles ? decodeURIComponent(this.$route.query.subtitles) : "",
        // searchType: this.$route.query.searchType ? this.$route.query.searchType : null,
      },
      items: [],
      ctx: {
        currentPage: this.$route.query.page ? parseInt(this.$route.query.page) : 1,
        perPage: 12,
        count: 0
      },
      filtersVisible: false,
      topFiltersVisible: true
    }
  },

  watch: {},

  computed: {},

  mounted() {
    this.search(true, this.searchFilters.searchType);
  },

  methods: {
    async search(newSearch = false, searchType = null) {
      if (newSearch) {
        this.ctx.currentPage = 1;
        this.prevSearch = {..._.clone(this.searchFilters)};
        this.prevSearch.searchType = searchType;
      }
      this.prevSearch.duration = this.searchFilters.duration
      this.prevSearch.dateStart = this.searchFilters.dateStart
      this.prevSearch.dateEnd = this.searchFilters.dateEnd

      console.log(this.prevSearch)
      let query = {};
      let searchParams = [];

      query['searchType'] = this.prevSearch.searchType;

      if (this.prevSearch.searchType === 'query') {
        query['searchString'] = encodeURIComponent(this.prevSearch.searchString);
        searchParams.push(`searchQuery=${encodeURIComponent(this.prevSearch.searchString)}`);
      } else {
        searchParams = Object.keys(this.prevSearch)
            .filter(name => this.prevSearch[name] !== null && name !== 'searchString' && name !== 'searchType' && name !== 'duration' && name !== 'dateStart' && name !== 'dateEnd')
            .map(name => {
              query[name] = encodeURIComponent(this.prevSearch[name]);
              return `${name}=${encodeURIComponent(this.prevSearch[name])}`
            })
      }

      query['duration'] = encodeURIComponent(JSON.stringify(this.prevSearch.duration));

      searchParams.push(`durationMin=${encodeURIComponent(this.prevSearch.duration[0])}`);
      searchParams.push(`durationMax=${encodeURIComponent(this.prevSearch.duration[1])}`);
      if (this.prevSearch.dateStart) {
        query['dateStart'] = encodeURIComponent(this.prevSearch.dateStart)
        searchParams.push(`dateStart=${encodeURIComponent(moment(this.prevSearch.dateStart).utc().startOf('day').toISOString())}`);
      }
      if (this.prevSearch.dateEnd) {
        query['dateEnd'] = encodeURIComponent(this.prevSearch.dateEnd)
        searchParams.push(`dateEnd=${encodeURIComponent(moment(this.prevSearch.dateEnd).utc().endOf('day').toISOString())}`);
      }

      let params = {
        take: this.ctx.perPage,
        page: this.ctx.currentPage
      };

      let encodedParams = encodeURI(JSON.stringify(params));

      if (this.ctx.currentPage !== 1)
        query['page'] = this.ctx.currentPage;

      // await this.$router.replace({query: {...query}})

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

    clearFilters() {
      this.searchFilters.showName = "";
      this.searchFilters.title = "";
      this.searchFilters.description = "";
      this.searchFilters.subtitles = "";
      this.searchFilters.speech = "";
    },

    formatDate(date) {
      return moment(date).format('DD. MM. YYYY');
    },

    formatLength(time) {
      let format = time >= 3600 ? 'HH:mm:ss' : 'mm:ss'
      return moment.utc(time * 1000).format(format);
    },

    formatLengthWithText(time) {
      let format = time >= 3600 ? 'H [h] m [min] s [s]' : 'm [min] s [s]'
      return moment.utc(time * 1000).format(format);
    },

    showVideo(item) {
      this.$refs.tvShowModal.$open(item._source);
    },

    onImageError(e) {
      e.target.src = require("../assets/images/thumbnail-unavailable.png")
    },

    rotateIcon(e) {
      document.querySelector('.filterIcon i').classList.toggle('down')
      console.log(e)
    }
  }
}
</script>

<style>

</style>