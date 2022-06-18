<template>
  <b-modal ref="videoModal" id="videoModal" :size="modalSize" @hide="closeVideo('videoPlayer')" body-class="p-0"
           no-close-on-backdrop header-close-white
           hide-footer>
    <div v-if="show">
      <Loading :active="isLoading" :can-cancel="false" :is-full-page="false" loader="bars"></Loading>
      <div class="d-flex">
        <div class="d-flex flex-column w-100">
          <vue3-video-player
              ref="videoPlayer"
              :key="keyFromSrc"
              v-if="show.streams && Object.entries(show.streams).length"
              :core="HLSCore"
              :view-core="viewCore.bind(null, 'videoPlayer')"
              :src="show.streams && Object.entries(show.streams).length ? (show.streams['hls_sec'] || show.streams['hls'] || show.streams[Object.keys(show.streams)[0]]) : ''"
          >
          </vue3-video-player>
          <div v-else class="d-flex justify-content-center align-items-center" style="height: 250px">
            <h3 v-if="!isLoading">Vidoposnetek ni na voljo...</h3>
          </div>
          <div class="navButtonsRow">
            <div class="d-flex align-items-center px-1 me-4" :class="{'active': activeTab === 0}"
                 @click="activeTab = 0">
              <vue-feather type="film" size="20" class="me-2"></vue-feather>
              <span style="font-size: 19px">Info</span>
            </div>
            <div class="d-flex align-items-center px-1" :class="{'active': activeTab === 1}" @click="activeTab = 1">
              <vue-feather type="align-center" size="20" class="me-2"></vue-feather>
              <span style="font-size: 19px">Podnapisi</span>
            </div>
          </div>
          <b-tabs id="showDataTabs" v-model="activeTab">
            <b-tab no-body>
              <div class="showDataContainer">
                <div class="showTitle">{{ show.metadata.title }}</div>
                <div class="showInfo">
                  <div style="line-height: 25px;">
                    <div style="color: #b7b7b7; padding-bottom: 3px">
                      <span>{{ show.metadata.showName }}</span>
                    </div>
                    <div class="d-flex">
                      <small class="d-flex align-items-center">
                        <vue-feather type="clock" size="13" class="me-1"></vue-feather>
                        {{ formatLengthWithText(show.metadata.duration) }}
                      </small>
                      <small class="d-flex align-items-center ms-3">
                        <vue-feather type="calendar" size="13" class="me-1"></vue-feather>
                        {{ formatDate(show.metadata.broadcastDate) }}
                      </small>
                    </div>
                  </div>
                  <div class="showDescription">
                    {{ show.metadata.description }}
                  </div>
                </div>
              </div>
            </b-tab>
            <b-tab no-body>
              <div class="allSubtitlesContainer" style="max-height: 350px; overflow-y: auto"
                   :style="{'border-bottom-right-radius': show.matchedSubtitles ? '0' : '0.3rem'}">
                <div v-for="(subtitle, index) in show.subtitles" :key="'subtitle_' + index"
                     class="transcription" @click="moveToTimestamp(subtitle.start)">
                  <span class="">
                    {{ formatOffsetTime(subtitle.start) }} - {{ subtitle.text }}
                  </span>
                </div>
              </div>
            </b-tab>
          </b-tabs>
        </div>
        <div class="matchedTranscriptsContainer" v-if="show.matchedSubtitles">
          <div class="matchedSubtitlesHeader">Ujemajoči podnapisi</div>
          <div style="flex: 1; position: relative">
            <div class="matchedSubtitlesContainer">
              <div v-for="(subtitle, index) in show.matchedSubtitles" :key="'subtitle_' + index"
                   class="transcription" @click="moveToTimestamp(subtitle._source.start)">
                  <span class="">
                    {{ formatOffsetTime(subtitle._source.start) }} - {{ subtitle._source.text }}
                  </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </b-modal>
</template>

<script>
import HLSCore from "@cloudgeek/playcore-hls";
import app from "@/main";
import moment from "moment";
import Loading from "vue3-loading-overlay";
import '@cloudgeek/vue3-video-player/dist/vue3-video-player.css';

export default {
  name: "tvShowModal",

  components: {
    Loading
  },

  data() {
    return {
      isLoading: false,
      show: null,
      HLSCore,
      players: {},
      activeTab: 0
    }
  },

  computed: {
    modalSize() {
      if (this.show && this.show.matchedSubtitles)
        return 'xl'
      return 'lg';
    },

    keyFromSrc() {
      if (this.show.streams && Object.entries(this.show.streams).length) {
        return this.$refs.videoPlayer && this.$refs.videoPlayer.src ? this.$refs.videoPlayer.src : Date.now();
      }
      return Date.now();
    }
  },

  methods: {
    $open(selectedShow) {
      if (!selectedShow) return
      this.activeTab = 0;
      this.show = selectedShow;
      this.getVideoStreams();
      this.$bvModal.show('videoModal');
    },

    viewCore(id, player) {
      console.log(id, player);
      this.players[id] = player;
    },

    async getVideoStreams() {
      try {
        let streams = {}

        this.isLoading = true;
        // get video streams
        let url = `${app.config.globalProperties.api.baseUrl}media/video/${this.show.metadata.id}`
        let resp = await app.axios.get(url)
        let obj = resp.data.response;

        if (obj) {
          if (obj['addaptiveMedia'])
            for (const [key, value] of Object.entries(obj['addaptiveMedia'])) {
              streams[key] = value
            }
          else if (obj['mediaFiles'] && obj['mediaFiles'].length)
            streams = obj['mediaFiles'].reduce((max, item) => max.bitrate > item.bitrate ? max : item).streams
          else if (obj['mediaFiles_sl'] && obj['mediaFiles_sl'].length)
            streams = obj['mediaFiles_sl'].reduce((max, item) => max.bitrate > item.bitrate ? max : item).streams

          this.show.streams = streams
        } else
          this.show.streams = {}

        this.isLoading = false;
      } catch (e) {
        this.show.streams = {}
        this.isLoading = false;
        console.error(e)
      }
    },

    formatOffsetTime(time) {
      let format = time >= 3600 ? 'HH:mm:ss' : 'mm:ss'
      return moment.utc(time * 1000).format(format);
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

    moveToTimestamp(time) {
      console.log(time)
      console.log(this.$refs.videoPlayer.$refs)
      this.players['videoPlayer'].$video.currentTime = time;
    },

    closeVideo(id) {
      this.players && this.players[id] && this.players[id].destroy();
      this.show = null;
    },
  }
}
</script>

<style scoped>
</style>