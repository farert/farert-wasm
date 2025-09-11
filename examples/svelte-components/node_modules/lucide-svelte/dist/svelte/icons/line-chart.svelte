<script>import Icon from '../Icon.svelte';
const iconNode = [["path", { "d": "M3 3v18h18" }], ["path", { "d": "m19 9-5 5-4-4-3 3" }]];
</script>

<Icon name="line-chart" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
