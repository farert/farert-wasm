<script>import Icon from '../Icon.svelte';
const iconNode = [["path", { "d": "m20 17-5-5 5-5" }], ["path", { "d": "m4 17 5-5-5-5" }]];
</script>

<Icon name="chevrons-right-left" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
