import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { registerSW } from 'virtual:pwa-register';
import App from '@/App.vue';
import router from '@/router';
import vuetify from '@/plugins/vuetify';
import '@/styles/main.css';

registerSW({ immediate: true });

createApp(App).use(createPinia()).use(router).use(vuetify).mount('#app');
