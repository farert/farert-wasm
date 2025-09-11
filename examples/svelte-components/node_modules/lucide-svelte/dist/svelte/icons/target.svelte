<script>import Icon from '../Icon.svelte';
const iconNode = [["circle", { "cx": "12", "cy": "12", "r": "10" }], ["circle", { "cx": "12", "cy": "12", "r": "6" }], ["circle", { "cx": "12", "cy": "12", "r": "2" }]];
</script>

<Icon name="target" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
