<script>import Icon from '../Icon.svelte';
const iconNode = [["path", { "d": "m7 20 5-5 5 5" }], ["path", { "d": "m7 4 5 5 5-5" }]];
</script>

<Icon name="chevrons-down-up" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
