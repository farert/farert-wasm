<script>import Icon from '../Icon.svelte';
const iconNode = [["polyline", { "points": "9 14 4 9 9 4" }], ["path", { "d": "M20 20v-7a4 4 0 0 0-4-4H4" }]];
</script>

<Icon name="corner-up-left" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
