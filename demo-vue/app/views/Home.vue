<template>
    <Page>
        <ActionBar title="Material Vue">
        </ActionBar>
        <GridLayout rows="50,50,auto,*">
            <HTMLLabel id="formattedText" padding="20 20 0 36" :autoFontSize="true" :autoFontSizeStep="4" maxFontSize="48" fontSize="48" maxLines="2" height="140" width="100%" :color="color">
                <Span :text="'collect' + '\n'" fontWeight="800" />
                <Span :text="counter + ' '" color="red" fontWeight="800" />
                <Span :text="'dabbas'" />
            </HTMLLabel>
            <HTMLLabel id="html" row="1" padding="20 20 0 36" :autoFontSize="true" maxFontSize="48" fontSize="48" maxLines="2" height="140" width="100%" :color="color" :html="htmlText"/>
            <StackLayout row="2" orientation="horizontal">
                <Button  text="up" @tap="counter+=1"/>
                <Button  text="color" @tap="color='green'"/>
            </StackLayout>
            <ListView row="3" ref="listView" rowHeight="50" for="example in examples" separatorColor="transparent" @itemTap="goToExample">
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

export default Vue.extend({
    name: 'Home',
    data() {
        return {
            counter:0,
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
        goToExample({ item }) {
            this.$navigateTo(item.component);
        }
    }
});
</script>
