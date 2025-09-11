<script>import Icon from '../Icon.svelte';
const iconNode = [["polyline", { "points": "9 17 4 12 9 7" }], ["path", { "d": "M20 18v-2a4 4 0 0 0-4-4H4" }]];
</script>

<Icon name="reply" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
