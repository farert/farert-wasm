<script>import Icon from '../Icon.svelte';
const iconNode = [["path", { "d": "M11 12H3" }], ["path", { "d": "M16 6H3" }], ["path", { "d": "M16 18H3" }], ["path", { "d": "M18 9v6" }], ["path", { "d": "M21 12h-6" }]];
</script>

<Icon name="list-plus" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
