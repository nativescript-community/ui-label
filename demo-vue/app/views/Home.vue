<template>
    <Page>
        <ActionBar title="Material Vue">
        </ActionBar>
        <GridLayout rows="auto,auto,auto,*">
            <GridLayout rows="50, 50, 50, 50">
      <HTMLLabel text="This is a test" color="#ff0000" row="0"/>

      <HTMLLabel html="This is a test" color="#ff0000" row="1"/>

      <HTMLLabel
          :html="someBindedUrl"
          @linkTap="()=>{}"
          linkColor="#ff0000"
          linkUnderline="false"
          fontFamily="OpenSans"
          fontSize="16"
          margin="2 5 5 5"
          textWrap="true"
          row="2"
      ></HTMLLabel>

      <HTMLLabel
          :html="someBindedUrl"
          @linkTap="()=>{}"
          linkColor="#ff0000"
          fontFamily="OpenSans"
          fontSize="16"
          margin="2 5 5 5"
          textWrap="true"
          row="3"
      ></HTMLLabel>
    </GridLayout>

            <ListView row="3" ref="listView" itemRowHeight="80" for="example in examples" separatorColor="transparent" @itemTap="goToExample">
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
        showBottomSheet() {
            (this as NativeScriptVue).$showBottomSheet(BottomSheetInnerVue, {
                        // transparent: true,
                        closeCallback: (...args) => {
                            console.log('bottom sheet closed', args);
                        }
                    });
                
        }
    }
});
</script>
