import { createApp } from 'vue';
import App from './App';
import router from './router';
import BootstrapVue3 from 'bootstrap-vue-3';
import VueFeather from 'vue-feather';
import axios from "axios";
import VueAxios from "vue-axios";
import moment from "moment";
import FloatingVue from 'floating-vue'

import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue-3/dist/bootstrap-vue-3.css';
import 'floating-vue/dist/style.css'

import './assets/styles/style.scss';

const app = createApp(App)

app.use(router);
app.use(BootstrapVue3);
app.use(VueAxios, axios);
app.use(FloatingVue)

app.component(VueFeather.name, VueFeather);

app.config.globalProperties.api = {
    baseUrl: 'http://localhost:5000/api/'
}
app.config.globalProperties.$moment = moment();

app.mount('#app')

export default app;
