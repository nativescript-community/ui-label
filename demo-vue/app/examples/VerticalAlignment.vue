<template>
    <Page>
        <ActionBar :title="title">
            <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="onNavigationButtonTap"></NavigationButton>
        </ActionBar>
        <ScrollView>
            <StackLayout>
            <HTMLLabel fontSize="20" width="100%" backgroundColor="red" height="100" lineHeight="0" color="green" textWrap="true" text="left textAlignment, top verticalAlignment" verticalTextAlignment="top"/>
            <HTMLLabel fontSize="10" width="100%" backgroundColor="green" height="100" color="black" textWrap="true" text="left textAlignment, center verticalAlignment" verticalTextAlignment="center"/>
            <HTMLLabel fontSize="20" width="100%" backgroundColor="blue" height="100" color="black" textWrap="true" text="left textAlignment, bottom verticalAlignment" verticalTextAlignment="bottom"/>
            <HTMLLabel fontSize="20" width="100%" backgroundColor="red" isUserInteractionEnabled="false" height="100" textAlignment="right" color="black" textWrap="false" text="right textAlignment, top verticalAlignment" verticalTextAlignment="top"/>
            <HTMLLabel fontSize="20" width="100%" backgroundColor="green" height="100" color="black" textWrap="false" text="left textAlignment, center verticalAlignment" verticalTextAlignment="center"/>
            <HTMLLabel fontSize="20" width="100%" backgroundColor="yellow" height="100" color="black" textWrap="false" verticalTextAlignment="center"> 
                <Span text="left textAlignment"/>
                <Span text=", center verticalAlignment" color="red" fontSize="20"/>
            </HTMLLabel>
            <HTMLLabel fontSize="20" width="100%" backgroundColor="blue" height="100" textAlignment="center" color="black" textWrap="false" text="center textAlignment, bottom verticalAlignment" verticalTextAlignment="bottom"/>

        </StackLayout>
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
        }
    }
});
</script>