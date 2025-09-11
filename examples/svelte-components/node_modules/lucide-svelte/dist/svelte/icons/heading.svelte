<script>import Icon from '../Icon.svelte';
const iconNode = [["path", { "d": "M6 12h12" }], ["path", { "d": "M6 20V4" }], ["path", { "d": "M18 20V4" }]];
</script>

<Icon name="heading" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
