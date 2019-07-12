<template>
    <Page>
        <ActionBar title="Material Vue">
        </ActionBar>
        <ListView ref="listView" rowHeight="50" for="example in examples" separatorColor="transparent" @itemTap="goToExample">
            <v-template>
                <StackLayout class="item" orientation="horizontal">
                    <Label :text="example.title" class="title" verticalAlignment="center" />
                </StackLayout>
            </v-template>
        </ListView>
    </Page>
</template>
<script lang="ts">
import { getExamples } from '../examples';
import Vue from 'vue';

export default Vue.extend({
    name: 'Home',
    data() {
        return {
            examples: getExamples()
        };
    },
    methods: {
        goToExample({ item }) {
            console.log('goToExample', item, item.component);
            this.$navigateTo(item.component);
        }
    }
});
</script>
