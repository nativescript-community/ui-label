<template>
  <GridLayout rows="auto,auto, auto" columns="auto, *, auto" class="p-20">
  <Label row="0" col="0" colSpan="3" class="h3" :text="title" textWrap="true"></Label>
  <GridLayout row="1" colSpan="3" rows="*" columns="*">
    <HTMLLabel
      fontSize="14"
      :html="htmlText"
      linkColor="#336699"
      linkUnderline="true"
      textWrap="true"
    ></HTMLLabel>
  </GridLayout>
  <Button row="2" col="0" text="No"  class="-secondary" textTransform="capitalize"></Button>
  <Button row="2" col="2" text="Yes" class="-primary" textTransform="capitalize"></Button>
</GridLayout>
</template>
<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
    name: 'Home',
    data() {
        return {
            title:'test',
        };
    },
    computed: {
        htmlText() {
            return `toto<br>titi<br>titi<br>titi<br>titi<br>titi<br>titi<br>titi<br>titi<br>titi<br>titi<br>titi`
        }
    },
    methods: {
    }
});
</script>
