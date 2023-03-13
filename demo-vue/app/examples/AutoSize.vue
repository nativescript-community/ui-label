<template>
    <Page>
        <ActionBar :title="title">
            <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="onNavigationButtonTap"></NavigationButton>
        </ActionBar>
            <GridLayout rows="*,*,*,60,auto,60" padding="0 20 0 20">

            <HTMLLabel
            ref="textView"
            :text="text"
          :textWrap="true"
          lineBreak="end"
          textAlignment="center" verticalTextAlignment="center" fontSize="20" :autoFontSize="true" backgroundColor="red" />
                <Button ref="nextButton"  row="4" text="next" @onTap="onTap" />

        </GridLayout>
        

    </Page>
</template>

<script lang="ts">
import { Frame } from '@nativescript/core';
import Vue from 'vue';

export const title = 'verticalAlignment sample';

export default Vue.extend({
    data() {
        return {
            title: title,
            index:0,
            text:'247 characters azertyuiop azertyuiop azertyuiop azertyuiop azertyuiop azertyuiop azertyuiop azertyuiop azertyuiop azertyuiop azertyuiop azertyuiop azertyuiop azertyuiop azertyuiop azertyuiop azertyuiop azertyuiop azertyuiop azertyuiop azertyuiof'
        };
    },
    methods: {
        onNavigationButtonTap() {
            Frame.topmost().goBack();
        },
        onTap(event) {
            this.index = (this.index+1) %3;
            console.log('onTap', this.index)
            switch(this.index) {
                case 0:
                    this.text='Toto'
                    this.$refs.textView.nativeView.style = ''
                    break;
                case 1:
                    this.text='this is a test text'
                    this.$refs.textView.nativeView.style = 'font-size:48pt;'
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