<script>import Icon from '../Icon.svelte';
const iconNode = [["path", { "d": "m9 7-5 5 5 5" }], ["path", { "d": "m15 7 5 5-5 5" }]];
</script>

<Icon name="chevrons-left-right" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
