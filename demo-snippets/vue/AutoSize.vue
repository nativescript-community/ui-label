<template>
    <Page>
        <ActionBar :title="title">
            <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="onNavigationButtonTap"></NavigationButton>
        </ActionBar>
            <GridLayout rows="*,*,*,60,auto,60" padding="0 20 0 20">

            <HTMLLabel
            ref="textView"
            :text="text"
           textWrap="true"
          textAlignment="center" verticalTextAlignment="center" :autoFontSize="true" backgroundColor="red" selectable="true" lineBreak="end" :class="testClass"/>
                <Button ref="nextButton"  row="4" text="next" @onTap="onTap" />

        </GridLayout>
        

    </Page>
</template>
<style scoped>

.testClass {
    font-size: 40;
    color: green;
}
   
</style>
<script lang="ts">
import { Frame } from '@nativescript/core';
import Vue from 'vue';

export const title = 'verticalAlignment sample';

export default Vue.extend({
    data() {
        return {
            title: title,
            index:0,
            testClass:'testClass',
            text:'247 characters azertyuiop azertyuiop azertyuiop azertyuiop azertyuiop azertyuiop azertyuiop azertyuiop azertyuiop azertyuiop azertyuiop azertyuiop azertyuiop azertyuiop azertyuiop azertyuiop azertyuiop azertyuiop azertyuiop azertyuiop azertyuiof'
        };
    },
    methods: {
        onNavigationButtonTap() {
            Frame.topmost().goBack();
        },
        onTap(event) {
            // this.testClass = this.testClass ? null: 'testClass';
            // console.log('onTap', this.testClass)
            // return;
            this.index = (this.index+1) %3;
            console.log('onTap', this.index)
            switch(this.index) {
                case 0:
                    this.text='Toto'
                    this.$refs.textView.nativeView.style = ''
                    break;
                case 1:
                    this.text='this is a test text'
                    this.$refs.textView.nativeView.style = 'font-size:88pt;'
                    break;
                case 2:
                    this.text='247 characters azertyuiop azertyuiop azertyuiop azertyuiop azertyuiop azertyuiop azertyuiop azertyuiop azertyuiop azertyuiop azertyuiop azertyuiop azertyuiop azertyuiop azertyuiop azertyuiop azertyuiop azertyuiop azertyuiop azertyuiop azertyuiof'
                    this.$refs.textView.nativeView.style = ''
                    break;
            }
        }
    }
});
</script>