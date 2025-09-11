<script>import Icon from '../Icon.svelte';
const iconNode = [["polyline", { "points": "14 15 9 20 4 15" }], ["path", { "d": "M20 4h-7a4 4 0 0 0-4 4v12" }]];
</script>

<Icon name="corner-left-down" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
