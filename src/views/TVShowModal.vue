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
              :core="show.streams.hasOwnProperty('hls_sec') || show.streams.hasOwnProperty('hls') ? HLSCore : null"
              :view-core="viewCore.bind(null, 'videoPlayer')"
              :src="show.streams && Object.entries(show.streams).length ? (show.streams['hls_sec'] || show.streams['hls'] || show.streams[Object.keys(show.streams)[0]]) : ''"
              @timeupdate="setCurrentTime"
          >
            <!--              @loadeddata="hideCursor"-->
            <template #cusControls>
              <div class="btn-control">
                <span class="material-icons"
                      style="font-size: 32px; color: rgb(255, 255, 255); opacity: 0.85; cursor: pointer"
                      @click="rewindVideo()">replay_10</span>
                <div class="tips">Skoči nazaj</div>
              </div>
              <div class="btn-control" style="margin: 0 10px;">
                <span class="material-icons"
                      style="font-size: 32px; color: rgb(255, 255, 255); opacity: 0.85; cursor: pointer"
                      @click="forwardVideo()">forward_10</span>
                <div class="tips">Skoči naprej</div>
              </div>
            </template>
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
            <div class="d-flex align-items-center px-1 me-4" :class="{'active': activeTab === 1}"
                 @click="activeTab = 1">
              <vue-feather type="align-center" size="20" class="me-2"></vue-feather>
              <span style="font-size: 19px">Podnapisi</span>
            </div>
            <div class="d-flex align-items-center px-1" :class="{'active': activeTab === 2}" @click="activeTab = 2">
              <vue-feather type="mic" size="18" style="margin-right: 6px"></vue-feather>
              <span style="font-size: 19px">Govor</span>
            </div>
          </div>
          <b-tabs id="showDataTabs" v-model="activeTab">
            <b-tab no-body>
              <div class="showDataContainer"
                   :style="{'border-bottom-right-radius': hasMatchedTranscripts ? '0' : '0.3rem'}">
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
              <div class="searchSubtitlesRow" v-if="show.subtitles?.length">
                <b-form-input style="height: 30px; max-width: 300px" placeholder="Išči po podnapisih" v-model="subtitleSearch"
                              @input="e => {subtitleSearch = e; $nextTick(() => {jumpDown('subtitles')})}">
                </b-form-input>
                <b-input-group-append>
                  <div class="d-flex ms-1 user-select-none">
                    <vue-feather type="chevron-up" size="16" class="d-flex align-self-center" style="cursor: pointer;"
                                 @click="jumpUp('subtitles')"></vue-feather>
                    <vue-feather type="chevron-down" size="16" class="d-flex align-self-center mx-1"
                                 style="cursor: pointer"
                                 @click="jumpDown('subtitles')"></vue-feather>
                    <span
                        class="d-flex align-self-center ms-1">{{ visitedSubtitleNo }}/{{ allFoundSubtitlesLen }}</span>

                  </div>
                </b-input-group-append>
                <div class="align-self-center ms-auto ps-2">
                  <b-form-checkbox style="cursor: pointer" v-model="trackSubtitles" switch><small style="white-space: nowrap">Sledi podnapisom</small></b-form-checkbox>
                </div>
              </div>
              <div class="allSubtitlesContainer"
                   :style="{'border-bottom-right-radius': hasMatchedTranscripts ? '0' : '0.3rem'}">
                <div v-if="!show.subtitles?.length" class="p-2 text-center">
                  Za to oddajo podnapisi žal niso na voljo
                </div>
                <div v-for="(subtitle, index) in filteredSubtitles" :key="'subtitle_' + index"
                     class="transcription" @click="moveToTimestamp(subtitle.start)"
                     :class="{'currentTranscript': currentVideoTime >= subtitle.start && (currentVideoTime < filteredSubtitles[index + 1]?.start || index + 1 === filteredSubtitles.length)}">
                  <span>
                    {{ formatOffsetTime(subtitle.start) }} - <span v-html="subtitle.text"></span>
                  </span>
                </div>
              </div>
            </b-tab>
            <b-tab no-body>
              <div class="searchSpeechRow" v-if="show.speech?.length">
                <b-form-input style="height: 30px; max-width: 300px" placeholder="Išči po govoru" v-model="speechSearch"
                              @input="e => {speechSearch = e; $nextTick(() => {jumpDown('speech')})}"></b-form-input>
                <b-input-group-append>
                  <div class="d-flex ms-1 user-select-none">
                    <vue-feather type="chevron-up" size="16" class="d-flex align-self-center" style="cursor: pointer;"
                                 @click="jumpUp('speech')"></vue-feather>
                    <vue-feather type="chevron-down" size="16" class="d-flex align-self-center mx-1"
                                 style="cursor: pointer"
                                 @click="jumpDown('speech')"></vue-feather>
                    <span
                        class="d-flex align-self-center ms-1">{{ visitedSpeechNo }}/{{ allFoundSpeechLen }}</span>

                  </div>
                </b-input-group-append>
                <div class="align-self-center ms-auto ps-2">
                  <b-form-checkbox style="cursor: pointer" v-model="trackSpeech" switch><small style="white-space: nowrap">Sledi govoru</small></b-form-checkbox>
                </div>
              </div>
              <div class="allSpeechContainer"
                   :style="{'border-bottom-right-radius': hasMatchedTranscripts ? '0' : '0.3rem'}">
                <div v-if="!show.speech?.length" class="p-2 text-center">
                  Za to oddajo govor žal ni na voljo
                </div>
                <div v-for="(text, index) in filteredSpeech" :key="'speech_' + index"
                     class="transcription" @click="moveToTimestamp(text.start)"
                     :class="{'currentTranscript': currentVideoTime >= text.start && (currentVideoTime < filteredSpeech[index + 1]?.start || index + 1 === filteredSpeech.length)}">
                  <span>
                    {{ formatOffsetTime(text.start) }} - <span v-html="text.text"></span>
                  </span>
                </div>
              </div>
            </b-tab>
          </b-tabs>
        </div>
        <div class="matchedTranscriptsContainer" v-if="hasMatchedTranscripts">
          <div class="matchedSubtitlesHeader">Ujemajoči podnapisi</div>
          <div style="flex: 1; position: relative">
            <div class="matchedSubtitlesContainer">
              <div v-for="(subtitle, index) in show.matchedSubtitles" :key="'subtitle_' + index"
                   class="transcription" @click="moveToTimestamp(subtitle._source.start)">
                  <span>
                    {{ formatOffsetTime(subtitle._source.start) }} - {{ subtitle._source.text }}
                  </span>
              </div>
              <div v-if="!show.matchedSubtitles.length">
                <span style="font-style: italic">Ni rezultatov za prikaz</span>
              </div>
            </div>
          </div>
          <div class="matchedSubtitlesHeader mt-3">Ujemajoč govor</div>
          <div style="flex: 1; position: relative">
            <div class="matchedSubtitlesContainer">
              <div v-for="(text, index) in show.matchedSpeech" :key="'speech_' + index"
                   class="transcription" @click="moveToTimestamp(text._source.start)">
                  <span>
                    {{ formatOffsetTime(text._source.start) }} - {{ text._source.text }}
                  </span>
              </div>
              <div v-if="!show.matchedSpeech.length">
                <span style="font-style: italic">Ni rezultatov za prikaz</span>
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
import _ from "lodash";

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
      activeTab: 0,
      currentVideoTime: -1,
      timeout: null,
      observer: null,
      subtitleSearch: null,
      visitedSubtitleNo: 0,
      allFoundSubtitlesLen: 0,
      trackSubtitles: true,
      speechSearch: null,
      visitedSpeechNo: 0,
      allFoundSpeechLen: 0,
      trackSpeech: true,
    }
  },

  computed: {
    modalSize() {
      if (this.hasMatchedTranscripts)
        return 'xl'
      return 'lg';
    },

    keyFromSrc() {
      if (this.show.streams && Object.entries(this.show.streams).length) {
        return this.$refs.videoPlayer && this.$refs.videoPlayer.src ? this.$refs.videoPlayer.src : Date.now();
      }
      return Date.now();
    },

    hasMatchedTranscripts() {
      return this.show && ((this.show.matchedSubtitles && this.show.matchedSubtitles.length) || this.show.matchedSpeech && this.show.matchedSpeech.length)
    },

    filteredSubtitles() {
      this.updateFoundLen('allFoundSubtitlesLen', 'set', 0)
      this.updateVisited('visitedSubtitleNo', 'set', 0)
      if (!this.subtitleSearch || !this.subtitleSearch.trim().length)
        return this.show.subtitles
      if (!(this.show && this.show.subtitles?.length))
        return []
      return this.show.subtitles.map(sub => {
        let tmpSub = _.clone(sub)
        if (sub.text.toLowerCase().includes(this.subtitleSearch.toLowerCase())) {
          tmpSub.text = sub.text.replace(new RegExp(this.subtitleSearch, "gi"), (match) => {
            this.updateFoundLen('allFoundSubtitlesLen', 'add', 1)
            return `<mark class="p-0">${match}</mark>`
          })
        }
        return tmpSub
      })
    },

    filteredSpeech() {
      this.updateFoundLen('allFoundSpeechLen', 'set', 0)
      this.updateVisited('visitedSpeechNo', 'set', 0)
      if (!this.speechSearch || !this.speechSearch.trim().length)
        return this.show.speech
      if (!(this.show && this.show.speech?.length))
        return []
      return this.show.speech.map(speech => {
        let tmpSpeech = _.clone(speech)
        if (speech.text.toLowerCase().includes(this.speechSearch.toLowerCase())) {
          tmpSpeech.text = speech.text.replace(new RegExp(this.speechSearch, "gi"), (match) => {
            this.updateFoundLen('allFoundSpeechLen', 'add', 1)
            return `<mark class="p-0">${match}</mark>`
          })
        }
        return tmpSpeech
      })
    }
  },

  watch: {
    activeTab: function (newVal) {
      if (this.observer)
        this.observer.disconnect()
      const _this = this
      if (newVal === 1 && this.show.subtitles?.length) {
        this.observer = new MutationObserver(function (mutations) {
          if (_this.trackSubtitles) {
            mutations.forEach(function (mutation) {
              if (mutation.attributeName === "class") {
                if (mutation.target.classList.contains('currentTranscript')) {
                  let parent = document.querySelector('.allSubtitlesContainer')
                  parent.scrollTop = mutation.target.offsetTop - parent.offsetTop
                }
              }
            });
          }
        });
        this.observer.observe(document.querySelector('.allSubtitlesContainer'), {
          attributes: true,
          subtree: true
        })

        console.log(this.observer)
      } else if (newVal === 2 && this.show.speech?.length) {
        this.observer = new MutationObserver(function (mutations) {
          if (_this.trackSpeech) {
            mutations.forEach(function (mutation) {
              if (mutation.attributeName === "class") {
                if (mutation.target.classList.contains('currentTranscript')) {
                  let parent = document.querySelector('.allSpeechContainer')
                  parent.scrollTop = mutation.target.offsetTop - parent.offsetTop
                  // mutation.target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
                }
              }
            });
          }
        });
        this.observer.observe(document.querySelector('.allSpeechContainer'), {
          attributes: true,
          subtree: true
        })
      }
    }
  },

  mounted() {

  },

  methods: {
    $open(selectedShow) {
      if (!selectedShow) return
      this.activeTab = 0;
      this.currentVideoTime = -1;
      this.observer = null;
      this.subtitleSearch = null;
      this.speechSearch = null;
      this.trackSubtitles = true;
      this.trackSpeech = true;
      this.show = selectedShow;
      this.players = {};
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
      this.players['videoPlayer'].$video.currentTime = time;
    },

    closeVideo(id) {
      this.players && this.players[id] && this.players[id].destroy();
      this.show = null;
    },

    setCurrentTime(e) {
      this.currentVideoTime = e.target.currentTime
    },

    rewindVideo() {
      this.players['videoPlayer'].$video.currentTime -= 10
    },

    forwardVideo() {
      this.players['videoPlayer'].$video.currentTime += 10
    },

    searchSubtitle(e) {
      if (this.show?.subtitles?.length && e.length) {
        let found = this.show.subtitles.filter(sub => sub.text.toLowerCase().includes(e.toLowerCase()));
        console.log(found)
      }
      console.log(e)
    },

    updateFoundLen(varName, operation, val) {
      if (operation === 'set')
        this[varName] = val
      else if (operation === 'add')
        this[varName] += val
      else if (operation === 'sub')
        this[varName] -= val
    },

    updateVisited(varName, operation, val) {
      if (operation === 'set')
        this[varName] = val
      else if (operation === 'add')
        this[varName] += val
      else if (operation === 'sub')
        this[varName] -= val
    },

    jumpUp(transcriptType) {
      if (transcriptType === 'subtitles') {
        if (!this.allFoundSubtitlesLen)
          return
        let highlighted = document.querySelectorAll('.allSubtitlesContainer mark')[this.visitedSubtitleNo - 1]
        if (highlighted)
          highlighted.style.background = null
        if (this.visitedSubtitleNo > 1)
          this.updateVisited('visitedSubtitleNo', 'sub', 1)
        else
          this.updateVisited('visitedSubtitleNo', 'set', this.allFoundSubtitlesLen)

        let parent = document.querySelector('.allSubtitlesContainer')
        let target = parent.querySelectorAll('mark')[this.visitedSubtitleNo - 1]
        target.style.background = 'red'
        parent.scrollTop = target.offsetTop - parent.offsetTop - 40
      } else if (transcriptType === 'speech') {
        if (!this.allFoundSpeechLen)
          return
        let highlighted = document.querySelectorAll('.allSpeechContainer mark')[this.visitedSpeechNo - 1]
        if (highlighted)
          highlighted.style.background = null
        if (this.visitedSpeechNo > 1)
          this.updateVisited('visitedSpeechNo', 'sub', 1)
        else
          this.updateVisited('visitedSpeechNo', 'set', this.allFoundSpeechLen)

        let parent = document.querySelector('.allSpeechContainer')
        let target = parent.querySelectorAll('mark')[this.visitedSpeechNo - 1]
        target.style.background = 'red'
        parent.scrollTop = target.offsetTop - parent.offsetTop - 40
      }

    },

    jumpDown(transcriptType) {
      if (transcriptType === 'subtitles') {
        if (!this.allFoundSubtitlesLen)
          return
        let highlighted = document.querySelectorAll('.allSubtitlesContainer mark')[this.visitedSubtitleNo - 1]
        if (highlighted)
          highlighted.style.background = null
        if (this.visitedSubtitleNo < this.allFoundSubtitlesLen)
          this.updateVisited('visitedSubtitleNo', 'add', 1)
        else
          this.updateVisited('visitedSubtitleNo', 'set', 1)

        let parent = document.querySelector('.allSubtitlesContainer')
        let target = parent.querySelectorAll('mark')[this.visitedSubtitleNo - 1]
        target.style.background = 'red'
        parent.scrollTop = target.offsetTop - parent.offsetTop - 40
      } else if (transcriptType === 'speech') {
        if (!this.allFoundSpeechLen)
          return
        let highlighted = document.querySelectorAll('.allSpeechContainer mark')[this.visitedSpeechNo - 1]
        if (highlighted)
          highlighted.style.background = null
        if (this.visitedSpeechNo < this.allFoundSpeechLen)
          this.updateVisited('visitedSpeechNo', 'add', 1)
        else
          this.updateVisited('visitedSpeechNo', 'set', 1)

        let parent = document.querySelector('.allSpeechContainer')
        let target = parent.querySelectorAll('mark')[this.visitedSpeechNo - 1]
        target.style.background = 'red'
        parent.scrollTop = target.offsetTop - parent.offsetTop - 40
      }
    }

    // hideCursor() {
    //   this.$refs.videoPlayer.$container.querySelector('.vue-core-video-player-layers').addEventListener('mousemove', (e) => {
    //     clearTimeout(this.timeout)
    //     e.target.style.removeProperty('cursor')
    //     this.timeout = setTimeout(() => {
    //       e.target.style.cursor = 'none'
    //     },2000)
    //   })
    // }
  }
}
</script>

<style scoped>
</style>