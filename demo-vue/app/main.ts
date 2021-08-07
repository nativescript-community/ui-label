import Vue from 'nativescript-vue';
import { overrideSpanAndFormattedString } from '@nativescript-community/text';
overrideSpanAndFormattedString();
Vue.registerElement('HTMLLabel', () => require('@nativescript-community/ui-label').Label);
import * as views from './views/index';

Vue.component('Home', views.Home);

Vue.config.silent = true;
new Vue({
    template: `
      <Frame>
        <Home />
      </Frame>
    `
}).$start();
