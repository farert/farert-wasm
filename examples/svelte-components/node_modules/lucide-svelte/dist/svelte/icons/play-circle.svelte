<script>import Icon from '../Icon.svelte';
const iconNode = [["circle", { "cx": "12", "cy": "12", "r": "10" }], ["polygon", { "points": "10 8 16 12 10 16 10 8" }]];
</script>

<Icon name="play-circle" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
