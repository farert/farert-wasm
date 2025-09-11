<script>import Icon from '../Icon.svelte';
const iconNode = [["polyline", { "points": "10 15 15 20 20 15" }], ["path", { "d": "M4 4h7a4 4 0 0 1 4 4v12" }]];
</script>

<Icon name="corner-right-down" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
