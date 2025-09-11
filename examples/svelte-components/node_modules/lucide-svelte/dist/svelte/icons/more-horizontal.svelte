<script>import Icon from '../Icon.svelte';
const iconNode = [["circle", { "cx": "12", "cy": "12", "r": "1" }], ["circle", { "cx": "19", "cy": "12", "r": "1" }], ["circle", { "cx": "5", "cy": "12", "r": "1" }]];
</script>

<Icon name="more-horizontal" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
