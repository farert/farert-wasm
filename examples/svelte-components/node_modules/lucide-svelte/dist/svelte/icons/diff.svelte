<script>import Icon from '../Icon.svelte';
const iconNode = [["path", { "d": "M12 3v14" }], ["path", { "d": "M5 10h14" }], ["path", { "d": "M5 21h14" }]];
</script>

<Icon name="diff" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
