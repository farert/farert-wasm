<script>import Icon from '../Icon.svelte';
const iconNode = [["path", { "d": "M4 4v16h16" }], ["path", { "d": "m4 20 7-7" }]];
</script>

<Icon name="axis-3d" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
