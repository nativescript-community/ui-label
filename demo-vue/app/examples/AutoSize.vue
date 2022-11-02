<template>
    <Page>
        <ActionBar :title="title">
            <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="onNavigationButtonTap"></NavigationButton>
        </ActionBar>
        <ScrollView>
            <GridLayout columns="auto" horizontalAlignment="center" height="200" backgroundColor="red" @tap="resize">

            <HTMLLabel 
            verticalAlignment="center"
          width="50"
          :textWrap="true"
          :autoFontSize="true"
          text="center textAlignment, bottom verticalAlignment"
          fontSize="10"
          maxFontSize="30"/>

        </GridLayout>
        </ScrollView>
        

    </Page>
</template>

<script lang="ts">
import { Frame } from '@nativescript/core';
import Vue from 'vue';

export const title = 'verticalAlignment sample';

export default Vue.extend({
    data() {
        return {
            title: title
        };
    },
    methods: {
        onNavigationButtonTap() {
            Frame.topmost().goBack();
        },
        resize(event) {
            event.object.width = 100;
        }
    }
});
</script>