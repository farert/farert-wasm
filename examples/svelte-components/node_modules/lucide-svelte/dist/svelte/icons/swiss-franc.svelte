<script>import Icon from '../Icon.svelte';
const iconNode = [["path", { "d": "M10 21V3h8" }], ["path", { "d": "M6 16h9" }], ["path", { "d": "M10 9.5h7" }]];
</script>

<Icon name="swiss-franc" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
