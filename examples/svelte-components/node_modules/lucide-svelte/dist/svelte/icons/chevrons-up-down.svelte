<script>import Icon from '../Icon.svelte';
const iconNode = [["path", { "d": "m7 15 5 5 5-5" }], ["path", { "d": "m7 9 5-5 5 5" }]];
</script>

<Icon name="chevrons-up-down" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
