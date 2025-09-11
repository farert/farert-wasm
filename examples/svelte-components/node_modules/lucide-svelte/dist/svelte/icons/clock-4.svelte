<script>import Icon from '../Icon.svelte';
const iconNode = [["circle", { "cx": "12", "cy": "12", "r": "10" }], ["polyline", { "points": "12 6 12 12 16 14" }]];
</script>

<Icon name="clock-4" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
