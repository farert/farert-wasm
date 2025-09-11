<script>import Icon from '../Icon.svelte';
const iconNode = [["path", { "d": "M4 12h8" }], ["path", { "d": "M4 18V6" }], ["path", { "d": "M12 18V6" }], ["path", { "d": "M17 10v4h4" }], ["path", { "d": "M21 10v8" }]];
</script>

<Icon name="heading-4" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
