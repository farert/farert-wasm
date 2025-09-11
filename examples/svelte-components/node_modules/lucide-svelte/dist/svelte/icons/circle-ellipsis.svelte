<script>import Icon from '../Icon.svelte';
const iconNode = [["circle", { "cx": "12", "cy": "12", "r": "10" }], ["path", { "d": "M17 12h.01" }], ["path", { "d": "M12 12h.01" }], ["path", { "d": "M7 12h.01" }]];
</script>

<Icon name="circle-ellipsis" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
