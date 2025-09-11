<script>import Icon from '../Icon.svelte';
const iconNode = [["path", { "d": "M4 20h16" }], ["path", { "d": "m6 16 6-12 6 12" }], ["path", { "d": "M8 12h8" }]];
</script>

<Icon name="baseline" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
