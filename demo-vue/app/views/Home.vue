<template>
    <Page>
        <ActionBar title="Material Vue">
        </ActionBar>
<GridLayout>
            <ListView ref="listView" itemRowHeight="80" for="example in examples" separatorColor="transparent" @itemTap="goToExample">
                <v-template>
                    <StackLayout class="item" orientation="horizontal">
                        <Label :text="example.title" class="title" verticalAlignment="center" />
                    </StackLayout>
                </v-template>
            </ListView>
        </GridLayout>
    </Page>
</template>
<script lang="ts">
import { getExamples } from '../examples';
import Vue from 'vue';
import BottomSheetInnerVue from './BottomSheetInner.vue';
import { NativeScriptVue } from 'nativescript-vue';

export default Vue.extend({
    name: 'Home',
    data() {
        return {
            counter:0,
            someBindedUrl: '<a href=\"https://youtube.com\">Open Youtube.com</a>',
            color:'yellow',
            examples: getExamples()
        };
    },
    methods: {
        async goToExample({ item }) {
            console.log('goToExample', !!item.component)
            try {
            this.$navigateTo(item.component);

            } catch (error) {
                console.error(error)
            }
        }
    }
});
</script>
