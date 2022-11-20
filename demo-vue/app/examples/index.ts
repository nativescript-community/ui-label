import BaseDemo, { title as BaseDemoTitle } from './Base.vue';
import VerticalAlignment, { title as VerticalAlignmentTitle } from './VerticalAlignment.vue';
import AutoSize from './AutoSize.vue';
import LinkTap from './LinkTap.vue';

export const getExamples = () => [
    {
        title: BaseDemoTitle,
        component: BaseDemo
    },
    {
        title: VerticalAlignmentTitle,
        component: VerticalAlignment
    },
    {
        title: 'autoSize',
        component: AutoSize
    },
    {
        title: 'linkTap',
        component: LinkTap
    }
];
