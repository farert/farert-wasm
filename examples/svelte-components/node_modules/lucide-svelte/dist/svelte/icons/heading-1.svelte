<script>import Icon from '../Icon.svelte';
const iconNode = [["path", { "d": "M4 12h8" }], ["path", { "d": "M4 18V6" }], ["path", { "d": "M12 18V6" }], ["path", { "d": "m17 12 3-2v8" }]];
</script>

<Icon name="heading-1" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
