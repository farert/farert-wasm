<script>import Icon from '../Icon.svelte';
const iconNode = [["polyline", { "points": "9 10 4 15 9 20" }], ["path", { "d": "M20 4v7a4 4 0 0 1-4 4H4" }]];
</script>

<Icon name="corner-down-left" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
