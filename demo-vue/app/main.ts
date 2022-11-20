import Vue from 'nativescript-vue';
import { overrideSpanAndFormattedString } from '@nativescript-community/text';
overrideSpanAndFormattedString();
Vue.registerElement('HTMLLabel', () => require('@nativescript-community/ui-label').Label);
import * as views from './views/index';

import { install as installBottomSheet } from '@nativescript-community/ui-material-bottomsheet';
import BottomSheetPlugin from '@nativescript-community/ui-material-bottomsheet/vue';
installBottomSheet();

Vue.component('Home', views.Home);
Vue.use(BottomSheetPlugin);

Vue.config.silent = true;
new Vue({
    template: `
      <Frame>
        <Home />
      </Frame>
    `
}).$start();
