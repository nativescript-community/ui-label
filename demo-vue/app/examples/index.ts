import BaseDemo, { title as BaseDemoTitle } from './Base.vue';
import VerticalAlignment, { title as VerticalAlignmentTitle } from './VerticalAlignment.vue';

export const getExamples = () => [
    {
        title: BaseDemoTitle,
        component: BaseDemo
    },{
        title: VerticalAlignmentTitle,
        component: VerticalAlignment
    }
];
