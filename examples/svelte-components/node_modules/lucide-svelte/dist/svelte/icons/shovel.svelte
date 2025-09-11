<script>import Icon from '../Icon.svelte';
const iconNode = [["path", { "d": "M2 22v-5l5-5 5 5-5 5z" }], ["path", { "d": "M9.5 14.5 16 8" }], ["path", { "d": "m17 2 5 5-.5.5a3.53 3.53 0 0 1-5 0s0 0 0 0a3.53 3.53 0 0 1 0-5L17 2" }]];
</script>

<Icon name="shovel" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
