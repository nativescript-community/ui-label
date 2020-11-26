import Vue from 'nativescript-vue';

Vue.registerElement('HTMLLabel', () => require('@nativescript-community/ui-label').Label);
import * as views from './views/index';

Vue.component('Home', views.Home);

Vue.config.silent = false;
new Vue({
    template: `
      <Frame>
        <Home />
      </Frame>
    `
}).$start();


