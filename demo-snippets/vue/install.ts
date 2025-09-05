import Vue from 'nativescript-vue';
import Basic from './Basic.vue';
import AutoSize from './AutoSize.vue';
import LinkTap from './LinkTap.vue';
import VerticalAlignment from './VerticalAlignment.vue';

export function installPlugin() {
    Vue.registerElement('HTMLLabel', () => require('@nativescript-community/ui-label').Label);

}

export const demos = [{ name: 'Basic', path: 'basic', component: Basic },
    { name: 'AutoSize', path: 'AutoSize', component: AutoSize },
    { name: 'LinkTap', path: 'LinkTap', component: LinkTap },
    { name: 'VerticalAlignment', path: 'VerticalAlignment', component: VerticalAlignment }
];
