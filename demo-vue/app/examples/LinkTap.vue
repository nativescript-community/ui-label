<template>
    <Page>
        <ActionBar :title="title">
            <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="onNavigationButtonTap"></NavigationButton>
        </ActionBar>
        <ScrollView>
            <StackLayout>
            <!-- Label with text align left (right will also do) -->
<!-- Set full width or height to test tap outside bounds -->
<HTMLLabel textAlignment="left" width="100%" marginBottom="50">
        <Span text="Click to open link" @linkTap="openLink">
        </Span>
</HTMLLabel>

<!-- Centered label with multiple lines -->
<HTMLLabel textAlignment="center" textWrap="true">
        <Span text="I am a paragraph with looots of words that wastes your time reading because I'm a humble little sample. If you are brave enough to lose more time, click this">
        </Span>
        <Span text="  link" @linkTap="openLink">
        </Span>
</HTMLLabel>

        </StackLayout>
        </ScrollView>
        

    </Page>
</template>

<script lang="ts">
import { Frame } from '@nativescript/core';
import Vue from 'vue';

export const title = 'LinkTap sample';

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
        openLink() {
            console.log('openLink')
        }
    }
});
</script>