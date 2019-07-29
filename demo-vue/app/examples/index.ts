import BaseDemo, { title as BaseDemoTitle } from './Base.vue';
import VerticalAlignment, { title as VerticalAlignmentTitle } from './VerticalAlignment.vue';

export const getExamples = () => {
    return [
        {
            title: BaseDemoTitle,
            component: BaseDemo
        },{
            title: VerticalAlignmentTitle,
            component: VerticalAlignment
        }
    ];
};
