import Vue from 'nativescript-vue';
import CollectionViewPlugin from '@nativescript-community/ui-collectionview/vue';
Vue.registerElement('HTMLLabel', () => require('@nativescript-community/ui-label').Label);
Vue.use(CollectionViewPlugin);
import * as views from './views/index';
// require('@nativescript-community/ui-label').enableIOSDTCoreText();
// import { install as installBottomSheet } from '@nativescript-community/ui-material-bottomsheet';
// import BottomSheetPlugin from '@nativescript-community/ui-material-bottomsheet/vue';
// installBottomSheet();

Vue.component('Home', views.Home);
// Vue.use(BottomSheetPlugin);

// let start = Date.now();
// for (let index = 0; index < 1000; index++) {
//     //@ts-ignore
//     const element = UITextView.new();
// }
// console.log('creating 1000 UITextView took', Date.now() - start, 'ms');
// start = Date.now();
// for (let index = 0; index < 1000; index++) {
//     //@ts-ignore
//     const element = UILabel.new();
// }
// console.log('creating 1000 UILabel took', Date.now() - start, 'ms');

Vue.config.silent = true;
new Vue({
    template: `
      <Frame>
        <Home />
      </Frame>
    `
}).$start();
