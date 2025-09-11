<script>import Icon from '../Icon.svelte';
const iconNode = [["path", { "d": "M4.5 3h15" }], ["path", { "d": "M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3" }], ["path", { "d": "M6 14h12" }]];
</script>

<Icon name="beaker" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
