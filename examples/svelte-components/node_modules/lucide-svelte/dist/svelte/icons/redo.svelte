<script>import Icon from '../Icon.svelte';
const iconNode = [["path", { "d": "M21 7v6h-6" }], ["path", { "d": "M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" }]];
</script>

<Icon name="redo" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
