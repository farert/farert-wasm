<script>import Icon from '../Icon.svelte';
const iconNode = [["polyline", { "points": "10 9 15 4 20 9" }], ["path", { "d": "M4 20h7a4 4 0 0 0 4-4V4" }]];
</script>

<Icon name="corner-right-up" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
