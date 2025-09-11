<script>import Icon from '../Icon.svelte';
const iconNode = [["circle", { "cx": "12", "cy": "12", "r": "1" }], ["circle", { "cx": "12", "cy": "5", "r": "1" }], ["circle", { "cx": "12", "cy": "19", "r": "1" }]];
</script>

<Icon name="more-vertical" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
