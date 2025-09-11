<script>import Icon from '../Icon.svelte';
const iconNode = [["circle", { "cx": "12", "cy": "12", "r": "10" }], ["polygon", { "points": "16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" }]];
</script>

<Icon name="compass" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
