<template>
    <Page>
        <ActionBar :title="title">
            <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="onNavigationButtonTap"></NavigationButton>
        </ActionBar>
        <ScrollView>
            <StackLayout>
            <HTMLLabel textAlignment="left" width="100%" margin="50">
                    <Span text="Click to open link" @linkTap="openLink">
                    </Span>
            </HTMLLabel>
            <!-- Centered label with multiple lines -->
            <HTMLLabel textAlignment="center" textWrap="true"  margin="50">
                    <Span text="I am a paragraph with looots of words that wastes your time reading because I'm a humble little sample. If you are brave enough to lose more time, click this">
                    </Span>
                    <Span text=" link" @linkTap="openLink">
                    </Span>
            </HTMLLabel>
            <!-- Centered label with multiple lines -->
            <HTMLLabel textAlignment="center"  margin="50" html="<a href='urltest'>toot</a>"  @linkTap="openLink">
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
        openLink(event) {
            console.log('openLink', event.link)
        }
    }
});
</script>