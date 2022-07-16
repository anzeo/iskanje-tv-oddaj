import { createApp } from 'vue';
import App from './App';
import router from './router';
import BootstrapVue3 from 'bootstrap-vue-3';
import VueFeather from 'vue-feather';
import axios from "axios";
import VueAxios from "vue-axios";
import moment from "moment";
import FloatingVue from 'floating-vue';
import Vue3VideoPlayer from '@cloudgeek/vue3-video-player';
import VueSlider from 'vue-slider-component';
import Datepicker from '@vuepic/vue-datepicker';


import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue-3/dist/bootstrap-vue-3.css';
import 'floating-vue/dist/style.css'

import './assets/styles/style.scss';
import './assets/styles/video-player.scss';
import 'vue-slider-component/theme/antd.css';
import '@vuepic/vue-datepicker/dist/main.css'

const app = createApp(App)

app.use(router);
app.use(BootstrapVue3);
app.use(VueAxios, axios);
app.use(FloatingVue);
app.use(Vue3VideoPlayer, {lang: require('./assets/lang/video-player-language.json')});

app.component(VueFeather.name, VueFeather);
app.component('VueSlider', VueSlider)
app.component('DatePicker', Datepicker);

app.config.globalProperties.api = {
    baseUrl: 'http://localhost:5000/api/'
}
app.config.globalProperties.$moment = moment();

app.mount('#app')

export default app;
