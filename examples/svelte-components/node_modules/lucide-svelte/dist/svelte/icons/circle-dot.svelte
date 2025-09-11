<script>import Icon from '../Icon.svelte';
const iconNode = [["circle", { "cx": "12", "cy": "12", "r": "10" }], ["circle", { "cx": "12", "cy": "12", "r": "1" }]];
</script>

<Icon name="circle-dot" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
