import Vue from 'nativescript-vue';
import Basic from './Basic.vue';

export function installPlugin() {
    Vue.registerElement('HTMLLabel', () => require('@nativescript-community/ui-label').Label);

}

export const demos = [{ name: 'Basic', path: 'basic', component: Basic }];
