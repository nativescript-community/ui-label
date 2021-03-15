<template>
    <Page>
        <ActionBar :title="title">
            <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="onNavigationButtonTap"></NavigationButton>
        </ActionBar>
        <ScrollView>
            <GridLayout width="50" height="100" backgroundColor="red" @tap="resize">

            <HTMLLabel fontSize="20" textAlignment="center" color="black" text="center textAlignment, bottom verticalAlignment" autoFontSize="true"/>

        </GridLayout>
        </ScrollView>
        

    </Page>
</template>

<script lang="ts">
import * as frameModule from '@nativescript/core/ui/frame';
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
            frameModule.topmost().goBack();
        },
        resize(event) {
            event.object.width = 100;
        }
    }
});
</script>