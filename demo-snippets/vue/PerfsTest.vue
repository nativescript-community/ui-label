<template>
    <Page>
        <ScrollView>
            <StackLayout>
            <FlexboxLayout
                style="height: 50dip; flex-shrink: 0; align-items: center; justify-content: space-between; background-color: orange;"
            >
                <FlexboxLayout
                style="margin: 10dip; height: 10dip; flex-shrink: 0; border-width: 2dip; border-color: white; padding: 4dip; font-weight: bold; color: white;"
                >
                <Label disableCss="true" text="Y" />
                </FlexboxLayout>

                <FlexboxLayout style="flex-shrink: 2; flex-direction: column;">
                <Label disableCss="true" style="font-size: 16dip; font-weight: bold; max-lines: 0;" text="Hacker News" />
                <Label disableCss="true" style="font-size: 12dip; max-lines: 0;" text="new | threads | past | comments | ask | show | jobs | submit" />
                </FlexboxLayout>
                <FlexboxLayout style="flex-shrink: 1;">
                <Label disableCss="true" style="max-lines: 0;" text="LinguaBrowse (336) | logout" />
                </FlexboxLayout>
            </FlexboxLayout>
            <GridLayout v-for="index in 100" :key="index + ''" backgroundColor="white"
                    padding="10"
                    columns="auto,*"
                    rows="auto,auto"
                >
                <Label disableCss="true" text="1. ▲"  marginRight="1" color="gray" verticalAlignment="top"/>
                <Label disableCss="true" col="1" fontSize="12" color="black" textWrap>
                    <FormattedString>
                        <Span text="Largest island in a lake on an island in a lake on an island" />
                        <Span text="(elbruz.org)" />
                        <Span fontSize="14" :text="'\n' + '123 points by whoever 3 hours ago | flag | hide | 12 comments'" />
                    </FormattedString>
                </Label >
            </GridLayout>
            

            </StackLayout>
        </ScrollView>
    </Page>
</template>
<script lang="ts">
import { getExamples } from '../examples';
import Vue from 'vue';
// import BottomSheetInnerVue from './BottomSheetInner.vue';
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
    computed: {
        htmlText() {
            return `<span style="font-weight:800;">collect</span><br><span style="font-weight:800;color:red;">${this.counter}</span>dabbas`
        }
    },
    methods: {
        async goToExample({ item }) {
            console.log('goToExample', !!item.component)
            try {
            this.$navigateTo(item.component);

            } catch (error) {
                console.error(error)
            }
        },
        // showBottomSheet() {
        //     (this as NativeScriptVue).$showBottomSheet(BottomSheetInnerVue, {
        //                 // transparent: true,
        //                 closeCallback: (...args) => {
        //                     console.log('bottom sheet closed', args);
        //                 }
        //             });
                
        // }
    }
});
</script>
