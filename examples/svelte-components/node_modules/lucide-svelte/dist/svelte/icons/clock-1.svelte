<script>import Icon from '../Icon.svelte';
const iconNode = [["circle", { "cx": "12", "cy": "12", "r": "10" }], ["polyline", { "points": "12 6 12 12 14.5 8" }]];
</script>

<Icon name="clock-1" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
