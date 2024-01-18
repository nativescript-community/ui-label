<template>
    <Page>
        <ActionBar title="Material Vue">
        </ActionBar>
<GridLayout rows="auto,*">
    <StackLayout>
    <HTMLLabel :text="nativeText" backgroundColor='yellow'/>
    <HTMLLabel html='<span style="font-size:16;font-weight:bold">test</span><span style="color:red;font-size:14">hello</span>' backgroundColor='yellow'/>
    <HTMLLabel  backgroundColor='pink'> 
        <Span fontSize="16" fontWeight="bold" text="test"/>
    </HTMLLabel>
    <HTMLLabel fontSize="16" fontWeight="bold" text="test"/>
    <Label  fontSize="16" fontWeight="bold" text="test"/>
    <Label text="test" fontWeight="bold" fontSize="16"/>
    </StackLayout>
            <ListView ref="listView" itemRowHeight="80" for="example in examples" separatorColor="transparent" @itemTap="goToExample" row="1">
                <v-template>
                    <StackLayout class="item" orientation="horizontal">
                        <HTMLLabel fontSize="16" :text="example.title" verticalAlignment="center" />
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

import { createNativeAttributedString } from '@nativescript-community/ui-label';


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
