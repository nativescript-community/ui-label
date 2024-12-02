<template>
    <Page>
        <ActionBar :title="title">
            <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="onNavigationButtonTap"></NavigationButton>
        </ActionBar>
        <ScrollView>
            <StackLayout>
            <HTMLLabel textAlignment="left" width="100%" margin="50" backgroundColor="red">
                    <Span text="Click to open link" @linkTap="openLink">
                    </Span>
            </HTMLLabel>
            <!-- Centered label with multiple lines -->
            <HTMLLabel horizontalAlignment="center" textAlignment="center" textWrap="true" width="80%" height="290" paddingRight="10" verticalTextAlignment="top" backgroundColor="yellow" fontSize='12' paddingTop="20" autoFontSize="true" selectable="true" borderWidth="30">
                <!-- <FormattedString> -->
                    <Span text="I am a paragraph with looots of words that wastes your time reading because I'm a humble little sample. If you are brave enough to lose more time, click this">
                    </Span>
                    <Span text=" link" @linkTap="openLink">
                    </Span>
                <!-- </FormattedString> -->
            </HTMLLabel>
            <!-- Centered label with multiple lines -->
            <HTMLLabel textAlignment="center"  margin="50" html="<a href='urltest'>toot</a>"  @linkTap="openLink">
            </HTMLLabel>
            <HTMLLabel text="This is a test" color="#ff0000" row="0"/>
            <GridLayout class="content-el text-indication-el">
    <HTMLLabel
        :fontSize="20"
        :html="someBindedUrl"
        textWrap="true"
        @linkTap="openLink"
        linkUnderline="true"
    >
    </HTMLLabel>
  </GridLayout>

      <HTMLLabel html="This is a test" color="#ff0000" row="1"/>

      <HTMLLabel
          :html="someBindedUrl"
          linkColor="#ff0000"
          linkUnderline="false"
          fontFamily="OpenSans"
          fontSize="16"
          margin="2 5 5 5"
          textWrap="true"
          row="2"
          @linkTap="openLink"
      ></HTMLLabel>

      <HTMLLabel
          :html="someBindedUrl"
          linkColor="#ff0000"
          fontFamily="OpenSans"
          fontSize="16"
          margin="2 5 5 5"
          textWrap="true"
          row="3"
          @linkTap="openLink"
      ></HTMLLabel>
        </StackLayout>
        </ScrollView>
    </Page>
</template>
<style scoped>
.text-indication-el HTMLLabel {
  font-weight: 500;
  font-size: 17;
  border-radius: 4;
  background-color: green;
  color: white;
  link-color: white;
  text-align: center;
  margin-left: 20;
  margin-right: 20;
  padding: 25;
}
</style>

<script lang="ts">
import { Frame } from '@nativescript/core';
import Vue from 'vue';

export const title = 'LinkTap sample';

export default Vue.extend({
    data() {
        return {
            title: title,
            someBindedUrl: '<a href=\"https://youtube.com\">Open Youtube.com</a> + <a href=\"https://google.com\">Open Google.com</a>'
        };
    },
    methods: {
        onNavigationButtonTap() {
            Frame.topmost().goBack();
        },
        openLink(event) {
            console.log('openLink', event.object, event.link)
        }
    }
});
</script>