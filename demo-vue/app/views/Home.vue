<template>
    <Page>
        <ActionBar title="Material Vue">
        </ActionBar>
        <GridLayout rows="auto,auto,auto,*">
            <HTMLLabel id="formattedText" padding="10 20 30 36" :autoFontSize="false" :autoFontSizeStep="4" maxFontSize="38" fontSize="30" maxLines="2" height="140" width="100%" :color="color" backgroundColor="blue" fontFamily="Montserrat,montserrat-regular">
                <Span :text="'collect' + '\n'"/>
                <Span :text="counter + ' '" color="red" fontWeight="bold" />
                <Span :text="'dabbas'"/>
            </HTMLLabel>
            <HTMLLabel class="test" 
            row="1" 
            padding="0 20 0 36" 
            maxLines="2" 
            verticalTextAlignment='center'
            height="140" 
            fontSize="20"
            width="100%" 
            backgroundColor="yellow"
            letterSpacing="-0.4"
            text="af"/>
            <StackLayout row="2" orientation="horizontal">
                <Button  text="up" @tap="counter+=1"/>
                <Button  text="color" @tap="color='green'"/>
            </StackLayout>
            <ListView row="3" ref="listView" itemRowHeight="80" for="example in examples" separatorColor="transparent" @itemTap="goToExample">
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
